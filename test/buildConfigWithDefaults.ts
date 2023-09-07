import path from 'path'

import type { Config, SanitizedConfig } from '../packages/payload/src/config/types'

import { mongooseAdapter } from '../packages/db-mongodb/src/index'
import { postgresAdapter } from '../packages/db-postgres/src/index'
import { buildConfig as buildPayloadConfig } from '../packages/payload/src/config/build'

const databaseAdapters = {
  mongoose: mongooseAdapter({
    url: 'mongodb://127.0.0.1/payload',
  }),
  postgres: postgresAdapter({
    client: {
      connectionString: process.env.POSTGRES_URL || 'postgres://127.0.0.1:5432/payload',
    },
  }),
}

export function buildConfigWithDefaults(testConfig?: Partial<Config>): Promise<SanitizedConfig> {
  const [name] = process.argv.slice(2)

  const config: Config = {
    telemetry: false,
    rateLimit: {
      window: 15 * 60 * 100, // 15min default,
      max: 9999999999,
    },
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
    webpack: (webpackConfig) => {
      const existingConfig =
        typeof testConfig?.admin?.webpack === 'function'
          ? testConfig.admin.webpack(webpackConfig)
          : webpackConfig
      return {
        ...existingConfig,
        name,
        cache: process.env.NODE_ENV === 'test' ? { type: 'memory' } : existingConfig.cache,
        resolve: {
          ...existingConfig.resolve,
          alias: {
            ...existingConfig.resolve?.alias,
            [path.resolve(__dirname, '../packages/db-postgres/src/index')]: path.resolve(
              __dirname,
              '../packages/db-postgres/src/mock',
            ),
            [path.resolve(__dirname, '../packages/db-mongodb/src/index')]: path.resolve(
              __dirname,
              '../packages/db-mongodb/src/mock',
            ),
            '@payloadcms/db-mongodb': path.resolve(__dirname, '../packages/db-mongodb/src/mock'),
            '@payloadcms/db-postgres': path.resolve(__dirname, '../packages/db-postgres/src/mock'),
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
