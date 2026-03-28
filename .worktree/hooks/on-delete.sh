#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# Worktree deletion hook — runs on the HOST before a worktree is removed.
# Stops the container, runs project-specific cleanup, and prunes orphans.
#
# Wire this into your worktree tool:
#   git-wt: git config --add wt.deletehook ".worktree/hooks/on-delete.sh"
#   manual: cd ../myapp-feature-x && .worktree/hooks/on-delete.sh
# =============================================================================

# --- Resolve project info ---

gitdir="$(git rev-parse --git-common-dir)"
case $gitdir in
  /*) ;;
  *) gitdir="$PWD/$gitdir"
esac
GIT_COMMON_DIR=$(cd "$gitdir" && pwd)
MAIN_REPO_DIR=$(dirname "$GIT_COMMON_DIR")
MAIN_REPO_NAME=$(basename "$MAIN_REPO_DIR")
PROJECT_NAME="${PROJECT_NAME:-$MAIN_REPO_NAME}"

WORKTREE_DIR_NAME=$(basename "$PWD")
WORKTREE_NAME=$(echo "$WORKTREE_DIR_NAME" | sed 's/[^a-zA-Z0-9-]/_/g' | tr '[:upper:]' '[:lower:]')

CONTAINER_NAME="app-${PROJECT_NAME}-${WORKTREE_NAME}"

# --- Stop and remove container ---

if docker inspect "$CONTAINER_NAME" > /dev/null 2>&1; then
  echo "[container-wt] Removing container ${CONTAINER_NAME}..."
  docker rm -f "$CONTAINER_NAME" 2>/dev/null || true
fi

# =============================================================================
# CUSTOMIZE — Project-specific cleanup below
# =============================================================================

# Examples:
#   # Drop per-worktree PostgreSQL database
#   docker exec "postgres-${PROJECT_NAME}" dropdb -U dev --if-exists "${PROJECT_NAME}_${WORKTREE_NAME}" 2>/dev/null || true

# --- Prune orphaned containers (full mode only — labels are not set in slim mode) ---

if docker ps -a --filter "label=container-wt.project=${PROJECT_NAME}" --format '{{.Names}}' 2>/dev/null | grep -q .; then
  echo "[container-wt] Checking for orphaned containers..."
  containers=$(docker ps -a --filter "label=container-wt.project=${PROJECT_NAME}" \
    --format '{{.Names}}\t{{.Label "container-wt.worktree-dir"}}' 2>/dev/null) || true

  if [[ -n "$containers" ]]; then
    while IFS=$'\t' read -r name worktree_dir; do
      [[ -z "$name" ]] && continue
      if [[ ! -d "$worktree_dir" ]]; then
        echo "[container-wt] Removing orphaned container: ${name}"
        docker rm -f "$name" 2>/dev/null || true
      fi
    done <<< "$containers"
  fi
fi

git worktree prune 2>/dev/null || true

echo "[container-wt] on-delete complete."
