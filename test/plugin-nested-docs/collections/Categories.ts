import type { CollectionConfig } from '../../../packages/payload/src/collections/config/types'

import { createBreadcrumbsField } from '../../../packages/plugin-nested-docs/src/fields/breadcrumbs'
import createParentField from '../../../packages/plugin-nested-docs/src/fields/parent'

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
