import path from 'path'

import type { Config } from '../../packages/payload/src/config/types'

import { mongooseAdapter } from '../../packages/db-mongodb/src'
import { buildConfigWithDefaults } from '../buildConfigWithDefaults'
import { devUser } from '../credentials'

const [testSuiteDir] = process.argv.slice(4)
const migrationDir = path.resolve(
  (process.env.PAYLOAD_CONFIG_PATH
    ? path.join(process.env.PAYLOAD_CONFIG_PATH, '..')
    : testSuiteDir) || __dirname,
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
      },
      {
        slug: 'relation-a',
        fields: [
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
  }

  const configWithDefaults = await buildConfigWithDefaults(config)

  if (process.env.PAYLOAD_DATABASE === 'mongoose' || !process.env.PAYLOAD_DATABASE) {
    configWithDefaults.db = mongooseAdapter({
      migrationDir,
      url: 'mongodb://127.0.0.1/payloadtests',
      // Disable JSON parsing to retain existing data shape(s)
      jsonParse: false,
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
