import type { ExportFieldHookEntry } from '../types.js'

import { fieldToRegex } from './fieldToRegex.js'

type Args = {
  data: Record<string, unknown>
  exportFieldHooks: Record<string, ExportFieldHookEntry>
  fields?: string[]
  format: 'csv' | 'json' | ({} & string)
  path?: string
}

export const flattenObject = ({
  data,
  exportFieldHooks,
  fields,
  format,
  path,
}: Args): Record<string, unknown> => {
  const row: Record<string, unknown> = {}

  const getExportHookEntry = (
    fieldSchemaPath: string,
    baseFieldName: string,
  ): ExportFieldHookEntry | undefined =>
    exportFieldHooks?.[fieldSchemaPath] ?? exportFieldHooks?.[baseFieldName]

  const invokeHook = (
    entry: ExportFieldHookEntry,
    columnName: string,
    value: unknown,
    siblingSource: Record<string, unknown>,
  ): unknown => {
    if (entry.type === 'beforeExport') {
      return entry.fn({
        columnName,
        data,
        format,
        siblingData: row,
        siblingDoc: siblingSource,
        value,
      })
    }
    return entry.fn({
      columnName,
      data: row,
      doc: data,
      row,
      siblingDoc: siblingSource,
      value,
    })
  }

  const selectedTopLevelKeys =
    Array.isArray(fields) && fields.length > 0
      ? new Set(fields.map((f) => f.split('.')[0]))
      : undefined

  const flattenWithFilter = (
    siblingSource: Record<string, unknown>,
    currentPath: string | undefined,
    currentSchemaPath: string | undefined,
  ) => {
    Object.entries(siblingSource).forEach(([key, value]) => {
      if (!currentPath && selectedTopLevelKeys && !selectedTopLevelKeys.has(key)) {
        return
      }

      const fieldPath = currentPath ? `${currentPath}_${key}` : key
      const fieldSchemaPath = currentSchemaPath ? `${currentSchemaPath}_${key}` : key
      const hookEntry = getExportHookEntry(fieldSchemaPath, key)

      if (Array.isArray(value)) {
        if (hookEntry) {
          try {
            const result = invokeHook(hookEntry, fieldPath, value, siblingSource)

            if (typeof result !== 'undefined') {
              row[fieldPath] = result
              return
            }

            for (const k in row) {
              if (k === fieldPath || k.startsWith(`${fieldPath}_`)) {
                return
              }
            }
          } catch (error) {
            throw new Error(
              `Error in field export hook for array "${fieldPath}": ${JSON.stringify(value)}\n${
                (error as Error).message
              }`,
            )
          }
        }

        value.forEach((item, index) => {
          if (typeof item === 'object' && item !== null) {
            const blockType = typeof item.blockType === 'string' ? item.blockType : undefined
            const itemPath = blockType
              ? `${fieldPath}_${index}_${blockType}`
              : `${fieldPath}_${index}`
            const itemSchemaPath = blockType ? `${fieldSchemaPath}_${blockType}` : fieldSchemaPath

            if (
              'relationTo' in item &&
              'value' in item &&
              typeof item.value === 'object' &&
              item.value !== null
            ) {
              row[`${itemPath}_relationTo`] = item.relationTo
              row[`${itemPath}_id`] = item.value.id
              return
            }

            flattenWithFilter(item, itemPath, itemSchemaPath)
          } else {
            row[`${fieldPath}_${index}`] = item
          }
        })
      } else if (typeof value === 'object' && value !== null) {
        if (!hookEntry) {
          flattenWithFilter(value as Record<string, unknown>, fieldPath, fieldSchemaPath)
        } else {
          try {
            const result = invokeHook(hookEntry, fieldPath, value, siblingSource)
            if (typeof result !== 'undefined') {
              row[fieldPath] = result
            }
          } catch (error) {
            throw new Error(
              `Error in field export hook for nested object "${fieldPath}": ${JSON.stringify(value)}\n${
                (error as Error).message
              }`,
            )
          }
        }
      } else {
        if (hookEntry) {
          try {
            const result = invokeHook(hookEntry, fieldPath, value, siblingSource)
            if (typeof result !== 'undefined') {
              row[fieldPath] = result
            }
          } catch (error) {
            throw new Error(
              `Error in field export hook for field "${fieldPath}": ${JSON.stringify(value)}\n${
                (error as Error).message
              }`,
            )
          }
        } else {
          row[fieldPath] = value
        }
      }
    })
  }

  flattenWithFilter(data, path, path)

  if (Array.isArray(fields) && fields.length > 0) {
    const orderedResult: Record<string, unknown> = {}

    const fieldPatterns = fields.map((field) => ({
      field,
      regex: fieldToRegex(field),
    }))

    const rowKeys = Object.keys(row)

    for (const { regex } of fieldPatterns) {
      for (const key of rowKeys) {
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
