import type { SanitizedConfig } from 'payload/types'

import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { postgresAdapter } from '@payloadcms/db-postgres'
import {
  AlignFeature,
  BlockQuoteFeature,
  BlocksFeature,
  BoldFeature,
  ChecklistFeature,
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
// import { slateEditor } from '@payloadcms/richtext-slate'
import { type Config, buildConfig } from 'payload/config'
import { de } from 'payload/i18n/de'
import { en } from 'payload/i18n/en'
import { es } from 'payload/i18n/es'
import sharp from 'sharp'

import { reInitEndpoint } from './helpers/reInit.js'
import { localAPIEndpoint } from './helpers/sdk/endpoint.js'
import { testEmailAdapter } from './testEmailAdapter.js'
// process.env.PAYLOAD_DATABASE = 'postgres'

export async function buildConfigWithDefaults(
  testConfig?: Partial<Config>,
): Promise<SanitizedConfig> {
  const databaseAdapters = {
    mongodb: mongooseAdapter({
      url:
        process.env.MONGODB_MEMORY_SERVER_URI ||
        process.env.DATABASE_URI ||
        'mongodb://127.0.0.1/payloadtests',
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

  const config: Config = {
    db: databaseAdapters[process.env.PAYLOAD_DATABASE || 'mongodb'],
    secret: 'TEST_SECRET',
    email: testEmailAdapter,
    endpoints: [localAPIEndpoint, reInitEndpoint],
    editor: lexicalEditor({
      features: [
        ParagraphFeature(),
        RelationshipFeature(),
        LinkFeature({
          fields: ({ defaultFields }) => [
            ...defaultFields,
            {
              name: 'description',
              type: 'text',
            },
          ],
        }),
        ChecklistFeature(),
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
    i18n: {
      supportedLanguages: {
        en,
        es,
        de,
      },
      ...(testConfig?.i18n || {}),
    },
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

  return await buildConfig(config)
}
