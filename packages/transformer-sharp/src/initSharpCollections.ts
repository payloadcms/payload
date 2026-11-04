import type { Config, SanitizedUploadConfig } from 'payload'

import { registerUploadVariants } from 'payload'

import type { SharpCollectionConfig } from './types.js'

/**
 * Registers the `variants` of `sharpTransformer({ collections })` with `registerUploadVariants`,
 * which checks each collection and size name. Then writes `crop`/`focalPoint`/
 * `hasImageAdjustments` onto each targeted collection's sanitized `upload` config, so core's own
 * field generation and Admin UI keep working without knowing about Sharp.
 */
export function initSharpCollections({
  collections,
  config,
  transformerSlug,
}: {
  collections: Partial<Record<string, SharpCollectionConfig>>
  config: Config
  transformerSlug: string
}): Config {
  const registeredConfig = registerUploadVariants({
    collections,
    config,
    label: 'sharpTransformer',
    transformerSlug,
  })

  // Write onto copies, never the caller's config or collection objects: a rebuilt config (e.g. on
  // a dev reload) would otherwise see `upload.variants` on the collection and reject it as authored.
  const sanitizedCollections = registeredConfig.collections?.map((collection) => {
    const sharpConfig = collections[collection.slug]

    if (!sharpConfig || !collection.upload) {
      return collection
    }

    const authoredUpload = typeof collection.upload === 'object' ? collection.upload : {}

    const upload: Partial<SanitizedUploadConfig> = {
      ...authoredUpload,
      // Sharp's setting wins when given; otherwise keep the collection's own, so an
      // unset Sharp option can't silently re-enable a collection's `crop: false`.
      crop: sharpConfig.crop ?? authoredUpload.crop,
      focalPoint: sharpConfig.focalPoint ?? authoredUpload.focalPoint,
      hasImageAdjustments: Boolean(
        sharpConfig.resizeOptions ||
        sharpConfig.formatOptions ||
        sharpConfig.trimOptions ||
        sharpConfig.constructorOptions ||
        sharpConfig.withMetadata,
      ),
    }

    return { ...collection, upload }
  })

  return { ...registeredConfig, collections: sanitizedCollections }
}
