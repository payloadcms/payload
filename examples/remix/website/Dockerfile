FROM node:22.14.0-alpine AS base

FROM base AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

RUN npm install -g pnpm@latest-10

COPY . .

RUN apk update \
  apk add --no-cache libc6-compat

WORKDIR /app

ENV NODE_ENV=production
RUN pnpm install --no-frozen-lockfile
RUN pnpm --filter website build

FROM base AS runner

RUN npm install -g @remix-run/serve@latest
WORKDIR /app
COPY --from=builder /app/website/build/ ./build

# We need to install sharp again to avoid copying node_modules into the final image.
# Sharp can't be bundled into the server file since it will throw an
# __dirname is not defined error
RUN npm install sharp@0.32.6

# These files are required by Payload to avoid file opening errors
# https://github.com/payloadcms/payload/issues/11276
COPY --from=builder /app/website/package.json ./package.json
COPY --from=builder /app/payload/src/payload.config.ts ./payload.config.ts
ENV PAYLOAD_CONFIG_PATH=./payload.config.ts

EXPOSE 3000
ENV PORT=3000
ENV NODE_ENV=production

CMD HOSTNAME="0.0.0.0" remix-serve build/server/index.js
