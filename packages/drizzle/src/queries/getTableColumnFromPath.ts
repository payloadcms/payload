import type { SQL, Table } from 'drizzle-orm'
import type { SQLiteTableWithColumns } from 'drizzle-orm/sqlite-core'
import type {
  FlattenedBlock,
  FlattenedField,
  NumberField,
  RelationshipField,
  TextField,
} from 'payload'

import { and, eq, getTableName, like, or, sql } from 'drizzle-orm'
import { type PgTableWithColumns } from 'drizzle-orm/pg-core'
import { APIError, getFieldByPath } from 'payload'
import { fieldShouldBeLocalized, tabHasName } from 'payload/shared'
import toSnakeCase from 'to-snake-case'
import { validate as uuidValidate } from 'uuid'

import type { DrizzleAdapter, GenericColumn } from '../types.js'
import type { BuildQueryJoinAliases } from './buildQuery.js'

import { isPolymorphicRelationship } from '../utilities/isPolymorphicRelationship.js'
import { jsonBuildObject } from '../utilities/json.js'
import { DistinctSymbol } from '../utilities/rawConstraint.js'
import { resolveBlockTableName } from '../utilities/validateExistingBlockIsIdentical.js'
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
  field: FlattenedField
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
  fields: FlattenedField[]
  joins: BuildQueryJoinAliases
  locale?: string
  parentAliasTable?: PgTableWithColumns<any> | SQLiteTableWithColumns<any>
  parentIsLocalized: boolean
  pathSegments: string[]
  queryPath?: string
  rootTableName?: string
  selectFields: Record<string, GenericColumn>
  selectLocale?: boolean
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
  parentAliasTable,
  parentIsLocalized,
  pathSegments: incomingSegments,
  rootTableName: incomingRootTableName,
  selectFields,
  selectLocale,
  tableName,
  tableNameSuffix = '',
  value,
  queryPath: incomingQueryPath,
}: Args): TableColumn => {
  const fieldPath = incomingSegments[0]
  let locale = incomingLocale
  const rootTableName = incomingRootTableName || tableName
  let constraintPath = incomingConstraintPath || ''
  let queryPath = incomingQueryPath || ''

  const field = fields.find((fieldToFind) => fieldToFind.name === fieldPath)
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

  let localizedPathQuery = false
  if (field) {
    const pathSegments = [...incomingSegments]

    const isFieldLocalized = fieldShouldBeLocalized({ field, parentIsLocalized })

    // If next segment is a locale,
    // we need to take it out and use it as the locale from this point on
    if (isFieldLocalized && adapter.payload.config.localization) {
      const matchedLocale = adapter.payload.config.localization.localeCodes.find(
        (locale) => locale === pathSegments[1],
      )

      if (matchedLocale) {
        locale = matchedLocale
        localizedPathQuery = true
        pathSegments.splice(1, 1)
      }
    }

    switch (field.type) {
      case 'array': {
        newTableName = adapter.tableNameMap.get(
          `${tableName}_${tableNameSuffix}${toSnakeCase(field.name)}`,
        )

        const arrayParentTable = aliasTable || adapter.tables[tableName]

        constraintPath = `${constraintPath}${field.name}.%.`
        if (locale && isFieldLocalized && adapter.payload.config.localization) {
          const conditions = [eq(arrayParentTable.id, adapter.tables[newTableName]._parentID)]

          if (selectLocale) {
            selectFields._locale = adapter.tables[newTableName]._locale
          }

          if (locale !== 'all') {
            conditions.push(eq(adapter.tables[newTableName]._locale, locale))
          }
          addJoinTable({
            condition: and(...conditions),
            joins,
            queryPath: `${queryPath}${field.name}._locales`,
            table: adapter.tables[newTableName],
          })
        } else {
          addJoinTable({
            condition: eq(arrayParentTable.id, adapter.tables[newTableName]._parentID),
            joins,
            queryPath: `${queryPath}${field.name}`,
            table: adapter.tables[newTableName],
          })
        }

        return getTableColumnFromPath({
          adapter,
          collectionPath,
          constraintPath,
          constraints,
          fields: field.flattenedFields,
          joins,
          locale,
          parentAliasTable: aliasTable,
          parentIsLocalized: parentIsLocalized || field.localized,
          pathSegments: pathSegments.slice(1),
          queryPath: `${queryPath}${field.name}.`,
          rootTableName,
          selectFields,
          selectLocale,
          tableName: newTableName,
          value,
        })
      }
      case 'blocks': {
        if (adapter.blocksAsJSON) {
          break
        }
        let blockTableColumn: TableColumn
        let newTableName: string

        // handle blockType queries
        if (pathSegments[1] === 'blockType') {
          // find the block config using the value
          const blockTypes = Array.isArray(value) ? value : [value]
          blockTypes.forEach((blockType) => {
            const block =
              adapter.payload.blocks[blockType] ??
              ((field.blockReferences ?? field.blocks).find(
                (block) => typeof block !== 'string' && block.slug === blockType,
              ) as FlattenedBlock | undefined)

            newTableName = resolveBlockTableName(
              block,
              adapter.tableNameMap.get(`${tableName}_blocks_${toSnakeCase(block.slug)}`),
            )

            const { newAliasTable, newAliasTableName } = getTableAlias({ adapter, tableName: newTableName })
            const queryPathToFind = `${queryPath}${pathSegments[0]}.${blockType}`

            addJoinTable({
              condition: eq(adapter.tables[tableName].id, newAliasTable._parentID),
              joins,
              queryPath: queryPathToFind,
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

        const hasBlockField = (field.blockReferences ?? field.blocks).some((_block) => {
          const block = typeof _block === 'string' ? adapter.payload.blocks[_block] : _block

          newTableName = resolveBlockTableName(
            block,
            adapter.tableNameMap.get(`${tableName}_blocks_${toSnakeCase(block.slug)}`),
          )

          constraintPath = `${constraintPath}${field.name}.%.`
          const newBlockQueryPath = `${queryPath}${field.name}.`

          let result: TableColumn
          const blockConstraints = []
          const blockSelectFields = {}

          let blockJoin: BuildQueryJoinAliases[0]
          if (isFieldLocalized && adapter.payload.config.localization) {
            const conditions = [
              eq(
                (aliasTable || adapter.tables[tableName]).id,
                adapter.tables[newTableName]._parentID,
              ),
            ]

            if (locale !== 'all') {
              conditions.push(eq(adapter.tables[newTableName]._locale, locale))
            }

            blockJoin = {
              condition: and(...conditions),
              table: adapter.tables[newTableName],
            }
          } else {
            blockJoin = {
              condition: eq(
                (aliasTable || adapter.tables[tableName]).id,
                adapter.tables[newTableName]._parentID,
              ),
              table: adapter.tables[newTableName],
            }
          }

          // Create a new reference for nested joins
          const newJoins = [...joins]

          try {
            result = getTableColumnFromPath({
              adapter,
              collectionPath,
              constraintPath,
              constraints: blockConstraints,
              fields: block.flattenedFields,
              joins: newJoins,
              locale,
              parentIsLocalized: parentIsLocalized || field.localized,
              pathSegments: pathSegments.slice(1),
              queryPath: newBlockQueryPath,
              rootTableName,
              selectFields: blockSelectFields,
              selectLocale,
              tableName: newTableName,
              value,
            })
          } catch (_) {
            // this is fine, not every block will have the field
          }
          if (!result) {
            return
          }
          blockTableColumn = result
          constraints = constraints.concat(blockConstraints)
          selectFields = { ...selectFields, ...blockSelectFields }

          const previousLength = joins.length
          joins.push(blockJoin)
          // Append new joins AFTER the block join to prevent errors with missing FROM clause.
          if (newJoins.length > previousLength) {
            for (let i = previousLength; i < newJoins.length; i++) {
              joins.push(newJoins[i])
            }
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

      case 'group': {
        if (locale && isFieldLocalized && adapter.payload.config.localization) {
          newTableName = `${tableName}${adapter.localesSuffix}`

          let condition = eq(adapter.tables[tableName].id, adapter.tables[newTableName]._parentID)

          if (locale !== 'all') {
            condition = and(condition, eq(adapter.tables[newTableName]._locale, locale))
          }

          addJoinTable({
            condition,
            joins,
            queryPath: `${queryPath}${field.name}._locales`,
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
          fields: field.flattenedFields,
          joins,
          locale,
          parentIsLocalized: parentIsLocalized || field.localized,
          pathSegments: pathSegments.slice(1),
          queryPath: `${queryPath}${field.name}.`,
          rootTableName,
          selectFields,
          selectLocale,
          tableName: newTableName,
          tableNameSuffix: `${tableNameSuffix}${toSnakeCase(field.name)}_`,
          value,
        })
      }

      case 'join': {
        if (Array.isArray(field.collection)) {
          throw new APIError('Not supported')
        }

        const newCollectionPath = pathSegments.slice(1).join('.')

        if (field.hasMany) {
          const relationTableName = `${adapter.tableNameMap.get(toSnakeCase(field.collection))}${adapter.relationshipsSuffix}`

          const existingTable = joins.find(
            (e) => e.queryPath === `${queryPath}${field.name}._rels`,
          )

          const aliasRelationshipTable = (existingTable?.table ??
            getTableAlias({
              adapter,
              tableName: relationTableName,
            }).newAliasTable) as PgTableWithColumns<any>

          const relationshipField = getFieldByPath({
            fields: adapter.payload.collections[field.collection].config.flattenedFields,
            path: field.on,
          })
          if (!relationshipField) {
            throw new APIError('Relationship was not found')
          }

          if (!existingTable) {
            addJoinTable({
              condition: and(
                eq(
                  adapter.tables[rootTableName].id,
                  aliasRelationshipTable[
                    `${(relationshipField.field as RelationshipField).relationTo as string}ID`
                  ],
                ),
                like(aliasRelationshipTable.path, field.on),
              ),
              joins,
              queryPath: `${constraintPath}${field.name}._rels`,
              table: aliasRelationshipTable,
            })
          }

          if (newCollectionPath === 'id') {
            return {
              columnName: 'parent',
              constraints,
              field: {
                name: 'id',
                type: adapter.idType === 'uuid' ? 'text' : 'number',
              } as NumberField | TextField,
              table: aliasRelationshipTable,
            }
          }

          const relationshipConfig = adapter.payload.collections[field.collection].config
          const relationshipTableName = adapter.tableNameMap.get(
            toSnakeCase(relationshipConfig.slug),
          )

          // parent to relationship join table
          const relationshipFields = relationshipConfig.flattenedFields

          const existingMainTable = joins.find(
            (e) => e.queryPath === `${queryPath}${field.name}`,
          )

          const relationshipTable = (existingMainTable?.table ??
            getTableAlias({
              adapter,
              tableName: relationshipTableName,
            }).newAliasTable) as PgTableWithColumns<any>

          addJoinTable({
            condition: eq(aliasRelationshipTable.parent, relationshipTable.id),
            joins,
            queryPath: `${queryPath}${field.name}`,
            table: relationshipTable,
          })

          return getTableColumnFromPath({
            adapter,
            aliasTable: relationshipTable,
            collectionPath: newCollectionPath,
            constraints,
            // relationshipFields are fields from a different collection => no parentIsLocalized
            fields: relationshipFields,
            joins,
            locale,
            parentIsLocalized: false,
            pathSegments: pathSegments.slice(1),
            queryPath: `${queryPath}${field.name}.`,
            rootTableName: relationshipTableName,
            selectFields,
            selectLocale,
            tableName: relationshipTableName,
            value,
          })
        }

        const newTableName = adapter.tableNameMap.get(
          toSnakeCase(adapter.payload.collections[field.collection].config.slug),
        )

        const existingTable = joins.find(
          (e) => e.queryPath === `${queryPath}${field.name}`,
        )?.table
        const newAliasTable =
          existingTable || getTableAlias({ adapter, tableName: newTableName }).newAliasTable

        if (!existingTable) {
          addJoinTable({
            condition: eq(
              newAliasTable[field.on.replaceAll('.', '_')],
              aliasTable ? aliasTable.id : adapter.tables[tableName].id,
            ),
            joins,
            queryPath: `${queryPath}${field.name}`,
            table: newAliasTable,
          })
        }

        if (newCollectionPath === 'id') {
          return {
            columnName: 'id',
            constraints,
            field: {
              name: 'id',
              type: adapter.idType === 'uuid' ? 'text' : 'number',
            } as NumberField | TextField,
            table: newAliasTable,
          }
        }

        return getTableColumnFromPath({
          adapter,
          aliasTable: newAliasTable,
          collectionPath: newCollectionPath,
          constraintPath: '',
          constraints,
          fields: adapter.payload.collections[field.collection].config.flattenedFields,
          joins,
          locale,
          parentIsLocalized: parentIsLocalized || field.localized,
          pathSegments: pathSegments.slice(1),
          queryPath: `${queryPath}${field.name}.`,
          selectFields,
          tableName: newTableName,
          value,
        })

        break
      }

      case 'number':
      case 'text': {
        if (field.hasMany) {
          let tableType = 'texts'
          let columnName = 'text'
          if (field.type === 'number') {
            tableType = 'numbers'
            columnName = 'number'
          }
          newTableName = `${rootTableName}_${tableType}`

          const existingTable = joins.find((e) => e.queryPath === `${queryPath}${field.name}`)

          const table = (existingTable?.table ??
            getTableAlias({ adapter, tableName: newTableName })
              .newAliasTable) as PgTableWithColumns<any>

          const joinConstraints = [
            eq(adapter.tables[rootTableName].id, table.parent),
            like(table.path, `${constraintPath}${field.name}`),
          ]

          if (locale && isFieldLocalized && adapter.payload.config.localization) {
            const conditions = [...joinConstraints]

            if (locale !== 'all') {
              conditions.push(eq(table._locale, locale))
            }

            addJoinTable({
              condition: and(...conditions),
              joins,
              queryPath: `${queryPath}${field.name}`,
              table,
            })
          } else {
            addJoinTable({
              condition: and(...joinConstraints),
              joins,
              queryPath: `${queryPath}${field.name}`,
              table,
            })
          }

          return {
            columnName,
            constraints,
            field,
            table,
          }
        }
        break
      }
      case 'relationship':
      case 'upload': {
        const newCollectionPath = pathSegments.slice(1).join('.')

        if (Array.isArray(field.relationTo) || field.hasMany) {
          let relationshipFields: FlattenedField[]
          const relationTableName = `${rootTableName}${adapter.relationshipsSuffix}`

          const existingJoin = joins.find((e) => e.queryPath === `${queryPath}${field.name}`)

          let aliasRelationshipTable: PgTableWithColumns<any> | SQLiteTableWithColumns<any>
          let aliasRelationshipTableName: string
          if (existingJoin) {
            aliasRelationshipTable = existingJoin.table
            aliasRelationshipTableName = getTableName(existingJoin.table)
          } else {
            const res = getTableAlias({
              adapter,
              tableName: relationTableName,
            })
            aliasRelationshipTable = res.newAliasTable
            aliasRelationshipTableName = res.newAliasTableName
          }

          if (selectLocale && isFieldLocalized && adapter.payload.config.localization) {
            selectFields._locale = aliasRelationshipTable.locale
          }

          // Join in the relationships table
          if (locale && isFieldLocalized && adapter.payload.config.localization) {
            const conditions = [
              eq(
                (parentAliasTable || aliasTable || adapter.tables[rootTableName]).id,
                aliasRelationshipTable.parent,
              ),
              like(aliasRelationshipTable.path, `${constraintPath}${field.name}`),
            ]

            if (locale !== 'all') {
              conditions.push(eq(aliasRelationshipTable.locale, locale))
            }

            addJoinTable({
              condition: and(...conditions),
              joins,
              queryPath: `${queryPath}${field.name}`,
              table: aliasRelationshipTable,
            })
          } else {
            // Join in the relationships table
            addJoinTable({
              condition: and(
                eq(
                  (parentAliasTable || aliasTable || adapter.tables[rootTableName]).id,
                  aliasRelationshipTable.parent,
                ),
                like(aliasRelationshipTable.path, `${constraintPath}${field.name}`),
              ),
              joins,
              queryPath: `${queryPath}${field.name}`,
              table: aliasRelationshipTable,
            })
          }

          selectFields[`${relationTableName}.path`] = aliasRelationshipTable.path

          let newAliasTable

          if (typeof field.relationTo === 'string') {
            const relationshipConfig = adapter.payload.collections[field.relationTo].config

            newTableName = adapter.tableNameMap.get(toSnakeCase(relationshipConfig.slug))

            // parent to relationship join table
            relationshipFields = relationshipConfig.flattenedFields
            ;({ newAliasTable } = getTableAlias({ adapter, tableName: newTableName }))

            addJoinTable({
              condition: eq(newAliasTable.id, aliasRelationshipTable[`${field.relationTo}ID`]),
              joins,
              queryPath: `${queryPath}${field.name}._target`,
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
          } else if (value === DistinctSymbol) {
            const obj: Record<string, SQL> = {}

            field.relationTo.forEach((relationTo) => {
              const relationTableName = adapter.tableNameMap.get(
                toSnakeCase(adapter.payload.collections[relationTo].config.slug),
              )

              obj[relationTo] = sql.raw(`"${aliasRelationshipTableName}"."${relationTableName}_id"`)
            })

            let rawColumn = jsonBuildObject(adapter, obj)
            if (adapter.name === 'postgres') {
              rawColumn = sql`${rawColumn}::text`
            }

            return {
              constraints,
              field,
              rawColumn,
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
            // relationshipFields are fields from a different collection => no parentIsLocalized
            fields: relationshipFields,
            joins,
            locale,
            parentIsLocalized: false,
            pathSegments: pathSegments.slice(1),
            queryPath: `${queryPath}${field.name}.`,
            rootTableName: newTableName,
            selectFields,
            selectLocale,
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

          const queryPathToFind = `${queryPath}${field.name}`
          const existingJoin = joins.find((e) => e.queryPath === queryPathToFind)

          const newAliasTable = (existingJoin?.table ||
            getTableAlias({ adapter, tableName: newTableName })
              .newAliasTable) as PgTableWithColumns<any>

          if (isFieldLocalized && adapter.payload.config.localization) {
            const { newAliasTable: aliasLocaleTable } = getTableAlias({
              adapter,
              tableName: `${rootTableName}${adapter.localesSuffix}`,
            })

            const condtions = [eq(aliasLocaleTable._parentID, adapter.tables[rootTableName].id)]

            if (selectLocale) {
              selectFields._locale = aliasLocaleTable._locale
            }

            if (locale !== 'all') {
              condtions.push(eq(aliasLocaleTable._locale, locale))
            }

            const localesTable = adapter.tables[`${rootTableName}${adapter.localesSuffix}`]

            addJoinTable({
              condition: and(...condtions),
              joins,
              queryPath: `${queryPath}${field.name}._locales`,
              table: localesTable,
            })

            addJoinTable({
              condition: eq(localesTable[columnName], newAliasTable.id),
              joins,
              queryPath: queryPathToFind,
              table: newAliasTable,
            })
          } else {
            addJoinTable({
              condition: eq(
                newAliasTable.id,
                aliasTable ? aliasTable[columnName] : adapter.tables[tableName][columnName],
              ),
              joins,
              queryPath: queryPathToFind,
              table: newAliasTable,
            })
          }

          return getTableColumnFromPath({
            adapter,
            aliasTable: newAliasTable,
            collectionPath: newCollectionPath,
            constraintPath: '',
            constraints,
            fields: adapter.payload.collections[field.relationTo].config.flattenedFields,
            joins,
            locale,
            parentIsLocalized: parentIsLocalized || field.localized,
            pathSegments: pathSegments.slice(1),
            queryPath: `${queryPath}${field.name}.`,
            selectFields,
            tableName: newTableName,
            value,
          })
        }

        break
      }

      case 'select': {
        if (field.hasMany) {
          const newTableName = adapter.tableNameMap.get(
            `${tableName}_${tableNameSuffix}${toSnakeCase(field.name)}`,
          )

          const idColumn = (aliasTable ?? adapter.tables[tableName]).id
          if (locale && isFieldLocalized && adapter.payload.config.localization) {
            const conditions = [
              eq(idColumn, adapter.tables[newTableName].parent),
              eq(adapter.tables[newTableName]._locale, locale),
            ]

            if (locale !== 'all') {
              conditions.push(eq(adapter.tables[newTableName]._locale, locale))
            }

            addJoinTable({
              condition: and(...conditions),
              joins,
              queryPath: `${queryPath}${field.name}._locales`,
              table: adapter.tables[newTableName],
            })
          } else {
            addJoinTable({
              condition: eq(idColumn, adapter.tables[newTableName].parent),
              joins,
              queryPath: `${queryPath}${field.name}`,
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

      case 'tab': {
        if (tabHasName(field)) {
          return getTableColumnFromPath({
            adapter,
            aliasTable,
            collectionPath,
            columnPrefix: `${columnPrefix}${field.name}_`,
            constraintPath: `${constraintPath}${field.name}.`,
            constraints,
            fields: field.flattenedFields,
            joins,
            locale,
            parentIsLocalized: parentIsLocalized || field.localized,
            pathSegments: pathSegments.slice(1),
            queryPath: `${queryPath}${field.name}.`,
            rootTableName,
            selectFields,
            selectLocale,
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
          fields: field.flattenedFields,
          joins,
          locale,
          parentIsLocalized: parentIsLocalized || field.localized,
          pathSegments: pathSegments.slice(1),
          queryPath,
          rootTableName,
          selectFields,
          selectLocale,
          tableName: newTableName,
          tableNameSuffix,
          value,
        })
      }

      default: {
        // fall through
        break
      }
    }

    let newTable = adapter.tables[newTableName]

    if (isFieldLocalized && adapter.payload.config.localization) {
      // If localized, we go to localized table and set aliasTable to undefined
      // so it is not picked up below to be used as targetTable
      const parentTable = aliasTable || adapter.tables[tableName]
      newTableName = `${tableName}${adapter.localesSuffix}`

      // use an alias because the same query may contain constraints with different locale value
      if (localizedPathQuery) {
        const { newAliasTable } = getTableAlias({ adapter, tableName: newTableName })
        newTable = newAliasTable
      } else {
        newTable = adapter.tables[newTableName]
      }

      let condition = eq(parentTable.id, newTable._parentID)

      if (locale !== 'all') {
        condition = and(condition, eq(newTable._locale, locale))
      }

      if (selectLocale) {
        selectFields._locale = newTable._locale
      }

      addJoinTable({
        condition,
        joins,
        queryPath: `${queryPath}${field.name}._locales`,
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

  throw new APIError(`Cannot find field for path at ${fieldPath}`)
}
