import path from 'path'

import type { Config, SanitizedConfig } from '../packages/payload/src/config/types'

import { mongooseAdapter } from '../packages/db-mongodb/src'
import { postgresAdapter } from '../packages/db-postgres/src'
import { buildConfig as buildPayloadConfig } from '../packages/payload/src/config/build'
import { slateEditor } from '../packages/richtext-slate/src'

// process.env.PAYLOAD_DATABASE = 'postgres'

const databaseAdapters = {
  mongoose: mongooseAdapter({
    migrationDir: path.resolve(__dirname, '../packages/db-mongodb/migrations'),
    url: 'mongodb://127.0.0.1/payloadtests',
  }),
  postgres: postgresAdapter({
    migrationDir: path.resolve(__dirname, '../packages/db-postgres/migrations'),
    pool: {
      connectionString: process.env.POSTGRES_URL || 'postgres://127.0.0.1:5432/payloadtests',
    },
  }),
}

export function buildConfigWithDefaults(testConfig?: Partial<Config>): Promise<SanitizedConfig> {
  const config: Config = {
    secret: 'TEST_SECRET',
    editor: undefined,
    rateLimit: {
      max: 9999999999,
      window: 15 * 60 * 1000, // 15min default,
    },
    telemetry: false,
    ...testConfig,
    db: databaseAdapters[process.env.PAYLOAD_DATABASE || 'mongoose'],
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
