import type { CollectionConfig } from 'payload'

export const NestedFields: CollectionConfig = {
  slug: 'nested-field-tables',
  fields: [
    {
      name: 'array',
      type: 'array',
      localized: true,
      fields: [
        {
          name: 'relation',
          type: 'relationship',
          relationTo: ['localized-posts'],
        },
        {
          name: 'hasManyRelation',
          type: 'relationship',
          hasMany: true,
          relationTo: 'localized-posts',
        },
        {
          name: 'hasManyPolyRelation',
          type: 'relationship',
          hasMany: true,
          relationTo: ['localized-posts'],
        },
        {
          name: 'select',
          type: 'select',
          hasMany: true,
          options: ['one', 'two', 'three'],
        },
        {
          name: 'number',
          type: 'number',
          hasMany: true,
        },
        {
          name: 'text',
          type: 'text',
          hasMany: true,
        },
      ],
    },
    // both are valid depending on config

    // group.field.en
    {
      name: 'group',
      type: 'group',
      fields: [
        {
          name: 'field',
          type: 'text',
          localized: true,
        },
      ],
    },

    // group.en.field
    // group.es.field
    // the locale passed in is what we need to match on "group[equals]='bla'" if locale === 'en' returns doc, if locale === 'es' this would miss in a query
    // group: { en: { field: 'bla'}, es: { field: 'spanish' }, }
    {
      name: 'group',
      type: 'group',
      localized: true,
      fields: [
        {
          name: 'field',
          type: 'text',
        },
      ],
    },

    {
      name: 'blocks',
      type: 'blocks',
      blocks: [
        {
          slug: 'block',
          fields: [
            {
              name: 'nestedBlocks',
              type: 'blocks',
              blocks: [
                {
                  slug: 'content',
                  fields: [
                    {
                      name: 'relation',
                      type: 'relationship',
                      relationTo: ['localized-posts'],
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
                  name: 'relation',
                  type: 'relationship',
                  relationTo: ['localized-posts'],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
