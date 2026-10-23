import { sharpTransformer } from '@payloadcms/transformer-sharp'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { ConvertedMedia } from './collections/ConvertedMedia/index.js'
import { DraftMedia } from './collections/DraftMedia/index.js'
import { LegacyMedia } from './collections/LegacyMedia/index.js'
import { LocalizedMedia } from './collections/LocalizedMedia/index.js'
import { Media } from './collections/Media/index.js'
import { PlainMedia } from './collections/PlainMedia/index.js'
import { TransformedMedia } from './collections/TransformedMedia/index.js'
import { TrashMedia } from './collections/TrashMedia/index.js'
import { convertedMediaSlug, transformedMediaSlug } from './shared.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const migrationDir = process.env.FILE_VERSIONING_MIGRATION_DIR
const hasLegacySchema = process.env.FILE_VERSIONING_LEGACY_SCHEMA === 'true'

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
    collections: hasLegacySchema
      ? [LegacyMedia]
      : [
          Media,
          DraftMedia,
          LocalizedMedia,
          TransformedMedia,
          ConvertedMedia,
          TrashMedia,
          PlainMedia,
        ],
    localization: { defaultLocale: 'en', locales: ['en', 'de'] },
    upload: {
      transformers: hasLegacySchema
        ? []
        : [
            sharpTransformer({
              collections: {
                [convertedMediaSlug]: {
                  formatOptions: { format: 'jpeg' },
                },
                [transformedMediaSlug]: {
                  variants: [{ name: 'small', height: 200, width: 200 }],
                },
              },
            }),
          ],
    },
    ...(migrationDb ? { db: migrationDb } : {}),
    typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  },
  seed: async (payload) => {
    await payload.create({
      collection: 'users',
      data: { email: devUser.email, password: devUser.password },
      overrideAccess: true,
    })
  },
  suite: 'file-versioning',
})
