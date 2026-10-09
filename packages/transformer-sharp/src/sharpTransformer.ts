import type { Config, TransformFileArgs, TransformFileResult, UploadTransformer } from 'payload'
import type { TransformerWithInternalBridge } from 'payload/internal'

import { getUploadTransformerInternal, uploadTransformerInternal } from 'payload/internal'
import bundledSharp from 'sharp'

import type { SharpDynamicDefaults, SharpDynamicOptions, SharpTransformerOptions } from './types.js'

import { createHandleRequest } from './handleRequest.js'
import { initSharpCollections } from './initSharpCollections.js'
import { parseDynamicResize } from './parseDynamicResize.js'
import { createPrepareLegacyUpload } from './prepareLegacyUpload.js'
import { createTransformFile } from './transformFile.js'
import { sharpTransformKeys } from './transformState.js'

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
  const variantSources = new WeakMap<File, File>()
  const transformLimits = {
    maxHeight: options.transformLimits?.maxHeight ?? 4096,
    maxPixels: options.transformLimits?.maxPixels ?? 16_777_216,
    maxWidth: options.transformLimits?.maxWidth ?? 4096,
  }

  if (Object.values(transformLimits).some((value) => !Number.isSafeInteger(value) || value <= 0)) {
    throw new Error('Sharp transformLimits must be positive safe integers.')
  }
  const handlesCollection = ({ collectionSlug }: { collectionSlug: string }) =>
    Boolean(collections[collectionSlug])
  const maxSourceBytes = options.maxSourceBytes ?? 64 * 1024 * 1024

  if (!Number.isSafeInteger(maxSourceBytes) || maxSourceBytes <= 0) {
    throw new Error('Sharp maxSourceBytes must be a positive safe integer.')
  }

  const transformer: TransformerWithInternalBridge & UploadTransformer = {
    slug: options.slug ?? 'sharp',
    canTransform: (args) => {
      if (
        args.doc?.mimeType &&
        !args.doc.mimeType.startsWith('image/') &&
        !args.doc._transforms?.posterFrame
      ) {
        return false
      }
      // Upload-time eligibility is already decided by the MIME match that ran
      // before `canTransform`; only dynamic request routing needs the query.
      if (args.operation === 'upload') {
        return {
          canTransform: true,
          handledTransformKeys: Object.keys(args.doc._transforms ?? {}).filter((key) =>
            sharpTransformKeys.includes(key),
          ),
          options: { collectionUpload: collections[args.collectionSlug] ?? {}, kind: 'main' },
        }
      }

      if (args.purpose === 'persisted-default') {
        const handledTransformKeys = Object.keys(args.doc._transforms ?? {}).filter((key) =>
          sharpTransformKeys.includes(key),
        )

        return handledTransformKeys.length ? { canTransform: true, handledTransformKeys } : false
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
    handleRequest: createHandleRequest({
      collections,
      dynamicDefaults,
      maxSourceBytes,
      sharpDependency,
      transformLimits,
    }),
    init: (config) => {
      assertDynamicCollectionsExist({ config, dynamicOptions })
      assertCollectionsOwnedOnce({ collections, config, transformer })

      return initSharpCollections({ collections, config })
    },
    mimeTypes: DEFAULT_MIME_TYPES,
    [uploadTransformerInternal]: {
      handlesCollection,
      maxSourceBytes,
      prepareUpload: createPrepareLegacyUpload({ collections, sharpDependency, variantSources }),
    },
    // `options` here is always what this transformer computed via `prepareUpload`'s
    // `transform` callback; the public contract's `unknown` just reflects that core never inspects it.
    transformFile: createTransformFile({
      maxSourceBytes,
      sharpDependency,
      transformLimits,
      variantSources,
    }) as (args: TransformFileArgs) => Promise<TransformFileResult>,
  }

  return transformer
}

/**
 * Core drives each upload through a single Sharp instance, so a collection's upload settings
 * split across instances would silently lose all but one of them.
 */
function assertCollectionsOwnedOnce({
  collections,
  config,
  transformer,
}: {
  collections: NonNullable<SharpTransformerOptions['collections']>
  config: Config
  transformer: UploadTransformer
}): void {
  for (const [collectionSlug, collectionConfig] of Object.entries(collections)) {
    if (!collectionConfig) {
      continue
    }

    const owners = (config.upload?.transformers ?? []).filter(
      (candidate) =>
        candidate === transformer ||
        getUploadTransformerInternal(candidate)?.handlesCollection?.({ collectionSlug }),
    )

    if (owners.length > 1) {
      throw new Error(
        `Invalid \`sharpTransformer({ collections })\` configuration: collection "${collectionSlug}" has upload settings on more than one Sharp transformer: ${owners.map((owner) => `"${owner.slug}"`).join(', ')}. Configure each collection on exactly one instance.`,
      )
    }
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
