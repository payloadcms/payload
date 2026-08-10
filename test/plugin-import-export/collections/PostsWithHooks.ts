import type { FieldBeforeImportHook } from '@payloadcms/plugin-import-export/types'
import type { CollectionConfig } from 'payload'

import { postsWithHooksSlug } from '../shared.js'

export const PostsWithHooks: CollectionConfig = {
  slug: postsWithHooksSlug,
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'secret',
      type: 'text',
    },
    {
      name: 'count',
      type: 'number',
    },
    {
      name: 'email',
      type: 'text',
      custom: {
        'plugin-import-export': {
          hooks: {
            beforeImport: (({ value }) => {
              if (typeof value === 'string') {
                return value.toLowerCase()
              }
              return value
            }) satisfies FieldBeforeImportHook,
          },
        },
      },
    },
  ],
  versions: false,
}
