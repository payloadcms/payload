import type { Config } from 'payload'

import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const [testSuiteDir] = process.argv.slice(4)
const migrationDir = path.resolve(
  (process.env.PAYLOAD_CONFIG_PATH
    ? path.join(process.env.PAYLOAD_CONFIG_PATH, '..')
    : testSuiteDir) || dirname,
  'migrations',
)

const createDatabaseTestConfig = async () => {
  const config: Partial<Config> = {
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
        slug: 'relation-a',
        fields: [
          {
            name: 'title',
            type: 'text',
          },
          {
            name: 'relationship',
            type: 'relationship',
            relationTo: 'relation-b',
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
  }

  const configWithDefaults = await buildConfigWithDefaults(config)

  if (process.env.PAYLOAD_DATABASE === 'mongoose' || !process.env.PAYLOAD_DATABASE) {
    configWithDefaults.db = mongooseAdapter({
      migrationDir,
      url:
        process.env.MONGODB_MEMORY_SERVER_URI ||
        process.env.DATABASE_URI ||
        'mongodb://127.0.0.1/payloadtests',
      // Disable strict mode for Mongoose
      schemaOptions: {
        strict: false,
      },
    })
  }

  return configWithDefaults
}

export default createDatabaseTestConfig()

export const postDoc = {
  title: 'test post',
}
