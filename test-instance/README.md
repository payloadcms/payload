# Payload Test Instance

Complete test environment for Payload CMS with Google Cloud Storage and MCP server integration.

## 🎯 What's Included

- **Payload CMS** with Next.js 15
- **PostgreSQL** database (via Docker Compose)
- **Google Cloud Storage** for asset management
- **MCP Server** for Claude integration
- **Collections**: Users, Media, Documents
- **GraphQL API** + REST API

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)

```bash
cd scripts
chmod +x setup-all.sh
./setup-all.sh
```

This script will:

1. ✓ Check prerequisites
2. ✓ Configure GCP (bucket, service account)
3. ✓ Start PostgreSQL with Docker
4. ✓ Create environment configuration
5. ✓ Install dependencies
6. ✓ Run migrations
7. ✓ Build MCP server
8. ✓ Provide Claude Desktop configuration

### Option 2: Manual Setup

#### 1. Prerequisites

- Node.js 18.20.2 or later
- pnpm 9.7.0 or later
- Docker (for PostgreSQL)
- gcloud CLI (for GCP setup)

#### 2. Start Database

```bash
# From project root
docker compose -f docker-compose.test.yml up -d postgres
```

#### 3. Configure GCP

```bash
# Set your project
export GCP_PROJECT_ID="your-project-id"
export GCS_BUCKET_NAME="your-bucket-name"

# Create bucket
gsutil mb -p $GCP_PROJECT_ID -l us-central1 gs://$GCS_BUCKET_NAME

# Create service account
gcloud iam service-accounts create payload-test-sa \
  --display-name="Payload Test"

# Grant permissions
gsutil iam ch "serviceAccount:payload-test-sa@${GCP_PROJECT_ID}.iam.gserviceaccount.com:roles/storage.objectAdmin" \
  gs://$GCS_BUCKET_NAME

# Create key
gcloud iam service-accounts keys create ../gcp-credentials.json \
  --iam-account=payload-test-sa@${GCP_PROJECT_ID}.iam.gserviceaccount.com
```

#### 4. Environment Configuration

```bash
cp .env.example .env
# Edit .env with your values
```

Required variables:

```bash
DATABASE_URI=postgresql://payload:payload123@localhost:5432/payload-test
PAYLOAD_SECRET=$(openssl rand -base64 32)
GCP_PROJECT_ID=your-project-id
GCS_BUCKET_NAME=your-bucket-name
GCP_KEY_FILE=../gcp-credentials.json
```

#### 5. Install & Build

```bash
# From project root
pnpm install
pnpm run build:core

# From test-instance
cd test-instance
pnpm install
```

#### 6. Run Migrations

```bash
pnpm payload migrate
```

#### 7. Start Payload

```bash
pnpm dev
```

Visit: http://localhost:3000

## 🔧 MCP Server Setup

### 1. Build MCP Server

```bash
cd ../packages/mcp-server-assets
pnpm install
pnpm build
```

### 2. Get API Token

Start Payload and login:

```bash
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@payloadcms.com","password":"test"}' \
  | jq -r '.token'
```

### 3. Configure Claude Desktop

Edit: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "payload-assets": {
      "command": "node",
      "args": ["/absolute/path/to/packages/mcp-server-assets/dist/index.js"],
      "env": {
        "GCS_BUCKET_NAME": "your-bucket-name",
        "GCP_PROJECT_ID": "your-project-id",
        "GCP_KEY_FILE": "/absolute/path/to/gcp-credentials.json",
        "PAYLOAD_API_URL": "http://localhost:3000",
        "PAYLOAD_API_KEY": "your-token-here"
      }
    }
  }
}
```

### 4. Restart Claude Desktop

## 📝 Testing

### Validate Setup

```bash
cd scripts
chmod +x validate-setup.sh
./validate-setup.sh
```

### Test Integration

```bash
chmod +x test-mcp-integration.sh
./test-mcp-integration.sh
```

### Manual Tests

1. **Upload via Admin**
   - Go to http://localhost:3000/admin
   - Login: `test@payloadcms.com` / `test`
   - Upload images to Media collection
   - Upload documents to Documents collection

2. **Verify in GCS**

   ```bash
   gsutil ls gs://your-bucket-name
   ```

3. **Test API**

   ```bash
   curl http://localhost:3000/api/media
   ```

4. **Test GraphQL**
   - Visit http://localhost:3000/api/graphql-playground
   - Run query:

   ```graphql
   query {
     Media(limit: 10) {
       docs {
         id
         filename
         alt
         url
       }
     }
   }
   ```

5. **Test MCP from Claude**
   - "List all my Payload media assets"
   - "Upload the file at /path/to/image.jpg"
   - "Search for assets with 'logo' in the name"
   - "Get a signed URL for private-doc.pdf"

## 📦 Collections

### Media

- **Fields**: filename, alt, caption, tags
- **Upload**: Images and videos
- **Sizes**: thumbnail, card, hero
- **Storage**: GCS with public access

### Documents

- **Fields**: title, description, category, isPublic
- **Upload**: PDF, Word, Excel, text files
- **Storage**: GCS (public or private based on isPublic)

### Users

- **Fields**: email, name, role
- **Auth**: Email/password
- **Roles**: admin, editor, user

## 🔑 Default Credentials

- **Email**: test@payloadcms.com
- **Password**: test

## 🛠️ Development Commands

```bash
# Start dev server
pnpm dev

# Build for production
pnpm build
pnpm start

# Run migrations
pnpm payload migrate

# Generate types
pnpm generate:types

# Seed database (if seed script is created)
pnpm seed
```

## 📊 Database Management

### Access PostgreSQL

```bash
# Via psql
psql postgresql://payload:payload123@localhost:5432/payload-test

# Via pgAdmin
# Open http://localhost:5050
# Login: admin@test.com / admin
```

### Reset Database

```bash
# Stop Payload
# Drop and recreate
docker compose -f ../docker-compose.test.yml down -v
docker compose -f ../docker-compose.test.yml up -d postgres

# Run migrations again
pnpm payload migrate
```

## 🐛 Troubleshooting

### Port 3000 already in use

```bash
lsof -ti:3000 | xargs kill -9
```

### Database connection failed

```bash
# Check if PostgreSQL is running
docker compose -f ../docker-compose.test.yml ps

# View logs
docker compose -f ../docker-compose.test.yml logs postgres
```

### GCS authentication failed

```bash
# Check credentials file
ls -la ../gcp-credentials.json

# Test with gcloud
gcloud auth activate-service-account --key-file=../gcp-credentials.json
gsutil ls gs://your-bucket-name
```

### MCP server not working

1. Check Payload is running: `curl http://localhost:3000/api/access`
2. Verify MCP server is built: `ls ../packages/mcp-server-assets/dist/index.js`
3. Check Claude Desktop config path is absolute
4. Restart Claude Desktop completely
5. Check Claude Desktop logs (if available)

## 📁 Project Structure

```
test-instance/
├── src/
│   ├── collections/          # Payload collections
│   │   ├── Users.ts
│   │   ├── Media.ts
│   │   └── Documents.ts
│   ├── app/                  # Next.js app
│   │   ├── (payload)/
│   │   │   ├── admin/        # Admin panel
│   │   │   └── api/          # API routes
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   └── payload.config.ts     # Payload configuration
├── scripts/
│   ├── setup-all.sh          # Complete setup
│   ├── validate-setup.sh     # Validate configuration
│   └── test-mcp-integration.sh # Test MCP integration
├── .env                      # Environment variables
├── next.config.ts            # Next.js configuration
├── tsconfig.json             # TypeScript configuration
└── package.json              # Dependencies
```

## 🔗 Useful Links

- **Admin Panel**: http://localhost:3000/admin
- **GraphQL Playground**: http://localhost:3000/api/graphql-playground
- **pgAdmin**: http://localhost:5050
- **GCS Console**: https://console.cloud.google.com/storage/browser/[BUCKET_NAME]

## 📚 Documentation

- [Payload CMS](https://payloadcms.com/docs)
- [GCS Storage Adapter](../packages/storage-gcs/README.md)
- [MCP Server](../packages/mcp-server-assets/README.md)
- [GCP Deployment](../examples/gcp-deployment/README.md)

## 🤝 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Run `./scripts/validate-setup.sh`
3. Check logs: `docker compose -f ../docker-compose.test.yml logs`
4. Review environment variables in `.env`

## 📄 License

MIT
