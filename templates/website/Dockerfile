# Base image for all stages
FROM node:22-alpine AS base

# Common ARGs for build-time variables (Make them available for all stages)
ARG DATABASE_URI
ARG PAYLOAD_SECRET
ARG PAYLOAD_PUBLIC_SERVER_URL
ARG NEXT_PUBLIC_SERVER_URL
ARG NEXT_PUBLIC_IS_LIVE
ARG PAYLOAD_PUBLIC_DRAFT_SECRET
ARG NEXT_PRIVATE_DRAFT_SECRET
ARG REVALIDATION_KEY
ARG NEXT_PRIVATE_REVALIDATION_KEY

# ENV variables (Optional: persist build-time variables as runtime ENV)
ENV DATABASE_URI=${DATABASE_URI}
ENV PAYLOAD_SECRET=${PAYLOAD_SECRET}
ENV PAYLOAD_PUBLIC_SERVER_URL=${PAYLOAD_PUBLIC_SERVER_URL}
ENV NEXT_PUBLIC_SERVER_URL=${NEXT_PUBLIC_SERVER_URL}
ENV NEXT_PUBLIC_IS_LIVE=${NEXT_PUBLIC_IS_LIVE}
ENV PAYLOAD_PUBLIC_DRAFT_SECRET=${PAYLOAD_PUBLIC_DRAFT_SECRET}
ENV NEXT_PRIVATE_DRAFT_SECRET=${NEXT_PRIVATE_DRAFT_SECRET}
ENV REVALIDATION_KEY=${REVALIDATION_KEY}
ENV NEXT_PRIVATE_REVALIDATION_KEY=${NEXT_PRIVATE_REVALIDATION_KEY}

# Dependencies Stage
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./

RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Build Stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Use build-time variables during build
RUN \
  if [ -f yarn.lock ]; then yarn run build; \
  elif [ -f package-lock.json ]; then npm run build; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm run build; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Runner Stage
FROM base AS runner
WORKDIR /app

# Use runtime variables here
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Create nextjs user and group
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

RUN mkdir .next

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD HOSTNAME="0.0.0.0" node server.js
