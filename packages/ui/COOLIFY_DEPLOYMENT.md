# Payload UI Storybook Deployment on Coolify

This guide explains how to deploy the Payload UI package's Storybook to Coolify using the provided Dockerfile.

## Files Created

- `Dockerfile` - Multi-stage Dockerfile optimized for Storybook deployment
- `.dockerignore` - Docker ignore file to optimize build performance
- `COOLIFY_DEPLOYMENT.md` - This deployment guide

## Coolify Configuration

### 1. Project Setup

1. **Create New Project** in Coolify
2. **Connect Repository** - Link your Payload repository
3. **Select Branch** - Choose the branch containing your UI package

### 2. Build Configuration

**Dockerfile Settings:**

- **Dockerfile Path**: `./packages/ui/Dockerfile`
- **Build Context**: `./packages/ui` (UI package directory)
- **Build Command**: Leave empty (Docker handles this automatically)

### 3. Environment Variables

Set these environment variables in Coolify:

```bash
NODE_ENV=production
STORYBOOK=true
SASS_SILENCE_DEPRECATIONS=legacy-js-api
SASS_QUIET_DEPS=true
```

### 4. Port Configuration

- **Port**: `80`
- **Health Check Path**: `/health`
- **Health Check Interval**: `30s`

### 5. Resource Allocation

**Recommended Resources:**

- **CPU**: 0.5-1 CPU cores
- **Memory**: 512MB-1GB RAM
- **Storage**: 1-2GB (for build cache and static files)

### 6. Domain Configuration

1. **Custom Domain** (optional):

   - Set up a subdomain like `storybook.yourdomain.com`
   - Configure SSL certificate
   - Enable HTTPS redirect

2. **Coolify Subdomain** (default):
   - Use the provided Coolify subdomain
   - Example: `your-project.coolify.app`

## Deployment Process

### Automatic Deployment

1. **Push to Repository** - Any push to the configured branch triggers deployment
2. **Build Process** - Coolify will:
   - Clone the repository
   - Build the Docker image using `Dockerfile.storybook`
   - Deploy the container
   - Start the nginx server

### Manual Deployment

1. Go to your project in Coolify
2. Click **"Deploy"** button
3. Monitor the build logs
4. Wait for deployment to complete

## Build Process Details

The Dockerfile uses a multi-stage build:

1. **Dependencies Stage**: Installs pnpm and project dependencies
2. **Build Stage**:
   - Builds the UI package (`pnpm build`)
   - Builds Storybook (`pnpm build-storybook`)
3. **Runtime Stage**:
   - Uses nginx to serve static files
   - Includes gzip compression and caching
   - Adds security headers

## Performance Optimizations

### Nginx Configuration

- **Gzip Compression**: Enabled for text-based assets
- **Static Asset Caching**: 1-year cache for immutable assets
- **Security Headers**: Basic security headers included

### Docker Optimizations

- **Multi-stage Build**: Reduces final image size
- **Layer Caching**: Dependencies cached separately from source
- **Alpine Linux**: Minimal base image for smaller size

## Monitoring and Health Checks

### Health Check Endpoint

- **URL**: `https://your-domain.com/health`
- **Response**: `healthy` (plain text)
- **Interval**: 30 seconds

### Logs

- **Build Logs**: Available during deployment
- **Runtime Logs**: Available in Coolify dashboard
- **Nginx Access Logs**: Standard nginx logging

## Troubleshooting

### Common Issues

1. **Build Fails - Dependencies**

   - Check if all required packages are included in `.dockerignore.storybook`
   - Verify `pnpm-lock.yaml` is up to date

2. **Storybook Not Loading**

   - Check if UI package builds successfully
   - Verify Storybook configuration in `.storybook/` directory

3. **Static Assets Not Loading**

   - Check nginx configuration
   - Verify file permissions in container

4. **Memory Issues**

   - Increase memory allocation in Coolify
   - Check if build process is using too much RAM

5. **Coolify-Specific Issues**
   - **"storybook: not found" error**: This is usually a Coolify-specific issue. The Dockerfile uses `npx storybook build` to avoid pnpm script resolution issues
   - **Build fails on Coolify but works locally**: Try clearing Coolify's build cache
   - **Dependencies not found**: Ensure Coolify has access to the entire monorepo structure
   - **Port configuration**: Make sure Coolify is configured to use port 6006

### Debug Commands

To debug locally, you can run:

```bash
# Build the Docker image locally
docker build -f Dockerfile.storybook -t payload-storybook .

# Run the container locally
docker run -p 8080:80 payload-storybook

# Check container logs
docker logs <container-id>

# Access container shell
docker exec -it <container-id> sh
```

## Customization

### Custom Nginx Configuration

To modify nginx settings, edit the nginx configuration section in `Dockerfile.storybook`:

```dockerfile
# Create nginx configuration for Storybook
RUN cat > /etc/nginx/conf.d/default.conf << 'EOF'
# Your custom nginx configuration here
EOF
```

### Additional Environment Variables

Add any additional environment variables needed for your Storybook:

```dockerfile
ENV YOUR_CUSTOM_VAR=value
```

### Custom Domain Setup

1. **DNS Configuration**:

   - Add CNAME record pointing to your Coolify domain
   - Example: `storybook.yourdomain.com` → `your-project.coolify.app`

2. **SSL Certificate**:
   - Coolify can automatically provision SSL certificates
   - Or use your own certificate

## Maintenance

### Updates

1. **Code Updates**: Push changes to trigger automatic deployment
2. **Dependency Updates**: Update `pnpm-lock.yaml` and redeploy
3. **Storybook Updates**: Update Storybook version in `package.json`

### Monitoring

- **Uptime**: Monitor via Coolify dashboard
- **Performance**: Check nginx access logs
- **Health**: Use `/health` endpoint for monitoring

## Cost Optimization

- **Resource Limits**: Set appropriate CPU/memory limits
- **Auto-scaling**: Configure based on traffic patterns
- **CDN**: Consider adding a CDN for better global performance

## Security Considerations

- **HTTPS**: Always use HTTPS in production
- **Security Headers**: Included in nginx configuration
- **Access Control**: Consider adding authentication if needed
- **Updates**: Keep dependencies and base images updated

---

For more information about Coolify, visit the [Coolify Documentation](https://coolify.io/docs).
