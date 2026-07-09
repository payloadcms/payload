import type { CollectionConfig } from 'payload'

import { childrenSlug, recordAccess } from '../../shared.js'

export const Children: CollectionConfig = {
  slug: childrenSlug,
  access: {
    create: () => true,
    delete: () => true,
    read: () => true,
    update: () => true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
    {
      name: 'childReadProbe',
      type: 'text',
      access: {
        read: recordAccess({
          fieldName: 'childReadProbe',
          operation: 'read',
          source: 'field-access',
        }),
      },
    },
  ],
}
