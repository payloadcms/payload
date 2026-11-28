#!/usr/bin/env bash
# One-time bootstrap for a FRESH app EC2 (Amazon Linux 2023 or Ubuntu 22.04/24.04).
# Installs Docker Engine + Compose + Buildx and git, adds swap for the build, and clones the repo.
#
#   curl -fsSL https://raw.githubusercontent.com/<owner>/<repo>/<branch>/apps/cms/deploy/setup-app-server.sh -o setup.sh
#   sudo bash setup.sh [repo-url] [branch]
#
# Defaults: repo https://github.com/atorpos/payloadcms.git, branch op-uat-mongodb,
# cloned into the home directory of the user who ran sudo (e.g. /home/ec2-user/payloadcms).
set -euo pipefail

REPO_URL="${1:-https://github.com/atorpos/payloadcms.git}"
BRANCH="${2:-op-uat-mongodb}"
# Building the admin panel needs roughly 6 GB of memory; swap covers smaller instances.
SWAP_SIZE_GB="${SWAP_SIZE_GB:-8}"

if [[ $EUID -ne 0 ]]; then
  echo "Run this script with sudo." >&2
  exit 1
fi

TARGET_USER="${SUDO_USER:-ec2-user}"
TARGET_HOME="$(getent passwd "$TARGET_USER" | cut -d: -f6)"

case "$(uname -m)" in
  x86_64) ARCH=x86_64; GOARCH=amd64 ;;
  aarch64 | arm64) ARCH=aarch64; GOARCH=arm64 ;;
  *) echo "Unsupported CPU architecture: $(uname -m)" >&2; exit 1 ;;
esac

. /etc/os-release

install_cli_plugin() {
  local name="$1" url="$2"
  mkdir -p /usr/local/lib/docker/cli-plugins
  curl -fsSL "$url" -o "/usr/local/lib/docker/cli-plugins/docker-$name"
  chmod +x "/usr/local/lib/docker/cli-plugins/docker-$name"
}

echo "==> Installing Docker and git on $PRETTY_NAME ($ARCH)"
if [[ "$ID" == "amzn" ]]; then
  dnf install -y docker git
  # Amazon Linux does not package the Compose and Buildx plugins, so fetch them from GitHub
  if ! docker compose version >/dev/null 2>&1; then
    install_cli_plugin compose \
      "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-$ARCH"
  fi
  if ! docker buildx version >/dev/null 2>&1; then
    BUILDX_VERSION="$(curl -fsSL https://api.github.com/repos/docker/buildx/releases/latest | grep -oP '"tag_name":\s*"\K[^"]+')"
    install_cli_plugin buildx \
      "https://github.com/docker/buildx/releases/download/$BUILDX_VERSION/buildx-$BUILDX_VERSION.linux-$GOARCH"
  fi
elif [[ "$ID" == "ubuntu" || "$ID" == "debian" ]]; then
  apt-get update
  apt-get install -y ca-certificates curl git
  if ! command -v docker >/dev/null 2>&1; then
    # Docker's official convenience script: docker-ce + compose + buildx plugins
    curl -fsSL https://get.docker.com | sh
  fi
else
  echo "Unsupported OS: $PRETTY_NAME. Install Docker Engine with the Compose and Buildx plugins manually." >&2
  exit 1
fi

systemctl enable --now docker
usermod -aG docker "$TARGET_USER"

echo "==> Docker: $(docker --version)"
echo "==> Compose: $(docker compose version)"
echo "==> Buildx: $(docker buildx version)"

if ! swapon --show | grep -q '/swapfile'; then
  echo "==> Adding ${SWAP_SIZE_GB}G swap at /swapfile"
  fallocate -l "${SWAP_SIZE_GB}G" /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=$((SWAP_SIZE_GB * 1024))
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

REPO_DIR="$TARGET_HOME/payloadcms"
if [[ ! -d "$REPO_DIR/.git" ]]; then
  echo "==> Cloning $REPO_URL ($BRANCH) into $REPO_DIR"
  # Private repo? Clone with a GitHub deploy key or a fine-grained token instead, e.g.
  #   git clone https://<token>@github.com/<owner>/<repo>.git
  sudo -u "$TARGET_USER" git clone --branch "$BRANCH" "$REPO_URL" "$REPO_DIR"
else
  echo "==> $REPO_DIR already exists, skipping clone"
fi

if [[ ! -f "$REPO_DIR/apps/cms/.env" ]]; then
  sudo -u "$TARGET_USER" cp "$REPO_DIR/apps/cms/.env.example" "$REPO_DIR/apps/cms/.env"
fi

cat <<EOF

Done. Next steps:
  1. Log out and back in (so '$TARGET_USER' can use docker without sudo).
  2. Edit $REPO_DIR/apps/cms/.env (DATABASE_URL, PAYLOAD_SECRET, SERVER_URL, SITE_ADDRESS).
  3. Check the database connection:  $REPO_DIR/apps/cms/deploy/check-db.sh
  4. Deploy:                         $REPO_DIR/apps/cms/deploy/deploy.sh
EOF
