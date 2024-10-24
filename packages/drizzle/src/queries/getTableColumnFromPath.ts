import type { SQL } from 'drizzle-orm'
import type { SQLiteTableWithColumns } from 'drizzle-orm/sqlite-core'
import type { Field, FieldAffectingData, NumberField, TabAsField, TextField } from 'payload'

import { and, eq, like, sql } from 'drizzle-orm'
import { type PgTableWithColumns } from 'drizzle-orm/pg-core'
import { APIError, flattenTopLevelFields } from 'payload'
import { fieldAffectsData, tabHasName } from 'payload/shared'
import toSnakeCase from 'to-snake-case'
import { validate as uuidValidate } from 'uuid'

import type { DrizzleAdapter, GenericColumn } from '../types.js'
import type { BuildQueryJoinAliases } from './buildQuery.js'

import { isPolymorphicRelationship } from '../utilities/isPolymorphicRelationship.js'
import { addJoinTable } from './addJoinTable.js'
import { getTableAlias } from './getTableAlias.js'

type Constraint = {
  columnName: string
  table: PgTableWithColumns<any> | SQLiteTableWithColumns<any>
  value: unknown
}

type TableColumn = {
  columnName?: string
  columns?: {
    idType: 'number' | 'text' | 'uuid'
    rawColumn: SQL<unknown>
  }[]
  constraints: Constraint[]
  field: FieldAffectingData
  getNotNullColumnByValue?: (val: unknown) => string
  pathSegments?: string[]
  rawColumn?: SQL
  table: PgTableWithColumns<any> | SQLiteTableWithColumns<any>
}

type Args = {
  adapter: DrizzleAdapter
  aliasTable?: PgTableWithColumns<any> | SQLiteTableWithColumns<any>
  collectionPath: string
  columnPrefix?: string
  constraintPath?: string
  constraints?: Constraint[]
  fields: (Field | TabAsField)[]
  joins: BuildQueryJoinAliases
  locale?: string
  pathSegments: string[]
  rootTableName?: string
  selectFields: Record<string, GenericColumn>
  tableName: string
  /**
   * If creating a new table name for arrays and blocks, this suffix should be appended to the table name
   */
  tableNameSuffix?: string
  /**
   * The raw value of the query before sanitization
   */
  value: unknown
}
/**
 * Transforms path to table and column name or to a list of OR columns
 * Adds tables to `join`
 * @returns TableColumn
 */
export const getTableColumnFromPath = ({
  adapter,
  aliasTable,
  collectionPath,
  columnPrefix = '',
  constraintPath: incomingConstraintPath,
  constraints = [],
  fields,
  joins,
  locale: incomingLocale,
  pathSegments: incomingSegments,
  rootTableName: incomingRootTableName,
  selectFields,
  tableName,
  tableNameSuffix = '',
  value,
}: Args): TableColumn => {
  const fieldPath = incomingSegments[0]
  let locale = incomingLocale
  const rootTableName = incomingRootTableName || tableName
  let constraintPath = incomingConstraintPath || ''

  const field = flattenTopLevelFields(fields as Field[]).find(
    (fieldToFind) => fieldAffectsData(fieldToFind) && fieldToFind.name === fieldPath,
  ) as Field | TabAsField
  let newTableName = tableName

  if (!field && fieldPath === 'id') {
    selectFields.id = adapter.tables[newTableName].id
    return {
      columnName: 'id',
      constraints,
      field: {
        name: 'id',
        type: adapter.idType === 'uuid' ? 'text' : 'number',
      } as NumberField | TextField,
      table: adapter.tables[newTableName],
    }
  }

  if (field) {
    const pathSegments = [...incomingSegments]

    // If next segment is a locale,
    // we need to take it out and use it as the locale from this point on
    if ('localized' in field && field.localized && adapter.payload.config.localization) {
      const matchedLocale = adapter.payload.config.localization.localeCodes.find(
        (locale) => locale === pathSegments[1],
      )

      if (matchedLocale) {
        locale = matchedLocale
        pathSegments.splice(1, 1)
      }
    }

    switch (field.type) {
      case 'tabs': {
        return getTableColumnFromPath({
          adapter,
          aliasTable,
          collectionPath,
          columnPrefix,
          constraintPath,
          constraints,
          fields: field.tabs.map((tab) => ({
            ...tab,
            type: 'tab',
          })),
          joins,
          locale,
          pathSegments: pathSegments.slice(1),
          rootTableName,
          selectFields,
          tableName: newTableName,
          tableNameSuffix,
          value,
        })
      }
      case 'tab': {
        if (tabHasName(field)) {
          return getTableColumnFromPath({
            adapter,
            aliasTable,
            collectionPath,
            columnPrefix: `${columnPrefix}${field.name}_`,
            constraintPath: `${constraintPath}${field.name}.`,
            constraints,
            fields: field.fields,
            joins,
            locale,
            pathSegments: pathSegments.slice(1),
            rootTableName,
            selectFields,
            tableName: newTableName,
            tableNameSuffix: `${tableNameSuffix}${toSnakeCase(field.name)}_`,
            value,
          })
        }
        return getTableColumnFromPath({
          adapter,
          aliasTable,
          collectionPath,
          columnPrefix,
          constraintPath,
          constraints,
          fields: field.fields,
          joins,
          locale,
          pathSegments: pathSegments.slice(1),
          rootTableName,
          selectFields,
          tableName: newTableName,
          tableNameSuffix,
          value,
        })
      }

      case 'group': {
        if (locale && field.localized && adapter.payload.config.localization) {
          newTableName = `${tableName}${adapter.localesSuffix}`

          let condition = eq(adapter.tables[tableName].id, adapter.tables[newTableName]._parentID)

          if (locale !== 'all') {
            condition = and(condition, eq(adapter.tables[newTableName]._locale, locale))
          }

          addJoinTable({
            condition,
            joins,
            table: adapter.tables[newTableName],
          })
        }
        return getTableColumnFromPath({
          adapter,
          aliasTable,
          collectionPath,
          columnPrefix: `${columnPrefix}${field.name}_`,
          constraintPath: `${constraintPath}${field.name}.`,
          constraints,
          fields: field.fields,
          joins,
          locale,
          pathSegments: pathSegments.slice(1),
          rootTableName,
          selectFields,
          tableName: newTableName,
          tableNameSuffix: `${tableNameSuffix}${toSnakeCase(field.name)}_`,
          value,
        })
      }

      case 'select': {
        if (field.hasMany) {
          const newTableName = adapter.tableNameMap.get(
            `${tableName}_${tableNameSuffix}${toSnakeCase(field.name)}`,
          )

          if (locale && field.localized && adapter.payload.config.localization) {
            const conditions = [
              eq(adapter.tables[tableName].id, adapter.tables[newTableName].parent),
              eq(adapter.tables[newTableName]._locale, locale),
            ]

            if (locale !== 'all') {
              conditions.push(eq(adapter.tables[newTableName]._locale, locale))
            }

            addJoinTable({
              condition: and(...conditions),
              joins,
              table: adapter.tables[newTableName],
            })
          } else {
            addJoinTable({
              condition: eq(adapter.tables[tableName].id, adapter.tables[newTableName].parent),
              joins,
              table: adapter.tables[newTableName],
            })
          }

          return {
            columnName: 'value',
            constraints,
            field,
            table: adapter.tables[newTableName],
          }
        }
        break
      }

      case 'text':
      case 'number': {
        if (field.hasMany) {
          let tableType = 'texts'
          let columnName = 'text'
          if (field.type === 'number') {
            tableType = 'numbers'
            columnName = 'number'
          }
          newTableName = `${rootTableName}_${tableType}`
          const joinConstraints = [
            eq(adapter.tables[rootTableName].id, adapter.tables[newTableName].parent),
            like(adapter.tables[newTableName].path, `${constraintPath}${field.name}`),
          ]

          if (locale && field.localized && adapter.payload.config.localization) {
            const conditions = [...joinConstraints]

            if (locale !== 'all') {
              conditions.push(eq(adapter.tables[newTableName]._locale, locale))
            }
            addJoinTable({
              condition: and(...conditions),
              joins,
              table: adapter.tables[newTableName],
            })
          } else {
            addJoinTable({
              condition: and(...joinConstraints),
              joins,
              table: adapter.tables[newTableName],
            })
          }

          return {
            columnName,
            constraints,
            field,
            table: adapter.tables[newTableName],
          }
        }
        break
      }

      case 'array': {
        newTableName = adapter.tableNameMap.get(
          `${tableName}_${tableNameSuffix}${toSnakeCase(field.name)}`,
        )

        const arrayParentTable = aliasTable || adapter.tables[tableName]

        constraintPath = `${constraintPath}${field.name}.%.`
        if (locale && field.localized && adapter.payload.config.localization) {
          const conditions = [eq(arrayParentTable.id, adapter.tables[newTableName]._parentID)]

          if (locale !== 'all') {
            conditions.push(eq(adapter.tables[newTableName]._locale, locale))
          }
          addJoinTable({
            condition: and(...conditions),
            joins,
            table: adapter.tables[newTableName],
          })
        } else {
          addJoinTable({
            condition: eq(arrayParentTable.id, adapter.tables[newTableName]._parentID),
            joins,
            table: adapter.tables[newTableName],
          })
        }
        return getTableColumnFromPath({
          adapter,
          collectionPath,
          constraintPath,
          constraints,
          fields: field.fields,
          joins,
          locale,
          pathSegments: pathSegments.slice(1),
          rootTableName,
          selectFields,
          tableName: newTableName,
          value,
        })
      }

      case 'blocks': {
        let blockTableColumn: TableColumn
        let newTableName: string

        // handle blockType queries
        if (pathSegments[1] === 'blockType') {
          // find the block config using the value
          const blockTypes = Array.isArray(value) ? value : [value]
          blockTypes.forEach((blockType) => {
            const block = field.blocks.find((block) => block.slug === blockType)
            newTableName = adapter.tableNameMap.get(
              `${tableName}_blocks_${toSnakeCase(block.slug)}`,
            )

            const { newAliasTable } = getTableAlias({ adapter, tableName: newTableName })

            joins.push({
              condition: eq(adapter.tables[tableName].id, newAliasTable._parentID),
              table: newAliasTable,
            })
            constraints.push({
              columnName: '_path',
              table: newAliasTable,
              value: pathSegments[0],
            })
          })
          return {
            constraints,
            field,
            getNotNullColumnByValue: () => 'id',
            table: adapter.tables[tableName],
          }
        }

        const hasBlockField = field.blocks.some((block) => {
          newTableName = adapter.tableNameMap.get(`${tableName}_blocks_${toSnakeCase(block.slug)}`)
          constraintPath = `${constraintPath}${field.name}.%.`

          let result
          const blockConstraints = []
          const blockSelectFields = {}
          try {
            result = getTableColumnFromPath({
              adapter,
              collectionPath,
              constraintPath,
              constraints: blockConstraints,
              fields: block.fields,
              joins,
              locale,
              pathSegments: pathSegments.slice(1),
              rootTableName,
              selectFields: blockSelectFields,
              tableName: newTableName,
              value,
            })
          } catch (error) {
            // this is fine, not every block will have the field
          }
          if (!result) {
            return
          }
          blockTableColumn = result
          constraints = constraints.concat(blockConstraints)
          selectFields = { ...selectFields, ...blockSelectFields }
          if (field.localized && adapter.payload.config.localization) {
            const conditions = [
              eq(
                (aliasTable || adapter.tables[tableName]).id,
                adapter.tables[newTableName]._parentID,
              ),
            ]

            if (locale !== 'all') {
              conditions.push(eq(adapter.tables[newTableName]._locale, locale))
            }

            joins.push({
              condition: and(...conditions),
              table: adapter.tables[newTableName],
            })
          } else {
            joins.push({
              condition: eq(
                (aliasTable || adapter.tables[tableName]).id,
                adapter.tables[newTableName]._parentID,
              ),
              table: adapter.tables[newTableName],
            })
          }
          return true
        })
        if (hasBlockField) {
          return {
            columnName: blockTableColumn.columnName,
            constraints,
            field: blockTableColumn.field,
            pathSegments: pathSegments.slice(1),
            rawColumn: blockTableColumn.rawColumn,
            table: blockTableColumn.table,
          }
        }
        break
      }

      case 'relationship':
      case 'upload': {
        const newCollectionPath = pathSegments.slice(1).join('.')
        if (Array.isArray(field.relationTo) || field.hasMany) {
          let relationshipFields
          const relationTableName = `${rootTableName}${adapter.relationshipsSuffix}`
          const {
            newAliasTable: aliasRelationshipTable,
            newAliasTableName: aliasRelationshipTableName,
          } = getTableAlias({ adapter, tableName: relationTableName })

          // Join in the relationships table
          if (locale && field.localized && adapter.payload.config.localization) {
            const conditions = [
              eq((aliasTable || adapter.tables[rootTableName]).id, aliasRelationshipTable.parent),
              like(aliasRelationshipTable.path, `${constraintPath}${field.name}`),
            ]

            if (locale !== 'all') {
              conditions.push(eq(aliasRelationshipTable.locale, locale))
            }
            joins.push({
              condition: and(...conditions),
              table: aliasRelationshipTable,
            })
          } else {
            // Join in the relationships table
            joins.push({
              condition: and(
                eq((aliasTable || adapter.tables[rootTableName]).id, aliasRelationshipTable.parent),
                like(aliasRelationshipTable.path, `${constraintPath}${field.name}`),
              ),
              table: aliasRelationshipTable,
            })
          }

          selectFields[`${relationTableName}.path`] = aliasRelationshipTable.path

          let newAliasTable

          if (typeof field.relationTo === 'string') {
            const relationshipConfig = adapter.payload.collections[field.relationTo].config

            newTableName = adapter.tableNameMap.get(toSnakeCase(relationshipConfig.slug))

            // parent to relationship join table
            relationshipFields = relationshipConfig.fields
            ;({ newAliasTable } = getTableAlias({ adapter, tableName: newTableName }))

            joins.push({
              condition: eq(newAliasTable.id, aliasRelationshipTable[`${field.relationTo}ID`]),
              table: newAliasTable,
            })

            if (newCollectionPath === '' || newCollectionPath === 'id') {
              return {
                columnName: `${field.relationTo}ID`,
                constraints,
                field,
                table: aliasRelationshipTable,
              }
            }
          } else if (newCollectionPath === 'value') {
            const hasCustomCollectionWithCustomID = field.relationTo.some(
              (relationTo) => !!adapter.payload.collections[relationTo].customIDType,
            )

            const columns: TableColumn['columns'] = field.relationTo
              .map((relationTo) => {
                let idType: 'number' | 'text' | 'uuid' =
                  adapter.idType === 'uuid' ? 'uuid' : 'number'

                const { customIDType } = adapter.payload.collections[relationTo]

                if (customIDType) {
                  idType = customIDType
                }

                const idTypeTextOrUuid = idType === 'text' || idType === 'uuid'

                // Do not add the column to OR if we know that it can't match by the type
                // We can't do the same with idType: 'number' because `value` can be from the REST search query params
                if (typeof value === 'number' && idTypeTextOrUuid) {
                  return null
                }

                if (
                  Array.isArray(value) &&
                  value.every((val) => typeof val === 'number') &&
                  idTypeTextOrUuid
                ) {
                  return null
                }

                // Do not add the UUID type column if incoming query value doesn't match UUID. If there aren't any collections with
                // a custom ID type, we skip this check
                // We need this because Postgres throws an error if querying by UUID column with a value that isn't a valid UUID.
                if (
                  value &&
                  !Array.isArray(value) &&
                  idType === 'uuid' &&
                  hasCustomCollectionWithCustomID
                ) {
                  if (!uuidValidate(value)) {
                    return null
                  }
                }

                if (
                  Array.isArray(value) &&
                  idType === 'uuid' &&
                  hasCustomCollectionWithCustomID &&
                  !value.some((val) => uuidValidate(val))
                ) {
                  return null
                }

                const relationTableName = adapter.tableNameMap.get(
                  toSnakeCase(adapter.payload.collections[relationTo].config.slug),
                )

                return {
                  idType,
                  rawColumn: sql.raw(`"${aliasRelationshipTableName}"."${relationTableName}_id"`),
                }
              })
              .filter(Boolean)

            return {
              columns,
              constraints,
              field,
              table: aliasRelationshipTable,
            }
          } else if (newCollectionPath === 'relationTo') {
            const relationTo = Array.isArray(field.relationTo)
              ? field.relationTo
              : [field.relationTo]

            return {
              constraints,
              field,
              getNotNullColumnByValue: (val) => {
                const matchedRelation = relationTo.find((relation) => relation === val)
                if (matchedRelation) {
                  return `${matchedRelation}ID`
                }
                return undefined
              },
              table: aliasRelationshipTable,
            }
          } else if (isPolymorphicRelationship(value)) {
            const { relationTo } = value

            const relationTableName = adapter.tableNameMap.get(
              toSnakeCase(adapter.payload.collections[relationTo].config.slug),
            )

            return {
              constraints,
              field,
              rawColumn: sql.raw(`"${aliasRelationshipTableName}"."${relationTableName}_id"`),
              table: aliasRelationshipTable,
            }
          } else {
            throw new APIError('Not supported')
          }

          return getTableColumnFromPath({
            adapter,
            aliasTable: newAliasTable,
            collectionPath: newCollectionPath,
            constraints,
            fields: relationshipFields,
            joins,
            locale,
            pathSegments: pathSegments.slice(1),
            rootTableName: newTableName,
            selectFields,
            tableName: newTableName,
            value,
          })
        } else if (
          pathSegments.length > 1 &&
          !(pathSegments.length === 2 && pathSegments[1] === 'id')
        ) {
          // simple relationships
          const columnName = `${columnPrefix}${field.name}`
          const newTableName = adapter.tableNameMap.get(
            toSnakeCase(adapter.payload.collections[field.relationTo].config.slug),
          )
          const { newAliasTable } = getTableAlias({ adapter, tableName: newTableName })

          if (field.localized && adapter.payload.config.localization) {
            const { newAliasTable: aliasLocaleTable } = getTableAlias({
              adapter,
              tableName: `${rootTableName}${adapter.localesSuffix}`,
            })

            const condtions = [eq(aliasLocaleTable._parentID, adapter.tables[rootTableName].id)]

            if (locale !== 'all') {
              condtions.push(eq(aliasLocaleTable._locale, locale))
            }

            const localesTable = adapter.tables[`${rootTableName}${adapter.localesSuffix}`]

            addJoinTable({
              condition: and(...condtions),
              joins,
              table: localesTable,
            })

            joins.push({
              condition: eq(localesTable[columnName], newAliasTable.id),
              table: newAliasTable,
            })
          } else {
            joins.push({
              condition: eq(
                newAliasTable.id,
                aliasTable ? aliasTable[columnName] : adapter.tables[tableName][columnName],
              ),
              table: newAliasTable,
            })
          }

          return getTableColumnFromPath({
            adapter,
            aliasTable: newAliasTable,
            collectionPath: newCollectionPath,
            constraintPath: '',
            constraints,
            fields: adapter.payload.collections[field.relationTo].config.fields,
            joins,
            locale,
            pathSegments: pathSegments.slice(1),
            selectFields,
            tableName: newTableName,
            value,
          })
        }
        break
      }

      default: {
        // fall through
        break
      }
    }

    if (fieldAffectsData(field)) {
      let newTable = adapter.tables[newTableName]

      if (field.localized && adapter.payload.config.localization) {
        // If localized, we go to localized table and set aliasTable to undefined
        // so it is not picked up below to be used as targetTable
        const parentTable = aliasTable || adapter.tables[tableName]
        newTableName = `${tableName}${adapter.localesSuffix}`

        newTable = adapter.tables[newTableName]

        let condition = eq(parentTable.id, newTable._parentID)

        if (locale !== 'all') {
          condition = and(condition, eq(newTable._locale, locale))
        }

        addJoinTable({
          condition,
          joins,
          table: newTable,
        })

        aliasTable = undefined
      }

      const targetTable = aliasTable || newTable

      selectFields[`${newTableName}.${columnPrefix}${field.name}`] =
        targetTable[`${columnPrefix}${field.name}`]

      return {
        columnName: `${columnPrefix}${field.name}`,
        constraints,
        field,
        pathSegments,
        table: targetTable,
      }
    }
  }

  throw new APIError(`Cannot find field for path at ${fieldPath}`)
}
