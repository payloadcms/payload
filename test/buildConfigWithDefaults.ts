import path from 'path'

import type { Config, SanitizedConfig } from '../packages/payload/src/config/types'

import { viteBundler } from '../packages/bundler-vite/src'
import { webpackBundler } from '../packages/bundler-webpack/src'
import { mongooseAdapter } from '../packages/db-mongodb/src'
import { postgresAdapter } from '../packages/db-postgres/src'
import { buildConfig as buildPayloadConfig } from '../packages/payload/src/config/build'
import { slateEditor } from '../packages/richtext-slate/src'

// process.env.PAYLOAD_DATABASE = 'postgres'

const bundlerAdapters = {
  vite: viteBundler(),
  webpack: webpackBundler(),
}

const [testSuiteDir] = process.argv.slice(4)
const migrationDir = path.resolve(
  (process.env.PAYLOAD_CONFIG_PATH
    ? path.join(process.env.PAYLOAD_CONFIG_PATH, '..')
    : testSuiteDir) || __dirname,
  'migrations',
)

const databaseAdapters = {
  mongoose: mongooseAdapter({
    migrationDir,
    url: 'mongodb://127.0.0.1/payloadtests',
    collation: {
      strength: 1,
    },
  }),
  postgres: postgresAdapter({
    migrationDir,
    pool: {
      connectionString: process.env.POSTGRES_URL || 'postgres://127.0.0.1:5432/payloadtests',
    },
  }),
  'postgres-custom-schema': postgresAdapter({
    migrationDir,
    pool: {
      connectionString: process.env.POSTGRES_URL || 'postgres://127.0.0.1:5432/payloadtests',
    },
    schemaName: 'custom',
  }),
  'postgres-uuid': postgresAdapter({
    idType: 'uuid',
    migrationDir,
    pool: {
      connectionString: process.env.POSTGRES_URL || 'postgres://127.0.0.1:5432/payloadtests',
    },
  }),
  supabase: postgresAdapter({
    migrationDir,
    pool: {
      connectionString:
        process.env.POSTGRES_URL || 'postgresql://postgres:postgres@127.0.0.1:54322/postgres',
    },
  }),
}

export function buildConfigWithDefaults(testConfig?: Partial<Config>): Promise<SanitizedConfig> {
  const [name] = process.argv.slice(2)

  const config: Config = {
    db: databaseAdapters[process.env.PAYLOAD_DATABASE || 'mongoose'],
    editor: slateEditor({}),
    rateLimit: {
      max: 9999999999,
      window: 15 * 60 * 1000, // 15min default,
    },
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
    buildPath: path.resolve(__dirname, '../build'),
    bundler: bundlerAdapters[process.env.PAYLOAD_BUNDLER || 'webpack'],
    webpack: (webpackConfig) => {
      const existingConfig =
        typeof testConfig?.admin?.webpack === 'function'
          ? testConfig.admin.webpack(webpackConfig)
          : webpackConfig
      return {
        ...existingConfig,
        name,
        cache: process.env.NODE_ENV === 'test' ? { type: 'memory' } : existingConfig.cache,
        entry: {
          main: [
            `webpack-hot-middleware/client?path=${
              testConfig?.routes?.admin || '/admin'
            }/__webpack_hmr`,
            path.resolve(__dirname, '../packages/payload/src/admin'),
          ],
        },
        resolve: {
          ...existingConfig.resolve,
          alias: {
            ...existingConfig.resolve?.alias,
            [path.resolve(__dirname, '../packages/bundler-vite/src/index')]: path.resolve(
              __dirname,
              '../packages/bundler-vite/mock.js',
            ),
            [path.resolve(__dirname, '../packages/bundler-webpack/src/index')]: path.resolve(
              __dirname,
              '../packages/bundler-webpack/src/mocks/emptyModule.js',
            ),
            [path.resolve(__dirname, '../packages/db-mongodb/src/index')]: path.resolve(
              __dirname,
              '../packages/payload/src/bundlers/mocks/db-mongodb.js',
            ),
            [path.resolve(__dirname, '../packages/db-postgres/src/index')]: path.resolve(
              __dirname,
              '../packages/payload/src/bundlers/mocks/db-postgres.js',
            ),
            react: path.resolve(__dirname, '../packages/payload/node_modules/react'),
          },
        },
      }
    },
  }

  if (process.env.PAYLOAD_DISABLE_ADMIN === 'true') {
    if (typeof config.admin !== 'object') config.admin = {}
    config.admin.disable = true
  }

  return buildPayloadConfig(config)
}
