import type { CloudflareContext } from '@opennextjs/cloudflare'
import type { GetPlatformProxyOptions } from 'wrangler'

import { getCloudflareContext } from '@opennextjs/cloudflare'
import { r2Storage } from '@payloadcms/storage-r2'
import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { Media } from './collections/Media.js'
import { MediaClient } from './collections/MediaClient.js'
import { MediaWithPrefix } from './collections/MediaWithPrefix.js'
import { Users } from './collections/Users.js'
import { mediaSlug } from './shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Load test env creds
dotenv.config({
  path: path.resolve(dirname, './.env'),
})

const cloudflareRemoteBindings = false
const cloudflare =
  process.argv.find((value) => value.match(/^(generate|migrate):?/)) || !cloudflareRemoteBindings
    ? await getCloudflareContextFromWrangler()
    : await getCloudflareContext({ async: true })

export default buildConfigWithDefaults({
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Media, MediaWithPrefix, MediaClient, Users],
  onInit: async (payload) => {
    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })
  },
  plugins: [
    r2Storage({
      bucket: cloudflare.env.R2,
      collections: {
        [mediaSlug]: true,
        'media-with-prefix': {
          prefix: 'test-prefix',
        },
      },
    }),
    r2Storage({
      bucket: cloudflare.env.R2,
      collections: {
        'media-client': true,
      },
      clientUploads: true,
    }),
  ],
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})

// Adapted from https://github.com/opennextjs/opennextjs-cloudflare/blob/d00b3a13e42e65aad76fba41774815726422cc39/packages/cloudflare/src/api/cloudflare-context.ts#L328C36-L328C46
function getCloudflareContextFromWrangler(): Promise<CloudflareContext> {
  return import(/* webpackIgnore: true */ `${'__wrangler'.replaceAll('_', '')}`).then(
    ({ getPlatformProxy }) =>
      getPlatformProxy({
        environment: process.env.CLOUDFLARE_ENV,
        experimental: { remoteBindings: cloudflareRemoteBindings },
        configPath: path.resolve(dirname, 'wrangler.jsonc'),
      } satisfies GetPlatformProxyOptions),
  )
}
