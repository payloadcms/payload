import type { Config } from 'payload'

import type { SharpCollectionConfig } from './types.js'

const RESERVED_IMAGE_SIZE_NAMES = [
  'filename',
  'mimeType',
  'filesize',
  'width',
  'height',
  'url',
  'thumbnailURL',
  'sizes',
  'focalX',
  'focalY',
]

/**
 * Validates `sharpTransformer({ collections })` against the config's real
 * collections, then writes a narrowed, Sharp-agnostic projection of
 * `imageSizes`/`crop`/`focalPoint`/`hasImageAdjustments` back onto each
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

    for (const size of sharpConfig.imageSizes ?? []) {
      if (typeof size.name !== 'string' || size.name.trim().length === 0) {
        errors.push(
          `sharpTransformer collections."${slug}".imageSizes has an entry missing a valid \`name\`.`,
        )
        continue
      }

      if (seenSizeNames.has(size.name)) {
        errors.push(
          `sharpTransformer collections."${slug}".imageSizes has a duplicate size name: "${size.name}".`,
        )
      }
      seenSizeNames.add(size.name)

      if (RESERVED_IMAGE_SIZE_NAMES.includes(size.name)) {
        errors.push(
          `sharpTransformer collections."${slug}".imageSizes uses reserved name "${size.name}", which collides with a built-in upload field. Choose a different name.`,
        )
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `Invalid \`sharpTransformer({ collections })\` configuration:\n${errors.join('\n')}`,
    )
  }

  for (const [slug, sharpConfig] of Object.entries(collections)) {
    if (!sharpConfig) {
      continue
    }

    const collection = config.collections!.find((candidate) => candidate.slug === slug)!

    if (collection.upload === true) {
      collection.upload = {}
    }

    if (typeof collection.upload !== 'object') {
      continue
    }

    collection.upload.imageSizes = sharpConfig.imageSizes?.map(
      ({ name, admin, generateImageName }) => ({ name, admin, generateImageName }),
    )
    collection.upload.crop = sharpConfig.crop
    collection.upload.focalPoint = sharpConfig.focalPoint
    collection.upload.hasImageAdjustments = Boolean(
      sharpConfig.resizeOptions ||
        sharpConfig.formatOptions ||
        sharpConfig.trimOptions ||
        sharpConfig.constructorOptions ||
        sharpConfig.withMetadata,
    )
  }

  return config
}
