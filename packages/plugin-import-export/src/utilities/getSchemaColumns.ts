import type { SanitizedCollectionConfig } from 'payload'

import { getFlattenedFieldKeys } from './getFlattenedFieldKeys.js'

export type GetSchemaColumnsArgs = {
  /**
   * The collection configuration to derive columns from
   */
  collectionConfig: SanitizedCollectionConfig
  /**
   * Array of disabled field paths from plugin config
   */
  disabledFields?: string[]
  /**
   * User-selected fields to export. If provided, only these fields (and their nested fields) will be included.
   */
  fields?: string[]
  /**
   * The locale to export. When 'all', localized fields are expanded to include all locale suffixes.
   */
  locale?: null | string
  /**
   * Available locale codes from config. Required when locale='all'.
   */
  localeCodes?: string[]
  /**
   * Set of auto-generated timezone companion field names (from collectTimezoneCompanionFields).
   * These fields are excluded unless explicitly selected.
   * If not provided, no timezone filtering is applied.
   */
  timezoneCompanionFields?: Set<string>
}

/**
 * Derives CSV column names from the collection schema.
 * This provides a base set of columns from field definitions.
 *
 * Note: For arrays/blocks with multiple items, the schema only generates index 0.
 * Additional indices from actual data should be merged with these columns.
 *
 * Benefits:
 * - Provides consistent base columns
 * - Works for empty exports
 * - Ensures proper column ordering
 */
export const getSchemaColumns = ({
  collectionConfig,
  disabledFields = [],
  fields: selectedFields,
  locale,
  localeCodes,
  timezoneCompanionFields,
}: GetSchemaColumnsArgs): string[] => {
  const hasVersions = Boolean(collectionConfig.versions)

  // Determine if we need locale expansion
  const expandLocales = locale === 'all' && localeCodes && localeCodes.length > 0

  // Get all possible columns from schema (excludes system fields like id, createdAt, updatedAt)
  let schemaColumns = getFlattenedFieldKeys(
    collectionConfig.flattenedFields,
    '',
    expandLocales ? { localeCodes } : {},
  )

  // Add system fields that aren't in flattenedFields
  const systemFields = ['id', 'createdAt', 'updatedAt']
  schemaColumns = [...systemFields, ...schemaColumns]

  // Filter to user-selected fields if specified
  if (selectedFields && selectedFields.length > 0) {
    schemaColumns = filterToSelectedFields(schemaColumns, selectedFields, timezoneCompanionFields)
  }

  // Remove disabled fields
  if (disabledFields.length > 0) {
    const disabledSet = new Set<string>()
    for (const path of disabledFields) {
      // Convert dot notation to underscore and add to set
      disabledSet.add(path.replace(/\./g, '_'))
    }
    schemaColumns = schemaColumns.filter((col) => {
      // Check if column matches any disabled path
      for (const disabled of disabledSet) {
        if (col === disabled || col.startsWith(`${disabled}_`)) {
          return false
        }
      }
      return true
    })
  }

  // When user has selected specific fields, preserve their ordering
  // filterToSelectedFields() already returns columns in user's specified order
  if (selectedFields && selectedFields.length > 0) {
    return schemaColumns
  }

  // No fields selected - apply default ordering (id first, timestamps last)
  const orderedColumns: string[] = []

  // 1. ID always first
  if (schemaColumns.includes('id')) {
    orderedColumns.push('id')
  }

  // 2. Status field for versioned collections
  if (hasVersions) {
    orderedColumns.push('_status')
  }

  // 3. All other fields (excluding id, timestamps, status)
  const excludeFromMiddle = new Set(['_status', 'createdAt', 'id', 'updatedAt'])
  for (const col of schemaColumns) {
    if (!excludeFromMiddle.has(col)) {
      orderedColumns.push(col)
    }
  }

  // 4. Timestamps at the end
  if (schemaColumns.includes('createdAt')) {
    orderedColumns.push('createdAt')
  }
  if (schemaColumns.includes('updatedAt')) {
    orderedColumns.push('updatedAt')
  }

  return orderedColumns
}

/**
 * Merges schema-derived columns with data-discovered columns.
 * Schema columns provide the base ordering, data columns add any additional
 * columns (e.g., array indices beyond 0, dynamic fields, derived columns from toCSV).
 */
export const mergeColumns = (schemaColumns: string[], dataColumns: string[]): string[] => {
  const result = [...schemaColumns]
  const schemaSet = new Set(schemaColumns)
  const insertedDerived = new Map<string, string[]>()

  // Add any data columns not in schema (preserves schema ordering, appends new ones)
  for (const col of dataColumns) {
    if (!schemaSet.has(col)) {
      let inserted = false

      // Check if this is a derived column from a schema column (e.g., field_id, field_email)
      // Pattern: schemaCol_suffix where suffix is NOT a number (array indices are handled separately)
      for (const schemaCol of schemaColumns) {
        if (col.startsWith(`${schemaCol}_`)) {
          const suffix = col.slice(schemaCol.length + 1)
          // Skip if suffix starts with a digit (array index pattern like field_0_*)
          if (!/^\d/.test(suffix)) {
            const baseIdx = result.indexOf(schemaCol)
            if (baseIdx !== -1) {
              const derivedList = insertedDerived.get(schemaCol) || []
              const insertIdx = baseIdx + 1 + derivedList.length
              result.splice(insertIdx, 0, col)
              derivedList.push(col)
              insertedDerived.set(schemaCol, derivedList)
              schemaSet.add(col)
              inserted = true
              break
            }
          }
        }
      }

      if (!inserted) {
        // Check for array indices (e.g., field_1_*), insert after field_0_*
        const match = col.match(/^(.+?)_(\d+)(_.*)?$/)
        if (match) {
          const [, basePath, index, suffix] = match
          if (basePath && index) {
            const prevIndex = parseInt(index, 10) - 1
            const prevCol = `${basePath}_${prevIndex}${suffix ?? ''}`
            const prevIdx = result.indexOf(prevCol)
            if (prevIdx !== -1) {
              // Insert after the previous index column
              result.splice(prevIdx + 1, 0, col)
              schemaSet.add(col)
              continue
            }
          }
        }

        // Otherwise append at the end (before timestamps)
        const createdAtIdx = result.indexOf('createdAt')
        if (createdAtIdx !== -1) {
          result.splice(createdAtIdx, 0, col)
        } else {
          result.push(col)
        }
        schemaSet.add(col)
      }
    }
  }

  // Remove schema columns that were fully replaced by toCSV-derived columns (e.g. "user" → "user_id", "user_email")
  for (const [schemaCol, derivedCols] of insertedDerived) {
    if (!dataColumns.includes(schemaCol) && derivedCols.length > 0) {
      const idx = result.indexOf(schemaCol)
      if (idx !== -1) {
        result.splice(idx, 1)
      }
    }
  }

  return result
}

/**
 * Filters schema columns to only include those matching user-selected fields.
 * Preserves the order specified by the user in selectedFields.
 * Handles nested field selection (e.g., 'group.value' includes 'group_value' and 'group_value_*')
 */
function filterToSelectedFields(
  columns: string[],
  selectedFields: string[],
  timezoneCompanionFields?: Set<string>,
): string[] {
  const result: string[] = []
  const columnsSet = new Set(columns)

  // Convert selected fields to underscore notation patterns
  const patterns = selectedFields.map((field) => {
    const underscored = field.replace(/\./g, '_')
    return {
      exact: underscored,
      original: field,
      prefix: `${underscored}_`,
    }
  })

  // Track which timezone companion fields were explicitly selected
  const explicitlySelectedTzFields = new Set(
    selectedFields
      .filter((f) => {
        const underscored = f.replace(/\./g, '_')
        return timezoneCompanionFields?.has(underscored)
      })
      .map((f) => f.replace(/\./g, '_')),
  )

  // Iterate through user-specified fields in order to preserve their ordering
  for (const pattern of patterns) {
    // First add the exact match if it exists and not already added
    // (it may have been added as a nested field of a previous pattern)
    if (columnsSet.has(pattern.exact) && !result.includes(pattern.exact)) {
      result.push(pattern.exact)
    }

    // Then add any columns with the prefix (nested fields)
    for (const column of columns) {
      if (column !== pattern.exact && column.startsWith(pattern.prefix)) {
        // Skip auto-generated timezone companion fields unless explicitly selected
        if (timezoneCompanionFields?.has(column) && !explicitlySelectedTzFields.has(column)) {
          continue
        }
        if (!result.includes(column)) {
          result.push(column)
        }
      }
    }
  }

  return result
}
