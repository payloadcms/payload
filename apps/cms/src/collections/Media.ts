import type { CollectionConfig, ImageSize } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
  ],
  upload: {
    // Used only when S3 storage is off (S3_BUCKET unset, see src/storage/s3.ts): files are then
    // written to local disk, which in Docker is a named volume that survives rebuilds.
    staticDir: process.env.MEDIA_DIR || 'media',
  },
}

/**
 * Smaller copies made from every uploaded image (JPEG, PNG, WebP, AVIF, GIF, TIFF), next to the
 * original, which is stored unchanged. They're saved wherever the original goes (S3 when it's on,
 * see src/storage/s3.ts) and returned under `variants.<name>` with their own url, width and height.
 * Registered on the Sharp transformer in src/payload.config.ts.
 */
export const mediaVariants: ImageSize[] = [
  fitLongestSide({ name: 'max1440', maxSide: 1440 }),
  fitLongestSide({ name: 'max720', maxSide: 720 }),
  fitLongestSide({ name: 'max640', maxSide: 640 }),
]

/** Keeps the aspect ratio and makes the longer side (width or height) at most `maxSide` pixels. */
function fitLongestSide({ name, maxSide }: { maxSide: number; name: string }): ImageSize {
  return {
    name,
    fit: 'inside',
    height: maxSide,
    width: maxSide,
    // An image that is already smaller keeps its own size instead of being enlarged
    withoutEnlargement: true,
  }
}
