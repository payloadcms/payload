# Payload CMS with Google Cloud Platform and MCP Server

Complete guide for deploying Payload CMS on Google Cloud Platform with asset management via Google Cloud Storage and Claude integration through MCP server.

## 🎯 Overview

This implementation provides:

1. **Google Cloud Storage Integration** - Store and serve assets from GCS
2. **MCP Server** - Enable Claude to manage assets programmatically
3. **Infrastructure as Code** - Terraform configurations for repeatable deployments
4. **Multiple Deployment Options** - Cloud Run, Compute Engine, or GKE
5. **Production-Ready** - Security, monitoring, and optimization built-in

## 📁 Project Structure

```
packages/
  mcp-server-assets/          # MCP server for Claude integration
    src/
      tools/                   # Asset management tools
      resources/               # GCS resource handlers
      utils/                   # Helper utilities
    package.json
    README.md

examples/
  gcp-deployment/             # GCP deployment example
    terraform/                # Infrastructure as code
      main.tf
      variables.tf
    scripts/                  # Deployment scripts
      setup.sh               # Automated setup
      deploy-cloud-run.sh    # Cloud Run deployment
    config/                   # Configuration examples
      payload.config.ts      # Payload config with GCS
    Dockerfile               # Container image
    README.md                # Detailed documentation
```

## 🚀 Quick Start

### Prerequisites

- GCP account with billing enabled
- Node.js 18.20.2+ and pnpm 9.7.0+
- gcloud CLI installed
- Terraform (optional)

### 1. Setup GCP Infrastructure

Choose one of the following methods:

#### Option A: Automated Script

```bash
cd examples/gcp-deployment/scripts
chmod +x setup.sh
./setup.sh
```

#### Option B: Terraform

```bash
cd examples/gcp-deployment/terraform
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values
terraform init
terraform apply
```

#### Option C: Manual Setup

Follow the detailed guide in [`examples/gcp-deployment/README.md`](examples/gcp-deployment/README.md)

### 2. Install Dependencies

```bash
# From project root
pnpm install

# Build core packages
pnpm run build:core

# Build MCP server
cd packages/mcp-server-assets
pnpm build
```

### 3. Configure Environment

Create `.env` file:

```bash
# GCP
GCP_PROJECT_ID=your-project-id
GCS_BUCKET_NAME=your-bucket-name
GCP_KEY_FILE=./service-account-key.json

# Payload
PAYLOAD_SECRET=$(openssl rand -base64 32)
PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3000
DATABASE_URI=postgresql://user:pass@host:5432/db

# MCP Server
PAYLOAD_API_URL=http://localhost:3000
PAYLOAD_API_KEY=your-api-key
```

### 4. Run Payload

```bash
pnpm dev
```

Visit `http://localhost:3000/admin`

## 🔧 MCP Server Configuration

The MCP server allows Claude to interact with your Payload assets.

### Installation

```bash
cd packages/mcp-server-assets
pnpm install
pnpm build
```

### Configure Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "payload-assets": {
      "command": "node",
      "args": ["/absolute/path/to/packages/mcp-server-assets/dist/index.js"],
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

### Available Commands for Claude

Once configured, Claude can:

- Upload assets: "Upload image.jpg to my Payload CMS"
- List assets: "Show me all media assets"
- Search: "Find all assets with 'logo' in the filename"
- Get details: "Get details for asset ID abc123"
- Update: "Update the alt text for asset xyz789"
- Delete: "Delete asset ID abc123"
- Get URLs: "Get a signed URL for private-image.jpg valid for 2 hours"

## 📦 Storage Adapter

Payload includes a GCS storage adapter at `packages/storage-gcs/`.

### Basic Configuration

```typescript
import { gcsStorage } from '@payloadcms/storage-gcs'

export default buildConfig({
  plugins: [
    gcsStorage({
      collections: {
        media: true,
        documents: true,
      },
      bucket: process.env.GCS_BUCKET_NAME,
      options: {
        projectId: process.env.GCP_PROJECT_ID,
        keyFilename: process.env.GCP_KEY_FILE,
      },
      acl: 'Public', // or 'Private' for signed URLs
    }),
  ],
})
```

### Client-Side Uploads

Enable direct uploads to bypass serverless limits:

```typescript
gcsStorage({
  collections: { media: true },
  bucket: process.env.GCS_BUCKET_NAME,
  options: {
    /* ... */
  },
  clientUploads: {
    access: async ({ req }) => !!req.user,
  },
})
```

## 🌐 Deployment Options

### Cloud Run (Serverless)

Best for: Variable traffic, auto-scaling

```bash
cd examples/gcp-deployment/scripts
chmod +x deploy-cloud-run.sh
./deploy-cloud-run.sh
```

**Pros:**

- Auto-scaling (0 to N)
- Pay per request
- No infrastructure management

**Cons:**

- Cold starts
- Request timeout limits

### Compute Engine (VMs)

Best for: Consistent traffic, full control

```bash
# Create VM
gcloud compute instances create payload-vm \
  --machine-type=n1-standard-2 \
  --image-family=ubuntu-2204-lts \
  --image-project=ubuntu-os-cloud

# SSH and deploy
gcloud compute ssh payload-vm
# Follow manual setup steps
```

**Pros:**

- No cold starts
- Full control
- Predictable costs

**Cons:**

- Manual scaling
- Infrastructure management

### GKE (Kubernetes)

Best for: Large scale, microservices

```bash
# Create cluster
gcloud container clusters create payload-cluster \
  --num-nodes=3 \
  --machine-type=n1-standard-2

# Deploy
kubectl apply -f k8s/
```

**Pros:**

- High availability
- Advanced orchestration
- Multi-service deployments

**Cons:**

- Complex setup
- Higher costs

## 🔒 Security

### Service Account Permissions

Minimal permissions:

```bash
roles/storage.objectAdmin  # For GCS operations
roles/cloudsql.client      # For Cloud SQL (if used)
```

### Private Assets

Use ACL settings:

```typescript
gcsStorage({
  acl: 'Private',
  // Access via signed URLs
})
```

Generate signed URLs:

```typescript
// Via MCP server
{
  filename: 'private-file.pdf',
  signed: true,
  expiresIn: 60  // minutes
}
```

### Network Security

- Use VPC for Cloud SQL
- Enable Cloud Armor for DDoS protection
- Implement rate limiting
- Use Secret Manager for credentials

## 📊 Monitoring

### Cloud Monitoring

```bash
# Storage metrics
gcloud monitoring dashboards create --config-from-file=monitoring.json

# Set up alerts
gcloud alpha monitoring policies create \
  --notification-channels=CHANNEL_ID \
  --display-name="Storage Alert"
```

### Logging

```bash
# Enable bucket logging
gsutil logging set on -b gs://logs-bucket gs://assets-bucket

# View logs
gcloud logging read "resource.type=gcs_bucket"
```

## 💰 Cost Optimization

1. **Storage Classes**: Move old files to Nearline/Coldline
2. **CDN**: Enable Cloud CDN to reduce egress
3. **Compression**: Use gzip for text assets
4. **Caching**: Implement proper cache headers
5. **Lifecycle Policies**: Auto-delete temporary files

### Example Lifecycle Rule

```bash
gsutil lifecycle set lifecycle.json gs://bucket-name
```

`lifecycle.json`:

```json
{
  "lifecycle": {
    "rule": [
      {
        "action": { "type": "SetStorageClass", "storageClass": "NEARLINE" },
        "condition": { "age": 90 }
      },
      {
        "action": { "type": "Delete" },
        "condition": { "age": 365 }
      }
    ]
  }
}
```

## 🧪 Testing

### Local Development

```bash
# Start local Payload
pnpm dev

# Test MCP server
cd packages/mcp-server-assets
pnpm dev
```

### Integration Tests

```bash
# Run Payload tests
pnpm test:int

# Test GCS adapter
pnpm test:int --filter=@payloadcms/storage-gcs
```

## 🔄 CI/CD

GitHub Actions workflow included at `examples/gcp-deployment/.github/workflows/deploy-gcp.yml`

Required secrets:

- `GCP_PROJECT_ID`
- `GCP_SA_KEY`
- `GCS_BUCKET_NAME`
- `PAYLOAD_SECRET`
- `DATABASE_URI`
- `SERVICE_ACCOUNT_EMAIL`

## 📚 Resources

- **Full Documentation**: [examples/gcp-deployment/README.md](examples/gcp-deployment/README.md)
- **MCP Server**: [packages/mcp-server-assets/README.md](packages/mcp-server-assets/README.md)
- **GCS Adapter**: [packages/storage-gcs/](packages/storage-gcs/)
- **Terraform Config**: [examples/gcp-deployment/terraform/](examples/gcp-deployment/terraform/)

### External Links

- [GCP Documentation](https://cloud.google.com/storage/docs)
- [Payload CMS](https://payloadcms.com/docs)
- [MCP Protocol](https://modelcontextprotocol.io/)
- [Terraform GCP Provider](https://registry.terraform.io/providers/hashicorp/google/latest/docs)

## 🆘 Troubleshooting

### Common Issues

**Issue**: CORS errors when uploading
**Solution**: Update bucket CORS configuration

```bash
gsutil cors set cors.json gs://bucket-name
```

**Issue**: "Access Denied" errors
**Solution**: Check service account permissions

```bash
gsutil iam get gs://bucket-name
```

**Issue**: MCP server connection failed
**Solution**: Verify environment variables and API key

**Issue**: Slow uploads on Vercel
**Solution**: Enable client-side uploads

```typescript
gcsStorage({ clientUploads: true })
```

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE.md](LICENSE.md)

## 🙋 Support

- **GitHub Issues**: [payloadcms/payload](https://github.com/payloadcms/payload/issues)
- **Discord**: [payload.chat](https://discord.gg/payload)
- **Documentation**: [payloadcms.com/docs](https://payloadcms.com/docs)

---

Built with ❤️ by the Payload team
