#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# container-wt init script
# Runs on the HOST before starting containers. Detects worktree/project context
# and generates .env (root, infra), .worktree/.env (app), and .worktree/.env.app files.
#
# Usage: .worktree/init.sh
# =============================================================================

# --- Worktree and project detection ---

WORKTREE_DIR_NAME=$(basename "$PWD")

# Sanitize worktree name for use in DB names, container names, etc.
# Replace any non-alphanumeric character (except hyphen) with underscore, then lowercase.
WORKTREE_NAME=$(echo "$WORKTREE_DIR_NAME" | sed 's/[^a-zA-Z0-9-]/_/g' | tr '[:upper:]' '[:lower:]')

# Detect the current branch name for use in subdomain routing.
# Replace slashes with hyphens and sanitize for DNS-safe names.
# Falls back to short SHA on detached HEAD (e.g., during PR review of a specific commit).
BRANCH_NAME=$(git branch --show-current | sed 's|/|-|g; s/[^a-zA-Z0-9-]/_/g' | tr '[:upper:]' '[:lower:]')
if [ -z "$BRANCH_NAME" ]; then
  BRANCH_NAME=$(git rev-parse --short HEAD)
fi

# Detect project name: use PROJECT_NAME env var if set, otherwise derive from main repo directory.
# The main repo directory is the parent of the git common dir.
gitdir="$(git rev-parse --git-common-dir)"
case $gitdir in
  /*) ;;
  *) gitdir="$PWD/$gitdir"
esac
GIT_COMMON_DIR=$(cd "$gitdir" && pwd)
MAIN_REPO_NAME=$(basename "$(dirname "$GIT_COMMON_DIR")")
PROJECT_NAME="${PROJECT_NAME:-$MAIN_REPO_NAME}"

NETWORK_NAME="${NETWORK_NAME:-devnet-${PROJECT_NAME}}"
# Note: COMPOSE_PROJECT_NAME is intentionally NOT set here or in .env.
# It is set via the top-level `name:` attribute in each compose file to avoid
# the app's project name leaking into the infra compose (and vice versa).
LOCAL_WORKSPACE_FOLDER="$PWD"

# --- Ensure Docker network exists (full mode only) ---

if [ -f "docker-compose.yml" ]; then
  if ! docker network inspect "$NETWORK_NAME" > /dev/null 2>&1; then
    docker network create "$NETWORK_NAME"
    echo "[container-wt] Created Docker network: ${NETWORK_NAME}"
  fi
fi

# --- Local compose overrides ---

# Create empty docker-compose.local.yml stub if missing (prevents Docker Compose errors).
if [ ! -f ".worktree/docker-compose.local.yml" ]; then
  echo "# Personal Docker Compose overrides (gitignored). See docker-compose.local.example.yml for examples." \
    > .worktree/docker-compose.local.yml
  echo "[container-wt] Created empty .worktree/docker-compose.local.yml stub."
fi

# --- Write root .env for infra docker-compose variable substitution (full mode only) ---

if [ -f "docker-compose.yml" ]; then
  cat > .env <<EOF
PROJECT_NAME=${PROJECT_NAME}
NETWORK_NAME=${NETWORK_NAME}
EOF
fi

# --- Write .worktree/.env for app docker-compose variable substitution ---

cat > .worktree/.env <<EOF
COMPOSE_FILE=docker-compose.yml:docker-compose.local.yml
WORKTREE_NAME=${WORKTREE_NAME}
BRANCH_NAME=${BRANCH_NAME}
GIT_COMMON_DIR=${GIT_COMMON_DIR}
MAIN_REPO_NAME=${MAIN_REPO_NAME}
PROJECT_NAME=${PROJECT_NAME}
NETWORK_NAME=${NETWORK_NAME}
LOCAL_WORKSPACE_FOLDER=${LOCAL_WORKSPACE_FOLDER}
EOF

# --- Expand .worktree/.env.app.template → .worktree/.env.app ---

# The .env.app.template uses ${VARIABLE} placeholders.
# All variables from init.sh are available for substitution.
if [ -f ".worktree/.env.app.template" ]; then
  export WORKTREE_NAME BRANCH_NAME MAIN_REPO_NAME PROJECT_NAME NETWORK_NAME
  envsubst '${WORKTREE_NAME} ${BRANCH_NAME} ${MAIN_REPO_NAME} ${PROJECT_NAME} ${NETWORK_NAME}' \
    < .worktree/.env.app.template > .worktree/.env.app
  echo "[container-wt] .worktree/.env.app generated from template."
else
  # Create empty .env.app so docker-compose env_file doesn't fail.
  touch .worktree/.env.app
fi

echo "[container-wt] init.sh complete for worktree '${WORKTREE_NAME}' branch '${BRANCH_NAME}' (project: ${PROJECT_NAME})"
