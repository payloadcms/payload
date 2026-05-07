import type { CollectionConfig, SanitizedCollectionConfig } from '../collections/config/types.js'
import type { Config, SanitizedConfig } from '../config/types.js'
import type { ArrayField, BlocksField, Field } from '../fields/config/types.js'

type ConfigLike = Config | SanitizedConfig
type CollectionConfigLike = CollectionConfig | SanitizedCollectionConfig

/**
 * True if the named collection has opted in to the Templates API.
 */
export function isCollectionOptedIn(slug: string, config: ConfigLike): boolean {
  const collection = findCollection(slug, config)
  return Boolean(collection?.templates)
}

/**
 * Returns the slugs of every collection that has opted in to templates.
 */
export function getOptedInCollectionSlugs(config: ConfigLike): string[] {
  return (config.collections ?? [])
    .filter((collection) => collection.templates)
    .map((collection) => collection.slug)
}

/**
 * True if a `blocks` or `array` field at the given dot-path on the host collection
 * has opted in to field-level templates (tier 3).
 *
 * `dotPath` is the field path within the collection (e.g. `'layout'` or `'sections.0.items'`).
 * Numeric path segments (array indexes) are skipped during the walk.
 */
export function isFieldOptedIn(
  hostCollectionSlug: string,
  dotPath: string,
  config: ConfigLike,
): boolean {
  const collection = findCollection(hostCollectionSlug, config)
  if (!collection) {
    return false
  }

  const field = walkToField(collection.fields, dotPath)
  if (!field) {
    return false
  }

  if (field.type === 'blocks' || field.type === 'array') {
    return Boolean(field.templates)
  }

  return false
}

/**
 * True if the named block slug appears in any opted-in `blocks` field across
 * the config's collections. Used to gate tier-2 (block) templates.
 */
export function isBlockSlugOptedIn(blockSlug: string, config: ConfigLike): boolean {
  for (const collection of config.collections ?? []) {
    if (!collection.templates) {
      continue
    }

    if (findOptedInBlock(collection.fields, blockSlug)) {
      return true
    }
  }
  return false
}

function findCollection(slug: string, config: ConfigLike): CollectionConfigLike | undefined {
  return (config.collections ?? []).find((collection) => collection.slug === slug)
}

function walkToField(fields: Field[], dotPath: string): Field | undefined {
  const segments = dotPath.split('.').filter((segment) => !/^\d+$/.test(segment))

  let cursor: Field[] | undefined = fields
  let result: Field | undefined

  for (const segment of segments) {
    if (!cursor) {
      return undefined
    }

    result = cursor.find((field) => 'name' in field && field.name === segment)
    if (!result) {
      return undefined
    }

    if (result.type === 'array' || result.type === 'group') {
      cursor = result.fields
    } else if (result.type === 'blocks') {
      cursor = undefined
    } else {
      cursor = undefined
    }
  }

  return result
}

function findOptedInBlock(fields: Field[], blockSlug: string): boolean {
  for (const field of fields) {
    if (field.type === 'blocks' && field.templates) {
      if ((field.blocks ?? []).some((block) => block.slug === blockSlug)) {
        return true
      }
    }

    if (field.type === 'array' || field.type === 'group') {
      if (findOptedInBlock(field.fields, blockSlug)) {
        return true
      }
    }
  }
  return false
}
