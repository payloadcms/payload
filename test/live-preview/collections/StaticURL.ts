import type { CollectionConfig } from 'payload'

export const StaticURLCollection: CollectionConfig = {
  slug: 'static-url',
  admin: {
    livePreview: {
      url: '/live-preview/static',
    },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
  ],
}
