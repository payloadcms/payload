import { sql } from 'drizzle-orm'
import { APIError, type FlattenedField } from 'payload'
import { fieldIsVirtual, fieldShouldBeLocalized } from 'payload/shared'
import toSnakeCase from 'to-snake-case'

import type { DrizzleAdapter } from '../../types.js'
import type {
  NumberToDelete,
  RelationshipToAppend,
  RelationshipToDelete,
  RowToInsert,
  TextToDelete,
} from './types.js'

import { isArrayOfRows } from '../../utilities/isArrayOfRows.js'
import { resolveBlockTableName } from '../../utilities/validateExistingBlockIsIdentical.js'
import { transformArray } from './array.js'
import { transformBlocks } from './blocks.js'
import { transformNumbers } from './numbers.js'
import { transformRelationship } from './relationships.js'
import { transformSelects } from './selects.js'
import { transformTexts } from './texts.js'

type Args = {
  adapter: DrizzleAdapter
  /**
   * This will delete the array table and then re-insert all the new array rows.
   */
  arrays: RowToInsert['arrays']
  /**
   * Array rows to push to the existing array. This will simply create
   * a new row in the array table.
   */
  arraysToPush: RowToInsert['arraysToPush']
  /**
   * This is the name of the base table
   */
  baseTableName: string
  blocks: RowToInsert['blocks']
  blocksToDelete: Set<string>
  /**
   * A snake-case field prefix, representing prior fields
   * Ex: my_group_my_named_tab_
   */
  columnPrefix: string
  data: Record<string, unknown>
  enableAtomicWrites?: boolean
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
  numbersToDelete: NumberToDelete[]
  parentIsLocalized: boolean
  /**
   * This is the name of the parent table
   */
  parentTableName: string
  path: string
  relationships: Record<string, unknown>[]
  relationshipsToAppend: RelationshipToAppend[]
  relationshipsToDelete: RelationshipToDelete[]
  row: Record<string, unknown>
  selects: {
    [tableName: string]: Record<string, unknown>[]
  }
  texts: Record<string, unknown>[]
  textsToDelete: TextToDelete[]
  /**
   * Set to a locale code if this set of fields is traversed within a
   * localized array or block field
   */
  withinArrayOrBlockLocale?: string
}

export const traverseFields = ({
  adapter,
  arrays,
  arraysToPush,
  baseTableName,
  blocks,
  blocksToDelete,
  columnPrefix,
  data,
  enableAtomicWrites,
  existingLocales,
  fieldPrefix,
  fields,
  forcedLocale,
  insideArrayOrBlock = false,
  locales,
  numbers,
  numbersToDelete,
  parentIsLocalized,
  parentTableName,
  path,
  relationships,
  relationshipsToAppend,
  relationshipsToDelete,
  row,
  selects,
  texts,
  textsToDelete,
  withinArrayOrBlockLocale,
}: Args) => {
  let fieldsMatched = false

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

    // Mark that we found a matching field
    if (data[field.name] !== undefined) {
      fieldsMatched = true
    }

    columnName = `${columnPrefix || ''}${toSnakeCase(field.name)}`
    fieldName = `${fieldPrefix || ''}${field.name}`
    fieldData = data[field.name]

    const isLocalized = fieldShouldBeLocalized({ field, parentIsLocalized })

    if (field.type === 'array') {
      const arrayTableName = adapter.tableNameMap.get(`${parentTableName}_${columnName}`)

      if (isLocalized) {
        const value = data[field.name]

        if (typeof value === 'object' && value !== null) {
          Object.entries(value).forEach(([localeKey, localeValue]) => {
            let localeData = localeValue
            let push = false

            if (localeValue && typeof localeValue === 'object' && '$push' in localeValue) {
              localeData = localeValue.$push
              push = true
              if (!Array.isArray(localeData)) {
                localeData = [localeData]
              }
            }

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
                numbersToDelete,
                parentIsLocalized: parentIsLocalized || field.localized,
                path,
                relationships,
                relationshipsToDelete,
                selects,
                texts,
                textsToDelete,
                withinArrayOrBlockLocale: localeKey,
              })

              if (push) {
                if (!arraysToPush[arrayTableName]) {
                  arraysToPush[arrayTableName] = []
                }
                arraysToPush[arrayTableName] = arraysToPush[arrayTableName].concat(newRows)
              } else {
                if (!arrays[arrayTableName]) {
                  arrays[arrayTableName] = []
                }
                arrays[arrayTableName] = arrays[arrayTableName].concat(newRows)
              }
            }
          })
        }
      } else {
        let value = data[field.name]
        let push = false
        if (typeof value === 'object' && '$push' in value) {
          value = Array.isArray(value.$push) ? value.$push : [value.$push]
          push = true
        }

        const newRows = transformArray({
          adapter,
          arrayTableName,
          baseTableName,
          blocks,
          blocksToDelete,
          data: value,
          field,
          numbers,
          numbersToDelete,
          parentIsLocalized: parentIsLocalized || field.localized,
          path,
          relationships,
          relationshipsToDelete,
          selects,
          texts,
          textsToDelete,
          withinArrayOrBlockLocale,
        })

        if (push) {
          if (!arraysToPush[arrayTableName]) {
            arraysToPush[arrayTableName] = []
          }
          arraysToPush[arrayTableName] = arraysToPush[arrayTableName].concat(newRows)
        } else {
          if (!arrays[arrayTableName]) {
            arrays[arrayTableName] = []
          }
          arrays[arrayTableName] = arrays[arrayTableName].concat(newRows)
        }
      }

      return
    }

    if (field.type === 'blocks' && !adapter.blocksAsJSON) {
      ;(field.blockReferences ?? field.blocks).forEach((block) => {
        const matchedBlock =
          typeof block === 'string'
            ? adapter.payload.config.blocks.find((each) => each.slug === block)
            : block

        blocksToDelete.add(
          resolveBlockTableName(
            matchedBlock,
            adapter.tableNameMap.get(`${baseTableName}_blocks_${toSnakeCase(matchedBlock.slug)}`),
          ),
        )
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
                numbersToDelete,
                parentIsLocalized: parentIsLocalized || field.localized,
                path,
                relationships,
                relationshipsToDelete,
                selects,
                texts,
                textsToDelete,
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
          numbersToDelete,
          parentIsLocalized: parentIsLocalized || field.localized,
          path,
          relationships,
          relationshipsToDelete,
          selects,
          texts,
          textsToDelete,
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
              arraysToPush,
              baseTableName,
              blocks,
              blocksToDelete,
              columnPrefix: `${columnName}_`,
              data: localeData as Record<string, unknown>,
              enableAtomicWrites,
              existingLocales,
              fieldPrefix: `${fieldName}_`,
              fields: field.flattenedFields,
              forcedLocale: localeKey,
              insideArrayOrBlock,
              locales,
              numbers,
              numbersToDelete,
              parentIsLocalized: parentIsLocalized || field.localized,
              parentTableName,
              path: `${path || ''}${field.name}.`,
              relationships,
              relationshipsToAppend,
              relationshipsToDelete,
              row,
              selects,
              texts,
              textsToDelete,
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
            arraysToPush,
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
            numbersToDelete,
            parentIsLocalized: parentIsLocalized || field.localized,
            parentTableName,
            path: `${path || ''}${field.name}.`,
            relationships,
            relationshipsToAppend,
            relationshipsToDelete,
            row,
            selects,
            texts,
            textsToDelete,
            withinArrayOrBlockLocale,
          })
        }
      }

      return
    }

    if (field.type === 'relationship' || field.type === 'upload') {
      const relationshipPath = `${path || ''}${field.name}`

      // Handle $push operation for relationship fields
      if (
        fieldData &&
        typeof fieldData === 'object' &&
        'hasMany' in field &&
        field.hasMany &&
        ('$push' in fieldData ||
          (field.localized &&
            Object.values(fieldData).some(
              (localeValue) =>
                localeValue &&
                typeof localeValue === 'object' &&
                '$push' in (localeValue as Record<string, unknown>),
            )))
      ) {
        let itemsToAppend: unknown[]

        if (field.localized) {
          let hasLocaleOperations = false
          Object.entries(fieldData).forEach(([localeKey, localeValue]) => {
            if (localeValue && typeof localeValue === 'object' && '$push' in localeValue) {
              hasLocaleOperations = true
              const push = localeValue.$push
              const localeItems = Array.isArray(push) ? push : [push]

              localeItems.forEach((item) => {
                const relationshipToAppend: RelationshipToAppend = {
                  locale: localeKey,
                  path: relationshipPath,
                  value: item,
                }

                // Handle polymorphic relationships
                if (
                  Array.isArray(field.relationTo) &&
                  item &&
                  typeof item === 'object' &&
                  'relationTo' in item
                ) {
                  relationshipToAppend.relationTo = item.relationTo
                  relationshipToAppend.value = item.value
                } else if (typeof field.relationTo === 'string') {
                  // Simple relationship
                  relationshipToAppend.relationTo = field.relationTo
                  relationshipToAppend.value = item
                }

                relationshipsToAppend.push(relationshipToAppend)
              })
            }
          })

          if (hasLocaleOperations) {
            return
          }
        } else {
          // Handle non-localized fields: { field: { $push: data } }
          itemsToAppend = Array.isArray((fieldData as any).$push)
            ? (fieldData as any).$push
            : [(fieldData as any).$push]

          itemsToAppend.forEach((item) => {
            const relationshipToAppend: RelationshipToAppend = {
              locale: isLocalized ? withinArrayOrBlockLocale : undefined,
              path: relationshipPath,
              value: item,
            }

            // Handle polymorphic relationships
            if (
              Array.isArray(field.relationTo) &&
              item &&
              typeof item === 'object' &&
              'relationTo' in item &&
              'value' in item
            ) {
              relationshipToAppend.relationTo = item.relationTo as string
              relationshipToAppend.value = item.value as number | string
            } else if (typeof field.relationTo === 'string') {
              // Simple relationship
              relationshipToAppend.relationTo = field.relationTo
              relationshipToAppend.value = item
            }

            relationshipsToAppend.push(relationshipToAppend)
          })
        }
        return
      }

      // Handle $remove operation for relationship fields
      if (
        fieldData &&
        typeof fieldData === 'object' &&
        'hasMany' in field &&
        field.hasMany &&
        ('$remove' in fieldData ||
          (field.localized &&
            Object.values(fieldData).some(
              (localeValue) =>
                localeValue &&
                typeof localeValue === 'object' &&
                '$remove' in (localeValue as Record<string, unknown>),
            )))
      ) {
        // Check for new locale-first syntax: { field: { locale: { $remove: data } } }
        if (field.localized) {
          let hasLocaleOperations = false
          Object.entries(fieldData).forEach(([localeKey, localeValue]) => {
            if (localeValue && typeof localeValue === 'object' && '$remove' in localeValue) {
              hasLocaleOperations = true
              const remove = localeValue.$remove
              const localeItems = Array.isArray(remove) ? remove : [remove]

              localeItems.forEach((item) => {
                const relationshipToDelete: RelationshipToDelete = {
                  itemToRemove: item,
                  locale: localeKey,
                  path: relationshipPath,
                }

                // Store relationTo for simple relationships
                if (typeof field.relationTo === 'string') {
                  relationshipToDelete.relationTo = field.relationTo
                }

                relationshipsToDelete.push(relationshipToDelete)
              })
            }
          })

          if (hasLocaleOperations) {
            return
          }
        } else {
          // Handle non-localized fields: { field: { $remove: data } }
          const itemsToRemove = Array.isArray((fieldData as any).$remove)
            ? (fieldData as any).$remove
            : [(fieldData as any).$remove]

          itemsToRemove.forEach((item) => {
            const relationshipToDelete: RelationshipToDelete = {
              itemToRemove: item,
              locale: isLocalized ? withinArrayOrBlockLocale : undefined,
              path: relationshipPath,
            }

            // Store relationTo for simple relationships
            if (typeof field.relationTo === 'string') {
              relationshipToDelete.relationTo = field.relationTo
            }

            relationshipsToDelete.push(relationshipToDelete)
          })
        }
        return
      }

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
              if (!localeData.length) {
                textsToDelete.push({ locale: localeKey, path: textPath })
                return
              }

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
        if (!fieldData.length) {
          textsToDelete.push({ locale: withinArrayOrBlockLocale, path: textPath })
          return
        }

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
              if (!localeData.length) {
                numbersToDelete.push({ locale: localeKey, path: numberPath })
                return
              }

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
        if (!fieldData.length) {
          numbersToDelete.push({ locale: withinArrayOrBlockLocale, path: numberPath })
          return
        }

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

      if (field.type === 'date') {
        if (fieldName === 'updatedAt' && formattedValue === null) {
          // If updatedAt is explicitly set to null, skip it entirely - don't add to row
          // This prevents the timestamp from being updated for session-only operations
          return // Skip this iteration
        } else if (fieldName === 'updatedAt' && typeof formattedValue === 'undefined') {
          // If updatedAt is undefined, set it to current time (normal behavior)
          formattedValue = new Date().toISOString()
        } else {
          if (typeof value === 'number' && !Number.isNaN(value)) {
            formattedValue = new Date(value).toISOString()
          } else if (value instanceof Date) {
            formattedValue = value.toISOString()
          }
        }
      }

      if (typeof value !== 'undefined') {
        if (value && field.type === 'point' && adapter.name !== 'sqlite') {
          formattedValue = sql`ST_GeomFromGeoJSON(${JSON.stringify(value)})`
        }

        if (field.type === 'text' && value && typeof value !== 'string') {
          formattedValue = JSON.stringify(value)
        }

        if (
          field.type === 'number' &&
          value &&
          typeof value === 'object' &&
          '$inc' in value &&
          typeof value.$inc === 'number'
        ) {
          if (!enableAtomicWrites) {
            throw new APIError(
              'The passed data must not contain any nested fields for atomic writes',
            )
          }

          formattedValue = sql.raw(`${columnName} + ${value.$inc}`)
        }
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

  // Handle dot-notation paths when no fields matched
  if (!fieldsMatched) {
    Object.keys(data).forEach((key) => {
      if (key.includes('.')) {
        // Split on first dot only
        const firstDotIndex = key.indexOf('.')
        const fieldName = key.substring(0, firstDotIndex)
        const remainingPath = key.substring(firstDotIndex + 1)

        // Create nested structure for this field
        if (!data[fieldName]) {
          data[fieldName] = {}
        }

        const nestedData = data[fieldName] as Record<string, unknown>

        // Move the value to the nested structure
        nestedData[remainingPath] = data[key]
        delete data[key]

        // Recursively process the newly created nested structure
        // The field traversal will naturally handle it if the field exists in the schema
        traverseFields({
          adapter,
          arrays,
          arraysToPush,
          baseTableName,
          blocks,
          blocksToDelete,
          columnPrefix,
          data,
          enableAtomicWrites,
          existingLocales,
          fieldPrefix,
          fields,
          forcedLocale,
          insideArrayOrBlock,
          locales,
          numbers,
          numbersToDelete,
          parentIsLocalized,
          parentTableName,
          path,
          relationships,
          relationshipsToAppend,
          relationshipsToDelete,
          row,
          selects,
          texts,
          textsToDelete,
          withinArrayOrBlockLocale,
        })
      }
    })
  }
}
