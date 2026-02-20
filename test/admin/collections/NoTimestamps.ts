import type { CollectionConfig } from 'payload'

export const noTimestampsSlug = 'no-timestamps'

export const NoTimestampsCollection: CollectionConfig = {
  slug: noTimestampsSlug,
  timestamps: false,
  fields: [
    {
      name: 'title',
      type: 'text',
    },
  ],
}
