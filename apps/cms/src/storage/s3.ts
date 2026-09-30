import { s3Storage } from '@payloadcms/storage-s3'

/**
 * Stores uploads from the `media` collection in S3 instead of the server's disk.
 * Enabled only when S3_BUCKET is set; otherwise files stay in the local `media` directory.
 *
 * Flow: upload to Payload -> Payload writes the object to s3://<bucket>/<prefix>/<filename>
 * and saves the document (filename, prefix, mimeType, filesize, width/height, url) in MongoDB.
 * Every read returns `url` pointing straight at S3_PUBLIC_URL, so frontends load the file
 * from S3/CloudFront without going through Payload.
 */
const bucket = process.env.S3_BUCKET || ''
const region = process.env.S3_REGION || 'us-east-1'
const accessKeyId = process.env.S3_ACCESS_KEY_ID
const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY

/** Public base URL files are served from, e.g. a CloudFront domain. Defaults to the bucket's S3 URL. */
const publicURL = (
  process.env.S3_PUBLIC_URL || `https://${bucket}.s3.${region}.amazonaws.com`
).replace(/\/+$/, '')

export const s3StorageAdapter = s3Storage({
  // Only for buckets that still use ACLs. New buckets block ACLs; use a bucket policy instead.
  acl: process.env.S3_ACL === 'public-read' ? 'public-read' : undefined,
  bucket,
  collections: {
    media: {
      // Serve files directly from S3 instead of proxying them through /api/media/file/...
      disablePayloadAccessControl: true,
      generateFileURL: ({ filename, prefix }) =>
        [publicURL, ...(prefix ? prefix.split('/') : []), filename]
          .map((segment, index) => (index === 0 ? segment : encodeURIComponent(segment)))
          .join('/'),
      prefix: process.env.S3_PREFIX ?? 'media',
    },
  },
  config: {
    // Without explicit keys the AWS SDK uses its default chain, e.g. the EC2 instance's IAM role
    credentials: accessKeyId && secretAccessKey ? { accessKeyId, secretAccessKey } : undefined,
    endpoint: process.env.S3_ENDPOINT || undefined,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
    region,
  },
  enabled: Boolean(bucket),
})
