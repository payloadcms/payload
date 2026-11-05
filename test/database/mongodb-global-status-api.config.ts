import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { randomUUID } from 'node:crypto'
import { buildConfig } from 'payload'

import { testDataConfigSymbol } from '../__helpers/shared/clearAndSeed/testDataConfig.js'

const databaseName = `payload_global_status_api_${randomUUID().replaceAll('-', '')}`
const config = await buildConfig({
  collections: [],
  db: mongooseAdapter({
    connectOptions: { dbName: databaseName, serverSelectionTimeoutMS: 10000 },
    url:
      process.env.MONGODB_URL ||
      process.env.DATABASE_URL ||
      'mongodb://payload:payload@localhost:27018/payload?authSource=admin&directConnection=true&replicaSet=rs0',
  }),
  globals: ['status-alpha', 'status-beta'].map((slug) => ({
    slug,
    fields: [{ name: 'title', type: 'text', localized: true }],
    versions: { drafts: { localizeStatus: true } },
  })),
  localization: { defaultLocale: 'en', locales: ['en', 'de'] },
  secret: 'global-status-index-integration-test',
  telemetry: false,
  typescript: { autoGenerate: false },
})

Object.defineProperty(config, testDataConfigSymbol, {
  value: { suite: 'mongodb-global-status-api' },
})

export default config
