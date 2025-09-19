# Production Dockerfile for @payloadcms/ui Storybook
FROM node:22.17.0-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files for dependency installation
COPY package.json pnpm-lock.yaml* ./
COPY ../../pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY ../../tsconfig.base.json ./tsconfig.base.json

# Enable pnpm and install dependencies
RUN corepack enable pnpm && pnpm i --frozen-lockfile

# Build stage
FROM base AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=deps /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=deps /app/tsconfig.base.json ./tsconfig.base.json

# Copy source code and config files
COPY . .

# Set production environment
ENV NODE_ENV=production
ENV SASS_SILENCE_DEPRECATIONS=legacy-js-api
ENV SASS_QUIET_DEPS=true

# Build Storybook for production
RUN corepack enable pnpm && pnpm build-storybook

# Production stage
FROM nginx:alpine AS runner
WORKDIR /usr/share/nginx/html

# Copy built Storybook
COPY --from=builder /app/storybook-static ./

# Create nginx config for serving Storybook
RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html; \
        try_files $uri $uri/ /index.html; \
    } \
    location /health { \
        access_log off; \
        return 200 "healthy\n"; \
        add_header Content-Type text/plain; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
