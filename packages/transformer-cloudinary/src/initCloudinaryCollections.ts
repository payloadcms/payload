import type { Config, SanitizedUploadConfig } from 'payload'

import type { CloudinaryCollectionConfig } from './types.js'

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
 * Validates `cloudinaryTransformer({ collections })` against the config's real
 * collections, then writes a narrowed, Cloudinary-agnostic projection of
 * `variants`/`crop`/`focalPoint`/`hasImageAdjustments` back onto each targeted
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

    for (const size of cloudinaryConfig.variants ?? []) {
      if (typeof size.name !== 'string' || size.name.trim().length === 0) {
        errors.push(
          `cloudinaryTransformer collections."${slug}".variants has an entry missing a valid \`name\`.`,
        )
        continue
      }

      if (seenSizeNames.has(size.name)) {
        errors.push(
          `cloudinaryTransformer collections."${slug}".variants has a duplicate size name: "${size.name}".`,
        )
      }
      seenSizeNames.add(size.name)

      if (RESERVED_IMAGE_SIZE_NAMES.includes(size.name)) {
        errors.push(
          `cloudinaryTransformer collections."${slug}".variants uses reserved name "${size.name}", which collides with a built-in upload field. Choose a different name.`,
        )
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `Invalid \`cloudinaryTransformer({ collections })\` configuration:\n${errors.join('\n')}`,
    )
  }

  // Write onto copies, never the authored collection objects: a rebuilt config (e.g. on a dev
  // reload) would otherwise see `upload.variants` on the collection and reject it as authored.
  config.collections = config.collections!.map((collection) => {
    const cloudinaryConfig = collections[collection.slug]

    if (!cloudinaryConfig || !collection.upload) {
      return collection
    }

    const authoredUpload = typeof collection.upload === 'object' ? collection.upload : {}

    const upload: Partial<SanitizedUploadConfig> = {
      ...authoredUpload,
      // Cloudinary's setting wins when given; otherwise keep the collection's own, so an
      // unset Cloudinary option can't silently re-enable a collection's `crop: false`.
      crop: cloudinaryConfig.crop ?? authoredUpload.crop,
      focalPoint: cloudinaryConfig.focalPoint ?? authoredUpload.focalPoint,
      hasImageAdjustments: Boolean(
        cloudinaryConfig.resizeOptions || cloudinaryConfig.formatOptions,
      ),
      variants: cloudinaryConfig.variants?.map(({ name, admin, generateImageName }) => ({
        name,
        admin,
        generateImageName,
      })),
    }

    return { ...collection, upload }
  })

  return config
}
