import type { SanitizedConfig } from 'payload'

import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { postgresAdapter } from '@payloadcms/db-postgres'
import {
  AlignFeature,
  BlockquoteFeature,
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
import { type Config, buildConfig } from 'payload'
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
        BlockquoteFeature(),
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
    email: testEmailAdapter,
    endpoints: [localAPIEndpoint, reInitEndpoint],
    secret: 'TEST_SECRET',
    sharp,
    telemetry: false,

    ...testConfig,

    typescript: {
      declare: {
        ignoreTSError: true,
      },
      ...testConfig?.typescript,
    },
    i18n: {
      supportedLanguages: {
        de,
        en,
        es,
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
