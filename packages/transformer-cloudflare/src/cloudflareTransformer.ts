import type { UploadTransformer } from 'payload'
import type { TransformerWithInternalBridge } from 'payload/internal'

import { uploadTransformerInternal } from 'payload/internal'

import type {
  CloudflareDynamicOptions,
  CloudflareTransformerOptions,
  CloudflareUploadTask,
} from './types.js'

import { createImagesClient } from './client.js'
import { createHandleRequest } from './handleRequest.js'
import { initCollections, validateDynamic } from './initCollections.js'
import { parseDynamicTransform } from './parseDynamicTransform.js'
import { createPrepareUpload } from './prepareUpload.js'
import { resolveOutput, resolveResize } from './transformation.js'

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
    canTransform: ({ collectionSlug, operation, req }) =>
      operation === 'upload'
        ? handlesCollection({ collectionSlug })
        : Boolean(
            dynamic &&
              (!dynamic.collections || dynamic.collections.includes(collectionSlug)) &&
              parseDynamicTransform({
                limits: {
                  maxHeight: dynamic.maxHeight!,
                  maxPixels: dynamic.maxPixels!,
                  maxWidth: dynamic.maxWidth!,
                },
                searchParams: req.searchParams ?? new URLSearchParams(),
              }).isRouted,
          ),
    mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif'],
    ...(dynamic ? { handleRequest: createHandleRequest({ client, dynamic }) } : {}),
    init: (config) => initCollections({ collections, config, dynamic, transformer }),
    transformFile: async ({ collectionSlug, file, options: taskOptions, req }) => {
      const config = collections[collectionSlug]
      let task: CloudflareUploadTask | undefined

      if (taskOptions !== undefined) {
        if (
          !taskOptions ||
          typeof taskOptions !== 'object' ||
          !('transformerSlug' in taskOptions) ||
          taskOptions.transformerSlug !== slug
        ) {
          return { status: 'continue' }
        }
        task = taskOptions as CloudflareUploadTask
      }
      const transforms =
        task?.transforms ??
        (config?.resizeOptions ? [resolveResize({ options: config.resizeOptions })] : [])
      const formatOptions = task?.formatOptions ?? config?.formatOptions

      if (!transforms.length && !formatOptions) {
        return { status: 'continue' }
      }
      const response = await client.transform({
        file,
        output: resolveOutput({ formatOptions, mimeType: file.type }),
        req,
        transforms,
      })
      const mimeType = response.headers.get('content-type')!
      const extension = mimeType === 'image/jpeg' ? 'jpg' : mimeType.slice(6)
      const name = `${file.name.replace(/\.[^.]+$/, '')}.${extension}`

      return {
        file: new File([await response.arrayBuffer()], name, {
          type: mimeType,
          lastModified: file.lastModified,
        }),
        status: 'continue',
      }
    },
    [uploadTransformerInternal]: {
      handlesCollection,
      prepareUpload: createPrepareUpload({ slug, client, collections }),
    },
  }

  return transformer
}
