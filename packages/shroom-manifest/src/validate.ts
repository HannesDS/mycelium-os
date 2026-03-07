#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve, basename, isAbsolute } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv from "ajv";
import { parse } from "yaml";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const schema = JSON.parse(
  readFileSync(resolve(__dirname, "..", "schema.json"), "utf-8")
);
const ajv = new Ajv({ allErrors: true });
const validator = ajv.compile(schema);

function resolvePath(filePath: string): string {
  if (isAbsolute(filePath)) return filePath;
  const root = process.env.INIT_CWD;
  if (root && isAbsolute(root)) return resolve(root, filePath);
  return resolve(process.cwd(), filePath);
}

function validate(filePath: string): boolean {
  const absolutePath = resolvePath(filePath);
  const fileName = basename(absolutePath);

  let content: string;
  try {
    content = readFileSync(absolutePath, "utf-8");
  } catch {
    console.error(`✗ ${fileName} — file not found: ${absolutePath}`);
    return false;
  }

  let manifest: unknown;
  try {
    manifest = parse(content);
  } catch (e) {
    console.error(`✗ ${fileName} — invalid YAML: ${e}`);
    return false;
  }

  if (validator(manifest)) {
    console.log(`✓ ${fileName} is valid`);
    return true;
  }

  console.error(`✗ ${fileName} is invalid:`);
  for (const err of validator.errors ?? []) {
    const path = err.instancePath || "/";
    console.error(`  - ${path}: ${err.message}`);
  }
  return false;
}

const files = process.argv.slice(2);

if (files.length === 0) {
  console.error(
    "Usage: pnpm shroom:validate <manifest.yaml> [manifest2.yaml ...]"
  );
  process.exit(1);
}

let allValid = true;
for (const file of files) {
  if (!validate(file)) allValid = false;
}

process.exit(allValid ? 0 : 1);
