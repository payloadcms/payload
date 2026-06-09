import type { CollectionConfig } from 'payload'

export const noGroupableSlug = 'no-groupable'

export const NoGroupableCollection: CollectionConfig = {
  slug: noGroupableSlug,
  admin: {
    useAsTitle: 'json',
  },
  timestamps: false,
  versions: false,
  fields: [
    {
      name: 'json',
      type: 'json',
    },
  ],
}
