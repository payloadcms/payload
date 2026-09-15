# Payload CMS - Secure File Upload Example

This example demonstrates how to implement secure file uploads in Payload CMS using **[Pompelmi](https://github.com/jkomyno/pompelmi)**, an in-process security scanner.

## What This Example Does

This example showcases a Media collection with built-in security scanning for all uploaded files. Before any file is saved, it is automatically scanned for:

- **ZIP Bombs**: Malicious compressed files that expand to enormous sizes
- **Malware**: Suspicious files detected using YARA rules
- **Security Threats**: Other potential file-based attacks

If a security threat is detected, the upload is automatically rejected with a descriptive error message.

## Why Pompelmi?

**Pompelmi** is an open-source security scanning library that provides:

- ✅ **In-Process Scanning**: No cloud APIs or external services required
- ✅ **ZIP Bomb Detection**: Protects against decompression bombs
- ✅ **YARA Integration**: Industry-standard malware detection
- ✅ **Zero Latency**: Scans happen instantly during the upload process
- ✅ **Privacy-First**: Files never leave your server

### Recognition

Pompelmi has been featured in:

- **[Help Net Security](https://www.helpnetsecurity.com/)** - Leading cybersecurity news source
- **[Bytes.dev](https://bytes.dev/)** - Popular web development newsletter

## How It Works

The security scanning is implemented in the Media collection's `beforeOperation` hook:

```typescript
import { scanBytes } from 'pompelmi'
import { APIError } from 'payload'

hooks: {
  beforeOperation: [
    async ({ operation, req }) => {
      if ((operation === 'create' || operation === 'update') && req.file?.data) {
        const result = await scanBytes(req.file.data)

        if (result.verdict !== 'clean') {
          throw new APIError(
            `Security Check Failed: ${result.reasons?.join(', ') || result.verdict}`,
            400
          )
        }
      }
    },
  ],
}
```

## Setup Instructions

1. **Clone and Install Dependencies**

   \`\`\`bash
   cd examples/secure-uploads
   pnpm install
   \`\`\`

2. **Set Up Environment Variables**

   Copy the example environment file:

   \`\`\`bash
   cp .env.example .env
   \`\`\`

   Update the following variables:

   - \`DATABASE_URL\`: Your MongoDB connection string
   - \`PAYLOAD_SECRET\`: A secure random string for JWT encryption

3. **Start the Development Server**

   \`\`\`bash
   pnpm dev
   \`\`\`

4. **Access the Application**
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Admin Panel: [http://localhost:3000/admin](http://localhost:3000/admin)

## Testing the Security Scanner

1. Navigate to the admin panel at `/admin`
2. Create a user account if you haven't already
3. Go to the "Media" collection
4. Try uploading various files:
   - ✅ Normal images and documents will be accepted
   - ❌ Malicious files or ZIP bombs will be rejected with an error

## Key Files

- **[src/collections/Media.ts](src/collections/Media.ts)** - Media collection with security scanning hook
- **[src/collections/Users.ts](src/collections/Users.ts)** - Basic user authentication
- **[src/payload.config.ts](src/payload.config.ts)** - Main Payload configuration
- **[package.json](package.json)** - Dependencies including Pompelmi

## Learn More

- **Pompelmi Documentation**: [https://github.com/jkomyno/pompelmi](https://github.com/jkomyno/pompelmi)
- **Payload Hooks**: [https://payloadcms.com/docs/hooks/overview](https://payloadcms.com/docs/hooks/overview)
- **Payload Upload Fields**: [https://payloadcms.com/docs/upload/overview](https://payloadcms.com/docs/upload/overview)

## Production Considerations

When deploying to production:

1. **Performance**: Pompelmi scanning is fast, but consider the impact on large file uploads
2. **Logging**: The example logs scan results - configure proper monitoring
3. **Error Handling**: Customize error messages for your users
4. **YARA Rules**: Consider customizing or extending the YARA rules for your specific needs
5. **File Size Limits**: Set appropriate upload size limits in your Payload configuration

## License

MIT
