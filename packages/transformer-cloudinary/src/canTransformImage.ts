/** MIME types Cloudinary can ingest and transform as images. */
const TRANSFORMABLE_MIME_TYPES = [
  'image/avif',
  'image/gif',
  'image/heic',
  'image/heif',
  'image/jpeg',
  'image/png',
  'image/svg+xml',
  'image/tiff',
  'image/webp',
]

export function canTransformImage(mimeType: string): boolean {
  return TRANSFORMABLE_MIME_TYPES.includes(mimeType)
}

export { TRANSFORMABLE_MIME_TYPES }
