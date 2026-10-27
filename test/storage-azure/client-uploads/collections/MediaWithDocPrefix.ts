import type { CollectionConfig } from 'payload'

export const mediaWithDocPrefixSlug = 'media-with-doc-prefix'

export const MediaWithDocPrefix: CollectionConfig = {
  slug: mediaWithDocPrefixSlug,
  fields: [
    {
      name: 'prefix',
      type: 'text',
      defaultValue: () => `doc-${Math.random().toString(36).slice(2, 10)}`,
    },
  ],
  upload: {
    filenameCompoundIndex: ['prefix', 'filename'],
    imageSizes: [{ name: 'thumbnail', height: 100, width: 100 }],
  },
}
