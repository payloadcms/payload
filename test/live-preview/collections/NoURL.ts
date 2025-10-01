import type { CollectionConfig } from 'payload'

export const NoURLCollection: CollectionConfig = {
  slug: 'no-url',
  admin: {
    livePreview: {
      url: () => undefined,
    },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
  ],
}
