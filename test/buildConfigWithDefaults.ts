import type { Config, SanitizedConfig } from 'payload'

import { mcpPlugin } from '@payloadcms/plugin-mcp'
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

import {
  createReInitEndpoint,
  reInitEndpoint,
} from './__helpers/shared/clearAndSeed/reInitEndpoint.js'
import { createSeedCommand } from './__helpers/shared/clearAndSeed/seedCommand.js'
import {
  type SeedFunction,
  testDataConfigSymbol,
} from './__helpers/shared/clearAndSeed/testDataConfig.js'
import { localAPIEndpoint } from './__helpers/shared/sdk/endpoint.js'
import { databaseAdapter } from './databaseAdapter.js'
import { testEmailAdapter } from './testEmailAdapter.js'

// process.env.POSTGRES_URL = 'postgres://postgres:postgres@127.0.0.1:5432/payloadtests'
// process.env.PAYLOAD_DATABASE = 'postgres'
// process.env.PAYLOAD_DATABASE = 'sqlite'

type BuildConfigWithDefaultsArgs = {
  config: Partial<Config>
  disableAutoLogin?: boolean
  seed?: SeedFunction
  suite: string
}

type LegacyBuildConfigWithDefaultsOptions = {
  disableAutoLogin?: boolean
}

export function buildConfigWithDefaults(args: BuildConfigWithDefaultsArgs): Promise<SanitizedConfig>
/** @deprecated Use `buildConfigWithDefaults({ config, disableAutoLogin, seed, suite })`. */
export function buildConfigWithDefaults(
  testConfig?: Partial<Config>,
  options?: LegacyBuildConfigWithDefaultsOptions,
): Promise<SanitizedConfig>
export async function buildConfigWithDefaults(
  argsOrConfig: BuildConfigWithDefaultsArgs | Partial<Config> = {},
  legacyOptions: LegacyBuildConfigWithDefaultsOptions = {},
): Promise<SanitizedConfig> {
  const usesTestDataConfig = 'config' in argsOrConfig && 'suite' in argsOrConfig
  const testConfig = usesTestDataConfig ? argsOrConfig.config : argsOrConfig
  const disableAutoLogin = usesTestDataConfig
    ? argsOrConfig.disableAutoLogin
    : legacyOptions.disableAutoLogin
  const testDataConfig = usesTestDataConfig
    ? { seed: argsOrConfig.seed, suite: argsOrConfig.suite }
    : undefined
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
    endpoints: [
      localAPIEndpoint,
      testDataConfig ? createReInitEndpoint(testDataConfig) : reInitEndpoint,
      ...(testConfig?.endpoints || []),
    ],
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
      process.env.PAYLOAD_PUBLIC_DISABLE_AUTO_LOGIN === 'true' || disableAutoLogin
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

  // Auto-add the MCP plugin so every test suite exercises it. Suites that need
  // to configure it explicitly add their own `mcpPlugin({...})` call.
  const hasMcpPlugin = (config.plugins ?? []).some((p) => p.slug === '@payloadcms/plugin-mcp')
  if (!hasMcpPlugin) {
    config.plugins = [...(config.plugins ?? []), mcpPlugin({})]
  }

  if (config.cli !== false && testDataConfig) {
    config.cli = {
      ...config.cli,
      commands: {
        ...config.cli?.commands,
        seed: createSeedCommand(testDataConfig),
      },
    }
  }

  const sanitizedConfig = await buildConfig(config)

  if (testDataConfig) {
    Object.defineProperty(sanitizedConfig, testDataConfigSymbol, {
      enumerable: false,
      value: testDataConfig,
    })
  }

  return sanitizedConfig
}
