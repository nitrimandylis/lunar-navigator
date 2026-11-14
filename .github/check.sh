#!/usr/bin/env bash
# The deterministic check: same result every time, no AI.
# Runs on every PR and on main. It works before any stack exists:
#   - package.json with a "check" script -> npm run check (typecheck + tests)
#   - Python test files                  -> pytest

set -euo pipefail

ran_something=no

if [ -f package.json ] && jq -e '.scripts.check' package.json > /dev/null; then
  npm ci
  npm run check
  ran_something=yes
fi

python_tests=$(find . \( -name 'test_*.py' -o -name '*_test.py' \) \
  -not -path './node_modules/*' -not -path './.venv/*')

if [ -n "$python_tests" ]; then
  # Installs only on the CI machine. Locally, run this inside your own environment.
  if [ "${CI:-}" = "true" ]; then
    python3 -m pip install --quiet pytest
    for requirements in $(find . -name requirements.txt -not -path './node_modules/*' -not -path './.venv/*'); do
      python3 -m pip install --quiet -r "$requirements"
    done
  fi
  python3 -m pytest -q
  ran_something=yes
fi

if [ "$ran_something" = "no" ]; then
  echo "Nothing to check yet."
fi
