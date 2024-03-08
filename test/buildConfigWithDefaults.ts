import sharp from 'sharp'

import type { Config, SanitizedConfig } from '../packages/payload/src/config/types.d.ts'

import { mongooseAdapter } from '../packages/db-mongodb/src/index.js'
import { postgresAdapter } from '../packages/db-postgres/src/index.js'
//import { postgresAdapter } from '../packages/db-postgres/src/index.js'
import { buildConfig as buildPayloadConfig } from '../packages/payload/src/config/build.js'
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
} from '../packages/richtext-lexical/src/index.js'
//import { slateEditor } from '../packages/richtext-slate/src/index.js'
// process.env.PAYLOAD_DATABASE = 'postgres'

const databaseAdapters = {
  mongoose: mongooseAdapter({
    url: 'mongodb://127.0.0.1/payloadtests',
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
export function buildConfigWithDefaults(testConfig?: Partial<Config>): Promise<SanitizedConfig> {
  const config: Config = {
    db: databaseAdapters[process.env.PAYLOAD_DATABASE || 'mongoose'],
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

  return buildPayloadConfig(config)
}
