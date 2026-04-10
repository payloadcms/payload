import type { CollectionConfig } from 'payload'

import { mediaWithDynamicPrefixSlug } from '../shared.js'

export const MediaWithDynamicPrefix: CollectionConfig<'media-with-dynamic-prefix'> = {
  slug: mediaWithDynamicPrefixSlug,
  fields: [
    {
      name: 'tenant',
      type: 'text',
      required: true,
    },
    {
      name: 'prefix',
      type: 'text',
    },
  ],
  hooks: {
    beforeOperation: [
      ({ args, operation }) => {
        if (operation === 'create') {
          return {
            ...args,
            data: {
              ...args.data,
              prefix: `tenant-${args.data.tenant}`,
            },
          }
        }
        return args
      },
    ],
  },
  upload: {
    disableLocalStorage: false,
    filenameCompoundIndex: ['filename', 'prefix'],
  },
}
