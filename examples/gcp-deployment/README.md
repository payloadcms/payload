# Payload CMS on Google Cloud Platform

Complete implementation guide for deploying Payload CMS on GCP with Cloud Storage integration and MCP server support for Claude.

## Architecture Overview

This implementation uses:

- **Google Cloud Storage (GCS)**: Asset storage with CDN support
- **Cloud SQL (PostgreSQL)**: Database for Payload CMS
- **Cloud Run**: Serverless container deployment (optional)
- **Cloud CDN**: Content delivery network for assets (optional)
- **Service Account**: Secure access to GCP resources
- **MCP Server**: Claude integration for asset management

## Prerequisites

- GCP account with billing enabled
- Node.js 18.20.2 or later
- pnpm 9.7.0 or later
- gcloud CLI installed
- Terraform (optional, for infrastructure as code)

## Quick Start

### Option 1: Automated Setup

```bash
cd examples/gcp-deployment/scripts
chmod +x setup.sh
./setup.sh
```

Follow the prompts to set up your GCP infrastructure.

### Option 2: Manual Setup

#### 1. Enable GCP APIs

```bash
gcloud services enable storage.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable run.googleapis.com
```

#### 2. Create GCS Bucket

```bash
export PROJECT_ID="your-project-id"
export BUCKET_NAME="${PROJECT_ID}-payload-assets"

gsutil mb -p $PROJECT_ID -c STANDARD -l us-central1 gs://${BUCKET_NAME}
```

#### 3. Configure CORS

Create `cors.json`:

```json
[
  {
    "origin": ["*"],
    "method": ["GET", "HEAD", "PUT", "POST", "DELETE"],
    "responseHeader": ["Content-Type"],
    "maxAgeSeconds": 3600
  }
]
```

Apply CORS:

```bash
gsutil cors set cors.json gs://${BUCKET_NAME}
```

#### 4. Create Service Account

```bash
gcloud iam service-accounts create payload-storage \
  --display-name="Payload Storage"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:payload-storage@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/storage.objectAdmin"

gcloud iam service-accounts keys create payload-key.json \
  --iam-account=payload-storage@${PROJECT_ID}.iam.gserviceaccount.com
```

## Option 3: Terraform Setup

For infrastructure as code:

```bash
cd examples/gcp-deployment/terraform

# Copy and edit variables
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values

# Initialize Terraform
terraform init

# Plan the deployment
terraform plan

# Apply the configuration
terraform apply
```

## Configuration

### Environment Variables

Create a `.env` file:

```bash
# GCP Configuration
GCP_PROJECT_ID=your-project-id
GCS_BUCKET_NAME=your-bucket-name
GCP_KEY_FILE=./payload-key.json

# Payload Configuration
PAYLOAD_SECRET=your-secret-key
PAYLOAD_PUBLIC_SERVER_URL=https://your-domain.com

# Database
DATABASE_URI=postgresql://user:password@host:5432/database

# MCP Server
PAYLOAD_API_URL=https://your-domain.com
PAYLOAD_API_KEY=your-api-key
```

### Payload Configuration

Use the example configuration from `config/payload.config.ts`:

```typescript
import { gcsStorage } from '@payloadcms/storage-gcs'

export default buildConfig({
  plugins: [
    gcsStorage({
      collections: {
        media: true,
        documents: true,
      },
      bucket: process.env.GCS_BUCKET_NAME || '',
      options: {
        projectId: process.env.GCP_PROJECT_ID,
        keyFilename: process.env.GCP_KEY_FILE,
      },
      acl: 'Public',
    }),
  ],
})
```

## Deployment Options

### 1. Cloud Run (Serverless)

Build and deploy:

```bash
# Build Docker image
docker build -t gcr.io/${PROJECT_ID}/payload-cms:latest .

# Push to Container Registry
docker push gcr.io/${PROJECT_ID}/payload-cms:latest

# Deploy to Cloud Run
gcloud run deploy payload-cms \
  --image gcr.io/${PROJECT_ID}/payload-cms:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "GCS_BUCKET_NAME=${BUCKET_NAME}" \
  --service-account payload-storage@${PROJECT_ID}.iam.gserviceaccount.com
```

### 2. Compute Engine

1. Create a VM instance
2. Install Node.js and dependencies
3. Clone your Payload project
4. Set environment variables
5. Run with PM2 or similar process manager

### 3. GKE (Kubernetes)

For production workloads with high availability:

```bash
# Create GKE cluster
gcloud container clusters create payload-cluster \
  --num-nodes=3 \
  --machine-type=n1-standard-2

# Deploy using Kubernetes manifests
kubectl apply -f k8s/
```

## MCP Server Setup

The MCP server allows Claude to interact with your Payload assets.

### Install the MCP Server

```bash
cd packages/mcp-server-assets
pnpm install
pnpm build
```

### Configure Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "payload-assets": {
      "command": "node",
      "args": ["/path/to/packages/mcp-server-assets/dist/index.js"],
      "env": {
        "GCS_BUCKET_NAME": "your-bucket-name",
        "GCP_PROJECT_ID": "your-project-id",
        "GCP_KEY_FILE": "/path/to/service-account-key.json",
        "PAYLOAD_API_URL": "https://your-payload-instance.com",
        "PAYLOAD_API_KEY": "your-api-key"
      }
    }
  }
}
```

### Using with Claude

Once configured, you can:

- "Upload this image to my Payload CMS"
- "List all media assets"
- "Search for images with 'logo' in the filename"
- "Get a signed URL for private-image.jpg"
- "Delete asset ID abc123"

## Security Best Practices

### 1. Service Account Permissions

Use minimal permissions:

```bash
# Only grant necessary roles
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:payload-storage@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/storage.objectAdmin"
```

### 2. Bucket Access

For private assets, use:

```typescript
gcsStorage({
  acl: 'Private',
  // Generate signed URLs when needed
})
```

### 3. API Keys

- Store API keys in Secret Manager
- Rotate keys regularly
- Use different keys for different environments

### 4. Network Security

- Use VPC Service Controls
- Enable Cloud Armor for DDoS protection
- Implement rate limiting

## Performance Optimization

### 1. Enable Cloud CDN

```bash
gcloud compute backend-buckets create payload-assets-cdn \
  --gcs-bucket-name=$BUCKET_NAME \
  --enable-cdn
```

### 2. Image Optimization

Use Payload's built-in image optimization:

```typescript
{
  slug: 'media',
  upload: {
    imageSizes: [
      { name: 'thumbnail', width: 300, height: 300 },
      { name: 'card', width: 768, height: 512 },
      { name: 'hero', width: 1920, height: 1080 },
    ],
  },
}
```

### 3. Caching

Set cache headers:

```typescript
gcsStorage({
  generateURL: ({ bucket, filename }) => {
    return `https://cdn.yourdomain.com/${filename}`
  },
})
```

## Monitoring

### 1. Cloud Monitoring

```bash
# Create alerts for bucket usage
gcloud alpha monitoring policies create \
  --notification-channels=CHANNEL_ID \
  --display-name="GCS High Usage" \
  --condition-display-name="Bucket Usage > 80%"
```

### 2. Cloud Logging

Enable logging for GCS:

```bash
gsutil logging set on \
  -b gs://logs-bucket \
  gs://${BUCKET_NAME}
```

## Cost Optimization

1. **Storage Classes**: Use lifecycle rules to move old files to Nearline/Coldline
2. **CDN**: Enable Cloud CDN to reduce egress costs
3. **Compression**: Enable gzip compression for text-based assets
4. **Request Deduplication**: Use Cloud CDN to deduplicate requests

## Troubleshooting

### Issue: "Access Denied" errors

**Solution**: Check service account permissions

```bash
gsutil iam get gs://${BUCKET_NAME}
```

### Issue: CORS errors

**Solution**: Update CORS configuration

```bash
gsutil cors set cors.json gs://${BUCKET_NAME}
```

### Issue: Slow uploads

**Solution**: Enable client-side uploads

```typescript
gcsStorage({
  clientUploads: true,
})
```

## Backup and Disaster Recovery

### Automated Backups

```bash
# Enable versioning
gsutil versioning set on gs://${BUCKET_NAME}

# Create backup bucket
gsutil mb gs://${BUCKET_NAME}-backup

# Set up transfer job
gcloud transfer jobs create \
  gs://${BUCKET_NAME} \
  gs://${BUCKET_NAME}-backup \
  --schedule-starts-date=$(date +%Y-%m-%d)
```

## Resources

- [GCS Documentation](https://cloud.google.com/storage/docs)
- [Payload CMS Docs](https://payloadcms.com/docs)
- [MCP Protocol](https://modelcontextprotocol.io/)
- [Terraform GCP Provider](https://registry.terraform.io/providers/hashicorp/google/latest/docs)

## Support

For issues and questions:

- GitHub Issues: [payloadcms/payload](https://github.com/payloadcms/payload/issues)
- Discord: [payload.chat](https://discord.gg/payload)
- GCP Support: [cloud.google.com/support](https://cloud.google.com/support)
