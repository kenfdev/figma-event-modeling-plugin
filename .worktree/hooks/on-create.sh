#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# Worktree creation hook — runs on the HOST after a new worktree is created.
# Copies gitignored files listed in .worktreeinclude to the new worktree,
# then runs init.sh to generate .env files.
#
# Wire this into your worktree tool:
#   git-wt: git config --add wt.hook ".worktree/hooks/on-create.sh"
#   manual: cd ../myapp-feature-x && .worktree/hooks/on-create.sh
# =============================================================================

# --- Resolve main worktree ---

gitdir="$(git rev-parse --git-common-dir)"
case $gitdir in
  /*) ;;
  *) gitdir="$PWD/$gitdir"
esac
GIT_COMMON_DIR=$(cd "$gitdir" && pwd)
MAIN_REPO_DIR=$(dirname "$GIT_COMMON_DIR")

# --- Exclusion patterns ---
# Files matching any of these patterns are never copied, even if matched by
# .worktreeinclude globs. Add your own project-specific exclusions here.

EXCLUDE_PATTERNS=(
  # Version control
  '.git'
  '.git/*'
  # JavaScript / Node
  'node_modules'
  'node_modules/*'
  '.next/*'
  '.nuxt/*'
  # Python
  '__pycache__'
  '__pycache__/*'
  '.venv/*'
  'venv/*'
  '*.pyc'
  # Build artifacts
  'dist/*'
  'build/*'
  '.cache/*'
  # OS files
  '.DS_Store'
  'Thumbs.db'
)

_is_excluded() {
  local filepath="$1"
  for pattern in "${EXCLUDE_PATTERNS[@]}"; do
    # shellcheck disable=SC2254
    case "$filepath" in
      $pattern) return 0 ;;
      */$pattern) return 0 ;;
    esac
  done
  return 1
}

# --- Copy .worktreeinclude files ---

copy_from_include_file() {
  local include_file="$1" target_root="$2"
  [[ -f "$include_file" ]] || return 0

  while IFS= read -r line; do
    [[ -z "$line" || "$line" =~ ^# ]] && continue
    (
      cd "$MAIN_REPO_DIR"
      shopt -s dotglob nullglob
      shopt -s globstar 2>/dev/null || true
      for f in $line; do
        [[ -f "$f" ]] || continue
        _is_excluded "$f" && continue
        mkdir -p "${target_root}/$(dirname "$f")"
        cp "$f" "${target_root}/${f}"
        echo "[container-wt] Copied: ${f}"
      done
    )
  done < "$include_file"
}

copy_from_include_file "${MAIN_REPO_DIR}/.worktreeinclude" "$PWD"
copy_from_include_file "${MAIN_REPO_DIR}/.worktreeinclude.local" "$PWD"

# --- Run init.sh to generate .env files ---

if [ -f ".worktree/init.sh" ]; then
  echo "[container-wt] Running init.sh..."
  .worktree/init.sh
fi

echo "[container-wt] on-create complete."
