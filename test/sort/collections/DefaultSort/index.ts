import type { CollectionConfig } from 'payload'

export const defaultSortSlug = 'default-sort'

export const DefaultSortCollection: CollectionConfig = {
  slug: defaultSortSlug,
  admin: {
    useAsTitle: 'text',
  },
  defaultSort: ['number', '-text'],
  fields: [
    {
      name: 'text',
      type: 'text',
    },
    {
      name: 'number',
      type: 'number',
    },
  ],
}
