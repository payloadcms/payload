import type { CollectionConfig } from 'payload'

export const noTimestampsSlug = 'no-timestamps'

export const NoTimestampsCollection: CollectionConfig = {
  slug: noTimestampsSlug,
  fields: [
    {
      name: 'title',
      type: 'text',
      admin: {
        components: undefined,
      },
    },
  ],
  timestamps: false,
  versions: false,
}
