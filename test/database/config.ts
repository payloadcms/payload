import { fileURLToPath } from 'node:url'
import path from 'path'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
import type { TextField } from 'payload'

import { v4 as uuid } from 'uuid'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'

const defaultValueField: TextField = {
  name: 'defaultValue',
  type: 'text',
  defaultValue: 'default value from database',
}

export default buildConfigWithDefaults({
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    {
      slug: 'posts',
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'hasTransaction',
          type: 'checkbox',
          hooks: {
            beforeChange: [({ req }) => !!req.transactionID],
          },
          admin: {
            readOnly: true,
          },
        },
        {
          name: 'throwAfterChange',
          type: 'checkbox',
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
        },
      ],
      hooks: {
        beforeOperation: [
          ({ args, operation, req }) => {
            if (operation === 'update') {
              const defaultIDType = req.payload.db.defaultIDType

              if (defaultIDType === 'number' && typeof args.id === 'string') {
                throw new Error('ID was not sanitized to a number properly')
              }
            }

            return args
          },
        ],
      },
    },
    {
      slug: 'default-values',
      fields: [
        {
          name: 'title',
          type: 'text',
        },
        defaultValueField,
        {
          name: 'array',
          type: 'array',
          // default array with one object to test subfield defaultValue properties for Mongoose
          defaultValue: [{}],
          fields: [defaultValueField],
        },
        {
          name: 'group',
          type: 'group',
          // we need to have to use as default in order to have subfield defaultValue properties directly for Mongoose
          defaultValue: {},
          fields: [defaultValueField],
        },
        {
          name: 'select',
          type: 'select',
          defaultValue: 'default',
          options: [
            { value: 'option0', label: 'Option 0' },
            { value: 'option1', label: 'Option 1' },
            { value: 'default', label: 'Default' },
          ],
        },
        {
          name: 'point',
          type: 'point',
          defaultValue: [10, 20],
        },
      ],
    },
    {
      slug: 'relation-a',
      fields: [
        {
          name: 'title',
          type: 'text',
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
    },
    {
      slug: 'relation-b',
      fields: [
        {
          name: 'title',
          type: 'text',
        },
        {
          name: 'relationship',
          type: 'relationship',
          relationTo: 'relation-a',
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
    },
    {
      slug: 'pg-migrations',
      fields: [
        {
          name: 'relation1',
          type: 'relationship',
          relationTo: 'relation-a',
        },
        {
          name: 'myArray',
          type: 'array',
          fields: [
            {
              name: 'relation2',
              type: 'relationship',
              relationTo: 'relation-b',
            },
            {
              name: 'mySubArray',
              type: 'array',
              fields: [
                {
                  name: 'relation3',
                  type: 'relationship',
                  localized: true,
                  relationTo: 'relation-b',
                },
              ],
            },
          ],
        },
        {
          name: 'myGroup',
          type: 'group',
          fields: [
            {
              name: 'relation4',
              type: 'relationship',
              localized: true,
              relationTo: 'relation-b',
            },
          ],
        },
        {
          name: 'myBlocks',
          type: 'blocks',
          blocks: [
            {
              slug: 'myBlock',
              fields: [
                {
                  name: 'relation5',
                  type: 'relationship',
                  relationTo: 'relation-a',
                },
                {
                  name: 'relation6',
                  type: 'relationship',
                  localized: true,
                  relationTo: 'relation-b',
                },
              ],
            },
          ],
        },
      ],
      versions: true,
    },
    {
      slug: 'custom-schema',
      dbName: 'customs',
      fields: [
        {
          name: 'text',
          type: 'text',
        },
        {
          name: 'localizedText',
          type: 'text',
          localized: true,
        },
        {
          name: 'relationship',
          type: 'relationship',
          hasMany: true,
          relationTo: 'relation-a',
        },
        {
          name: 'select',
          type: 'select',
          dbName: ({ tableName }) => `${tableName}_customSelect`,
          enumName: 'selectEnum',
          hasMany: true,
          options: ['a', 'b', 'c'],
        },
        {
          name: 'radio',
          type: 'select',
          enumName: 'radioEnum',
          options: ['a', 'b', 'c'],
        },
        {
          name: 'array',
          type: 'array',
          dbName: 'customArrays',
          fields: [
            {
              name: 'text',
              type: 'text',
            },
            {
              name: 'localizedText',
              type: 'text',
              localized: true,
            },
          ],
        },
        {
          name: 'blocks',
          type: 'blocks',
          blocks: [
            {
              slug: 'block',
              dbName: 'customBlocks',
              fields: [
                {
                  name: 'text',
                  type: 'text',
                },
                {
                  name: 'localizedText',
                  type: 'text',
                  localized: true,
                },
              ],
            },
          ],
        },
      ],
      versions: {
        drafts: true,
      },
    },
    {
      slug: 'places',
      fields: [
        {
          name: 'country',
          type: 'text',
        },
        {
          name: 'city',
          type: 'text',
        },
      ],
    },
    {
      slug: 'fields-persistance',
      fields: [
        {
          name: 'text',
          type: 'text',
          virtual: true,
        },
        {
          name: 'textHooked',
          type: 'text',
          virtual: true,
          hooks: { afterRead: [() => 'hooked'] },
        },
        {
          name: 'array',
          type: 'array',
          virtual: true,
          fields: [],
        },
        {
          type: 'row',
          fields: [
            {
              type: 'text',
              name: 'textWithinRow',
              virtual: true,
            },
          ],
        },
        {
          type: 'collapsible',
          fields: [
            {
              type: 'text',
              name: 'textWithinCollapsible',
              virtual: true,
            },
          ],
          label: 'Colllapsible',
        },
        {
          type: 'tabs',
          tabs: [
            {
              label: 'tab',
              fields: [
                {
                  type: 'text',
                  name: 'textWithinTabs',
                  virtual: true,
                },
              ],
            },
          ],
        },
      ],
    },
    {
      slug: 'custom-ids',
      fields: [
        {
          name: 'id',
          type: 'text',
          admin: {
            readOnly: true,
          },
          hooks: {
            beforeChange: [
              ({ value, operation }) => {
                if (operation === 'create') {
                  return uuid()
                }
                return value
              },
            ],
          },
        },
        {
          name: 'title',
          type: 'text',
        },
      ],
      versions: { drafts: true },
    },
    {
      slug: 'fake-custom-ids',
      fields: [
        {
          name: 'title',
          type: 'text',
        },
        {
          name: 'group',
          type: 'group',
          fields: [
            {
              name: 'id',
              type: 'text',
            },
          ],
        },
        {
          type: 'tabs',
          tabs: [
            {
              name: 'myTab',
              fields: [
                {
                  name: 'id',
                  type: 'text',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      slug: 'relationships-migration',
      fields: [
        {
          type: 'relationship',
          relationTo: 'default-values',
          name: 'relationship',
        },
        {
          type: 'relationship',
          relationTo: ['default-values'],
          name: 'relationship_2',
        },
      ],
      versions: true,
    },
  ],
  globals: [
    {
      slug: 'global',
      dbName: 'customGlobal',
      fields: [
        {
          name: 'text',
          type: 'text',
        },
      ],
      versions: true,
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
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})

export const postDoc = {
  title: 'test post',
}
