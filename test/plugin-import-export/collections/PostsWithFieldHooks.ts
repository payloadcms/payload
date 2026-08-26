import type {
  FieldBeforeExportHook,
  FieldBeforeImportHook,
} from '@payloadcms/plugin-import-export/types'
import type { CollectionConfig } from 'payload'

import { postsWithFieldHooksSlug } from '../shared.js'

export const emailFieldWithHooks = {
  name: 'email',
  type: 'text' as const,
  custom: {
    'plugin-import-export': {
      hooks: {
        beforeExport: (({ value }) => {
          if (typeof value === 'string') {
            return value.toLowerCase()
          }
          return value
        }) satisfies FieldBeforeExportHook,
        beforeImport: (({ value }) => {
          if (typeof value === 'string') {
            return value.toLowerCase()
          }
          return value
        }) satisfies FieldBeforeImportHook,
      },
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
      custom: {
        'plugin-import-export': {
          hooks: {
            beforeExport: (({ columnName, format, siblingData, value }) => {
              siblingData[`${columnName}_format`] = format
              return String(value) + ' exported'
            }) satisfies FieldBeforeExportHook,
          },
        },
      },
      defaultValue: 'raw value',
    },
    {
      name: 'customImport',
      type: 'text',
      custom: {
        'plugin-import-export': {
          hooks: {
            beforeImport: (({ format, value }) => {
              if (typeof value === 'string') {
                return `${value}_imported_${format}`
              }
              return value
            }) satisfies FieldBeforeImportHook,
          },
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
                  custom: {
                    'plugin-import-export': {
                      hooks: {
                        beforeExport: (({ value }) => {
                          return String(value) + ' deep_exported'
                        }) satisfies FieldBeforeExportHook,
                      },
                    },
                  },
                  defaultValue: 'deep value',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'items',
      type: 'array',
      fields: [
        {
          name: 'note',
          type: 'text',
          custom: {
            'plugin-import-export': {
              hooks: {
                beforeExport: (({ value }) => {
                  return typeof value === 'string' ? `${value} array_exported` : value
                }) satisfies FieldBeforeExportHook,
                beforeImport: (({ value }) => {
                  return typeof value === 'string' ? `${value}_array_imported` : value
                }) satisfies FieldBeforeImportHook,
              },
            },
          },
        },
      ],
    },
    {
      name: 'content',
      type: 'blocks',
      blocks: [
        {
          slug: 'textBlock',
          fields: [
            {
              name: 'body',
              type: 'text',
              custom: {
                'plugin-import-export': {
                  hooks: {
                    beforeExport: (({ value }) => {
                      return typeof value === 'string' ? `${value} block_exported` : value
                    }) satisfies FieldBeforeExportHook,
                    beforeImport: (({ value }) => {
                      return typeof value === 'string' ? `${value}_block_imported` : value
                    }) satisfies FieldBeforeImportHook,
                  },
                },
              },
            },
          ],
        },
      ],
    },
    {
      name: 'mayCrash',
      type: 'text',
      custom: {
        'plugin-import-export': {
          hooks: {
            beforeExport: (({ value }) => {
              if (value === 'CRASH') {
                throw new Error('Field-level beforeExport hook intentionally crashed')
              }
              return typeof value === 'string' ? `${value}_exported` : value
            }) satisfies FieldBeforeExportHook,
            beforeImport: (({ value }) => {
              if (value === 'CRASH') {
                throw new Error('Field-level beforeImport hook intentionally crashed')
              }
              return typeof value === 'string' ? `${value}_imported` : value
            }) satisfies FieldBeforeImportHook,
          },
        },
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'rowField',
          type: 'text',
          custom: {
            'plugin-import-export': {
              hooks: {
                beforeExport: (({ value }) => {
                  return typeof value === 'string' ? `${value}_row_exported` : value
                }) satisfies FieldBeforeExportHook,
                beforeImport: (({ value }) => {
                  return typeof value === 'string' ? `${value}_row_imported` : value
                }) satisfies FieldBeforeImportHook,
              },
            },
          },
        },
      ],
    },
    {
      type: 'collapsible',
      fields: [
        {
          name: 'collapsibleField',
          type: 'text',
          custom: {
            'plugin-import-export': {
              hooks: {
                beforeExport: (({ value }) => {
                  return typeof value === 'string' ? `${value}_collapsible_exported` : value
                }) satisfies FieldBeforeExportHook,
                beforeImport: (({ value }) => {
                  return typeof value === 'string' ? `${value}_collapsible_imported` : value
                }) satisfies FieldBeforeImportHook,
              },
            },
          },
        },
      ],
      label: 'Collapsible Section',
    },
    {
      name: 'metadata',
      type: 'group',
      fields: [
        {
          name: 'slugFromTitle',
          type: 'text',
          custom: {
            'plugin-import-export': {
              hooks: {
                beforeImport: (({ data, value }) => {
                  if (typeof value === 'string' && value.length > 0) {
                    return value
                  }
                  const topLevelTitle = data.title
                  if (typeof topLevelTitle === 'string') {
                    return topLevelTitle.toLowerCase().replace(/\s+/g, '-')
                  }
                  return value
                }) satisfies FieldBeforeImportHook,
              },
            },
          },
        },
        {
          name: 'siblingEcho',
          type: 'text',
          custom: {
            'plugin-import-export': {
              hooks: {
                beforeImport: (({ siblingData, value }) => {
                  const slug = siblingData?.slugFromTitle
                  if (typeof slug === 'string' && slug.length > 0) {
                    return `${value ?? ''}:${slug}`
                  }
                  return value
                }) satisfies FieldBeforeImportHook,
              },
            },
          },
        },
      ],
    },
  ],
  versions: false,
}
