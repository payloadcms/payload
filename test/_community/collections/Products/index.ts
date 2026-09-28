import type { CollectionConfig } from 'payload'

import { contentAccess, publishedOrEditor } from '../../access.js'
import { slugField } from '../../fields.js'

export const Products: CollectionConfig = {
  slug: 'products',
  access: { ...contentAccess, read: publishedOrEditor },
  admin: {
    defaultColumns: ['name', 'sku', 'price', '_status'],
    group: 'Content',
    useAsTitle: 'name',
  },
  fields: [
    { name: 'name', type: 'text', localized: true, required: true },
    slugField,
    { name: 'sku', type: 'text', required: true, unique: true },
    { name: 'description', type: 'textarea', localized: true },
    {
      type: 'row',
      fields: [
        {
          name: 'price',
          type: 'number',
          admin: { description: 'USD; sample catalog only.' },
          min: 0,
          required: true,
        },
        { name: 'inventory', type: 'number', defaultValue: 0, min: 0, required: true },
      ],
    },
    { name: 'categories', type: 'relationship', hasMany: true, relationTo: 'categories' },
    {
      name: 'gallery',
      type: 'array',
      fields: [
        { name: 'image', type: 'upload', relationTo: 'media', required: true },
        { name: 'caption', type: 'text' },
      ],
    },
    {
      name: 'variants',
      type: 'array',
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'sku', type: 'text', required: true },
        { name: 'inStock', type: 'checkbox', defaultValue: true },
      ],
    },
    {
      name: 'specifications',
      type: 'json',
      admin: { description: 'Flexible metadata for testing JSON fields.' },
    },
  ],
  versions: { drafts: true, maxPerDoc: 15 },
}
