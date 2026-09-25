import type { FieldBeforeExportHook } from '@payloadcms/plugin-import-export/types'
import type { CollectionConfig } from 'payload'

import { postsWithColumnMapSlug } from '../shared.js'

// Payload field name -> foreign system column name.
// Used by collection-level export.hooks.before in config.ts and mirrored
// in import.hooks.before.
export const exportRenameMap: Record<string, string> = {
  title: 'Post Title',
  excerpt: 'Summary',
  count: 'View Count',
}

export const importRenameMap: Record<string, string> = {
  'Post Title': 'title',
  Summary: 'excerpt',
  'View Count': 'count',
}

export const PostsWithColumnMap: CollectionConfig = {
  slug: postsWithColumnMapSlug,
  admin: { useAsTitle: 'title' },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'excerpt', type: 'text' },
    { name: 'count', type: 'number' },
    {
      name: 'sharedName',
      type: 'text',
      custom: {
        'plugin-import-export': {
          hooks: {
            beforeExport: (({ siblingData, value }) => {
              siblingData['Display Name'] = value
              return undefined
            }) satisfies FieldBeforeExportHook,
          },
        },
      },
    },
  ],
  versions: false,
}
