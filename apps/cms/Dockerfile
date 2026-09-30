# syntax=docker/dockerfile:1.7
#
# Production image for the Payload CMS app, built from THIS branch's packages/ sources.
#
# The build context must be the repository root:
#   docker build -f apps/cms/Dockerfile -t payload-cms .
# (docker-compose.yml in this folder already does that.)
#
# Stages:
#   packages - install the monorepo, build the Payload packages, pack them into tarballs
#   builder  - install the app against those tarballs and run `payload build` (next build)
#   runner   - minimal runtime with only the Next.js standalone output

ARG NODE_IMAGE=node:24-slim
ARG PNPM_VERSION=11.9.0

FROM ${NODE_IMAGE} AS base
ARG PNPM_VERSION
RUN npm install -g pnpm@${PNPM_VERSION}
ENV CI=true \
    DO_NOT_TRACK=1 \
    HUSKY=0 \
    NEXT_TELEMETRY_DISABLED=1 \
    TURBO_TELEMETRY_DISABLED=1

# -----------------------------------------------------------------------------
FROM base AS packages
WORKDIR /repo

# Copy only what building the packages needs, so editing the app (apps/cms/src)
# does not invalidate this stage and the slow package build stays cached.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json tsconfig.json .swcrc ./
COPY packages ./packages
COPY tools ./tools
COPY apps/cms/pnpm-workspace.yaml ./apps/cms/
COPY apps/cms/scripts ./apps/cms/scripts

# Only install what the Payload packages below (and the root build tooling) need.
# --ignore-scripts skips the root `prepare` hook and test-only postinstalls.
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --ignore-scripts --store-dir /pnpm/store \
      --filter payload-monorepo \
      --filter "payload..." \
      --filter "@payloadcms/db-mongodb..." \
      --filter "@payloadcms/next..." \
      --filter "@payloadcms/richtext-lexical..." \
      --filter "@payloadcms/storage-s3..."

RUN NODE_OPTIONS="--max-old-space-size=6144" pnpm turbo build \
      --filter payload \
      --filter @payloadcms/db-mongodb \
      --filter @payloadcms/next \
      --filter @payloadcms/richtext-lexical \
      --filter @payloadcms/storage-s3 \
      --output-logs=errors-only

# Writes apps/cms/local-packages/*.tgz and the matching overrides in apps/cms/pnpm-workspace.yaml
RUN node apps/cms/scripts/pack-local-packages.mjs

# -----------------------------------------------------------------------------
FROM base AS builder
WORKDIR /app
COPY apps/cms ./
COPY --from=packages /repo/apps/cms/local-packages ./local-packages
COPY --from=packages /repo/apps/cms/pnpm-workspace.yaml ./pnpm-workspace.yaml

RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --no-frozen-lockfile --store-dir /pnpm/store

RUN pnpm run build

# -----------------------------------------------------------------------------
FROM ${NODE_IMAGE} AS runner
WORKDIR /app

ENV HOSTNAME=0.0.0.0 \
    MEDIA_DIR=/app/media \
    NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production \
    PORT=3006

# The base image ships an unprivileged `node` user (uid 1000)
RUN mkdir -p .next media && chown node:node .next media

COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

USER node
EXPOSE 3006

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:3000/api/health').then((res) => process.exit(res.ok ? 0 : 1), () => process.exit(1))"]

CMD ["node", "server.js"]
