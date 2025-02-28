import type { FlattenedField } from 'payload'

import { sql } from 'drizzle-orm'
import { fieldIsVirtual, fieldShouldBeLocalized } from 'payload/shared'
import toSnakeCase from 'to-snake-case'

import type { DrizzleAdapter } from '../../types.js'
import type { ArrayRowToInsert, BlockRowToInsert, RelationshipToDelete } from './types.js'

import { isArrayOfRows } from '../../utilities/isArrayOfRows.js'
import { transformArray } from './array.js'
import { transformBlocks } from './blocks.js'
import { transformNumbers } from './numbers.js'
import { transformRelationship } from './relationships.js'
import { transformSelects } from './selects.js'
import { transformTexts } from './texts.js'

type Args = {
  adapter: DrizzleAdapter
  arrays: {
    [tableName: string]: ArrayRowToInsert[]
  }
  /**
   * This is the name of the base table
   */
  baseTableName: string
  blocks: {
    [blockType: string]: BlockRowToInsert[]
  }
  blocksToDelete: Set<string>
  /**
   * A snake-case field prefix, representing prior fields
   * Ex: my_group_my_named_tab_
   */
  columnPrefix: string
  data: Record<string, unknown>
  existingLocales?: Record<string, unknown>[]
  /**
   * A prefix that will retain camel-case formatting, representing prior fields
   * Ex: myGroup_myNamedTab_
   */
  fieldPrefix: string
  fields: FlattenedField[]
  forcedLocale?: string
  /**
   * Tracks whether the current traversion context is from array or block.
   */
  insideArrayOrBlock?: boolean
  locales: {
    [locale: string]: Record<string, unknown>
  }
  numbers: Record<string, unknown>[]
  parentIsLocalized: boolean
  /**
   * This is the name of the parent table
   */
  parentTableName: string
  path: string
  relationships: Record<string, unknown>[]
  relationshipsToDelete: RelationshipToDelete[]
  row: Record<string, unknown>
  selects: {
    [tableName: string]: Record<string, unknown>[]
  }
  texts: Record<string, unknown>[]
  /**
   * Set to a locale code if this set of fields is traversed within a
   * localized array or block field
   */
  withinArrayOrBlockLocale?: string
}

export const traverseFields = ({
  adapter,
  arrays,
  baseTableName,
  blocks,
  blocksToDelete,
  columnPrefix,
  data,
  existingLocales,
  fieldPrefix,
  fields,
  forcedLocale,
  insideArrayOrBlock = false,
  locales,
  numbers,
  parentIsLocalized,
  parentTableName,
  path,
  relationships,
  relationshipsToDelete,
  row,
  selects,
  texts,
  withinArrayOrBlockLocale,
}: Args) => {
  if (row._uuid) {
    data._uuid = row._uuid
  }

  fields.forEach((field) => {
    let columnName = ''
    let fieldName = ''
    let fieldData: unknown

    if (fieldIsVirtual(field)) {
      return
    }

    columnName = `${columnPrefix || ''}${toSnakeCase(field.name)}`
    fieldName = `${fieldPrefix || ''}${field.name}`
    fieldData = data[field.name]

    const isLocalized = fieldShouldBeLocalized({ field, parentIsLocalized })

    if (field.type === 'array') {
      const arrayTableName = adapter.tableNameMap.get(`${parentTableName}_${columnName}`)

      if (!arrays[arrayTableName]) {
        arrays[arrayTableName] = []
      }

      if (isLocalized) {
        if (typeof data[field.name] === 'object' && data[field.name] !== null) {
          Object.entries(data[field.name]).forEach(([localeKey, localeData]) => {
            if (Array.isArray(localeData)) {
              const newRows = transformArray({
                adapter,
                arrayTableName,
                baseTableName,
                blocks,
                blocksToDelete,
                data: localeData,
                field,
                locale: localeKey,
                numbers,
                parentIsLocalized: parentIsLocalized || field.localized,
                path,
                relationships,
                relationshipsToDelete,
                selects,
                texts,
                withinArrayOrBlockLocale: localeKey,
              })

              arrays[arrayTableName] = arrays[arrayTableName].concat(newRows)
            }
          })
        }
      } else {
        const newRows = transformArray({
          adapter,
          arrayTableName,
          baseTableName,
          blocks,
          blocksToDelete,
          data: data[field.name],
          field,
          numbers,
          parentIsLocalized: parentIsLocalized || field.localized,
          path,
          relationships,
          relationshipsToDelete,
          selects,
          texts,
          withinArrayOrBlockLocale,
        })

        arrays[arrayTableName] = arrays[arrayTableName].concat(newRows)
      }

      return
    }

    if (field.type === 'blocks') {
      ;(field.blockReferences ?? field.blocks).forEach((block) => {
        blocksToDelete.add(toSnakeCase(typeof block === 'string' ? block : block.slug))
      })

      if (isLocalized) {
        if (typeof data[field.name] === 'object' && data[field.name] !== null) {
          Object.entries(data[field.name]).forEach(([localeKey, localeData]) => {
            if (Array.isArray(localeData)) {
              transformBlocks({
                adapter,
                baseTableName,
                blocks,
                blocksToDelete,
                data: localeData,
                field,
                locale: localeKey,
                numbers,
                parentIsLocalized: parentIsLocalized || field.localized,
                path,
                relationships,
                relationshipsToDelete,
                selects,
                texts,
                withinArrayOrBlockLocale: localeKey,
              })
            }
          })
        }
      } else if (isArrayOfRows(fieldData)) {
        transformBlocks({
          adapter,
          baseTableName,
          blocks,
          blocksToDelete,
          data: fieldData,
          field,
          numbers,
          parentIsLocalized: parentIsLocalized || field.localized,
          path,
          relationships,
          relationshipsToDelete,
          selects,
          texts,
          withinArrayOrBlockLocale,
        })
      }

      return
    }

    if (field.type === 'group' || field.type === 'tab') {
      if (typeof data[field.name] === 'object' && data[field.name] !== null) {
        if (isLocalized) {
          Object.entries(data[field.name]).forEach(([localeKey, localeData]) => {
            // preserve array ID if there is
            localeData._uuid = data.id || data._uuid

            traverseFields({
              adapter,
              arrays,
              baseTableName,
              blocks,
              blocksToDelete,
              columnPrefix: `${columnName}_`,
              data: localeData as Record<string, unknown>,
              existingLocales,
              fieldPrefix: `${fieldName}_`,
              fields: field.flattenedFields,
              forcedLocale: localeKey,
              insideArrayOrBlock,
              locales,
              numbers,
              parentIsLocalized: parentIsLocalized || field.localized,
              parentTableName,
              path: `${path || ''}${field.name}.`,
              relationships,
              relationshipsToDelete,
              row,
              selects,
              texts,
              withinArrayOrBlockLocale: localeKey,
            })
          })
        } else {
          // preserve array ID if there is
          const groupData = data[field.name] as Record<string, unknown>
          groupData._uuid = data.id || data._uuid

          traverseFields({
            adapter,
            arrays,
            baseTableName,
            blocks,
            blocksToDelete,
            columnPrefix: `${columnName}_`,
            data: groupData,
            existingLocales,
            fieldPrefix: `${fieldName}_`,
            fields: field.flattenedFields,
            insideArrayOrBlock,
            locales,
            numbers,
            parentIsLocalized: parentIsLocalized || field.localized,
            parentTableName,
            path: `${path || ''}${field.name}.`,
            relationships,
            relationshipsToDelete,
            row,
            selects,
            texts,
            withinArrayOrBlockLocale,
          })
        }
      }

      return
    }

    if (field.type === 'relationship' || field.type === 'upload') {
      const relationshipPath = `${path || ''}${field.name}`

      if (
        isLocalized &&
        (Array.isArray(field.relationTo) || ('hasMany' in field && field.hasMany))
      ) {
        if (typeof fieldData === 'object') {
          Object.entries(fieldData).forEach(([localeKey, localeData]) => {
            if (localeData === null) {
              relationshipsToDelete.push({
                locale: localeKey,
                path: relationshipPath,
              })
              return
            }

            transformRelationship({
              baseRow: {
                locale: localeKey,
                path: relationshipPath,
              },
              data: localeData,
              field,
              relationships,
            })
          })
        }
        return
      } else if (Array.isArray(field.relationTo) || ('hasMany' in field && field.hasMany)) {
        if (fieldData === null || (Array.isArray(fieldData) && fieldData.length === 0)) {
          relationshipsToDelete.push({ path: relationshipPath })
          return
        }

        transformRelationship({
          baseRow: {
            locale: withinArrayOrBlockLocale,
            path: relationshipPath,
          },
          data: fieldData,
          field,
          relationships,
        })
        return
      } else {
        if (
          !isLocalized &&
          fieldData &&
          typeof fieldData === 'object' &&
          'id' in fieldData &&
          fieldData?.id
        ) {
          fieldData = fieldData.id
        } else if (isLocalized) {
          if (typeof fieldData === 'object') {
            Object.entries(fieldData).forEach(([localeKey, localeData]) => {
              if (typeof localeData === 'object') {
                if (localeData && 'id' in localeData && localeData?.id) {
                  fieldData[localeKey] = localeData.id
                }
              } else {
                fieldData[localeKey] = localeData
              }
            })
          }
        }
      }
    }

    if (field.type === 'text' && field.hasMany) {
      const textPath = `${path || ''}${field.name}`

      if (isLocalized) {
        if (typeof fieldData === 'object') {
          Object.entries(fieldData).forEach(([localeKey, localeData]) => {
            if (Array.isArray(localeData)) {
              transformTexts({
                baseRow: {
                  locale: localeKey,
                  path: textPath,
                },
                data: localeData,
                texts,
              })
            }
          })
        }
      } else if (Array.isArray(fieldData)) {
        transformTexts({
          baseRow: {
            locale: withinArrayOrBlockLocale,
            path: textPath,
          },
          data: fieldData,
          texts,
        })
      }

      return
    }

    if (field.type === 'number' && field.hasMany) {
      const numberPath = `${path || ''}${field.name}`

      if (isLocalized) {
        if (typeof fieldData === 'object') {
          Object.entries(fieldData).forEach(([localeKey, localeData]) => {
            if (Array.isArray(localeData)) {
              transformNumbers({
                baseRow: {
                  locale: localeKey,
                  path: numberPath,
                },
                data: localeData,
                numbers,
              })
            }
          })
        }
      } else if (Array.isArray(fieldData)) {
        transformNumbers({
          baseRow: {
            locale: withinArrayOrBlockLocale,
            path: numberPath,
          },
          data: fieldData,
          numbers,
        })
      }

      return
    }

    if (field.type === 'select' && field.hasMany) {
      const selectTableName = adapter.tableNameMap.get(`${parentTableName}_${columnName}`)
      if (!selects[selectTableName]) {
        selects[selectTableName] = []
      }

      if (isLocalized) {
        if (typeof data[field.name] === 'object' && data[field.name] !== null) {
          Object.entries(data[field.name]).forEach(([localeKey, localeData]) => {
            if (Array.isArray(localeData)) {
              const newRows = transformSelects({
                id: insideArrayOrBlock ? data._uuid || data.id : undefined,
                data: localeData,
                locale: localeKey,
              })

              selects[selectTableName] = selects[selectTableName].concat(newRows)
            }
          })
        }
      } else if (Array.isArray(data[field.name])) {
        const newRows = transformSelects({
          id: insideArrayOrBlock ? data._uuid || data.id : undefined,
          data: data[field.name],
          locale: withinArrayOrBlockLocale,
        })

        selects[selectTableName] = selects[selectTableName].concat(newRows)
      }

      return
    }

    const valuesToTransform: { localeKey?: string; ref: unknown; value: unknown }[] = []

    if (isLocalized) {
      if (typeof fieldData === 'object' && fieldData !== null) {
        Object.entries(fieldData).forEach(([localeKey, localeData]) => {
          if (!locales[localeKey]) {
            locales[localeKey] = {}
          }

          valuesToTransform.push({
            localeKey,
            ref: locales,
            value: localeData,
          })
        })
      }
    } else {
      let ref = row

      if (forcedLocale) {
        if (!locales[forcedLocale]) {
          locales[forcedLocale] = {}
        }
        ref = locales[forcedLocale]
      }

      valuesToTransform.push({ ref, value: fieldData })
    }

    valuesToTransform.forEach(({ localeKey, ref, value }) => {
      let formattedValue = value

      if (typeof value !== 'undefined') {
        if (value && field.type === 'point' && adapter.name !== 'sqlite') {
          formattedValue = sql`ST_GeomFromGeoJSON(${JSON.stringify(value)})`
        }

        if (field.type === 'date') {
          if (typeof value === 'number' && !Number.isNaN(value)) {
            formattedValue = new Date(value).toISOString()
          } else if (value instanceof Date) {
            formattedValue = value.toISOString()
          }
        }
      }

      if (field.type === 'date' && fieldName === 'updatedAt') {
        // let the db handle this
        formattedValue = new Date().toISOString()
      }

      if (typeof formattedValue !== 'undefined') {
        if (localeKey) {
          ref[localeKey][fieldName] = formattedValue
        } else {
          ref[fieldName] = formattedValue
        }
      }
    })
  })
}
