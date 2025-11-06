# Dockerfile for deploying Payload CMS on GCP Cloud Run

# Stage 1: Build
FROM node:20-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.7.0 --activate

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/payload/package.json ./packages/payload/
COPY packages/db-postgres/package.json ./packages/db-postgres/
COPY packages/storage-gcs/package.json ./packages/storage-gcs/
COPY packages/richtext-lexical/package.json ./packages/richtext-lexical/
COPY packages/next/package.json ./packages/next/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build Payload
RUN pnpm run build:core

# Stage 2: Production
FROM node:20-alpine AS runner

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.7.0 --activate

# Set working directory
WORKDIR /app

# Set environment to production
ENV NODE_ENV=production

# Copy built application
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/node_modules ./node_modules

# Copy application files
COPY --from=builder /app/app ./app
COPY --from=builder /app/next.config.mjs ./
COPY --from=builder /app/next-env.d.ts ./
COPY --from=builder /app/tsconfig.json ./

# Create uploads directory
RUN mkdir -p /app/uploads

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/access', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start application
CMD ["pnpm", "start"]
