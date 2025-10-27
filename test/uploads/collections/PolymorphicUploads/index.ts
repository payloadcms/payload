import type { CollectionConfig } from 'payload'

import { polymorphicUploadsSlug } from '../../shared.js'

export const PolymorphicUploadsCollection: CollectionConfig = {
  slug: polymorphicUploadsSlug,
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      type: 'text',
      name: 'title',
    },
    {
      type: 'upload',
      name: 'singleUpload',
      relationTo: ['media', 'svg-only'],
    },
    {
      type: 'upload',
      name: 'multiUpload',
      hasMany: true,
      relationTo: ['media', 'svg-only'],
    },
  ],
}
