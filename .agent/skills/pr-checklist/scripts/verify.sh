#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
FAILED=0

run_check() {
  local label="$1"; shift
  printf "%-40s" "$label..."
  if "$@" > /dev/null 2>&1; then
    echo "OK"
  else
    echo "FAIL"
    FAILED=1
  fi
}

echo "=== Mycelium OS Pre-PR Verification ==="
echo ""

run_check "Frontend lint" pnpm --filter frontend lint
run_check "Frontend type-check" pnpm --filter frontend exec tsc --noEmit
run_check "Frontend tests" pnpm test
run_check "Control plane tests" pytest "$ROOT/apps/control-plane/tests/" -q

echo ""
echo "=== TODO scan (staged files) ==="
if git diff --cached --name-only | xargs grep -l 'TODO' 2>/dev/null; then
  echo "FAIL — TODOs found in staged files (use feature flags instead)"
  FAILED=1
else
  echo "OK — no TODOs in staged files"
fi

echo ""
if [ "$FAILED" -eq 0 ]; then
  echo "All checks passed."
else
  echo "Some checks failed. Fix before opening PR."
  exit 1
fi
