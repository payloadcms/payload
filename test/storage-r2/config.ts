import type { CloudflareContext } from '@opennextjs/cloudflare'
import type { GetPlatformProxyOptions } from 'wrangler'

import { getCloudflareContext } from '@opennextjs/cloudflare'
import { r2Storage } from '@payloadcms/storage-r2'
import { sharpTransformer } from '@payloadcms/transformer-sharp'
import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'
import path from 'path'

import { getTestSuiteDir } from '../__helpers/shared/getTestSuiteDir.js'
import { storageMediaSharpOptions } from '../__helpers/shared/storageMediaSharpOptions.js'
import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { Media } from './collections/Media.js'
import { MediaClient } from './collections/MediaClient.js'
import { MediaContainer } from './collections/MediaContainer.js'
import { MediaWithPrefix } from './collections/MediaWithPrefix.js'
import { Users } from './collections/Users.js'
import { mediaSlug } from './shared.js'

const filename = fileURLToPath(import.meta.url)
// TanStack Start bundles this file, so resolve `wrangler.jsonc` and other suite files from the source folder
const dirname = getTestSuiteDir({ fallbackDir: path.dirname(filename), suitePath: 'storage-r2' })

// Load test env creds
dotenv.config({
  path: path.resolve(dirname, './.env'),
})

const cloudflareRemoteBindings = false
const cloudflare =
  process.argv.find((value) => value.match(/^(generate|migrate):?/)) || !cloudflareRemoteBindings
    ? await getCloudflareContextFromWrangler()
    : await getCloudflareContext({ async: true })

export const r2Bucket = cloudflare.env.R2

export default buildConfigWithDefaults({
  suite: 'storage-r2',
  config: {
    admin: {
      importMap: {
        baseDir: path.resolve(dirname),
      },
    },
    collections: [Media, MediaWithPrefix, MediaClient, MediaContainer, Users],
    storage: [
      r2Storage({
        bucket: r2Bucket,
        collections: {
          'media-with-prefix': {
            prefix: 'test-prefix',
          },
          [mediaSlug]: true,
        },
      }),
      r2Storage({
        bucket: r2Bucket,
        clientUploads: true,
        collections: {
          'media-client': true,
        },
      }),
    ],
    typescript: {
      outputFile: path.resolve(dirname, 'payload-types.ts'),
    },
    upload: {
      transformers: [
        sharpTransformer({
          collections: {
            'media-client': storageMediaSharpOptions,
            [mediaSlug]: storageMediaSharpOptions,
          },
        }),
      ],
    },
  },
  seed: async (payload) => {
    await payload.create({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
      overrideAccess: true,
    })
  },
})

declare global {
  var payloadR2TestContext: Promise<CloudflareContext> | undefined
}

/**
 * A production server can load this config in several module graphs. They share one local
 * Cloudflare runtime per process, and nothing is persisted, so runtimes never lock each other's
 * state and every run starts with an empty bucket, like the database.
 *
 * Adapted from https://github.com/opennextjs/opennextjs-cloudflare/blob/d00b3a13e42e65aad76fba41774815726422cc39/packages/cloudflare/src/api/cloudflare-context.ts#L328C36-L328C46
 */
function getCloudflareContextFromWrangler(): Promise<CloudflareContext> {
  globalThis.payloadR2TestContext ??= import(
    /* webpackIgnore: true */ `${'__wrangler'.replaceAll('_', '')}`
  ).then(({ getPlatformProxy }) =>
    getPlatformProxy({
      configPath: path.resolve(dirname, 'wrangler.jsonc'),
      environment: process.env.CLOUDFLARE_ENV,
      persist: false,
      remoteBindings: cloudflareRemoteBindings,
    } satisfies GetPlatformProxyOptions),
  )

  return globalThis.payloadR2TestContext
}
