import type { Document } from 'payload'

import type { ToCSVFunction } from '../types.js'

import { fieldToRegex } from './fieldToRegex.js'

type Args = {
  doc: Document
  fields?: string[]
  prefix?: string
  toCSVFunctions: Record<string, ToCSVFunction>
}

export const flattenObject = ({
  doc,
  fields,
  prefix,
  toCSVFunctions,
}: Args): Record<string, unknown> => {
  const row: Record<string, unknown> = {}

  // Helper to get toCSV function by full path or base field name
  // This allows functions registered for field names (e.g., 'richText') to work
  // even when the field is nested in arrays/blocks (e.g., 'blocks_0_content_richText')
  const getToCSVFunction = (fullPath: string, baseFieldName: string): ToCSVFunction | undefined => {
    return toCSVFunctions?.[fullPath] ?? toCSVFunctions?.[baseFieldName]
  }

  // When fields are selected, build a set of top-level document keys to process.
  // This prevents sibling fields with similar prefixes from being included
  // (e.g. selecting 'dateWithTimezone' won't pull in 'dateWithTimezone_tz')
  const selectedTopLevelKeys =
    Array.isArray(fields) && fields.length > 0
      ? new Set(fields.map((f) => f.split('.')[0]))
      : undefined

  const flattenWithFilter = (siblingDoc: Document, currentPrefix?: string) => {
    Object.entries(siblingDoc).forEach(([key, value]) => {
      // At the document root, skip keys that don't match any selected field
      if (!currentPrefix && selectedTopLevelKeys && !selectedTopLevelKeys.has(key)) {
        return
      }

      const newKey = currentPrefix ? `${currentPrefix}_${key}` : key
      const toCSVFn = getToCSVFunction(newKey, key)

      if (Array.isArray(value)) {
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
              return
            }

            for (const k in row) {
              if (k === newKey || k.startsWith(`${newKey}_`)) {
                return
              }
            }
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

            flattenWithFilter(item, itemPrefix)
          } else {
            row[`${newKey}_${index}`] = item
          }
        })
      } else if (typeof value === 'object' && value !== null) {
        if (!toCSVFn) {
          flattenWithFilter(value, newKey)
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

  flattenWithFilter(doc, prefix)

  if (Array.isArray(fields) && fields.length > 0) {
    const orderedResult: Record<string, unknown> = {}

    // Build all field regexes once
    const fieldPatterns = fields.map((field) => ({
      field,
      regex: fieldToRegex(field),
    }))

    // Single pass through row keys - O(keys * fields) regex tests but only one iteration
    const rowKeys = Object.keys(row)

    // Process in field order to maintain user's specified ordering
    for (const { regex } of fieldPatterns) {
      for (const key of rowKeys) {
        // Skip if already added (a key might match multiple field patterns)
        if (key in orderedResult) {
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
