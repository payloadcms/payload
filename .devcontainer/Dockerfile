FROM debian:bookworm-slim

ARG MISE_VERSION=latest

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
  ca-certificates \
  curl \
  wget \
  git \
  procps \
  sudo \
  fzf \
  zsh \
  man-db \
  unzip \
  gnupg2 \
  jq \
  nano \
  vim \
  less \
  # Firewall tooling (always installed, only activated when ENABLE_FIREWALL=true)
  iptables \
  ipset \
  iproute2 \
  dnsutils \
  aggregate \
  && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install gh CLI
RUN curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg \
  && chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg \
  && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | tee /etc/apt/sources.list.d/github-cli.list > /dev/null \
  && apt-get update && apt-get install -y gh \
  && apt-get clean && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd --gid 1000 node \
  && useradd --uid 1000 --gid node --shell /bin/zsh --create-home node \
  && echo "node ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/node \
  && chmod 0440 /etc/sudoers.d/node

# Persist bash/zsh history
RUN mkdir /commandhistory \
  && touch /commandhistory/.zsh_history \
  && chown -R node:node /commandhistory

# Set DEVCONTAINER env var
ENV DEVCONTAINER=true

# Create workspace directory
RUN mkdir -p /workspace && chown -R node:node /workspace

WORKDIR /workspace

# Install mise as root, then switch to node user
RUN curl https://mise.run | sh
ENV PATH="/root/.local/bin:$PATH"

# Switch to non-root user
USER node

# Install mise for node user
RUN curl https://mise.run | sh
ENV PATH="/home/node/.local/bin:$PATH"

# Copy .tool-versions to install Node and pnpm
# (actual .tool-versions comes from workspace mount, this is for build-time install)
COPY --chown=node:node .tool-versions /tmp/.tool-versions
RUN cd /tmp && mise trust && mise install

# Set up paths for mise-installed tools
RUN echo 'eval "$(mise activate zsh)"' >> /home/node/.zshrc \
  && echo 'eval "$(mise activate bash)"' >> /home/node/.bashrc

# Install Claude Code globally via mise-managed npm
RUN eval "$(mise activate bash)" && npm install -g @anthropic-ai/claude-code@latest

# Set default shell
ENV SHELL=/bin/zsh

# Copy firewall script
COPY --chown=root:root .devcontainer/init-firewall.sh /usr/local/bin/
USER root
RUN chmod +x /usr/local/bin/init-firewall.sh \
  && echo "node ALL=(root) NOPASSWD: /usr/local/bin/init-firewall.sh" > /etc/sudoers.d/node-firewall \
  && chmod 0440 /etc/sudoers.d/node-firewall
USER node
