import type { Config, SanitizedUploadConfig, UploadTransformer } from 'payload'

import { getUploadTransformerInternal } from 'payload/internal'

import type {
  CloudflareCollectionConfig,
  CloudflareDynamicOptions,
  CloudflareImageSizeOptions,
} from './types.js'

import {
  assertPositiveInteger,
  validateFormatOptions,
  validateOutput,
  validateTransformation,
} from './validation.js'

const RESERVED_NAMES = [
  'filename',
  'mimeType',
  'filesize',
  'width',
  'height',
  'url',
  'thumbnailURL',
  'variants',
  'focalX',
  'focalY',
]

export function initCollections({
  collections,
  config,
  dynamic,
  transformer,
}: {
  collections: Partial<Record<string, CloudflareCollectionConfig>>
  config: Config
  dynamic: CloudflareDynamicOptions | false
  transformer: UploadTransformer
}): Config {
  const assertUploadCollection = ({ slug }: { slug: string }) => {
    if (!config.collections?.some((collection) => collection.slug === slug && collection.upload)) {
      throw new Error(
        `cloudflareTransformer targets an unknown or non-upload collection: "${slug}".`,
      )
    }
  }

  if (dynamic) {
    for (const slug of dynamic.collections ?? []) {
      assertUploadCollection({ slug })
    }
  }
  for (const [slug, options] of Object.entries(collections)) {
    if (!options) {
      continue
    }
    assertUploadCollection({ slug })
    const owners = (config.upload?.transformers ?? []).filter(
      (candidate) =>
        candidate === transformer ||
        getUploadTransformerInternal(candidate)?.handlesCollection?.({ collectionSlug: slug }),
    )

    if (owners.length > 1) {
      throw new Error(
        `Collection "${slug}" has upload settings on more than one transformer. Configure each collection on exactly one instance.`,
      )
    }
    validateFormatOptions({ value: options.formatOptions })
    if (options.resizeOptions) {
      const { withoutEnlargement, ...resize } = options.resizeOptions

      assertBoolean({ name: 'withoutEnlargement', value: withoutEnlargement })
      validateTransformation({ value: resize })
    }
    assertBoolean({ name: 'crop', value: options.crop })
    assertBoolean({ name: 'focalPoint', value: options.focalPoint })
    const names = new Set<string>()

    for (const size of options.variants ?? []) {
      if (
        typeof size.name !== 'string' ||
        !/^[\w-]+$/.test(size.name) ||
        names.has(size.name) ||
        RESERVED_NAMES.includes(size.name)
      ) {
        throw new Error(`Invalid or duplicate Cloudflare variant name: "${size.name}".`)
      }
      names.add(size.name)
      const resize = size as CloudflareImageSizeOptions

      validateTransformation({
        value: {
          fit: resize.fit,
          gravity: resize.gravity,
          height: resize.height,
          width: resize.width,
        },
      })
      validateFormatOptions({ value: resize.formatOptions })
      assertBoolean({ name: 'withoutEnlargement', value: resize.withoutEnlargement })
    }
  }

  return {
    ...config,
    collections: config.collections?.map((collection) => {
      const options = collections[collection.slug]

      if (!options || !collection.upload) {
        return collection
      }
      const authoredUpload = typeof collection.upload === 'object' ? collection.upload : {}
      const upload: Partial<SanitizedUploadConfig> = {
        ...authoredUpload,
        crop: options.crop ?? authoredUpload.crop,
        focalPoint: options.focalPoint ?? authoredUpload.focalPoint,
        hasImageAdjustments: Boolean(options.resizeOptions || options.formatOptions),
        variants: options.variants?.map(({ name, admin, generateImageName }) => ({
          name,
          admin,
          generateImageName,
        })),
      }

      return { ...collection, upload }
    }),
  }
}

export function validateDynamic({ dynamic }: { dynamic: CloudflareDynamicOptions | false }): void {
  if (!dynamic) {
    return
  }
  for (const key of ['maxWidth', 'maxHeight', 'maxPixels'] as const) {
    assertPositiveInteger({ name: key, value: dynamic[key] })
  }
  assertBoolean({ name: 'withoutEnlargement', value: dynamic.withoutEnlargement })
  validateTransformation({ value: { fit: dynamic.fit, gravity: dynamic.gravity } })
  validateOutput({
    value: {
      anim: dynamic.anim,
      format: `image/${dynamic.format ?? 'png'}`,
      quality: dynamic.quality,
    },
  })
}

function assertBoolean({ name, value }: { name: string; value: unknown }): void {
  if (value !== undefined && typeof value !== 'boolean') {
    throw new Error(`Cloudflare ${name} must be a boolean.`)
  }
}
