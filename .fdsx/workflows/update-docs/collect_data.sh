#!/usr/bin/env bash
# Collect fdsx source code + current README.md for analysis.
# Outputs a structured dump that an LLM can compare against the docs.
set -euo pipefail

SRC_DIR="src/fdsx"

echo "===== CURRENT README.md ====="
cat "README.md"

echo ""
echo "===== SOURCE: models/flow.py ====="
cat "$SRC_DIR/models/flow.py"

echo ""
echo "===== SOURCE: models/task.py ====="
cat "$SRC_DIR/models/task.py"

echo ""
echo "===== SOURCE: providers/base.py ====="
cat "$SRC_DIR/providers/base.py"

echo ""
echo "===== SOURCE: providers/claude.py ====="
cat "$SRC_DIR/providers/claude.py"

echo ""
echo "===== SOURCE: providers/codex.py ====="
cat "$SRC_DIR/providers/codex.py"

echo ""
echo "===== SOURCE: providers/opencode.py ====="
cat "$SRC_DIR/providers/opencode.py"

echo ""
echo "===== SOURCE: providers/gemini.py ====="
cat "$SRC_DIR/providers/gemini.py"

echo ""
echo "===== SOURCE: providers/system.py ====="
cat "$SRC_DIR/providers/system.py"

echo ""
echo "===== SOURCE: providers/__init__.py ====="
cat "$SRC_DIR/providers/__init__.py"

echo ""
echo "===== SOURCE: cli/main.py ====="
cat "$SRC_DIR/cli/main.py"

echo ""
echo "===== SOURCE: core/loader.py ====="
cat "$SRC_DIR/core/loader.py"

echo ""
echo "===== SOURCE: core/extraction.py ====="
cat "$SRC_DIR/core/extraction.py"

echo ""
echo "===== SOURCE: core/engine/run.py ====="
cat "$SRC_DIR/core/engine/run.py"

echo ""
echo "===== SOURCE: core/engine/batch.py ====="
cat "$SRC_DIR/core/engine/batch.py"

echo ""
echo "===== SOURCE: core/engine/tasks_dir.py ====="
cat "$SRC_DIR/core/engine/tasks_dir.py"

echo ""
echo "===== SOURCE: core/profiles.py ====="
cat "$SRC_DIR/core/profiles.py"

echo ""
echo "===== SOURCE: core/config.py ====="
cat "$SRC_DIR/core/config.py"

echo ""
echo "===== SOURCE: core/selector.py ====="
cat "$SRC_DIR/core/selector.py"

echo ""
echo "===== PYPROJECT.TOML (metadata) ====="
cat "pyproject.toml"

echo ""
echo "===== RECENT GIT LOG (last 30 commits) ====="
git log --oneline -30
