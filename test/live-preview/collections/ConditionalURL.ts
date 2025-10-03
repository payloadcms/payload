import type { CollectionConfig } from 'payload'

export const ConditionalURL: CollectionConfig = {
  slug: 'conditional-url',
  admin: {
    livePreview: {
      url: ({ data }) => (data?.enabled ? '/live-preview/static' : null),
    },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
    {
      name: 'enabled',
      type: 'checkbox',
    },
  ],
}
