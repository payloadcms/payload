import type { CollectionConfig } from 'payload'

export const StaticURLCollection: CollectionConfig = {
  slug: 'static-url',
  admin: {
    livePreview: {
      url: '/live-preview/hello-world',
    },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
  ],
}
