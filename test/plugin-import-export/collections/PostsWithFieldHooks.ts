import type { FieldExportHook, FieldImportHook } from '@payloadcms/plugin-import-export/types'
import type { CollectionConfig } from 'payload'

import { postsWithFieldHooksSlug } from '../shared.js'

export const emailFieldWithHooks = {
  name: 'email',
  type: 'text' as const,
  custom: {
    'plugin-import-export': {
      export: (({ value }) => {
        if (typeof value === 'string') {
          return value.toLowerCase()
        }
        return value
      }) satisfies FieldExportHook,
      import: (({ value }) => {
        if (typeof value === 'string') {
          return value.toLowerCase()
        }
        return value
      }) satisfies FieldImportHook,
    },
  },
}

export const PostsWithFieldHooks: CollectionConfig = {
  slug: postsWithFieldHooksSlug,
  admin: { useAsTitle: 'title' },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'secret', type: 'text' },
    { name: 'count', type: 'number' },
    {
      name: 'customExport',
      type: 'text',
      defaultValue: 'raw value',
      custom: {
        'plugin-import-export': {
          export: (({
            value,
            columnName,
            row,
            format,
          }: {
            columnName: string
            format: string
            row: Record<string, unknown>
            value: unknown
          }) => {
            row[`${columnName}_format`] = format
            return String(value) + ' exported'
          }) satisfies FieldExportHook,
        },
      },
    },
    {
      name: 'customImport',
      type: 'text',
      custom: {
        'plugin-import-export': {
          import: (({ value, format }) => {
            if (typeof value === 'string') {
              return `${value}_imported_${format}`
            }
            return value
          }) satisfies FieldImportHook,
        },
      },
    },
    emailFieldWithHooks,
    {
      name: 'group',
      type: 'group',
      fields: [
        {
          type: 'tabs',
          tabs: [
            {
              name: 'namedTab',
              fields: [
                {
                  name: 'deepField',
                  type: 'text',
                  defaultValue: 'deep value',
                  custom: {
                    'plugin-import-export': {
                      export: (({ value }) => {
                        return String(value) + ' deep_exported'
                      }) satisfies FieldExportHook,
                    },
                  },
                },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'legacyToCSV',
      type: 'text',
      defaultValue: 'legacy value',
      custom: {
        'plugin-import-export': {
          toCSV: ({ value }: { value: unknown }) => String(value) + ' legacy_toCSV',
        },
      },
    },
    {
      name: 'legacyFromCSV',
      type: 'text',
      custom: {
        'plugin-import-export': {
          fromCSV: ({ value }: { value: unknown }) =>
            typeof value === 'string' ? `${value}_legacy_fromCSV` : value,
        },
      },
    },
  ],
}
