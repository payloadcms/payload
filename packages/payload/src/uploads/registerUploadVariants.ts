import type { Config } from '../config/types.js'
import type { UploadTransformer } from './transformers/types.js'
import type { ImageSize, SanitizedUploadConfig, VariantsOwner } from './types.js'

import { mimePatternsOverlap } from './mimePatternsOverlap.js'
import { getUploadTransformerInternal } from './transformers/uploadTransformerBridge.js'

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
 * Registers a transformer's variants on upload collections. Call it from a transformer's `init`.
 * Several transformers can register variants on one collection. A variant name can have only one
 * owner for each MIME type, and a MIME type that has an upload-bridge owner can have no other
 * owner. Two owners of one name must give it the same `admin` and `generateImageName` options. It
 * writes onto copies and never changes the given config.
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

  const transformers = config.upload?.transformers ?? []
  const transformer = transformers.find((candidate) => candidate.slug === transformerSlug)

  if (!transformer) {
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

    if (registration.variants?.length && transformer) {
      errors.push(
        ...getOwnerErrors({
          collectionSlug: slug,
          existingUpload: collection.upload as Partial<SanitizedUploadConfig>,
          transformer,
          transformers,
          variants: registration.variants,
        }),
      )
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

      if (/[/\\]|\.\./.test(variant.name)) {
        errors.push(
          `collections."${slug}".variants uses name "${variant.name}", which contains a path separator or "..". Size names are part of file names.`,
        )
      }

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

      if (!variants?.length || !collection.upload) {
        return collection
      }

      const upload = (
        typeof collection.upload === 'object' ? collection.upload : {}
      ) as Partial<SanitizedUploadConfig>

      const existingNames = new Set((upload.variants ?? []).map(({ name }) => name))
      const owner: VariantsOwner = {
        slug: transformerSlug,
        mimeTypes: transformer!.mimeTypes,
        variantNames: variants.map(({ name }) => name),
      }

      return {
        ...collection,
        upload: {
          ...upload,
          variantOwners: [...(upload.variantOwners ?? []), owner],
          variants: [
            ...(upload.variants ?? []),
            ...variants
              .filter(({ name }) => !existingNames.has(name))
              .map(({ name, admin, generateImageName }) => ({ name, admin, generateImageName })),
          ],
        },
      }
    }),
  }
}

/** The errors for a new owner that joins the owners already on a collection. */
function getOwnerErrors({
  collectionSlug,
  existingUpload,
  transformer,
  transformers,
  variants,
}: {
  collectionSlug: string
  existingUpload: Partial<SanitizedUploadConfig>
  transformer: UploadTransformer
  transformers: UploadTransformer[]
  variants: ImageSize[]
}): string[] {
  const errors: string[] = []

  for (const owner of existingUpload.variantOwners ?? []) {
    if (owner.slug === transformer.slug) {
      errors.push(
        `collections."${collectionSlug}": "${transformer.slug}" already registered variants on "${collectionSlug}".`,
      )
      continue
    }

    const sharedPattern = getSharedPattern({ a: transformer.mimeTypes, b: owner.mimeTypes })
    const ownerTransformer = transformers.find((candidate) => candidate.slug === owner.slug)
    const bridgeSlug = [transformer, ownerTransformer].find((candidate) =>
      Boolean(candidate && getUploadTransformerInternal(candidate)?.transformUpload),
    )?.slug

    if (sharedPattern && bridgeSlug) {
      errors.push(
        `collections."${collectionSlug}": "${transformer.slug}" and "${owner.slug}" both make variants for "${sharedPattern}", and "${bridgeSlug}" uses the upload bridge. A MIME type with a bridge owner can have no other owner.`,
      )
      continue
    }

    for (const variant of variants) {
      if (!owner.variantNames.includes(variant.name)) {
        continue
      }

      if (sharedPattern) {
        errors.push(
          `collections."${collectionSlug}".variants."${variant.name}": "${transformer.slug}" and "${owner.slug}" both make it for "${sharedPattern}". A variant name can have only one owner for each MIME type.`,
        )
      }

      const existing = existingUpload.variants?.find(({ name }) => name === variant.name)

      if (
        existing &&
        (!areSameAdminOptions({ a: existing.admin, b: variant.admin }) ||
          existing.generateImageName !== variant.generateImageName)
      ) {
        errors.push(
          `collections."${collectionSlug}".variants."${variant.name}" has different \`admin\` or \`generateImageName\` options in "${owner.slug}" and "${transformer.slug}". Give the shared name the same options.`,
        )
      }
    }
  }

  return errors
}

/**
 * Whether two `admin` options are the same, whatever the order of their keys. A missing value and
 * an empty object are the same, as are a key set to `undefined` and a missing key.
 */
function areSameAdminOptions({ a, b }: { a: unknown; b: unknown }): boolean {
  const isAObject = isPlainObject(a)
  const isBObject = isPlainObject(b)

  if (!isAObject && !isBObject) {
    return a === b
  }

  if ((!isAObject && a !== undefined) || (!isBObject && b !== undefined)) {
    return false
  }

  const aObject = isAObject ? a : {}
  const bObject = isBObject ? b : {}
  const keys = new Set([...Object.keys(aObject), ...Object.keys(bObject)])

  return [...keys].every((key) => areSameAdminOptions({ a: aObject[key], b: bObject[key] }))
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** The first pattern in `a` that one MIME type can match together with a pattern in `b`. */
function getSharedPattern({ a, b }: { a: string[]; b: string[] }): string | undefined {
  return a.find((pattern) => b.some((other) => mimePatternsOverlap({ a: pattern, b: other })))
}
