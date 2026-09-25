import type { Config, TransformFileArgs, TransformFileResult, UploadTransformer } from 'payload'
import type { TransformerWithInternalBridge } from 'payload/internal'

import { uploadTransformerInternal } from 'payload/internal'
import bundledSharp from 'sharp'

import type { SharpDynamicDefaults, SharpDynamicOptions, SharpTransformerOptions } from './types.js'

import { createHandleRequest } from './handleRequest.js'
import { initSharpCollections } from './initSharpCollections.js'
import { parseDynamicResize } from './parseDynamicResize.js'
import { createPrepareLegacyUpload } from './prepareLegacyUpload.js'
import { createTransformFile } from './transformFile.js'

const DEFAULT_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/tiff',
  'image/avif',
]

export function resolveSharpDynamicDefaults(
  overrides?: SharpDynamicDefaults,
): Required<SharpDynamicDefaults> {
  return {
    fit: overrides?.fit ?? 'cover',
    maxHeight: overrides?.maxHeight ?? 4096,
    maxPixels: overrides?.maxPixels ?? 16_777_216,
    maxWidth: overrides?.maxWidth ?? 4096,
    position: overrides?.position ?? 'center',
    withoutEnlargement: overrides?.withoutEnlargement ?? false,
  }
}

/**
 * Normalizes the `dynamic` option: `false`/omitted disables request-time
 * resizing, `true` enables it with defaults for every upload collection.
 */
function resolveSharpDynamicOptions(
  dynamic: SharpTransformerOptions['dynamic'],
): false | SharpDynamicOptions {
  if (!dynamic) {
    return false
  }

  return dynamic === true ? {} : dynamic
}

/**
 * Payload's official Sharp-based file transformer: upload-time image processing,
 * plus opt-in (`dynamic`) request-time width/height/`withoutEnlargement` resizing.
 */
export function sharpTransformer(
  options: SharpTransformerOptions = {},
): TransformerWithInternalBridge & UploadTransformer {
  const dynamicOptions = resolveSharpDynamicOptions(options.dynamic)
  const dynamicDefaults = resolveSharpDynamicDefaults(dynamicOptions || undefined)
  const sharpDependency = options.sharp ?? bundledSharp
  const collections = options.collections ?? {}

  return {
    slug: options.slug ?? 'sharp',
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

      const result = parseDynamicResize({
        limits: dynamicDefaults,
        searchParams: args.req.searchParams ?? new URLSearchParams(),
      })

      return result.isRouted
    },
    handleRequest: createHandleRequest({ dynamicDefaults, sharpDependency }),
    init: (config) => {
      assertDynamicCollectionsExist({ config, dynamicOptions })

      return initSharpCollections({ collections, config })
    },
    mimeTypes: DEFAULT_MIME_TYPES,
    [uploadTransformerInternal]: {
      prepareUpload: createPrepareLegacyUpload({ collections, sharpDependency }),
    },
    // `options` here is always what this transformer computed via `prepareUpload`'s
    // `transform` callback; the public contract's `unknown` just reflects that core never inspects it.
    transformFile: createTransformFile({ sharpDependency }) as (
      args: TransformFileArgs,
    ) => Promise<TransformFileResult>,
  }
}

function assertDynamicCollectionsExist({
  config,
  dynamicOptions,
}: {
  config: Config
  dynamicOptions: false | SharpDynamicOptions
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
      `Invalid \`sharpTransformer({ dynamic: { collections } })\` configuration: not an upload-enabled collection: ${invalidSlugs.map((slug) => `"${slug}"`).join(', ')}.`,
    )
  }
}
