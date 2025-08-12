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

            flatten(item, itemPrefix)
          } else {
            if (toCSVFunctions?.[newKey]) {
              const columnName = `${newKey}_${index}`
              try {
                const result = toCSVFunctions[newKey]({
                  columnName,
                  data: row,
                  doc,
                  row,
                  siblingDoc,
                  value: item,
                })
                if (typeof result !== 'undefined') {
                  row[columnName] = result
                }
              } catch (error) {
                throw new Error(
                  `Error in toCSVFunction for array item "${columnName}": ${JSON.stringify(item)}\n${
                    (error as Error).message
                  }`,
                )
              }
            } else {
              row[`${newKey}_${index}`] = item
            }
          }
        })
      } else if (typeof value === 'object' && value !== null) {
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
              `Error in toCSVFunction for nested object "${newKey}": ${JSON.stringify(value)}\n${(error as Error).message}`,
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
              `Error in toCSVFunction for field "${newKey}": ${JSON.stringify(value)}\n${(error as Error).message}`,
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
