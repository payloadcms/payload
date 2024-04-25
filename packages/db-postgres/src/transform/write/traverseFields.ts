/* eslint-disable no-param-reassign */
import type { Field } from 'payload/types'

import { fieldAffectsData } from 'payload/types'
import toSnakeCase from 'to-snake-case'

import type { PostgresAdapter } from '../../types'
import type { ArrayRowToInsert, BlockRowToInsert, RelationshipToDelete } from './types'

import { isArrayOfRows } from '../../utilities/isArrayOfRows'
import { transformArray } from './array'
import { transformBlocks } from './blocks'
import { transformNumbers } from './numbers'
import { transformRelationship } from './relationships'
import { transformSelects } from './selects'
import { transformTexts } from './texts'

type Args = {
  adapter: PostgresAdapter
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
  fields: Field[]
  forcedLocale?: string
  locales: {
    [locale: string]: Record<string, unknown>
  }
  numbers: Record<string, unknown>[]
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
  locales,
  numbers,
  parentTableName,
  path,
  relationships,
  relationshipsToDelete,
  row,
  selects,
  texts,
}: Args) => {
  fields.forEach((field) => {
    let columnName = ''
    let fieldName = ''
    let fieldData: unknown

    if (fieldAffectsData(field)) {
      columnName = `${columnPrefix || ''}${toSnakeCase(field.name)}`
      fieldName = `${fieldPrefix || ''}${field.name}`
      fieldData = data[field.name]
    }

    if (field.type === 'array') {
      const arrayTableName = adapter.tableNameMap.get(`${parentTableName}_${columnName}`)

      if (!arrays[arrayTableName]) arrays[arrayTableName] = []

      if (field.localized) {
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
                path,
                relationships,
                relationshipsToDelete,
                selects,
                texts,
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
          path,
          relationships,
          relationshipsToDelete,
          selects,
          texts,
        })

        arrays[arrayTableName] = arrays[arrayTableName].concat(newRows)
      }

      return
    }

    if (field.type === 'blocks') {
      field.blocks.forEach(({ slug }) => {
        blocksToDelete.add(toSnakeCase(slug))
      })

      if (field.localized) {
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
                path,
                relationships,
                relationshipsToDelete,
                selects,
                texts,
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
          path,
          relationships,
          relationshipsToDelete,
          selects,
          texts,
        })
      }

      return
    }

    if (field.type === 'group') {
      if (typeof data[field.name] === 'object' && data[field.name] !== null) {
        if (field.localized) {
          Object.entries(data[field.name]).forEach(([localeKey, localeData]) => {
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
              fields: field.fields,
              forcedLocale: localeKey,
              locales,
              numbers,
              parentTableName,
              path: `${path || ''}${field.name}.`,
              relationships,
              relationshipsToDelete,
              row,
              selects,
              texts,
            })
          })
        } else {
          traverseFields({
            adapter,
            arrays,
            baseTableName,
            blocks,
            blocksToDelete,
            columnPrefix: `${columnName}_`,
            data: data[field.name] as Record<string, unknown>,
            existingLocales,
            fieldPrefix: `${fieldName}_`,
            fields: field.fields,
            locales,
            numbers,
            parentTableName,
            path: `${path || ''}${field.name}.`,
            relationships,
            relationshipsToDelete,
            row,
            selects,
            texts,
          })
        }
      }

      return
    }

    if (field.type === 'tabs') {
      field.tabs.forEach((tab) => {
        if ('name' in tab) {
          if (typeof data[tab.name] === 'object' && data[tab.name] !== null) {
            if (tab.localized) {
              Object.entries(data[tab.name]).forEach(([localeKey, localeData]) => {
                traverseFields({
                  adapter,
                  arrays,
                  baseTableName,
                  blocks,
                  blocksToDelete,
                  columnPrefix: `${columnPrefix || ''}${toSnakeCase(tab.name)}_`,
                  data: localeData as Record<string, unknown>,
                  existingLocales,
                  fieldPrefix: `${fieldPrefix || ''}${tab.name}_`,
                  fields: tab.fields,
                  forcedLocale: localeKey,
                  locales,
                  numbers,
                  parentTableName,
                  path: `${path || ''}${tab.name}.`,
                  relationships,
                  relationshipsToDelete,
                  row,
                  selects,
                  texts,
                })
              })
            } else {
              traverseFields({
                adapter,
                arrays,
                baseTableName,
                blocks,
                blocksToDelete,
                columnPrefix: `${columnPrefix || ''}${toSnakeCase(tab.name)}_`,
                data: data[tab.name] as Record<string, unknown>,
                existingLocales,
                fieldPrefix: `${fieldPrefix || ''}${tab.name}_`,
                fields: tab.fields,
                locales,
                numbers,
                parentTableName,
                path: `${path || ''}${tab.name}.`,
                relationships,
                relationshipsToDelete,
                row,
                selects,
                texts,
              })
            }
          }
        } else {
          traverseFields({
            adapter,
            arrays,
            baseTableName,
            blocks,
            blocksToDelete,
            columnPrefix,
            data,
            existingLocales,
            fieldPrefix,
            fields: tab.fields,
            locales,
            numbers,
            parentTableName,
            path,
            relationships,
            relationshipsToDelete,
            row,
            selects,
            texts,
          })
        }
      })
    }

    if (field.type === 'row' || field.type === 'collapsible') {
      traverseFields({
        adapter,
        arrays,
        baseTableName,
        blocks,
        blocksToDelete,
        columnPrefix,
        data,
        existingLocales,
        fieldPrefix,
        fields: field.fields,
        locales,
        numbers,
        parentTableName,
        path,
        relationships,
        relationshipsToDelete,
        row,
        selects,
        texts,
      })
    }

    if (field.type === 'relationship' || field.type === 'upload') {
      const relationshipPath = `${path || ''}${field.name}`

      if (field.localized) {
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
      } else {
        if (fieldData === null || (Array.isArray(fieldData) && fieldData.length === 0)) {
          relationshipsToDelete.push({ path: relationshipPath })
          return
        }

        transformRelationship({
          baseRow: {
            path: relationshipPath,
          },
          data: fieldData,
          field,
          relationships,
        })
      }

      return
    }

    if (field.type === 'text' && field.hasMany) {
      const textPath = `${path || ''}${field.name}`

      if (field.localized) {
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

      if (field.localized) {
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
      if (!selects[selectTableName]) selects[selectTableName] = []

      if (field.localized) {
        if (typeof data[field.name] === 'object' && data[field.name] !== null) {
          Object.entries(data[field.name]).forEach(([localeKey, localeData]) => {
            if (Array.isArray(localeData)) {
              const newRows = transformSelects({
                id: data._uuid || data.id,
                data: localeData,
                locale: localeKey,
              })

              selects[selectTableName] = selects[selectTableName].concat(newRows)
            }
          })
        }
      } else if (Array.isArray(data[field.name])) {
        const newRows = transformSelects({
          id: data._uuid || data.id,
          data: data[field.name],
        })

        selects[selectTableName] = selects[selectTableName].concat(newRows)
      }

      return
    }

    if (fieldAffectsData(field)) {
      const valuesToTransform: { localeKey?: string; ref: unknown; value: unknown }[] = []

      if (field.localized) {
        if (typeof fieldData === 'object' && fieldData !== null) {
          Object.entries(fieldData).forEach(([localeKey, localeData]) => {
            if (!locales[localeKey]) locales[localeKey] = {}

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
          if (!locales[forcedLocale]) locales[forcedLocale] = {}
          ref = locales[forcedLocale]
        }

        valuesToTransform.push({ ref, value: fieldData })
      }

      valuesToTransform.forEach(({ localeKey, ref, value }) => {
        if (typeof value !== 'undefined') {
          let formattedValue = value

          if (field.type === 'date' && field.name === 'updatedAt') {
            formattedValue = new Date().toISOString()
          }

          if (localeKey) {
            ref[localeKey][fieldName] = formattedValue
          } else {
            ref[fieldName] = formattedValue
          }
        }
      })
    }
  })
}
