# Multi-stage Dockerfile for Payload UI Storybook deployment
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat python3 make g++ py3-pip
WORKDIR /app

# Copy workspace configuration files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY tsconfig.base.json ./

# Copy package.json files for all dependencies
COPY packages/ui/package.json ./packages/ui/
COPY packages/translations/package.json ./packages/translations/
COPY packages/payload/package.json ./packages/payload/

# Install dependencies
RUN corepack enable pnpm && pnpm install --frozen-lockfile

# Build stage
FROM base AS builder
RUN apk add --no-cache libc6-compat python3 make g++ py3-pip
WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json
COPY --from=deps /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=deps /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=deps /app/tsconfig.base.json ./tsconfig.base.json

# Copy source code
COPY packages/ui ./packages/ui
COPY packages/translations ./packages/translations
COPY packages/payload ./packages/payload

# Set environment variables for build
ENV NODE_ENV=production
ENV STORYBOOK=true
ENV SASS_SILENCE_DEPRECATIONS=legacy-js-api
ENV SASS_QUIET_DEPS=true

# Build Storybook (dependencies are already installed from deps stage)
RUN corepack enable pnpm && \
    cd packages/ui && \
    pnpm build-storybook

# Production stage - minimal with serve
FROM node:20-alpine AS runner

# Install serve globally
RUN npm install -g serve

# Set working directory
WORKDIR /app

# Copy the built Storybook static files
COPY --from=builder /app/packages/ui/storybook-static ./storybook-static

# Create a simple health check script
RUN echo '#!/bin/sh' > /usr/local/bin/health-check.sh && \
    echo 'wget --no-verbose --tries=1 --spider http://localhost:6006/health || exit 1' >> /usr/local/bin/health-check.sh && \
    chmod +x /usr/local/bin/health-check.sh

# Expose port 6006
EXPOSE 6006

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD /usr/local/bin/health-check.sh

# Start serve with health check endpoint on port 6006
CMD ["sh", "-c", "echo 'healthy' > storybook-static/health && serve -s storybook-static -l 6006"]
