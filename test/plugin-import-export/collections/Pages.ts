import type { CollectionConfig } from 'payload'

import { pagesSlug } from '../shared.js'

export const Pages: CollectionConfig = {
  slug: pagesSlug,
  labels: {
    singular: 'Page',
    plural: 'Pages',
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
