#!/usr/bin/env bash
set -euo pipefail

# Runs the `@visual`-tagged e2e tests inside the exact Playwright Docker image CI uses.
# Screenshots differ enough between operating systems (font hinting/anti-aliasing) that
# baselines generated on a bare macOS/Windows host will never match CI, even when nothing
# visually changed. This script is the only supported way to generate or update baselines.
#
# Usage:
#   pnpm test:visual              # run every suite that has an @visual-tagged test
#   pnpm test:visual [suite] -- [playwright flags]
#   pnpm test:visual:update       # accept intentional visual changes, every suite
#   pnpm test:visual [suite] -- --update-snapshots   # accept intentional visual changes, one suite
#
# The root `node_modules` is installed fresh inside a Docker volume (not bind-mounted from the
# host) because the host's `node_modules` may contain macOS-native binaries (sharp, etc.) that are
# incompatible with the container's Linux/glibc environment. `test/node_modules` deliberately
# isn't given the same volume treatment: `prepare-run-test-against-prod:ci` unconditionally
# `rm -rf test/node_modules`s on every run anyway (so there's nothing to isolate long-term — any
# leftover Linux binaries get wiped the next time this runs, in Docker or on the host), and `rm -rf`
# on an active mount point fails with "Device or resource busy" (you can't rmdir a mount point,
# empty or not), which would abort that `&&`-chained script before it ever reaches the actual
# install.
#
# `prepare-run-test-against-prod:ci` also `rm -rf`s the top-level `app/` and rewrites
# `test/package.json`/`test/pnpm-workspace.yaml` in place (to point every `@payloadcms/*` dep at
# a packed tarball — see `test/setupProd.ts`). Since the container bind-mounts the real repo, those
# three paths are given the same volume/scratch-file treatment below so that work lands on a
# throwaway copy instead of the host's tracked files. `test/pnpm-lock.yaml` and `test/packed` are
# also rewritten but are already gitignored, so they need no such isolation.

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT"

PLAYWRIGHT_VERSION=$(node -e "console.log(require('./node_modules/@playwright/test/package.json').version)")

if [ -z "$PLAYWRIGHT_VERSION" ]; then
  echo "Could not determine the installed @playwright/test version. Run 'pnpm install' first." >&2
  exit 1
fi

# Same precedence the rest of the test harness uses (see test/dbAdapters.ts and
# playwright.config.ts's dotenv.config calls): MONGODB_URL, then DATABASE_URL, checked in the
# shell env first and falling back to the repo-root .env file, since a plain bash script doesn't
# source dotenv files itself. This lets a developer point at their own Mongo (any host/port,
# already running outside this repo's `pnpm docker:start`) instead of always assuming 27018.
read_env_var() {
  local name="$1"
  local value="${!name:-}"
  if [ -z "$value" ] && [ -f "$REPO_ROOT/.env" ]; then
    value="$(grep -E "^${name}=" "$REPO_ROOT/.env" | tail -1 | cut -d= -f2-)"
  fi
  echo "$value"
}

MONGO_SOURCE_URL="$(read_env_var MONGODB_URL)"
if [ -z "$MONGO_SOURCE_URL" ]; then
  MONGO_SOURCE_URL="$(read_env_var DATABASE_URL)"
fi

if [ -n "$MONGO_SOURCE_URL" ]; then
  # Reuse whatever Mongo is already configured rather than assuming this repo's own
  # `pnpm docker:start` default. The container can't reach the host via `localhost`/`127.0.0.1`
  # (that resolves to the container itself), so rewrite those to `host.docker.internal`, which
  # `--add-host` below makes resolve back to the host on every platform.
  NODE_OUT="$(node -e "
    const raw = process.argv[1]
    const scheme = raw.startsWith('mongodb+srv://') ? 'mongodb+srv://' : 'mongodb://'
    const u = new URL(raw.replace(scheme, 'http://'))
    console.log(u.hostname)
    console.log(u.port || '27017')
    if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') {
      u.hostname = 'host.docker.internal'
    }
    console.log(u.toString().replace('http://', scheme))
  " "$MONGO_SOURCE_URL")"
  MONGO_HOST="$(sed -n '1p' <<< "$NODE_OUT")"
  MONGO_PORT="$(sed -n '2p' <<< "$NODE_OUT")"
  CONTAINER_MONGODB_URL="$(sed -n '3p' <<< "$NODE_OUT")"
else
  # 27018, not the MongoDB default 27017 — `pnpm docker:start`'s `mongodb` profile maps the
  # container's 27017 to host port 27018 to avoid clashing with a Mongo instance a developer might
  # already have running locally (see test/dbAdapters.ts).
  MONGO_HOST="127.0.0.1"
  MONGO_PORT="27018"
  CONTAINER_MONGODB_URL="mongodb://payload:payload@host.docker.internal:27018/payload?authSource=admin&directConnection=true&replicaSet=rs0"
fi

# mongodb+srv resolves its actual host(s)/port via DNS SRV lookup, so there's no single
# host:port worth probing directly — trust it's reachable and let the container's own connection
# attempt surface a clear error if not.
if [[ "$MONGO_SOURCE_URL" != mongodb+srv://* ]] && ! (exec 3<>"/dev/tcp/${MONGO_HOST}/${MONGO_PORT}") 2>/dev/null; then
  echo "MongoDB isn't reachable at ${MONGO_HOST}:${MONGO_PORT}. Run 'pnpm docker:start' first, or fix MONGODB_URL/DATABASE_URL (checked in the shell env, then .env)." >&2
  exit 1
fi

IMAGE="mcr.microsoft.com/playwright:v${PLAYWRIGHT_VERSION}-noble"

# `pnpm test:visual -- --update-snapshots` (and `pnpm test:visual <suite> --
# --update-snapshots`) forward a literal `--` through to this script (pnpm doesn't strip it for a
# plain `bash <script>` command). Drop every bare `--` token, wherever it falls, since it would
# otherwise reach runE2E.ts's minimist parsing and get treated as "stop parsing flags", silently
# swallowing everything after it (including --update-snapshots) into positional args.
ARGS=()
for arg in "$@"; do
  if [ "$arg" != "--" ]; then
    ARGS+=("$arg")
  fi
done
set -- "${ARGS[@]}"

SUITE=""
if [ "$#" -gt 0 ] && [[ "$1" != -* ]]; then
  SUITE="$1"
  shift
fi
EXTRA_ARGS="$*"

TTY_FLAGS=""
if [ -t 0 ]; then
  TTY_FLAGS="-it"
fi

echo "Using $IMAGE"

# Scratch copies of the two files `prepare-run-test-against-prod:ci` rewrites in place, bind-mounted
# over the real ones below so the container edits these instead. Seeded from the current content
# (not left empty) since `test/setupProd.ts` reads the existing dependency list to know which
# entries to point at a tarball.
SCRATCH_DIR="$(mktemp -d)"
cp "$REPO_ROOT/test/package.json" "$SCRATCH_DIR/package.json"
cp "$REPO_ROOT/test/pnpm-workspace.yaml" "$SCRATCH_DIR/pnpm-workspace.yaml"

# `app/` can't be given the same file-level bind-mount treatment: `prepare-run-test-against-prod:ci`
# `rm -rf`s it outright, and Linux refuses to remove a directory that's itself an active mount
# point ("Device or resource busy") — the same constraint that already keeps `test/node_modules`
# off the isolation list above. Moving it out of the bind-mounted tree entirely sidesteps that:
# the container just finds no `app/` to remove (a silent no-op for `rm -rf`), which is safe since
# nothing in this pipeline reads from `app/` — it's not a pnpm workspace member and isn't part of
# `build:all`'s package graph.
restore_app() {
  rm -rf "$SCRATCH_DIR"
}
if [ -d "$REPO_ROOT/app" ]; then
  mv "$REPO_ROOT/app" "$SCRATCH_DIR/app"
  restore_app() {
    rm -rf "$REPO_ROOT/app"
    mv "$SCRATCH_DIR/app" "$REPO_ROOT/app"
    rm -rf "$SCRATCH_DIR"
  }
fi
trap restore_app EXIT

# Delegates to the `prepare-run-test-against-prod:ci` pipeline CI's `e2e-prep` job uses (pack
# every package to a .tgz -> rewrite test/package.json to depend on those tarballs -> `pnpm i`
# inside test/) rather than hand-rolling a `turbo build` filter list. That matters beyond
# consistency: every test config (see test/buildConfigWithDefaults.ts) unconditionally imports
# `@payloadcms/plugin-mcp`, so a filter that excludes `@payloadcms/plugin-*` (mirroring
# `build:core`, which is fine for the admin UI itself) leaves that package unbuilt and the prod
# server fails to boot. `build:all` (run explicitly below, since the `:ci` pipeline itself skips
# it — it normally assumes a separate build job already ran) has no such gap.
#
# The dist check skips rebuilding on a second run against the same bind-mounted checkout (e.g.
# re-running after only changing a test spec), since `packages/*/dist` persists on the host.
#
# run-visual-suites.sh discovers every suite with an @visual-tagged test when $SUITE is empty
# (the default), rather than only ever running one hardcoded suite.
CONTAINER_CMD="
  apt-get update -qq && apt-get install -y -qq build-essential python3 > /dev/null &&
  npm install -g pnpm@\$(grep '^pnpm ' .tool-versions | awk '{print \$2}') &&
  pnpm install --frozen-lockfile &&
  ( [ -d packages/payload/dist ] || pnpm run build:all ) &&
  pnpm prepare-run-test-against-prod:ci &&
  export \$(grep -E '^PORT=' .env 2>/dev/null) &&
  bash .github/scripts/visual/run-visual-suites.sh ${SUITE} -- ${EXTRA_ARGS}
"

# The prod-server e2e path needs a real MongoDB, resolved above from MONGODB_URL/DATABASE_URL or
# this repo's own `pnpm docker:start` default. `--network host` would reach it directly on Linux,
# but doesn't reliably share the host loopback on Docker Desktop for macOS — this repo's primary
# local dev platform — so instead route through `host.docker.internal` (native on Mac/Windows;
# `--add-host` below makes it resolve on Linux too), which $CONTAINER_MONGODB_URL already points at
# in place of `localhost`/`127.0.0.1` (meaning the container itself, not the host).
# shellcheck disable=SC2086
docker run --rm $TTY_FLAGS \
  --add-host=host.docker.internal:host-gateway \
  --ipc=host \
  -e MONGODB_URL="$CONTAINER_MONGODB_URL" \
  -e PLAYWRIGHT_HTML_REPORT \
  -v "$REPO_ROOT":/repo \
  -v payload_visual_node_modules:/repo/node_modules \
  -v "$SCRATCH_DIR/package.json":/repo/test/package.json \
  -v "$SCRATCH_DIR/pnpm-workspace.yaml":/repo/test/pnpm-workspace.yaml \
  -w /repo \
  "$IMAGE" \
  bash -lc "$CONTAINER_CMD"
