import type { FlattenedBlock, FlattenedField } from 'payload'

/**
 * Removes array/block row `id`s from incoming update data when the id does not belong to a row of
 * the locale being updated.
 *
 * Rows of a localized array/blocks field (or one nested inside a localized parent) exist once per
 * locale, keyed by row id. An MCP client that reads a document in one locale and then updates
 * another echoes the first locale's row ids back. Keeping them would store the same row id under
 * two locales — a unique constraint violation on the relational adapters (the update fails with
 * "The following field is invalid: id") and silently duplicated row ids on MongoDB. Ids that do
 * exist in the target locale are kept, so partial row updates still merge with existing row data.
 *
 * `existingDoc` must be the current document in the target locale with fallback disabled; pass
 * `undefined` when there is no reference document (e.g. a bulk update by `where`), which strips
 * every row id inside localized containers.
 *
 * Mutates and returns `data`.
 */
export function stripCrossLocaleRowIDs({
  blocks,
  data,
  existingDoc,
  fields,
  parentIsLocalized = false,
}: {
  blocks?: FlattenedBlock[]
  data: Record<string, unknown>
  existingDoc?: Record<string, unknown>
  fields: FlattenedField[]
  parentIsLocalized?: boolean
}): Record<string, unknown> {
  for (const field of fields) {
    if (!('name' in field) || !field.name) {
      continue
    }

    const value = data[field.name]

    if (value === null || typeof value !== 'object') {
      continue
    }

    const existingValue = existingDoc?.[field.name]
    const isLocalized = parentIsLocalized || Boolean('localized' in field && field.localized)

    switch (field.type) {
      case 'array': {
        if (Array.isArray(value)) {
          stripRowIDs({
            blocks,
            existingRows: existingValue,
            isLocalized,
            resolveFields: () => field.flattenedFields,
            rows: value,
          })
        }
        break
      }

      case 'blocks': {
        if (Array.isArray(value)) {
          stripRowIDs({
            blocks,
            existingRows: existingValue,
            isLocalized,
            resolveFields: (row) => {
              for (const blockOrReference of field.blocks) {
                const block =
                  typeof blockOrReference === 'string'
                    ? blocks?.find(({ slug }) => slug === blockOrReference)
                    : blockOrReference
                if (block && block.slug === row.blockType) {
                  return block.flattenedFields
                }
              }
              return []
            },
            rows: value,
          })
        }
        break
      }

      case 'group':
      case 'tab': {
        if (!Array.isArray(value)) {
          stripCrossLocaleRowIDs({
            blocks,
            data: value as Record<string, unknown>,
            existingDoc:
              existingValue && typeof existingValue === 'object' && !Array.isArray(existingValue)
                ? (existingValue as Record<string, unknown>)
                : undefined,
            fields: field.flattenedFields,
            parentIsLocalized: isLocalized,
          })
        }
        break
      }
    }
  }

  return data
}

/**
 * Strips unknown ids from one set of array/block rows and recurses into each row's nested fields.
 * A row id is unknown when `existingRows` (the target locale's current rows) has no row with it.
 */
const stripRowIDs = ({
  blocks,
  existingRows,
  isLocalized,
  resolveFields,
  rows,
}: {
  blocks?: FlattenedBlock[]
  existingRows: unknown
  isLocalized: boolean
  resolveFields: (row: Record<string, unknown>) => FlattenedField[]
  rows: unknown[]
}): void => {
  for (const row of rows) {
    if (row === null || typeof row !== 'object' || Array.isArray(row)) {
      continue
    }

    const rowData = row as Record<string, unknown>
    const existingRow = Array.isArray(existingRows)
      ? existingRows.find(
          (candidate) =>
            candidate !== null &&
            typeof candidate === 'object' &&
            'id' in candidate &&
            rowData.id !== undefined &&
            (candidate as Record<string, unknown>).id === rowData.id,
        )
      : undefined

    if (isLocalized && rowData.id !== undefined && !existingRow) {
      delete rowData.id
    }

    stripCrossLocaleRowIDs({
      blocks,
      data: rowData,
      existingDoc: existingRow as Record<string, unknown> | undefined,
      fields: resolveFields(rowData),
      parentIsLocalized: isLocalized,
    })
  }
}

/**
 * Whether any array/blocks field of the entity stores per-locale rows — i.e. is localized itself or
 * sits inside a localized group/tab/array/blocks. Only then can incoming row ids collide across
 * locales, so callers skip the reference-document fetch entirely otherwise.
 */
export function entityHasLocalizedRowContainers({
  blocks,
  fields,
  parentIsLocalized = false,
}: {
  blocks?: FlattenedBlock[]
  fields: FlattenedField[]
  parentIsLocalized?: boolean
}): boolean {
  return fields.some((field) => {
    const isLocalized = parentIsLocalized || Boolean('localized' in field && field.localized)

    switch (field.type) {
      case 'array': {
        return (
          isLocalized ||
          entityHasLocalizedRowContainers({
            blocks,
            fields: field.flattenedFields,
            parentIsLocalized: isLocalized,
          })
        )
      }
      case 'blocks': {
        return (
          isLocalized ||
          field.blocks.some((blockOrReference) => {
            const block =
              typeof blockOrReference === 'string'
                ? blocks?.find(({ slug }) => slug === blockOrReference)
                : blockOrReference
            return (
              block &&
              entityHasLocalizedRowContainers({
                blocks,
                fields: block.flattenedFields,
                parentIsLocalized: isLocalized,
              })
            )
          })
        )
      }
      case 'group':
      case 'tab': {
        return entityHasLocalizedRowContainers({
          blocks,
          fields: field.flattenedFields,
          parentIsLocalized: isLocalized,
        })
      }
      default: {
        return false
      }
    }
  })
}
