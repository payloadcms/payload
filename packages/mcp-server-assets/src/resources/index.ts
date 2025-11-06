import type { Bucket } from '@google-cloud/storage'

interface ServerConfig {
  bucketName: string
  projectId?: string
  keyFilename?: string
  payloadApiUrl?: string
  payloadApiKey?: string
}

export async function getAssetResources(bucket: Bucket, config: ServerConfig) {
  try {
    const [files] = await bucket.getFiles({ maxResults: 100 })

    return files.map((file) => ({
      uri: `gcs://${config.bucketName}/${file.name}`,
      name: file.name,
      description: `Asset in GCS bucket: ${file.name}`,
      mimeType: file.metadata.contentType || 'application/octet-stream',
    }))
  } catch (error) {
    console.error('Error listing resources:', error)
    return []
  }
}

export async function readAssetResource(bucket: Bucket, uri: string, config: ServerConfig) {
  try {
    // Parse URI: gcs://bucket-name/path/to/file
    const match = uri.match(/^gcs:\/\/([^/]+)\/(.+)$/)
    if (!match) {
      throw new Error('Invalid GCS URI format')
    }

    const [, bucketName, filePath] = match

    if (bucketName !== config.bucketName) {
      throw new Error('Bucket name mismatch')
    }

    const file = bucket.file(filePath)
    const [metadata] = await file.getMetadata()
    const [exists] = await file.exists()

    if (!exists) {
      throw new Error('File not found')
    }

    // For images, we can provide base64 encoded data
    const mimeType = metadata.contentType || 'application/octet-stream'
    const isImage = mimeType.startsWith('image/')

    if (isImage && (metadata.size || 0) < 5 * 1024 * 1024) {
      // Only for images < 5MB
      const [buffer] = await file.download()
      const base64 = buffer.toString('base64')

      return {
        contents: [
          {
            uri,
            mimeType,
            text: `Image asset: ${filePath}\nSize: ${metadata.size} bytes\nContent-Type: ${mimeType}\nPublic URL: https://storage.googleapis.com/${bucketName}/${filePath}`,
          },
          {
            uri: `${uri}/preview`,
            mimeType,
            blob: base64,
          },
        ],
      }
    }

    // For other files, just return metadata
    return {
      contents: [
        {
          uri,
          mimeType: 'text/plain',
          text: JSON.stringify(
            {
              name: filePath,
              size: metadata.size,
              contentType: metadata.contentType,
              updated: metadata.updated,
              created: metadata.timeCreated,
              publicUrl: `https://storage.googleapis.com/${bucketName}/${filePath}`,
              metadata: metadata.metadata,
            },
            null,
            2,
          ),
        },
      ],
    }
  } catch (error: any) {
    return {
      contents: [
        {
          uri,
          mimeType: 'text/plain',
          text: `Error reading resource: ${error.message}`,
        },
      ],
    }
  }
}
