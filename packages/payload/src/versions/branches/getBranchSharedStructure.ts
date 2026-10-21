import type { BranchScopeField } from './compileBranchScopeFields.js'

import { hasLocalizedBranchFields } from './hasLocalizedBranchFields.js'

/**
 * Captures compatibility of locale attachments, excluding shared scalar values and row order.
 * A shared label edit or reorder must not force unrelated locale content to be published.
 */
export const getBranchSharedStructure = ({
  data,
  fields,
}: {
  data: Record<string, unknown>
  fields: readonly BranchScopeField[]
}): Record<string, unknown> => {
  const entries: [string, unknown][] = []

  for (const field of fields) {
    if (field.type === 'value' || !Object.hasOwn(data, field.name)) {
      continue
    }

    const hasLocalizedContent =
      field.type === 'blocks'
        ? [...field.blocks.values()].some((fields) => hasLocalizedBranchFields({ fields }))
        : hasLocalizedBranchFields({ fields: field.fields })

    if (!hasLocalizedContent) {
      continue
    }

    const value = data[field.name]

    if (value == null) {
      entries.push([field.name, value])
      continue
    }

    if (field.type === 'group') {
      if (typeof value !== 'object' || Array.isArray(value)) {
        throw new Error(`Invalid shared group structure in field "${field.name}".`)
      }

      entries.push([
        field.name,
        getBranchSharedStructure({ data: value as Record<string, unknown>, fields: field.fields }),
      ])
      continue
    }

    if (!Array.isArray(value)) {
      throw new Error(`Invalid shared row structure in field "${field.name}".`)
    }

    const keys = new Set<string>()
    const rows = value.map((input: unknown) => {
      if (!input || typeof input !== 'object' || Array.isArray(input)) {
        throw new Error(`Invalid shared row in field "${field.name}".`)
      }

      const row = input as Record<string, unknown>
      const id = row.id

      if (
        (typeof id !== 'number' || !Number.isFinite(id)) &&
        (typeof id !== 'string' || !id.length)
      ) {
        throw new Error(`A stable row identity is required in field "${field.name}".`)
      }

      const key = `${typeof id}:${id}`

      if (keys.has(key)) {
        throw new Error(`Duplicate shared row identity in field "${field.name}".`)
      }

      keys.add(key)

      const rowFields =
        field.type === 'blocks' ? field.blocks.get(String(row.blockType)) : field.fields

      if (!rowFields) {
        throw new Error(`Unknown block type in shared structure field "${field.name}".`)
      }

      return {
        key,
        structure: {
          ...getBranchSharedStructure({ data: row, fields: rowFields }),
          id,
          ...(field.type === 'blocks' ? { blockType: row.blockType } : {}),
        },
      }
    })

    rows.sort((left, right) => (left.key < right.key ? -1 : left.key > right.key ? 1 : 0))
    entries.push([field.name, rows.map(({ structure }) => structure)])
  }

  return Object.fromEntries(entries)
}
