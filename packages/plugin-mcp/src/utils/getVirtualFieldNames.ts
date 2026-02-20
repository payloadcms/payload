import type { SanitizedConfig } from 'payload'

import { fieldIsVirtual } from 'payload/shared'

/**
 * Returns the names of all top-level virtual fields for a given collection slug.
 */
export function getCollectionVirtualFieldNames(config: SanitizedConfig, slug: string): string[] {
  const collection = config.collections.find((c) => c.slug === slug)

  if (!collection) {
    return []
  }

  return collection.flattenedFields
    .filter((field) => 'name' in field && fieldIsVirtual(field))
    .map((field) => (field as { name: string }).name)
}

/**
 * Returns the names of all top-level virtual fields for a given global slug.
 */
export function getGlobalVirtualFieldNames(config: SanitizedConfig, slug: string): string[] {
  const global = config.globals.find((g) => g.slug === slug)

  if (!global) {
    return []
  }

  return global.flattenedFields
    .filter((field) => 'name' in field && fieldIsVirtual(field))
    .map((field) => (field as { name: string }).name)
}

/**
 * Strips virtual field values from a data object given a list of virtual field names.
 */
export function stripVirtualFields(
  data: Record<string, unknown>,
  virtualFieldNames: string[],
): Record<string, unknown> {
  if (virtualFieldNames.length === 0) {
    return data
  }

  const stripped = { ...data }

  for (const name of virtualFieldNames) {
    delete stripped[name]
  }

  return stripped
}
