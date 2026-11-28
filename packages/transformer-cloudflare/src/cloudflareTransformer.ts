import type { UploadTransformer } from 'payload'
import type { TransformerWithInternalBridge } from 'payload/internal'

import { uploadTransformerInternal } from 'payload/internal'

import type { CloudflareDynamicOptions, CloudflareTransformerOptions } from './types.js'

import { createImagesClient } from './client.js'
import { createHandleRequest } from './handleRequest.js'
import { initCollections, validateDynamic } from './initCollections.js'
import { parseDynamicTransform } from './parseDynamicTransform.js'
import { createTransformFile } from './transformFile.js'
import { createTransformUpload } from './transformUpload.js'

/** Cloudflare Images processing through a local binding or an authenticated companion Worker. */
export function cloudflareTransformer(
  options: CloudflareTransformerOptions,
): TransformerWithInternalBridge & UploadTransformer {
  const client = createImagesClient({ transport: options.transport })
  const collections = options.collections ?? {}
  const slug = options.slug ?? 'cloudflare'
  const dynamic: CloudflareDynamicOptions | false = options.dynamic
    ? {
        fit: 'cover',
        gravity: 'center',
        maxHeight: 4096,
        maxPixels: 16_777_216,
        maxWidth: 4096,
        withoutEnlargement: false,
        ...(options.dynamic === true ? {} : options.dynamic),
      }
    : false

  validateDynamic({ dynamic })
  const handlesCollection = ({ collectionSlug }: { collectionSlug: string }) =>
    Boolean(collections[collectionSlug])
  const transformer: TransformerWithInternalBridge & UploadTransformer = {
    slug,
    canTransform: ({ collectionSlug, operation, purpose, req }) => {
      if (operation === 'upload') {
        return handlesCollection({ collectionSlug })
          ? { canTransform: true, handledTransformKeys: ['crop', 'focalPoint'] }
          : false
      }

      // Saved transforms are applied at upload time, so requests only resize on demand.
      return Boolean(
        dynamic &&
        purpose !== 'persisted-default' &&
        (!dynamic.collections || dynamic.collections.includes(collectionSlug)) &&
        parseDynamicTransform({
          limits: {
            maxHeight: dynamic.maxHeight!,
            maxPixels: dynamic.maxPixels!,
            maxWidth: dynamic.maxWidth!,
          },
          searchParams: req.searchParams ?? new URLSearchParams(),
        }).isRouted,
      )
    },
    mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif'],
    ...(dynamic ? { handleRequest: createHandleRequest({ client, dynamic }) } : {}),
    init: (config) => initCollections({ collections, config, dynamic, transformer }),
    transformFile: createTransformFile({ slug, client, collections }),
    [uploadTransformerInternal]: {
      handlesCollection,
      transformUpload: createTransformUpload({ slug, client, collections }),
    },
  }

  return transformer
}
