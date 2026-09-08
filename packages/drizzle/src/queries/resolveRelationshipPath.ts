import type { FlattenedField, RelationshipField, UploadField } from 'payload'

import type { DrizzleAdapter } from '../types.js'

type ResolvedRelationshipPath = {
  field: RelationshipField | UploadField
  isLocalized: boolean
  locale?: string
  path: string
}

/**
 * Adds a field to the path used by Drizzle's shared relationship, text, and number tables.
 * Array and block entries are stored with a numeric position, represented by `%` while querying.
 *
 * @example `blocks` becomes `blocks.%` and then `directors` becomes
 * `blocks.%.directors`.
 */
export function appendFieldToStoragePath({
  field,
  path = '',
}: {
  field: FlattenedField
  path?: string
}): string {
  const pathSegments = path ? [path.replace(/\.$/, ''), field.name] : [field.name]

  if (field.type === 'array' || field.type === 'blocks') {
    pathSegments.push('%')
  }

  return pathSegments.join('.')
}

/**
 * Resolves a schema path to the relationship field and the path stored in the collection's shared
 * relationships table. This understands groups, tabs, arrays, blocks, and explicit locale
 * segments.
 *
 * @example `blocks.directors` resolves to the stored path `blocks.%.directors`.
 */
export function resolveRelationshipPath({
  adapter,
  fields,
  locale,
  parentIsLocalized,
  path,
  pathPrefix = '',
}: {
  adapter: DrizzleAdapter
  fields: FlattenedField[]
  locale?: string
  parentIsLocalized: boolean
  path: string
  pathPrefix?: string
}): null | ResolvedRelationshipPath {
  const localeCodes = adapter.payload.config.localization
    ? adapter.payload.config.localization.localeCodes
    : []
  const pathSegments = path.split('.')
  let currentField: FlattenedField | undefined
  let currentFields = fields
  let isLocalized = parentIsLocalized
  let resolvedPath = pathPrefix

  for (const segment of pathSegments) {
    const field = currentFields.find(({ name }) => name === segment)

    if (!field && isLocalized && localeCodes.includes(segment)) {
      locale = segment
      continue
    }

    if (!field) {
      return null
    }

    currentField = field
    resolvedPath = appendFieldToStoragePath({ field, path: resolvedPath })
    isLocalized = isLocalized || Boolean(field.localized)

    if ('flattenedFields' in field) {
      currentFields = field.flattenedFields
    } else if (field.type === 'blocks') {
      currentFields = field.blocks.flatMap((block) =>
        typeof block === 'string'
          ? adapter.payload.blocks[block].flattenedFields
          : block.flattenedFields,
      )
    } else {
      currentFields = []
    }
  }

  if (!currentField || (currentField.type !== 'relationship' && currentField.type !== 'upload')) {
    return null
  }

  return {
    field: currentField,
    isLocalized,
    locale,
    path: resolvedPath,
  }
}
