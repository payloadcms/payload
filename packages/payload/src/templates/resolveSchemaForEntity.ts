import type { CollectionConfig, SanitizedCollectionConfig } from '../collections/config/types.js'
import type { Config, SanitizedConfig } from '../config/types.js'
import type { BlocksField, Field } from '../fields/config/types.js'
import type { TemplateEntityType } from './types.js'

type ConfigLike = Config | SanitizedConfig
type CollectionLike = CollectionConfig | SanitizedCollectionConfig

/**
 * Resolve the schema for a templated entity (collection / block / field) so the
 * hash, snapshot, and field-hook walkers operate against the right field tree.
 *
 * Returns the field list and any host context (the collection a block is being
 * applied into, or the host collection of a field-path) so callers can validate
 * apply-time compatibility.
 */
export function resolveSchemaForEntity({
  config,
  entitySlug,
  entityType,
}: {
  config: ConfigLike
  entitySlug: string
  entityType: TemplateEntityType
}): {
  blockSlug?: string
  fields: Field[]
  hostCollection?: CollectionLike
  hostField?: Field
  hostFieldPath?: string
} | null {
  if (entityType === 'collection') {
    const collection = findCollection(config, entitySlug)
    if (!collection) {
      return null
    }
    return { fields: collection.fields, hostCollection: collection }
  }

  if (entityType === 'block') {
    for (const collection of config.collections ?? []) {
      const found = findFirstBlockBySlug(collection.fields, entitySlug)
      if (found) {
        return {
          blockSlug: entitySlug,
          fields: found.fields,
          hostCollection: collection,
        }
      }
    }
    return null
  }

  if (entityType === 'field') {
    const [hostCollectionSlug, ...rest] = entitySlug.split('.')
    const dotPath = rest.join('.')
    if (!hostCollectionSlug || !dotPath) {
      return null
    }
    const collection = findCollection(config, hostCollectionSlug)
    if (!collection) {
      return null
    }
    const field = walkToField(collection.fields, dotPath)
    if (!field) {
      return null
    }
    return {
      fields: extractFieldChildren(field),
      hostCollection: collection,
      hostField: field,
      hostFieldPath: dotPath,
    }
  }

  return null
}

function findCollection(config: ConfigLike, slug: string): CollectionLike | undefined {
  return (config.collections ?? []).find((candidate) => candidate.slug === slug)
}

function findFirstBlockBySlug(fields: Field[], blockSlug: string): { fields: Field[] } | null {
  for (const field of fields) {
    if (field.type === 'blocks' && field.templates) {
      const match = (field.blocks ?? []).find((block) => block.slug === blockSlug)
      if (match) {
        return { fields: match.fields }
      }
    }
    if (field.type === 'array' || field.type === 'group') {
      const inner = findFirstBlockBySlug(field.fields, blockSlug)
      if (inner) {
        return inner
      }
    }
    if (field.type === 'tabs') {
      for (const tab of field.tabs) {
        const inner = findFirstBlockBySlug(tab.fields, blockSlug)
        if (inner) {
          return inner
        }
      }
    }
  }
  return null
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

/**
 * For a tier-3 field template, return the field tree that should drive hashing
 * and hook traversal. For `blocks` and `array` fields we wrap the field itself
 * in a single-element array so `buildSchemaSnapshot` reflects the allowed
 * block list / inner field shape, which is what callers want to detect drift
 * against.
 */
function extractFieldChildren(field: Field): Field[] {
  if (field.type === 'group') {
    return field.fields
  }
  if (field.type === 'array' || field.type === 'blocks') {
    return [field]
  }
  return [field]
}
