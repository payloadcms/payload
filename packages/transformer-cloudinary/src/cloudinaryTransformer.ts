import type { Config, TransformFileArgs, TransformFileResult, UploadTransformer } from 'payload'
import type { TransformerWithInternalBridge } from 'payload/internal'

import { uploadTransformerInternal } from 'payload/internal'

import type {
  CloudinaryDynamicDefaults,
  CloudinaryDynamicOptions,
  CloudinaryTransformerOptions,
} from './types.js'

import { TRANSFORMABLE_MIME_TYPES } from './canTransformImage.js'
import { createHandleRequest } from './handleRequest.js'
import { initCloudinaryCollections } from './initCloudinaryCollections.js'
import { parseDynamicTransform } from './parseDynamicTransform.js'
import { createPrepareUpload } from './prepareUpload.js'
import { resolveConfig } from './resolveConfig.js'
import { createResolveSourceURL } from './resolveSourceURL.js'
import { transformFile } from './transformFile.js'

type ResolvedDynamicDefaults = {
  format?: CloudinaryDynamicDefaults['format']
} & Required<Omit<CloudinaryDynamicDefaults, 'format'>>

export function resolveCloudinaryDynamicDefaults(
  overrides?: CloudinaryDynamicDefaults,
): ResolvedDynamicDefaults {
  return {
    crop: overrides?.crop ?? 'fill',
    format: overrides?.format,
    gravity: overrides?.gravity ?? 'center',
    maxHeight: overrides?.maxHeight ?? 4096,
    maxPixels: overrides?.maxPixels ?? 16_777_216,
    maxWidth: overrides?.maxWidth ?? 4096,
    quality: overrides?.quality ?? 'auto',
    withoutEnlargement: overrides?.withoutEnlargement ?? false,
  }
}

/**
 * Normalizes the `dynamic` option: `false`/omitted disables request-time
 * transformation, `true` enables it with defaults for every upload collection.
 */
function resolveCloudinaryDynamicOptions(
  dynamic: CloudinaryTransformerOptions['dynamic'],
): CloudinaryDynamicOptions | false {
  if (!dynamic) {
    return false
  }

  return dynamic === true ? {} : dynamic
}

/**
 * A Cloudinary-backed file transformer: upload-time image processing, plus
 * opt-in (`dynamic`) request-time `width`/`height`/`withoutEnlargement`
 * transformation delivered from Cloudinary's CDN.
 *
 * Credentials are resolved eagerly so a misconfigured cloud fails at startup
 * rather than on the first upload.
 */
export function cloudinaryTransformer(
  options: CloudinaryTransformerOptions = {},
): TransformerWithInternalBridge & UploadTransformer {
  const config = resolveConfig({ config: options.config, url: options.url })
  const dynamicOptions = resolveCloudinaryDynamicOptions(options.dynamic)
  const dynamicDefaults = resolveCloudinaryDynamicDefaults(dynamicOptions || undefined)
  const collections = options.collections ?? {}

  return {
    slug: options.slug ?? 'cloudinary',
    canTransform: (args) => {
      // Upload-time eligibility is already decided by the MIME match that ran
      // before `canTransform`; only dynamic request routing needs the query.
      if (args.operation === 'upload') {
        return true
      }

      if (
        !dynamicOptions ||
        (dynamicOptions.collections && !dynamicOptions.collections.includes(args.collectionSlug))
      ) {
        return false
      }

      return parseDynamicTransform({
        limits: dynamicDefaults,
        searchParams: args.req.searchParams ?? new URLSearchParams(),
      }).isRouted
    },
    handleRequest: createHandleRequest({
      config,
      delivery: options.delivery ?? 'proxy',
      dynamicDefaults,
      resolveSourceURL: options.sourceURL ?? createResolveSourceURL(),
    }),
    init: (payloadConfig) => {
      assertDynamicCollectionsExist({ config: payloadConfig, dynamicOptions })

      return initCloudinaryCollections({ collections, config: payloadConfig })
    },
    mimeTypes: TRANSFORMABLE_MIME_TYPES,
    [uploadTransformerInternal]: {
      prepareUpload: createPrepareUpload({
        collections,
        config,
        uploadFolder: options.uploadFolder ?? 'payload-transformer-tmp',
      }),
    },
    // `options` here is always what this transformer computed via `prepareUpload`'s
    // `transform` callback; the public contract's `unknown` just reflects that core never inspects it.
    transformFile: transformFile as (args: TransformFileArgs) => Promise<TransformFileResult>,
  }
}

function assertDynamicCollectionsExist({
  config,
  dynamicOptions,
}: {
  config: Config
  dynamicOptions: CloudinaryDynamicOptions | false
}): void {
  if (!dynamicOptions || !dynamicOptions.collections) {
    return
  }

  const invalidSlugs = dynamicOptions.collections.filter(
    (slug) =>
      !config.collections?.some((collection) => collection.slug === slug && collection.upload),
  )

  if (invalidSlugs.length > 0) {
    throw new Error(
      `Invalid \`cloudinaryTransformer({ dynamic: { collections } })\` configuration: not an upload-enabled collection: ${invalidSlugs.map((slug) => `"${slug}"`).join(', ')}.`,
    )
  }
}
