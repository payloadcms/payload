# Multi-stage Dockerfile for Payload UI Storybook deployment
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy workspace configuration files from root
COPY ../../package.json ../../pnpm-lock.yaml ../../pnpm-workspace.yaml ./
COPY ../../tsconfig.base.json ./

# Copy package.json files for all dependencies
COPY package.json ./packages/ui/
COPY ../../packages/translations/package.json ./packages/translations/
COPY ../../packages/payload/package.json ./packages/payload/

# Install dependencies
RUN corepack enable pnpm && pnpm install --frozen-lockfile

# Build stage
FROM base AS builder
WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json
COPY --from=deps /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=deps /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=deps /app/tsconfig.base.json ./tsconfig.base.json

# Copy source code
COPY . ./packages/ui
COPY ../../packages/translations ./packages/translations
COPY ../../packages/payload ./packages/payload

# Set environment variables for build
ENV NODE_ENV=production
ENV STORYBOOK=true
ENV SASS_SILENCE_DEPRECATIONS=legacy-js-api
ENV SASS_QUIET_DEPS=true

# Build the UI package first (required for Storybook)
RUN corepack enable pnpm && \
    cd packages/ui && \
    pnpm build

# Build Storybook
RUN corepack enable pnpm && \
    cd packages/ui && \
    pnpm build-storybook

# Production stage with nginx
FROM nginx:alpine AS runner

# Install node for potential server-side rendering if needed
RUN apk add --no-cache nodejs

# Copy the built Storybook static files
COPY --from=builder /app/packages/ui/storybook-static /usr/share/nginx/html

# Create nginx configuration for Storybook
RUN cat > /etc/nginx/conf.d/default.conf << 'EOF'
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Enable gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    # Handle Storybook routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header Vary "Accept-Encoding";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF

# Create a simple health check script
RUN echo '#!/bin/sh' > /usr/local/bin/health-check.sh && \
    echo 'curl -f http://localhost/health || exit 1' >> /usr/local/bin/health-check.sh && \
    chmod +x /usr/local/bin/health-check.sh

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD /usr/local/bin/health-check.sh

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
