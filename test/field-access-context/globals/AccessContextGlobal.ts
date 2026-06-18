import type { GlobalConfig } from 'payload'

import { globalSlug, recordAccess } from '../shared.js'

export const AccessContextGlobal: GlobalConfig = {
  slug: globalSlug,
  access: {
    read: () => true,
    update: () => true,
  },
  fields: [
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
  ],
}
