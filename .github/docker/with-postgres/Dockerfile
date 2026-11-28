FROM node:22.17.0-alpine AS base

RUN apk add --no-cache libc6-compat
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps

COPY templates/with-postgres/package.json ./package.json
COPY templates/with-postgres/.yarnrc ./.yarnrc

RUN corepack enable \
  && corepack prepare pnpm@9.0.0 --activate \
  && pnpm install --no-frozen-lockfile

FROM base AS builder

ENV NODE_ENV=production
ENV PAYLOAD_SECRET=build-time-secret
ENV PAYLOAD_CONFIG_PATH=src/payload.config.ts
ENV DATABASE_URL=postgresql://127.0.0.1:5432/payload

COPY --from=deps /app/node_modules ./node_modules
COPY templates/with-postgres/ ./

RUN corepack enable \
  && corepack prepare pnpm@9.0.0 --activate \
  && pnpm build \
  && pnpm prune --prod

FROM node:22.17.0-alpine AS runner

RUN apk add --no-cache libc6-compat postgresql-client
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV PAYLOAD_CONFIG_PATH=src/payload.config.ts
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app ./
COPY .github/docker/with-postgres/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

RUN corepack enable \
  && corepack prepare pnpm@9.0.0 --activate \
  && chmod +x /usr/local/bin/docker-entrypoint.sh \
  && mkdir -p /app/src/media \
  && chown -R node:node /app /usr/local/bin/docker-entrypoint.sh

USER node

EXPOSE 3000

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["pnpm", "start"]
