# Payload Assets MCP Server

A Model Context Protocol (MCP) server for managing Payload CMS assets stored in Google Cloud Storage. This server enables Claude and other MCP clients to interact with your Payload assets programmatically.

## Features

- **Asset Management**: Upload, list, get, update, and delete assets
- **Search**: Search assets by filename and metadata
- **URL Generation**: Generate public and signed URLs for assets
- **GCS Integration**: Direct integration with Google Cloud Storage
- **Payload API**: Seamless integration with Payload CMS REST API

## Installation

```bash
pnpm add @payloadcms/mcp-server-assets
```

## Configuration

### Environment Variables

Create a `.env` file with the following variables:

```bash
# Required
GCS_BUCKET_NAME=your-bucket-name

# Optional
GCP_PROJECT_ID=your-project-id
GCP_KEY_FILE=/path/to/service-account-key.json
PAYLOAD_API_URL=http://localhost:3000
PAYLOAD_API_KEY=your-api-key
```

### Service Account Setup

1. Create a service account in Google Cloud Console
2. Grant the following roles:
   - Storage Object Admin
   - Storage Object Viewer
3. Download the JSON key file
4. Set `GCP_KEY_FILE` to the path of the key file

Alternatively, use Application Default Credentials:

```bash
gcloud auth application-default login
```

## Usage

### Running the Server

```bash
# Development
pnpm dev

# Production
pnpm build
node dist/index.js
```

### Connecting with Claude Desktop

Add to your Claude Desktop configuration (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

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

## Available Tools

### `upload_asset`

Upload a file to Payload CMS and store it in GCS.

```typescript
{
  file_path: string      // Path to the file to upload
  collection?: string    // Target collection (default: "media")
  alt?: string          // Alt text for images
}
```

### `list_assets`

List all assets from Payload CMS.

```typescript
{
  collection?: string    // Collection name (default: "media")
  limit?: number        // Results per page (default: 10)
  page?: number         // Page number (default: 1)
}
```

### `get_asset`

Get details of a specific asset by ID.

```typescript
{
  id: string            // Asset ID
  collection?: string   // Collection name (default: "media")
}
```

### `delete_asset`

Delete an asset from Payload CMS and GCS.

```typescript
{
  id: string            // Asset ID
  collection?: string   // Collection name (default: "media")
}
```

### `update_asset`

Update asset metadata in Payload CMS.

```typescript
{
  id: string            // Asset ID
  collection?: string   // Collection name (default: "media")
  alt?: string         // New alt text
  filename?: string    // New filename
}
```

### `search_assets`

Search assets by filename or metadata.

```typescript
{
  query: string         // Search query
  collection?: string   // Collection to search (default: "media")
}
```

### `get_asset_url`

Get the public URL for an asset.

```typescript
{
  filename: string      // Asset filename
  signed?: boolean      // Generate signed URL (default: false)
  expiresIn?: number   // Expiration in minutes for signed URLs (default: 60)
}
```

## Resources

The server exposes GCS assets as resources with URIs in the format:

```
gcs://bucket-name/path/to/file
```

These resources can be read to get metadata and, for images under 5MB, base64-encoded previews.

## Example Usage with Claude

Once configured, you can ask Claude to:

- "Upload the image at /path/to/image.jpg to my Payload CMS"
- "List all assets in my media collection"
- "Search for assets with 'logo' in the filename"
- "Delete the asset with ID abc123"
- "Get a signed URL for image.jpg that expires in 30 minutes"

## Security Considerations

- **API Keys**: Store API keys securely in environment variables
- **Service Account**: Use minimal permissions for the service account
- **Signed URLs**: Use signed URLs for private assets
- **Network**: Ensure Payload API is accessible from where the MCP server runs

## Development

```bash
# Install dependencies
pnpm install

# Build the package
pnpm build

# Run in development mode
pnpm dev

# Lint
pnpm lint
```

## License

MIT
