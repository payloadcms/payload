import type { CollectionConfig } from 'payload'

export const noLocalizedFieldsCollectionSlug = 'no-localized-fields'

export const NoLocalizedFieldsCollection: CollectionConfig = {
  slug: noLocalizedFieldsCollectionSlug,
  fields: [
    {
      name: 'text',
      type: 'text',
      localized: false,
    },
  ],
}
