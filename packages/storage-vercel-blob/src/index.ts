import type { Plugin } from 'payload'

import type { VercelBlobStorageOptions } from './plugin.js'

import { getClientUploadRoute } from './getClientUploadRoute.js'
import { createVercelBlobStorage } from './plugin.js'

export type { VercelBlobStorageOptions } from './plugin.js'

export const vercelBlobStorage: (options: VercelBlobStorageOptions) => Plugin = (options) =>
  createVercelBlobStorage({
    options,
    serverHandler: getClientUploadRoute({
      access: typeof options.clientUploads === 'object' ? options.clientUploads.access : undefined,
      addRandomSuffix: options.addRandomSuffix ?? false,
      cacheControlMaxAge: options.cacheControlMaxAge,
      collections: options.collections,
      token: options.token ?? '',
      useCompositePrefixes: options.useCompositePrefixes,
    }),
  })
