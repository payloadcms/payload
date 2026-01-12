import type { CollectionConfig } from 'payload'

export const PostsCollection: CollectionConfig = {
  slug: 'posts',
  admin: {
    useAsTitle: 'text',
  },
  fields: [
    {
      name: 'text',
      type: 'text',
    },
    {
      name: 'number',
      type: 'number',
    },
    {
      name: 'select',
      type: 'select',
      options: ['a', 'b'],
    },
    {
      name: 'selectMany',
      type: 'select',
      options: ['a', 'b'],
      hasMany: true,
    },
    {
      name: 'group',
      type: 'group',
      fields: [
        {
          name: 'text',
          type: 'text',
        },
        {
          name: 'number',
          type: 'number',
        },
      ],
    },
    {
      name: 'array',
      type: 'array',
      fields: [
        {
          name: 'text',
          type: 'text',
        },
        {
          name: 'number',
          type: 'number',
        },
      ],
    },
    {
      name: 'blocks',
      type: 'blocks',
      blocks: [
        {
          slug: 'intro',
          fields: [
            {
              name: 'text',
              type: 'text',
            },
            {
              name: 'introText',
              type: 'text',
            },
          ],
        },
        {
          slug: 'cta',
          fields: [
            {
              name: 'text',
              type: 'text',
            },
            {
              name: 'ctaText',
              type: 'text',
            },
          ],
        },
      ],
    },
    {
      type: 'tabs',
      tabs: [
        {
          name: 'tab',
          fields: [
            {
              type: 'text',
              name: 'text',
            },
            {
              type: 'number',
              name: 'number',
            },
          ],
        },
        {
          label: 'Tab Unnamed',
          fields: [
            {
              type: 'text',
              name: 'unnamedTabText',
            },
            {
              type: 'number',
              name: 'unnamedTabNumber',
            },
          ],
        },
      ],
    },
    {
      type: 'relationship',
      name: 'hasOne',
      relationTo: 'rels',
    },
    {
      type: 'relationship',
      name: 'hasMany',
      hasMany: true,
      relationTo: 'rels',
    },
    {
      type: 'upload',
      name: 'hasManyUpload',
      hasMany: true,
      relationTo: 'upload',
    },
    {
      type: 'relationship',
      name: 'hasOnePoly',
      relationTo: ['rels'],
    },
    {
      type: 'relationship',
      name: 'hasManyPoly',
      hasMany: true,
      relationTo: ['rels'],
    },
  ],
}
