import { sqliteD1Adapter } from '@payloadcms/db-d1-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { r2Storage } from '@payloadcms/storage-r2'
import path from 'node:path'
import { buildConfig } from 'payload'
import type { PayloadLogger } from 'payload'
import { fileURLToPath } from 'node:url'

import { cloudflareEnv as cloudflare } from '#cloudflare-runtime'
import { Media } from './collections/Media'
import { Posts } from './collections/Posts'
import { Users } from './collections/Users'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const createLog =
  (level: string, write: typeof console.log) =>
  (objectOrMessage: object | string, message?: string) => {
    const entry =
      typeof objectOrMessage === 'string'
        ? { level, msg: objectOrMessage }
        : {
            level,
            ...objectOrMessage,
            msg: message ?? (objectOrMessage as { msg?: string }).msg,
          }

    write(JSON.stringify(entry))
  }

const cloudflareLogger = {
  debug: createLog('debug', console.debug),
  error: createLog('error', console.error),
  fatal: createLog('fatal', console.error),
  info: createLog('info', console.log),
  level: process.env.PAYLOAD_LOG_LEVEL || 'info',
  silent: () => undefined,
  trace: createLog('trace', console.debug),
  warn: createLog('warn', console.warn),
} as unknown as PayloadLogger

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media, Posts],
  db: sqliteD1Adapter({
    binding: cloudflare.D1,
  }),
  editor: lexicalEditor(),
  logger: process.env.NODE_ENV === 'production' ? cloudflareLogger : undefined,
  secret: process.env.PAYLOAD_SECRET || cloudflare.PAYLOAD_SECRET || '',
  storage: [
    r2Storage({
      bucket: cloudflare.R2,
      collections: {
        media: true,
      },
    }),
  ],
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
