import type { CollectionConfig } from 'payload'

export const textsSlug = 'texts'

export const TextsCollection: CollectionConfig = {
  slug: 'texts',
  admin: {
    useAsTitle: 'text',
  },
  fields: [
    {
      name: 'text',
      type: 'text',
      localized: true,
    },
  ],
}
