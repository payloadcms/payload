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
            return value + ' toCSV'
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
          toCSV: ({ value, columnName, row, siblingDoc, doc }) => {
            row[`${columnName}_id`] = value.id
            row[`${columnName}_email`] = value.email
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
                return value + ' toCSV'
              },
            },
          },
        },
      ],
    },
    {
      name: 'tabs',
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
                    return value + ' toCSV'
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
              defaultValue: 'my custom csv transformer',
              custom: {
                'plugin-import-export': {
                  toCSV: ({ value, columnName, row, siblingDoc, doc }) => {
                    return value + ' toCSV'
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
      name: 'relationship',
      type: 'relationship',
      relationTo: 'users',
    },
    {
      name: 'excerpt',
      label: 'Excerpt',
      type: 'text',
    },
  ],
}
