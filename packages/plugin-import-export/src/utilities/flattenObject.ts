import type { PayloadRequest } from 'payload'

import type { ExportFieldHookEntry } from '../types.js'

import { fieldToRegex } from './fieldToRegex.js'
import { isPlainObject } from './isPlainObject.js'
import { getPolymorphicRelId, isPolymorphicRelValue } from './polymorphicRel.js'

type Args = {
  data: Record<string, unknown>
  exportFieldHooks: Record<string, ExportFieldHookEntry>
  fields?: string[]
  format: 'csv' | 'json' | (string & {})
  path?: string
  req: PayloadRequest
}

export const flattenObject = ({
  data,
  exportFieldHooks,
  fields,
  format,
  path,
  req,
}: Args): Record<string, unknown> => {
  const row: Record<string, unknown> = {}

  const invokeHook = (
    entry: ExportFieldHookEntry,
    columnName: string,
    value: unknown,
    siblingSource: Record<string, unknown>,
  ): unknown => {
    return entry.fn({
      columnName,
      data,
      format,
      siblingData: row,
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
      const hookEntry = exportFieldHooks?.[fieldSchemaPath]

      const flattenArray = (items: unknown[], arrayPath: string, arraySchemaPath: string): void => {
        items.forEach((item, index) => {
          if (!isPlainObject(item)) {
            row[`${arrayPath}_${index}`] = item
            return
          }

          const blockType = typeof item.blockType === 'string' ? item.blockType : undefined
          const itemPath = blockType
            ? `${arrayPath}_${index}_${blockType}`
            : `${arrayPath}_${index}`
          const itemSchemaPath = blockType ? `${arraySchemaPath}_${blockType}` : arraySchemaPath

          if (isPolymorphicRelValue(item) && isPlainObject(item.value)) {
            const id = getPolymorphicRelId(item)
            if (id !== undefined) {
              row[`${itemPath}_relationTo`] = item.relationTo
              row[`${itemPath}_id`] = id
              return
            }
          }

          flattenWithFilter(item, itemPath, itemSchemaPath)
        })
      }

      if (Array.isArray(value)) {
        if (hookEntry) {
          try {
            const result = invokeHook(hookEntry, fieldPath, value, siblingSource)

            if (result === null) {
              return
            }

            if (Array.isArray(result)) {
              flattenArray(result, fieldPath, fieldSchemaPath)
              return
            }

            if (typeof result !== 'undefined') {
              row[fieldPath] = result
              return
            }
          } catch (error) {
            req.payload.logger.error({
              err: error,
              msg: `[plugin-import-export] Field-level beforeExport hook for "${fieldPath}" threw — falling back to default flattening`,
            })
          }
        }

        flattenArray(value, fieldPath, fieldSchemaPath)
      } else if (typeof value === 'object' && value !== null) {
        if (!hookEntry) {
          flattenWithFilter(value as Record<string, unknown>, fieldPath, fieldSchemaPath)
        } else {
          const keysBeforeHook = new Set(Object.keys(row))
          try {
            const result = invokeHook(hookEntry, fieldPath, value, siblingSource)
            if (result === null) {
              return
            }
            if (typeof result === 'undefined') {
              const hookWroteForField = Object.keys(row).some(
                (k) => !keysBeforeHook.has(k) && (k === fieldPath || k.startsWith(`${fieldPath}_`)),
              )
              if (hookWroteForField) {
                return
              }
              flattenWithFilter(value as Record<string, unknown>, fieldPath, fieldSchemaPath)
            } else if (typeof result === 'object' && !Array.isArray(result)) {
              flattenWithFilter(result as Record<string, unknown>, fieldPath, fieldSchemaPath)
            } else {
              row[fieldPath] = result
            }
          } catch (error) {
            req.payload.logger.error({
              err: error,
              msg: `[plugin-import-export] Field-level beforeExport hook for "${fieldPath}" threw — falling back to default flattening`,
            })
            flattenWithFilter(value as Record<string, unknown>, fieldPath, fieldSchemaPath)
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
            req.payload.logger.error({
              err: error,
              msg: `[plugin-import-export] Field-level beforeExport hook for "${fieldPath}" threw — falling back to original value`,
            })
            row[fieldPath] = value
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
