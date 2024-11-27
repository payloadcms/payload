import type { CollectionConfig } from 'payload'

export const Points: CollectionConfig = {
  slug: 'points',
  fields: [
    {
      type: 'text',
      name: 'text',
    },
    {
      type: 'point',
      name: 'point',
    },
  ],
}
