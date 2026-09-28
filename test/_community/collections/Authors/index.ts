import type { CollectionConfig } from 'payload'

import { contentAccess } from '../../access.js'
import { slugField } from '../../fields.js'

export const Authors: CollectionConfig = {
  slug: 'authors',
  access: contentAccess,
  admin: {
    defaultColumns: ['name', 'specialty', 'updatedAt'],
    group: 'Content',
    useAsTitle: 'name',
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    slugField,
    { name: 'bio', type: 'textarea', localized: true },
    {
      name: 'specialty',
      type: 'select',
      options: ['hiking', 'climbing', 'camping', 'conservation'],
    },
    { name: 'portrait', type: 'upload', relationTo: 'media' },
    {
      name: 'socialLinks',
      type: 'array',
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'url', type: 'text', required: true },
      ],
    },
  ],
}
