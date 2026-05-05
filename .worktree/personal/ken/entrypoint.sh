#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# Personal entrypoint — runs dotfiles install on first container start.
# Uses a marker file so it only runs once per container lifecycle.
# Delete ~/.dotfiles-installed to re-trigger.
# =============================================================================

MARKER="$HOME/.dotfiles-installed"
DOTFILES_DIR="$HOME/.dotfiles"

if [ ! -f "$MARKER" ] && [ -d "$DOTFILES_DIR/scripts" ]; then
    echo "[personal] Running dotfiles setup..."
    REMOTE_CONTAINERS=true bash "$DOTFILES_DIR/scripts/install.sh"
    touch "$MARKER"
    echo "[personal] Dotfiles setup complete."
elif [ -f "$MARKER" ]; then
    echo "[personal] Dotfiles already installed (remove $MARKER to re-run)."
else
    echo "[personal] No dotfiles found at $DOTFILES_DIR — skipping."
    # Mark complete so healthcheck reports healthy even without dotfiles.
    touch "$MARKER"
fi

exec "$@"
