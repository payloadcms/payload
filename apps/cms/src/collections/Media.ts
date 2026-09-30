import type { CollectionConfig } from 'payload'

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
