import type { R2StorageOptions } from '@payloadcms/storage-r2'
import type { PlatformProxy } from 'wrangler'

import { r2Storage } from '@payloadcms/storage-r2'
import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../../buildConfigWithDefaults.js'
import { devUser } from '../../credentials.js'
import { MediaClient } from '../collections/MediaClient.js'
import { Users } from '../collections/Users.js'
import { mediaClientSlug } from '../shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const { getPlatformProxy } = await import('wrangler')

/** A local R2 bucket that keeps nothing between runs. */
export const r2Environment: PlatformProxy<{ R2: R2StorageOptions['bucket'] }> =
  await getPlatformProxy<{ R2: R2StorageOptions['bucket'] }>({
    configPath: path.resolve(dirname, '../wrangler.jsonc'),
    persist: false,
  })

export default buildConfigWithDefaults({
  config: {
    admin: {
      importMap: {
        baseDir: path.resolve(dirname, '..'),
      },
    },
    collections: [MediaClient, Users],
    storage: [
      r2Storage({
        bucket: r2Environment.env.R2,
        clientUploads: true,
        collections: {
          [mediaClientSlug]: true,
        },
      }),
    ],
    typescript: {
      outputFile: path.resolve(dirname, 'payload-types.ts'),
    },
  },
  seed: async (payload) => {
    await payload.create({
      collection: 'users',
      data: { email: devUser.email, password: devUser.password },
      overrideAccess: true,
    })
  },
  suite: 'storage-r2-client-uploads',
})
