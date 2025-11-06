# Payload Test Instance - Quick Start Guide

Get a complete Payload CMS instance with GCS storage and MCP server running in under 10 minutes.

## ⚡ Super Quick Start

```bash
# 1. Clone and navigate
cd Payload-assets/test-instance

# 2. Run automated setup
cd scripts
chmod +x setup-all.sh
./setup-all.sh

# 3. Start Payload
cd ..
pnpm dev
```

Visit http://localhost:3000/admin and login with:

- Email: `test@payloadcms.com`
- Password: `test`

## 📋 What You'll Get

✅ **Payload CMS** running on http://localhost:3000
✅ **PostgreSQL** database in Docker
✅ **GCS Storage** for assets
✅ **MCP Server** ready for Claude integration
✅ **GraphQL API** at /api/graphql-playground
✅ **3 Collections**: Users, Media, Documents

## 🔧 Setup Steps (Detailed)

### 1. Prerequisites Check

```bash
node --version    # Should be 18.20.2+
pnpm --version    # Should be 9.7.0+
docker --version  # For PostgreSQL
gcloud --version  # For GCP setup
```

### 2. GCP Configuration

You'll need:

- A GCP project ID
- A GCS bucket name (can be auto-generated)
- Service account credentials

The setup script can create these automatically or you can do it manually.

**Automatic (Recommended):**

```bash
./scripts/setup-all.sh
# Follow the prompts
```

**Manual:**

```bash
# Set variables
export GCP_PROJECT_ID="your-project"
export GCS_BUCKET_NAME="your-bucket"

# Create bucket
gsutil mb -p $GCP_PROJECT_ID gs://$GCS_BUCKET_NAME

# Create service account and key
gcloud iam service-accounts create payload-test-sa
gcloud iam service-accounts keys create ../gcp-credentials.json \
  --iam-account=payload-test-sa@${GCP_PROJECT_ID}.iam.gserviceaccount.com

# Grant permissions
gsutil iam ch "serviceAccount:payload-test-sa@${GCP_PROJECT_ID}.iam.gserviceaccount.com:roles/storage.objectAdmin" \
  gs://$GCS_BUCKET_NAME
```

### 3. Database Setup

```bash
# Start PostgreSQL
cd ..
docker compose -f docker-compose.test.yml up -d postgres

# Wait for it to be ready (about 10 seconds)
```

### 4. Environment Configuration

```bash
cd test-instance
cp .env.example .env
```

Edit `.env`:

```bash
DATABASE_URI=postgresql://payload:payload123@localhost:5432/payload-test
PAYLOAD_SECRET=$(openssl rand -base64 32)
GCP_PROJECT_ID=your-gcp-project
GCS_BUCKET_NAME=your-bucket-name
GCP_KEY_FILE=../gcp-credentials.json
```

### 5. Install and Build

```bash
# Install dependencies (from project root)
cd ..
pnpm install

# Build core packages
pnpm run build:core

# Install test instance dependencies
cd test-instance
pnpm install
```

### 6. Initialize Database

```bash
pnpm payload migrate
```

### 7. Start Payload

```bash
pnpm dev
```

## 🎨 First Steps

### 1. Access Admin Panel

Open http://localhost:3000/admin

Auto-login credentials:

- Email: `test@payloadcms.com`
- Password: `test`

### 2. Upload Test Assets

1. Go to **Media** collection
2. Click **Create New**
3. Upload an image
4. Fill in alt text
5. Save

The image is now stored in GCS!

### 3. Verify in GCS

```bash
source .env
gsutil ls gs://$GCS_BUCKET_NAME
```

### 4. Test the API

```bash
# Get all media
curl http://localhost:3000/api/media | jq

# Get specific item
curl http://localhost:3000/api/media/{id} | jq
```

## 🤖 MCP Server Setup

### 1. Build MCP Server

```bash
cd ../packages/mcp-server-assets
pnpm install
pnpm build
```

### 2. Get Authentication Token

```bash
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@payloadcms.com","password":"test"}' \
  | jq -r '.token'
```

Copy the token output.

### 3. Configure Claude Desktop

Create or edit: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "payload-assets": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/packages/mcp-server-assets/dist/index.js"],
      "env": {
        "GCS_BUCKET_NAME": "your-bucket-name",
        "GCP_PROJECT_ID": "your-project-id",
        "GCP_KEY_FILE": "/ABSOLUTE/PATH/TO/gcp-credentials.json",
        "PAYLOAD_API_URL": "http://localhost:3000",
        "PAYLOAD_API_KEY": "paste-token-here"
      }
    }
  }
}
```

**Important:** Use absolute paths!

### 4. Restart Claude Desktop

Completely quit and restart Claude Desktop.

### 5. Test with Claude

Ask Claude:

- "List all my Payload media assets"
- "How many assets do I have?"
- "Search for assets with 'test' in the filename"

## ✅ Validation

Run the validation script:

```bash
cd test-instance/scripts
./validate-setup.sh
```

This checks:

- ✓ Environment configuration
- ✓ GCP credentials
- ✓ Database connection
- ✓ GCS bucket access
- ✓ Dependencies
- ✓ MCP server build
- ✓ Port availability

## 🧪 Testing

### Integration Tests

```bash
cd test-instance/scripts
./test-mcp-integration.sh
```

This tests:

- Payload API endpoints
- GCS bucket access
- GraphQL queries
- Authentication
- MCP configuration

### Manual Tests

1. **Upload via Admin**: Upload an image in the admin panel
2. **Check GCS**: Verify file appears in bucket
3. **API Test**: Fetch the asset via API
4. **MCP Test**: Ask Claude to list assets

## 🐛 Troubleshooting

### "Port 3000 in use"

```bash
lsof -ti:3000 | xargs kill -9
```

### "Database connection failed"

```bash
docker compose -f docker-compose.test.yml restart postgres
docker compose -f docker-compose.test.yml logs postgres
```

### "GCS permission denied"

```bash
# Activate service account
gcloud auth activate-service-account --key-file=gcp-credentials.json

# Test access
gsutil ls gs://your-bucket-name
```

### "MCP server not responding in Claude"

1. Check Payload is running: `curl http://localhost:3000`
2. Verify paths in Claude config are **absolute**
3. Check token is valid (get a new one if needed)
4. Restart Claude Desktop completely
5. Check for errors in Claude Desktop logs

### "Cannot find module"

```bash
# Rebuild from scratch
cd ..
pnpm install
pnpm run build:core
cd test-instance
pnpm install
```

## 📊 What's Running

After setup, you should have:

| Service       | URL                                          | Credentials                |
| ------------- | -------------------------------------------- | -------------------------- |
| Payload Admin | http://localhost:3000/admin                  | test@payloadcms.com / test |
| GraphQL       | http://localhost:3000/api/graphql-playground | -                          |
| REST API      | http://localhost:3000/api/\*                 | -                          |
| PostgreSQL    | localhost:5432                               | payload / payload123       |
| pgAdmin       | http://localhost:5050                        | admin@test.com / admin     |

## 🔗 Next Steps

1. **Explore Collections**: Check out Media and Documents
2. **Try GraphQL**: Use the playground to query data
3. **Test MCP**: Use Claude to manage assets
4. **Upload More**: Test with different file types
5. **Check GCS**: View files in GCP console

## 📚 Full Documentation

- [Test Instance README](test-instance/README.md) - Complete documentation
- [MCP Server Guide](packages/mcp-server-assets/README.md) - MCP details
- [GCP Deployment](examples/gcp-deployment/README.md) - Production deployment

## 💡 Tips

- Keep Payload running while using MCP server
- Use absolute paths in Claude Desktop config
- Refresh auth token if it expires
- Check validation script if something breaks
- Use pgAdmin for database inspection

## 🎯 Expected Timeline

- **GCP Setup**: 5-10 minutes
- **Installation**: 5 minutes
- **Database Setup**: 1 minute
- **First Upload**: 1 minute
- **MCP Configuration**: 5 minutes

**Total: ~15-20 minutes** for complete setup

## 🆘 Get Help

If you're stuck:

1. Run `./scripts/validate-setup.sh`
2. Check the troubleshooting section
3. Review logs: `docker compose -f docker-compose.test.yml logs`
4. Check environment variables in `.env`
5. Verify GCP credentials and bucket permissions

---

**Ready to start?** Run `./test-instance/scripts/setup-all.sh` and you'll be up in minutes! 🚀
