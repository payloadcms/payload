import { buildConfigWithDefaults } from '../buildConfigWithDefaults'
import { devUser } from '../credentials'

export default buildConfigWithDefaults({
  collections: [
    {
      fields: [
        {
          name: 'title',
          required: true,
          type: 'text',
        },
        {
          name: 'throwAfterChange',
          defaultValue: false,
          hooks: {
            afterChange: [
              ({ value }) => {
                if (value) {
                  throw new Error('throw after change')
                }
              },
            ],
          },
          type: 'checkbox',
        },
      ],
      slug: 'posts',
    },
    {
      fields: [
        {
          name: 'relationship',
          relationTo: 'relation-b',
          type: 'relationship',
        },
        {
          name: 'richText',
          type: 'richText',
        },
      ],
      labels: {
        plural: 'Relation As',
        singular: 'Relation A',
      },
      slug: 'relation-a',
    },
    {
      fields: [
        {
          name: 'relationship',
          relationTo: 'relation-a',
          type: 'relationship',
        },
        {
          name: 'richText',
          type: 'richText',
        },
      ],
      labels: {
        plural: 'Relation Bs',
        singular: 'Relation B',
      },
      slug: 'relation-b',
    },
    {
      fields: [
        {
          name: 'text',
          type: 'text',
        },
        {
          name: 'localizedText',
          localized: true,
          type: 'text',
        },
        {
          name: 'relationship',
          hasMany: true,
          relationTo: 'relation-a',
          type: 'relationship',
        },
        {
          name: 'select',
          enumName: 'selectEnum',
          hasMany: true,
          options: ['a', 'b', 'c'],
          tableName: 'customSelect',
          type: 'select',
        },
        {
          name: 'radio',
          enumName: 'radioEnum',
          options: ['a', 'b', 'c'],
          type: 'select',
        },
        {
          name: 'array',
          fields: [
            {
              name: 'text',
              type: 'text',
            },
            {
              name: 'localizedText',
              localized: true,
              type: 'text',
            },
          ],
          tableName: 'customArrays',
          type: 'array',
        },
        {
          name: 'blocks',
          blocks: [
            {
              fields: [
                {
                  name: 'text',
                  type: 'text',
                },
                {
                  name: 'localizedText',
                  localized: true,
                  type: 'text',
                },
              ],
              slug: 'block',
              tableName: 'customBlocks',
            },
          ],
          type: 'blocks',
        },
      ],
      slug: 'custom-schema',
      tableName: 'customs',
    },
  ],
  globals: [
    {
      fields: [
        {
          name: 'text',
          type: 'text',
        },
      ],
      slug: 'global',
      tableName: 'customGlobal',
    },
  ],
  localization: {
    defaultLocale: 'en',
    locales: ['en', 'es'],
  },
  onInit: async (payload) => {
    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })
  },
})

export const postDoc = {
  title: 'test post',
}
