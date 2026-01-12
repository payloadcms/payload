import type { CollectionConfig } from 'payload'

export const largeDocumentsCollectionSlug = 'large-documents'

export const LargeDocuments: CollectionConfig = {
  slug: largeDocumentsCollectionSlug,
  fields: [
    {
      name: 'array',
      type: 'array',
      fields: [
        {
          name: 'text',
          type: 'text',
        },
      ],
    },
  ],
}
