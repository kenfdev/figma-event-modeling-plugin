# =============================================================================
# Personal Dockerfile — ken
#
# Layers:
#   1. Project app image (fdsx-dev-base + project deps from Dockerfile.app)
#   2. Devenv tools (tmux, lazygit, neovim, gh, claude-code, etc.)
#
# Dotfiles are mounted at runtime (not baked in) — see docker-compose.local.yml
# =============================================================================

FROM fdsx-dev-base:local

# --- Project deps (keep in sync with Dockerfile.app) ---
RUN curl -LsSf https://astral.sh/uv/install.sh | sh
ENV PATH="/home/vscode/.local/bin:$PATH"
RUN uv python install 3.12

# --- Node.js (for npm-based tools: codex, takt, opencode) ---
USER root
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
  && apt-get install -y nodejs \
  && rm -rf /var/lib/apt/lists/*
USER vscode

# --- Configure npm global prefix for vscode user (so npm install -g works without root) ---
USER root
RUN mkdir -p /home/vscode/.npm-global \
  && chown vscode:vscode /home/vscode/.npm-global \
  && su - vscode -c "npm config set prefix /home/vscode/.npm-global"
ENV PATH="/home/vscode/.npm-global/bin:$PATH"

# --- Personal dev tools (from devcontainer-feature) ---
RUN curl -fsSL https://raw.githubusercontent.com/kenfdev/devcontainer-feature/refs/heads/main/src/devenv/install.sh \
      -o /tmp/devenv-install.sh \
  && chmod +x /tmp/devenv-install.sh \
  && _REMOTE_USER=vscode _REMOTE_USER_HOME=/home/vscode \
     INSTALLTMUX=true \
     INSTALLLAZYGIT=true \
     INSTALLNVIM=true \
     INSTALLCLAUDECODE=true \
     INSTALLCODEX=true \
     INSTALLGH=true \
     INSTALLTAKT=true \
     INSTALLOPENCODE=true \
     INSTALLGEMINI=true \
     bash /tmp/devenv-install.sh \
  && rm -f /tmp/devenv-install.sh
USER vscode

# --- Entrypoint for dotfiles setup ---
COPY .worktree/personal/ken/entrypoint.sh /usr/local/bin/personal-entrypoint.sh
RUN sudo chmod +x /usr/local/bin/personal-entrypoint.sh
ENTRYPOINT ["/usr/local/bin/personal-entrypoint.sh"]
CMD ["sleep", "infinity"]
