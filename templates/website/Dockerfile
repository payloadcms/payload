# Use a Node.js base image
FROM node:18-alpine AS base

# Enable Corepack to manage package managers like pnpm
RUN corepack enable

# Set the working directory
WORKDIR /app

# Copy package.json and pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# Install dependencies (only production dependencies if applicable)
RUN pnpm install --frozen-lockfile --prod

# Copy the rest of the app code including the build artifacts
COPY . .

# Expose the app port
EXPOSE 3000

# Start the app
CMD ["pnpm", "start"]
