import type { Config } from 'payload'

import type { CloudinaryCollectionConfig } from './types.js'

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
 * Validates `cloudinaryTransformer({ collections })` against the config's real
 * collections, then writes a narrowed, Cloudinary-agnostic projection of
 * `imageSizes`/`crop`/`focalPoint`/`hasImageAdjustments` back onto each targeted
 * collection's sanitized `upload` config, so core's own field generation and
 * Admin UI keep working without knowing about Cloudinary.
 */
export function initCloudinaryCollections({
  collections,
  config,
}: {
  collections: Partial<Record<string, CloudinaryCollectionConfig>>
  config: Config
}): Config {
  const errors: string[] = []

  for (const [slug, cloudinaryConfig] of Object.entries(collections)) {
    if (!cloudinaryConfig) {
      continue
    }

    const collection = config.collections?.find((candidate) => candidate.slug === slug)

    if (!collection) {
      errors.push(
        `cloudinaryTransformer collections."${slug}" does not match any configured collection slug.`,
      )
      continue
    }

    if (!collection.upload) {
      errors.push(
        `cloudinaryTransformer collections."${slug}" targets a collection whose \`upload\` option is not set. Enable uploads on "${slug}" first.`,
      )
      continue
    }

    const seenSizeNames = new Set<string>()

    for (const size of cloudinaryConfig.imageSizes ?? []) {
      if (typeof size.name !== 'string' || size.name.trim().length === 0) {
        errors.push(
          `cloudinaryTransformer collections."${slug}".imageSizes has an entry missing a valid \`name\`.`,
        )
        continue
      }

      if (seenSizeNames.has(size.name)) {
        errors.push(
          `cloudinaryTransformer collections."${slug}".imageSizes has a duplicate size name: "${size.name}".`,
        )
      }
      seenSizeNames.add(size.name)

      if (RESERVED_IMAGE_SIZE_NAMES.includes(size.name)) {
        errors.push(
          `cloudinaryTransformer collections."${slug}".imageSizes uses reserved name "${size.name}", which collides with a built-in upload field. Choose a different name.`,
        )
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `Invalid \`cloudinaryTransformer({ collections })\` configuration:\n${errors.join('\n')}`,
    )
  }

  for (const [slug, cloudinaryConfig] of Object.entries(collections)) {
    if (!cloudinaryConfig) {
      continue
    }

    const collection = config.collections!.find((candidate) => candidate.slug === slug)!

    if (collection.upload === true) {
      collection.upload = {}
    }

    if (typeof collection.upload !== 'object') {
      continue
    }

    collection.upload.imageSizes = cloudinaryConfig.imageSizes?.map(
      ({ name, admin, generateImageName }) => ({ name, admin, generateImageName }),
    )
    collection.upload.crop = cloudinaryConfig.crop
    collection.upload.focalPoint = cloudinaryConfig.focalPoint
    collection.upload.hasImageAdjustments = Boolean(
      cloudinaryConfig.resizeOptions || cloudinaryConfig.formatOptions,
    )
  }

  return config
}
