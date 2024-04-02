import type { SanitizedConfig } from 'payload/types'

import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { postgresAdapter } from '@payloadcms/db-postgres'
import {
  AlignFeature,
  BlockQuoteFeature,
  BlocksFeature,
  BoldFeature,
  CheckListFeature,
  HeadingFeature,
  IndentFeature,
  InlineCodeFeature,
  ItalicFeature,
  LinkFeature,
  OrderedListFeature,
  ParagraphFeature,
  RelationshipFeature,
  StrikethroughFeature,
  SubscriptFeature,
  SuperscriptFeature,
  TreeViewFeature,
  UnderlineFeature,
  UnorderedListFeature,
  UploadFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import { MongoMemoryReplSet } from 'mongodb-memory-server'
// import { slateEditor } from '@payloadcms/richtext-slate'
import { type Config, buildConfig } from 'payload/config'
import sharp from 'sharp'

import { reInitEndpoint } from './helpers/reInit.js'
import { localAPIEndpoint } from './helpers/sdk/endpoint.js'
// process.env.PAYLOAD_DATABASE = 'postgres'

const databaseAdapters = {
  mongodb: mongooseAdapter({
    url: process.env.DATABASE_URI || 'mongodb://127.0.0.1/payloadtests',
  }),
  postgres: postgresAdapter({
    pool: {
      connectionString: process.env.POSTGRES_URL || 'postgres://127.0.0.1:5432/payloadtests',
    },
  }),
  'postgres-custom-schema': postgresAdapter({
    pool: {
      connectionString: process.env.POSTGRES_URL || 'postgres://127.0.0.1:5432/payloadtests',
    },
    schemaName: 'custom',
  }),
  'postgres-uuid': postgresAdapter({
    idType: 'uuid',
    pool: {
      connectionString: process.env.POSTGRES_URL || 'postgres://127.0.0.1:5432/payloadtests',
    },
  }),
  supabase: postgresAdapter({
    pool: {
      connectionString:
        process.env.POSTGRES_URL || 'postgresql://postgres:postgres@127.0.0.1:54322/postgres',
    },
  }),
}
let cached = global._cachedDBAdapter

if (!cached) {
  // eslint-disable-next-line no-multi-assign
  cached = global._cachedDBAdapter = {
    promise: null,
    adapter: null,
  }
}

export async function buildConfigWithDefaults(
  testConfig?: Partial<Config>,
): Promise<SanitizedConfig> {
  if (!process.env.PAYLOAD_DATABASE || process.env.PAYLOAD_DATABASE === 'mongodb') {
    if (process.env.JEST_WORKER_ID || process.env.PW_TS_ESM_LOADER_ON) {
      if (cached.adapter) {
        databaseAdapters.mongodb = cached.adapter
      } else {
        if (!cached.promise) {
          cached.promise = MongoMemoryReplSet.create({
            replSet: {
              count: 3,
              dbName: 'payloadmemory',
            },
          }).then((server) => {
            const url = server.getUri()
            return mongooseAdapter({
              mongoMemoryServer: server,
              url,
            })
          })
        }

        cached.adapter = await cached.promise
        cached.promise = null

        databaseAdapters.mongodb = cached.adapter
      }
    }
  }

  const config: Config = {
    db: databaseAdapters[process.env.PAYLOAD_DATABASE || 'mongodb'],
    secret: 'TEST_SECRET',
    //editor: slateEditor({}),
    // editor: slateEditor({
    //   admin: {
    //     upload: {
    //       collections: {
    //         media: {
    //           fields: [
    //             {
    //               name: 'alt',
    //               type: 'text',
    //             },
    //           ],
    //         },
    //       },
    //     },
    //   },
    // }),
    endpoints: [localAPIEndpoint, reInitEndpoint],
    editor: lexicalEditor({
      features: [
        ParagraphFeature(),
        RelationshipFeature(),
        LinkFeature({
          fields: [
            {
              name: 'description',
              type: 'text',
            },
          ],
        }),
        CheckListFeature(),
        UnorderedListFeature(),
        OrderedListFeature(),
        AlignFeature(),
        BlockQuoteFeature(),
        BoldFeature(),
        ItalicFeature(),
        UploadFeature({
          collections: {
            media: {
              fields: [
                {
                  name: 'alt',
                  type: 'text',
                },
              ],
            },
          },
        }),
        UnderlineFeature(),
        StrikethroughFeature(),
        SubscriptFeature(),
        SuperscriptFeature(),
        InlineCodeFeature(),
        TreeViewFeature(),
        HeadingFeature(),
        IndentFeature(),
        BlocksFeature({
          blocks: [
            {
              slug: 'myBlock',
              fields: [
                {
                  name: 'someText',
                  type: 'text',
                },
                {
                  name: 'someTextRequired',
                  type: 'text',
                  required: true,
                },
                {
                  name: 'radios',
                  type: 'radio',
                  options: [
                    {
                      label: 'Option 1',
                      value: 'option1',
                    },
                    {
                      label: 'Option 2',
                      value: 'option2',
                    },
                    {
                      label: 'Option 3',
                      value: 'option3',
                    },
                  ],
                  validate: (value) => {
                    return value !== 'option2' ? true : 'Cannot be option2'
                  },
                },
              ],
            },
          ],
        }),
      ],
    }),
    sharp,
    telemetry: false,
    typescript: {
      declare: false,
    },
    ...testConfig,
  }

  config.admin = {
    autoLogin:
      process.env.PAYLOAD_PUBLIC_DISABLE_AUTO_LOGIN === 'true'
        ? false
        : {
            email: 'dev@payloadcms.com',
            password: 'test',
          },
    ...(config.admin || {}),
  }

  if (process.env.PAYLOAD_DISABLE_ADMIN === 'true') {
    if (typeof config.admin !== 'object') config.admin = {}
    config.admin.disable = true
  }

  return buildConfig(config)
}
