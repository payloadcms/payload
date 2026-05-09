import type { Config, SanitizedConfig } from 'payload'

import { mcpPlugin, type MCPPluginConfig } from '@payloadcms/plugin-mcp'
import {
  AlignFeature,
  BlockquoteFeature,
  BlocksFeature,
  BoldFeature,
  ChecklistFeature,
  HeadingFeature,
  IndentFeature,
  InlineCodeFeature,
  InlineToolbarFeature,
  ItalicFeature,
  lexicalEditor,
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
} from '@payloadcms/richtext-lexical'
import { buildConfig } from 'payload'
import { de } from 'payload/i18n/de'
import { en } from 'payload/i18n/en'
import { es } from 'payload/i18n/es'
import sharp from 'sharp'

import { reInitEndpoint } from './__helpers/shared/clearAndSeed/reInitEndpoint.js'
import { localAPIEndpoint } from './__helpers/shared/sdk/endpoint.js'
import { databaseAdapter } from './databaseAdapter.js'
import { testEmailAdapter } from './testEmailAdapter.js'

// process.env.POSTGRES_URL = 'postgres://postgres:postgres@127.0.0.1:5432/payloadtests'
// process.env.PAYLOAD_DATABASE = 'postgres'
// process.env.PAYLOAD_DATABASE = 'sqlite'

export async function buildConfigWithDefaults(
  testConfig?: Partial<Config>,
  options?: {
    disableAutoLogin?: boolean
  },
): Promise<SanitizedConfig> {
  const config: Config = {
    db: databaseAdapter,
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
        InlineToolbarFeature(),
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
    secret: 'TEST_SECRET',
    sharp,
    telemetry: false,
    ...testConfig,
    endpoints: [localAPIEndpoint, reInitEndpoint, ...(testConfig?.endpoints || [])],
    i18n: {
      supportedLanguages: {
        de,
        en,
        es,
        ...(testConfig?.i18n?.supportedLanguages || {}),
      },
      ...(testConfig?.i18n || {}),
    },
    typescript: {
      declare: {
        ignoreTSError: true,
        ...(testConfig?.typescript?.declare || {}),
      },
      ...testConfig?.typescript,
    },
  }

  if (!config.admin) {
    config.admin = {}
  }

  if (config.admin.autoLogin === undefined) {
    config.admin.autoLogin =
      process.env.PAYLOAD_PUBLIC_DISABLE_AUTO_LOGIN === 'true' || options?.disableAutoLogin
        ? false
        : {
            email: 'dev@payloadcms.com',
          }
  }

  if (process.env.PAYLOAD_DISABLE_ADMIN === 'true') {
    if (typeof config.admin !== 'object') {
      config.admin = {}
    }
    config.admin.disable = true
  }

  const hasMcpPlugin = (config.plugins ?? []).some((p) => p.slug === '@payloadcms/plugin-mcp')

  if (!hasMcpPlugin) {
    // Payload's sanitize step picks the first auth-enabled collection as admin.user when
    // it's unset, so adding the MCP plugin's API keys collection (auth.useAPIKey) would
    // otherwise hijack admin.user. Pre-populate a default users collection to keep that
    // detection stable across suites that don't define one.
    if (!config.admin.user && !(config.collections ?? []).some(({ auth }) => Boolean(auth))) {
      config.collections = [
        ...(config.collections ?? []),
        {
          slug: 'users',
          auth: { tokenExpiration: 7200 },
          fields: [],
        },
      ]
      config.admin.user = 'users'
    }

    const userCollectionSlug = config.admin.user ?? 'users'
    const mcpCollections: NonNullable<MCPPluginConfig['collections']> = {
      [userCollectionSlug]: { enabled: true },
    }
    for (const collection of config.collections ?? []) {
      mcpCollections[collection.slug] = { enabled: true }
    }

    const mcpGlobals: NonNullable<MCPPluginConfig['globals']> = {}
    for (const global of config.globals ?? []) {
      mcpGlobals[global.slug] = { enabled: true }
    }

    config.plugins = [
      ...(config.plugins ?? []),
      mcpPlugin({ collections: mcpCollections, globals: mcpGlobals }),
    ]
  }

  return await buildConfig(config)
}
