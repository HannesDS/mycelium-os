import { readFileSync } from "node:fs";
import { resolve, basename } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv from "ajv";
import { parse } from "yaml";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

function loadSchema() {
  const schemaPath = resolve(__dirname, "..", "schema.json");
  return JSON.parse(readFileSync(schemaPath, "utf-8"));
}

function validate(filePath: string): boolean {
  const cwd = process.env.INIT_CWD || process.cwd();
  const absolutePath = resolve(cwd, filePath);
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

  const ajv = new Ajv({ allErrors: true });
  const schema = loadSchema();
  const valid = ajv.validate(schema, manifest);

  if (valid) {
    console.log(`✓ ${fileName} is valid`);
    return true;
  }

  console.error(`✗ ${fileName} is invalid:`);
  for (const err of ajv.errors ?? []) {
    const path = err.instancePath || "/";
    console.error(`  - ${path}: ${err.message}`);
  }
  return false;
}

const files = process.argv.slice(2);

if (files.length === 0) {
  console.error("Usage: shroom validate <manifest.yaml> [manifest2.yaml ...]");
  process.exit(1);
}

let allValid = true;
for (const file of files) {
  if (!validate(file)) allValid = false;
}

process.exit(allValid ? 0 : 1);
