import type { Config, SanitizedUploadConfig } from 'payload'

import type { SharpCollectionConfig } from './types.js'

const RESERVED_IMAGE_SIZE_NAMES = [
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

/**
 * Validates `sharpTransformer({ collections })` against the config's real
 * collections, then writes a narrowed, Sharp-agnostic projection of
 * `variants`/`crop`/`focalPoint`/`hasImageAdjustments` back onto each
 * targeted collection's sanitized `upload` config, so core's own field
 * generation and Admin UI keep working without knowing about Sharp.
 */
export function initSharpCollections({
  collections,
  config,
}: {
  collections: Partial<Record<string, SharpCollectionConfig>>
  config: Config
}): Config {
  const errors: string[] = []

  for (const [slug, sharpConfig] of Object.entries(collections)) {
    if (!sharpConfig) {
      continue
    }

    const collection = config.collections?.find((candidate) => candidate.slug === slug)

    if (!collection) {
      errors.push(
        `sharpTransformer collections."${slug}" does not match any configured collection slug.`,
      )
      continue
    }

    if (!collection.upload) {
      errors.push(
        `sharpTransformer collections."${slug}" targets a collection whose \`upload\` option is not set. Enable uploads on "${slug}" first.`,
      )
      continue
    }

    const seenSizeNames = new Set<string>()

    for (const size of sharpConfig.variants ?? []) {
      if (typeof size.name !== 'string' || size.name.trim().length === 0) {
        errors.push(
          `sharpTransformer collections."${slug}".variants has an entry missing a valid \`name\`.`,
        )
        continue
      }

      if (seenSizeNames.has(size.name)) {
        errors.push(
          `sharpTransformer collections."${slug}".variants has a duplicate size name: "${size.name}".`,
        )
      }
      seenSizeNames.add(size.name)

      if (RESERVED_IMAGE_SIZE_NAMES.includes(size.name)) {
        errors.push(
          `sharpTransformer collections."${slug}".variants uses reserved name "${size.name}", which collides with a built-in upload field. Choose a different name.`,
        )
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `Invalid \`sharpTransformer({ collections })\` configuration:\n${errors.join('\n')}`,
    )
  }

  // Write onto copies, never the caller's config or collection objects: a rebuilt config (e.g. on
  // a dev reload) would otherwise see `upload.variants` on the collection and reject it as authored.
  const sanitizedCollections = config.collections?.map((collection) => {
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
      variants: sharpConfig.variants?.map(({ name, admin, generateImageName }) => ({
        name,
        admin,
        generateImageName,
      })),
    }

    return { ...collection, upload }
  })

  return { ...config, collections: sanitizedCollections }
}
