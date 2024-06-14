import type { CollectionConfig } from 'payload'

import { createBreadcrumbsField, createParentField } from '@payloadcms/plugin-nested-docs'

export const Categories: CollectionConfig = {
  access: {
    read: () => true,
  },
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      required: true,
      type: 'text',
    },
    createBreadcrumbsField('categories', {
      name: 'categorization',
      admin: {
        description: 'custom',
      },
      fields: [
        {
          name: 'test',
          type: 'text',
        },
      ],
    }),
    createParentField('categories', {
      name: 'owner',
      admin: {
        description: 'custom',
      },
    }),
  ],
  slug: 'categories',
}
