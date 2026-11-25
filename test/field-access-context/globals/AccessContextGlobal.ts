import type { GlobalConfig } from 'payload'

import { childrenSlug, globalSlug, recordAccess, recordUpdateOperation } from '../shared.js'

export const AccessContextGlobal: GlobalConfig = {
  slug: globalSlug,
  hooks: {
    beforeOperation: [
      ({ args, operation }) => {
        if (operation === 'update') {
          recordUpdateOperation({ slug: globalSlug })
        }
        return args
      },
    ],
  },
  access: {
    read: () => true,
    update: () => true,
  },
  fields: [
    {
      name: 'count',
      type: 'number',
    },
    {
      name: 'globalReadProbe',
      type: 'text',
      access: {
        read: recordAccess({
          fieldName: 'globalReadProbe',
          operation: 'read',
          source: 'field-access',
        }),
      },
    },
    {
      name: 'globalChild',
      type: 'relationship',
      relationTo: childrenSlug,
    },
  ],
}
