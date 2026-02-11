import type { CollectionConfig } from 'payload'

import { pagesSlug } from '../shared.js'

export const Pages: CollectionConfig = {
  slug: pagesSlug,
  labels: {
    singular: { en: 'Page', es: 'Página' },
    plural: { en: 'Pages', es: 'Páginas' },
  },
  admin: {
    useAsTitle: 'title',
    groupBy: true,
  },
  versions: {
    drafts: true,
  },
  fields: [
    {
      name: 'title',
      label: { en: 'Title', es: 'Título', de: 'Titel' },
      type: 'text',
      required: true,
    },
    {
      name: 'localized',
      type: 'text',
      localized: true,
    },
    {
      name: 'custom',
      type: 'text',
      defaultValue: 'my custom csv transformer',
      custom: {
        'plugin-import-export': {
          toCSV: ({ value, columnName, row, siblingDoc }) => {
            return String(value) + ' toCSV'
          },
        },
      },
    },
    {
      name: 'customRelationship',
      type: 'relationship',
      relationTo: 'users',
      custom: {
        'plugin-import-export': {
          toCSV: ({ value, columnName, row }) => {
            if (value && typeof value === 'object' && 'id' in value && 'email' in value) {
              row[`${columnName}_id`] = (value as { id: number | string }).id
              row[`${columnName}_email`] = (value as { email: string }).email
            }
          },
          fromCSV: ({ data, columnName }) => {
            // When importing, reconstruct the relationship from the split columns
            const id = data[`${columnName}_id`]
            const email = data[`${columnName}_email`]
            if (id) {
              return id // Return just the ID for the relationship
            }
            return undefined
          },
        },
      },
    },
    {
      name: 'customRelNameEmail',
      type: 'relationship',
      relationTo: 'users',
      custom: {
        'plugin-import-export': {
          toCSV: ({
            value,
            columnName,
            row,
          }: {
            columnName: string
            row: Record<string, unknown>
            value: unknown
          }) => {
            if (value && typeof value === 'object' && 'name' in value && 'email' in value) {
              row[`${columnName}_name`] = (value as { name: string }).name
              row[`${columnName}_email`] = (value as { email: string }).email
            }
          },
        },
      },
    },
    {
      name: 'customRelIdName',
      type: 'relationship',
      relationTo: 'users',
      custom: {
        'plugin-import-export': {
          toCSV: ({
            value,
            columnName,
            row,
          }: {
            columnName: string
            row: Record<string, unknown>
            value: unknown
          }) => {
            if (value && typeof value === 'object' && 'id' in value && 'name' in value) {
              row[`${columnName}_id`] = (value as { id: number | string }).id
              row[`${columnName}_locationName`] = (value as { name: string }).name
            }
          },
        },
      },
    },
    {
      name: 'group',
      type: 'group',
      fields: [
        {
          name: 'value',
          type: 'text',
          defaultValue: 'group value',
          // custom: {
          //   'plugin-import-export': {
          //     disabled: true,
          //   },
          // },
        },
        {
          name: 'ignore',
          type: 'text',
        },
        {
          name: 'array',
          type: 'array',
          fields: [
            {
              name: 'field1',
              type: 'text',
            },
            {
              name: 'field2',
              type: 'text',
            },
          ],
        },
        {
          name: 'custom',
          type: 'text',
          defaultValue: 'my custom csv transformer',
          custom: {
            'plugin-import-export': {
              toCSV: ({ value, columnName, row, siblingDoc, doc }) => {
                return String(value) + ' toCSV'
              },
            },
          },
        },
      ],
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'No Name',
          fields: [
            {
              name: 'tabToCSV',
              type: 'text',
              defaultValue: 'my custom csv transformer',
              custom: {
                'plugin-import-export': {
                  toCSV: ({ value, columnName, row, siblingDoc, doc }) => {
                    return String(value) + ' toCSV'
                  },
                },
              },
            },
          ],
        },
        {
          name: 'namedTab',
          fields: [
            {
              name: 'tabToCSV',
              type: 'text',
              admin: {
                description: 'Field inside a named tab',
              },
              defaultValue: 'my custom csv transformer',
              custom: {
                'plugin-import-export': {
                  toCSV: ({ value, columnName, row, siblingDoc, doc }) => {
                    return String(value) + ' toCSV'
                  },
                },
              },
            },
          ],
        },
      ],
    },
    {
      name: 'array',
      type: 'array',
      fields: [
        {
          name: 'field1',
          type: 'text',
        },
        {
          name: 'field2',
          type: 'text',
        },
      ],
    },
    {
      name: 'blocks',
      type: 'blocks',
      blocks: [
        {
          slug: 'hero',
          fields: [
            {
              name: 'title',
              type: 'text',
            },
          ],
        },
        {
          slug: 'content',
          fields: [
            {
              name: 'richText',
              type: 'richText',
            },
          ],
        },
      ],
    },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'users',
    },
    {
      name: 'virtualRelationship',
      type: 'text',
      virtual: 'author.name',
    },
    {
      name: 'virtual',
      type: 'text',
      virtual: true,
      hooks: {
        afterRead: [() => 'virtual value'],
      },
    },
    {
      name: 'hasManyNumber',
      type: 'number',
      hasMany: true,
    },
    {
      name: 'jsonField',
      type: 'json',
    },
    {
      name: 'richTextField',
      type: 'richText',
    },
    {
      name: 'relationship',
      type: 'relationship',
      relationTo: 'users',
    },
    {
      name: 'excerpt',
      label: 'Excerpt',
      type: 'text',
    },
    {
      name: 'date',
      type: 'date',
      admin: {
        description: 'Date field for testing export/import timezone handling',
      },
    },
    {
      name: 'dateWithTimezone',
      type: 'date',
      timezone: true,
      admin: {
        description: 'Date field for testing export/import timezone handling',
      },
    },
    {
      name: 'hasOnePolymorphic',
      type: 'relationship',
      relationTo: ['users', 'posts'],
      hasMany: false,
    },
    {
      name: 'hasManyPolymorphic',
      type: 'relationship',
      relationTo: ['users', 'posts'],
      hasMany: true,
    },
    {
      name: 'hasManyMonomorphic',
      type: 'relationship',
      relationTo: 'posts',
      hasMany: true,
    },
    {
      type: 'collapsible',
      label: 'Collapsible Field',
      fields: [
        {
          name: 'textFieldInCollapsible',
          type: 'text',
          // custom: {
          //   'plugin-import-export': {
          //     disabled: true,
          //   },
          // },
        },
      ],
    },
    {
      name: 'checkbox',
      type: 'checkbox',
    },
    {
      name: 'select',
      type: 'select',
      options: [
        { label: 'Option 1', value: 'option1' },
        { label: 'Option 2', value: 'option2' },
        { label: 'Option 3', value: 'option3' },
      ],
    },
    {
      name: 'selectHasMany',
      type: 'select',
      hasMany: true,
      options: [
        { label: 'Tag A', value: 'tagA' },
        { label: 'Tag B', value: 'tagB' },
        { label: 'Tag C', value: 'tagC' },
        { label: 'Tag D', value: 'tagD' },
      ],
    },
    {
      name: 'radio',
      type: 'radio',
      options: [
        { label: 'Radio 1', value: 'radio1' },
        { label: 'Radio 2', value: 'radio2' },
        { label: 'Radio 3', value: 'radio3' },
      ],
    },
    {
      name: 'email',
      type: 'email',
    },
    {
      name: 'textarea',
      type: 'textarea',
    },
    {
      name: 'code',
      type: 'code',
      admin: {
        language: 'javascript',
      },
    },
    {
      name: 'point',
      type: 'point',
    },
    {
      name: 'textHasMany',
      type: 'text',
      hasMany: true,
    },
    {
      name: 'upload',
      type: 'upload',
      relationTo: 'media',
    },
  ],
}
