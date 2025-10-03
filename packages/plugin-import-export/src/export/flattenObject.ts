import type { Document } from 'payload'

import type { ToCSVFunction } from '../types.js'

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

  const flatten = (siblingDoc: Document, prefix?: string) => {
    Object.entries(siblingDoc).forEach(([key, value]) => {
      const newKey = prefix ? `${prefix}_${key}` : key

      if (Array.isArray(value)) {
        // If a custom toCSV function exists for this array field, run it first.
        // If it produces output, skip per-item handling; otherwise, fall back.
        if (toCSVFunctions?.[newKey]) {
          try {
            const result = toCSVFunctions[newKey]({
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
        if (!toCSVFunctions?.[newKey]) {
          flatten(value, newKey)
        } else {
          try {
            const result = toCSVFunctions[newKey]({
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
        if (toCSVFunctions?.[newKey]) {
          try {
            const result = toCSVFunctions[newKey]({
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

    const fieldToRegex = (field: string): RegExp => {
      const parts = field.split('.').map((part) => `${part}(?:_\\d+)?`)
      const pattern = `^${parts.join('_')}`
      return new RegExp(pattern)
    }

    fields.forEach((field) => {
      if (row[field.replace(/\./g, '_')]) {
        const sanitizedField = field.replace(/\./g, '_')
        orderedResult[sanitizedField] = row[sanitizedField]
      } else {
        const regex = fieldToRegex(field)
        Object.keys(row).forEach((key) => {
          if (regex.test(key)) {
            orderedResult[key] = row[key]
          }
        })
      }
    })

    return orderedResult
  }

  return row
}
