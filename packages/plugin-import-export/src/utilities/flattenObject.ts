import type { Document } from 'payload'

import type { ToCSVFunction } from '../types.js'

import { fieldToRegex } from './fieldToRegex.js'

type Args = {
  doc: Document
  fields?: string[]
  prefix?: string
  /**
   * Set of auto-generated timezone companion field names (from collectTimezoneCompanionFields).
   * These fields are excluded unless explicitly selected.
   * If not provided, no timezone filtering is applied.
   */
  timezoneCompanionFields?: Set<string>
  toCSVFunctions: Record<string, ToCSVFunction>
}

export const flattenObject = ({
  doc,
  fields,
  prefix,
  timezoneCompanionFields,
  toCSVFunctions,
}: Args): Record<string, unknown> => {
  const row: Record<string, unknown> = {}

  // Helper to get toCSV function by full path or base field name
  // This allows functions registered for field names (e.g., 'richText') to work
  // even when the field is nested in arrays/blocks (e.g., 'blocks_0_content_richText')
  const getToCSVFunction = (fullPath: string, baseFieldName: string): ToCSVFunction | undefined => {
    return toCSVFunctions?.[fullPath] ?? toCSVFunctions?.[baseFieldName]
  }

  const flatten = (siblingDoc: Document, prefix?: string) => {
    Object.entries(siblingDoc).forEach(([key, value]) => {
      const newKey = prefix ? `${prefix}_${key}` : key
      const toCSVFn = getToCSVFunction(newKey, key)

      if (Array.isArray(value)) {
        // If a custom toCSV function exists for this array field, run it first.
        // If it produces output, skip per-item handling; otherwise, fall back.
        if (toCSVFn) {
          try {
            const result = toCSVFn({
              columnName: newKey,
              data: row,
              doc,
              row,
              siblingDoc,
              value, // whole array
            })

            if (typeof result !== 'undefined') {
              // Custom function returned a single value for this array field.
              row[newKey] = result
              return
            }

            // If the custom function wrote any keys for this field, consider it handled.
            for (const k in row) {
              if (k === newKey || k.startsWith(`${newKey}_`)) {
                return
              }
            }
            // Otherwise, fall through to per-item handling.
          } catch (error) {
            throw new Error(
              `Error in toCSVFunction for array "${newKey}": ${JSON.stringify(value)}\n${
                (error as Error).message
              }`,
            )
          }
        }

        value.forEach((item, index) => {
          if (typeof item === 'object' && item !== null) {
            const blockType = typeof item.blockType === 'string' ? item.blockType : undefined
            const itemPrefix = blockType ? `${newKey}_${index}_${blockType}` : `${newKey}_${index}`

            // Case: hasMany polymorphic relationships
            if (
              'relationTo' in item &&
              'value' in item &&
              typeof item.value === 'object' &&
              item.value !== null
            ) {
              row[`${itemPrefix}_relationTo`] = item.relationTo
              row[`${itemPrefix}_id`] = item.value.id
              return
            }

            // Fallback: deep-flatten nested objects
            flatten(item, itemPrefix)
          } else {
            // Primitive array item.
            row[`${newKey}_${index}`] = item
          }
        })
      } else if (typeof value === 'object' && value !== null) {
        // Object field: use custom toCSV if present, else recurse.
        if (!toCSVFn) {
          flatten(value, newKey)
        } else {
          try {
            const result = toCSVFn({
              columnName: newKey,
              data: row,
              doc,
              row,
              siblingDoc,
              value,
            })
            if (typeof result !== 'undefined') {
              row[newKey] = result
            }
          } catch (error) {
            throw new Error(
              `Error in toCSVFunction for nested object "${newKey}": ${JSON.stringify(value)}\n${
                (error as Error).message
              }`,
            )
          }
        }
      } else {
        if (toCSVFn) {
          try {
            const result = toCSVFn({
              columnName: newKey,
              data: row,
              doc,
              row,
              siblingDoc,
              value,
            })
            if (typeof result !== 'undefined') {
              row[newKey] = result
            }
          } catch (error) {
            throw new Error(
              `Error in toCSVFunction for field "${newKey}": ${JSON.stringify(value)}\n${
                (error as Error).message
              }`,
            )
          }
        } else {
          row[newKey] = value
        }
      }
    })
  }

  flatten(doc, prefix)

  if (Array.isArray(fields) && fields.length > 0) {
    const orderedResult: Record<string, unknown> = {}

    // Build all field regexes once
    const fieldPatterns = fields.map((field) => ({
      field,
      regex: fieldToRegex(field),
    }))

    // Track which timezone companion fields were explicitly selected
    // Convert dotted notation to underscore for matching against flattened keys
    const explicitlySelectedTimezoneFields = new Set(
      fields
        .filter((f) => {
          const underscored = f.replace(/\./g, '_')
          return timezoneCompanionFields?.has(underscored)
        })
        .map((f) => f.replace(/\./g, '_')),
    )

    // Single pass through row keys - O(keys * fields) regex tests but only one iteration
    const rowKeys = Object.keys(row)

    // Process in field order to maintain user's specified ordering
    for (const { regex } of fieldPatterns) {
      for (const key of rowKeys) {
        // Skip if already added (a key might match multiple field patterns)
        if (key in orderedResult) {
          continue
        }

        // Skip auto-generated timezone companion fields unless explicitly selected
        if (timezoneCompanionFields?.has(key) && !explicitlySelectedTimezoneFields.has(key)) {
          continue
        }

        if (regex.test(key)) {
          orderedResult[key] = row[key]
        }
      }
    }

    return orderedResult
  }

  return row
}
