import path from 'path'

import type { Config, SanitizedConfig } from '../packages/payload/src/config/types'

import { mongooseAdapter } from '../packages/db-mongodb/src'
import { postgresAdapter } from '../packages/db-postgres/src'
import { buildConfig as buildPayloadConfig } from '../packages/payload/src/config/build'
import { slateEditor } from '../packages/richtext-slate/src'

// process.env.PAYLOAD_DATABASE = 'postgres'

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
  const config: Config = {
    db: databaseAdapters[process.env.PAYLOAD_DATABASE || 'mongoose'],
    secret: 'TEST_SECRET',
    editor: undefined,
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
  }

  if (process.env.PAYLOAD_DISABLE_ADMIN === 'true') {
    if (typeof config.admin !== 'object') config.admin = {}
    config.admin.disable = true
  }

  return buildPayloadConfig(config)
}
