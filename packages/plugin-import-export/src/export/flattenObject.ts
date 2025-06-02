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
  const result: Record<string, unknown> = {}

  const flatten = (doc: Document, prefix?: string) => {
    Object.entries(doc).forEach(([key, value]) => {
      const newKey = prefix ? `${prefix}_${key}` : key

      if (Array.isArray(value)) {
        value.forEach((item, index) => {
          if (typeof item === 'object' && item !== null) {
            flatten(item, `${newKey}_${index}`)
          } else {
            if (toCSVFunctions?.[newKey]) {
              const columnName = `${newKey}_${index}`
              result[columnName] = toCSVFunctions[newKey]({
                columnName,
                data: result,
                siblingData: doc,
                value: item,
              })
            } else {
              result[`${newKey}_${index}`] = item
            }
          }
        })
      } else if (typeof value === 'object' && value !== null) {
        if (!toCSVFunctions?.[newKey]) {
          flatten(value, newKey)
        } else {
          result[newKey] = toCSVFunctions[newKey]({
            columnName: newKey,
            data: result,
            siblingData: doc,
            value,
          })
        }
      } else {
        if (toCSVFunctions?.[newKey]) {
          result[newKey] = toCSVFunctions[newKey]({
            columnName: newKey,
            data: result,
            siblingData: doc,
            value,
          })
        } else {
          result[newKey] = value
        }
      }
    })
  }

  flatten(doc, prefix)

  if (fields) {
    const orderedResult: Record<string, unknown> = {}

    const fieldToRegex = (field: string): RegExp => {
      const parts = field.split('.').map((part) => `${part}(?:_\\d+)?`)
      const pattern = `^${parts.join('_')}`
      return new RegExp(pattern)
    }

    fields.forEach((field) => {
      if (result[field.replace(/\./g, '_')]) {
        const sanitizedField = field.replace(/\./g, '_')
        orderedResult[sanitizedField] = result[sanitizedField]
      } else {
        const regex = fieldToRegex(field)
        Object.keys(result).forEach((key) => {
          if (regex.test(key)) {
            orderedResult[key] = result[key]
          }
        })
      }
    })

    return orderedResult
  }

  return result
}
