import type { CollectionConfig } from 'payload'

export const MediaWithDynamicPrefix: CollectionConfig = {
  slug: 'media-with-dynamic-prefix',
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
        if (operation === 'create' && args?.data?.tenant) {
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
    filenameCompoundIndex: true,
  },
}
