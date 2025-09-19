# Production Dockerfile for @payloadcms/ui Storybook
FROM node:22.17.0-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy UI package files
COPY package.json ./
COPY babel.config.cjs bundle.js tsconfig.json .swcrc .browserslistrc ./
COPY .storybook ./.storybook/
COPY src ./src/

# Copy translations package (workspace dependency) - create a minimal version
RUN mkdir -p ./node_modules/@payloadcms/translations
COPY ../../packages/translations/package.json ./node_modules/@payloadcms/translations/package.json
COPY ../../packages/translations/src ./node_modules/@payloadcms/translations/src

# Create a temporary package.json without workspace dependencies
RUN node -e "const pkg = require('./package.json'); const fs = require('fs'); if (pkg.dependencies && pkg.dependencies['@payloadcms/translations']) { pkg.dependencies['@payloadcms/translations'] = 'file:./node_modules/@payloadcms/translations'; } if (pkg.peerDependencies) { delete pkg.peerDependencies.payload; } if (pkg.devDependencies) { delete pkg.devDependencies.payload; delete pkg.devDependencies['@payloadcms/eslint-config']; } fs.writeFileSync('./package.json', JSON.stringify(pkg, null, 2));"

# Enable pnpm and install dependencies
RUN corepack enable pnpm && pnpm i --no-frozen-lockfile

# Build stage
FROM base AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app ./

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
