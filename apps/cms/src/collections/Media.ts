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
    // Uploaded files are written to local disk. In Docker this is a named volume
    // (see docker-compose.yml) so files survive container rebuilds.
    staticDir: process.env.MEDIA_DIR || 'media',
  },
}
