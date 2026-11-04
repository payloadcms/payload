import type { Config } from '../config/types.js'
import type { ImageSize, SanitizedUploadConfig } from './types.js'

const RESERVED_VARIANT_NAMES = [
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
 * Registers a transformer's image sizes on upload collections. Call it from a transformer's
 * `init`. It checks each collection and size name, then writes the sizes (name and admin options
 * only) to the collection's sanitized `upload.variants`. Only one transformer can register sizes
 * on a collection. It writes onto copies and never changes the given config.
 *
 * @param transformerSlug The registering transformer's `slug`, saved as the owner of the sizes and
 *   used in error messages. It must match a transformer in `upload.transformers`. Payload writes
 *   size entries with no stored file only when this transformer builds files at request time.
 */
export function registerUploadVariants({
  collections,
  config,
  transformerSlug,
}: {
  collections: Partial<Record<string, { variants?: ImageSize[] }>>
  config: Config
  transformerSlug: string
}): Config {
  const errors: string[] = []

  if (!config.upload?.transformers?.some((transformer) => transformer.slug === transformerSlug)) {
    errors.push(
      `no transformer in \`upload.transformers\` has the slug "${transformerSlug}". Pass the slug of the transformer that registers the variants.`,
    )
  }

  for (const [slug, registration] of Object.entries(collections)) {
    if (!registration) {
      continue
    }

    const collection = config.collections?.find((candidate) => candidate.slug === slug)

    if (!collection) {
      errors.push(`collections."${slug}" does not match any configured collection slug.`)
      continue
    }

    if (!collection.upload) {
      errors.push(
        `collections."${slug}" targets a collection whose \`upload\` option is not set. Enable uploads on "${slug}" first.`,
      )
      continue
    }

    // One owner per collection: an upload transformer such as Sharp builds only its own sizes, so
    // a size another transformer registers would get a field but no entry when Sharp runs.
    if (
      registration.variants?.length &&
      (collection.upload as Partial<SanitizedUploadConfig>).variants?.length
    ) {
      errors.push(
        `collections."${slug}" registers variants, but another transformer already registered variants on "${slug}". Only one transformer can register variants on a collection.`,
      )
      continue
    }

    const seenNames = new Set<string>()

    for (const variant of registration.variants ?? []) {
      if (typeof variant.name !== 'string' || variant.name.trim().length === 0) {
        errors.push(`collections."${slug}".variants has an entry missing a valid \`name\`.`)
        continue
      }

      if (seenNames.has(variant.name)) {
        errors.push(`collections."${slug}".variants has a duplicate size name: "${variant.name}".`)
      }
      seenNames.add(variant.name)

      if (RESERVED_VARIANT_NAMES.includes(variant.name)) {
        errors.push(
          `collections."${slug}".variants uses reserved name "${variant.name}", which collides with a built-in upload field. Choose a different name.`,
        )
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `Invalid upload variants from transformer "${transformerSlug}":\n${errors.join('\n')}`,
    )
  }

  // Write onto copies, never the caller's config or collection objects: a rebuilt config (e.g. on
  // a dev reload) would otherwise see `upload.variants` on the collection and reject it as authored.
  return {
    ...config,
    collections: config.collections?.map((collection) => {
      const variants = collections[collection.slug]?.variants

      if (!variants || !collection.upload) {
        return collection
      }

      const upload = (
        typeof collection.upload === 'object' ? collection.upload : {}
      ) as Partial<SanitizedUploadConfig>

      return {
        ...collection,
        upload: {
          ...upload,
          variants: variants.map(({ name, admin, generateImageName }) => ({
            name,
            admin,
            generateImageName,
          })),
          variantsTransformerSlug: transformerSlug,
        },
      }
    }),
  }
}
