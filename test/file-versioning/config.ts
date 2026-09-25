import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { LegacyMedia } from './collections/LegacyMedia/index.js'
import { Media } from './collections/Media/index.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const migrationDir = process.env.FILE_VERSIONING_MIGRATION_DIR

const migrationDb = migrationDir
  ? process.env.PAYLOAD_DATABASE === 'postgres'
    ? (await import('@payloadcms/db-postgres')).postgresAdapter({
        migrationDir,
        pool: {
          connectionString:
            process.env.POSTGRES_URL || 'postgres://payload:payload@localhost:5433/payload',
        },
        push: false,
      })
    : (await import('@payloadcms/db-sqlite')).sqliteAdapter({
        autoIncrement: true,
        client: { url: process.env.SQLITE_URL || 'file:./payload.db' },
        migrationDir,
        push: false,
      })
  : undefined

export default buildConfigWithDefaults({
  config: {
    collections: [process.env.FILE_VERSIONING_LEGACY_SCHEMA === 'true' ? LegacyMedia : Media],
    ...(migrationDb ? { db: migrationDb } : {}),
    typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  },
  suite: 'file-versioning',
})
