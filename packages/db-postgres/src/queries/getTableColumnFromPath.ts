/* eslint-disable no-param-reassign */
import type { SQL } from 'drizzle-orm'
import type { PgTableWithColumns } from 'drizzle-orm/pg-core'
import type { Field, FieldAffectingData, NumberField, TabAsField, TextField } from 'payload'

import { and, eq, like, sql } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { APIError, flattenTopLevelFields } from 'payload'
import { fieldAffectsData, tabHasName } from 'payload/shared'
import toSnakeCase from 'to-snake-case'
import { v4 as uuid } from 'uuid'

import type { GenericColumn, GenericTable, PostgresAdapter } from '../types.js'
import type { BuildQueryJoinAliases } from './buildQuery.js'

type Constraint = {
  columnName: string
  table: GenericTable | PgTableWithColumns<any>
  value: unknown
}

type TableColumn = {
  columnName?: string
  constraints: Constraint[]
  field: FieldAffectingData
  getNotNullColumnByValue?: (val: unknown) => string
  pathSegments?: string[]
  rawColumn?: SQL
  table: GenericTable | PgTableWithColumns<any>
}

type Args = {
  adapter: PostgresAdapter
  aliasTable?: GenericTable | PgTableWithColumns<any>
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
 * Transforms path to table and column name
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

          joins.push({
            condition: eq(adapter.tables[tableName].id, adapter.tables[newTableName]._parentID),
            table: adapter.tables[newTableName],
          })
          if (locale !== 'all') {
            constraints.push({
              columnName: '_locale',
              table: adapter.tables[newTableName],
              value: locale,
            })
          }
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
            joins.push({
              condition: and(
                eq(adapter.tables[tableName].id, adapter.tables[newTableName].parent),
                eq(adapter.tables[newTableName]._locale, locale),
              ),
              table: adapter.tables[newTableName],
            })
            if (locale !== 'all') {
              constraints.push({
                columnName: '_locale',
                table: adapter.tables[newTableName],
                value: locale,
              })
            }
          } else {
            joins.push({
              condition: eq(adapter.tables[tableName].id, adapter.tables[newTableName].parent),
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
          newTableName = `${tableName}_${tableType}`
          const joinConstraints = [
            eq(adapter.tables[tableName].id, adapter.tables[newTableName].parent),
            eq(adapter.tables[newTableName].path, `${constraintPath}${field.name}`),
          ]

          if (locale && field.localized && adapter.payload.config.localization) {
            joins.push({
              condition: and(...joinConstraints, eq(adapter.tables[newTableName]._locale, locale)),
              table: adapter.tables[newTableName],
            })
            if (locale !== 'all') {
              constraints.push({
                columnName: 'locale',
                table: adapter.tables[newTableName],
                value: locale,
              })
            }
          } else {
            joins.push({
              condition: and(...joinConstraints),
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

        constraintPath = `${constraintPath}${field.name}.%.`
        if (locale && field.localized && adapter.payload.config.localization) {
          joins.push({
            condition: and(
              eq(adapter.tables[tableName].id, adapter.tables[newTableName]._parentID),
              eq(adapter.tables[newTableName]._locale, locale),
            ),
            table: adapter.tables[newTableName],
          })
          if (locale !== 'all') {
            constraints.push({
              columnName: '_locale',
              table: adapter.tables[newTableName],
              value: locale,
            })
          }
        } else {
          joins.push({
            condition: eq(adapter.tables[tableName].id, adapter.tables[newTableName]._parentID),
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
            const newAliasTableName = toSnakeCase(uuid())
            const newAliasTable = alias(adapter.tables[newTableName], newAliasTableName)

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
            joins.push({
              condition: and(
                eq(
                  (aliasTable || adapter.tables[tableName]).id,
                  adapter.tables[newTableName]._parentID,
                ),
                eq(adapter.tables[newTableName]._locale, locale),
              ),
              table: adapter.tables[newTableName],
            })
            if (locale) {
              constraints.push({
                columnName: '_locale',
                table: adapter.tables[newTableName],
                value: locale,
              })
            }
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
        if (Array.isArray(field.relationTo) || (field.type === 'relationship' && field.hasMany)) {
          let relationshipFields
          const relationTableName = `${rootTableName}${adapter.relationshipsSuffix}`
          const aliasRelationshipTableName = uuid()
          const aliasRelationshipTable = alias(
            adapter.tables[relationTableName],
            aliasRelationshipTableName,
          )

          // Join in the relationships table
          if (locale && field.localized && adapter.payload.config.localization) {
            joins.push({
              condition: and(
                eq((aliasTable || adapter.tables[rootTableName]).id, aliasRelationshipTable.parent),
                eq(aliasRelationshipTable.locale, locale),
                like(aliasRelationshipTable.path, `${constraintPath}${field.name}`),
              ),
              table: aliasRelationshipTable,
            })
            if (locale !== 'all') {
              constraints.push({
                columnName: 'locale',
                table: aliasRelationshipTable,
                value: locale,
              })
            }
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

            newAliasTable = alias(adapter.tables[newTableName], toSnakeCase(uuid()))

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
            const tableColumnsNames = field.relationTo.map((relationTo) => {
              const relationTableName = adapter.tableNameMap.get(
                toSnakeCase(adapter.payload.collections[relationTo].config.slug),
              )

              return `"${aliasRelationshipTableName}"."${relationTableName}_id"`
            })
            return {
              constraints,
              field,
              rawColumn: sql.raw(`COALESCE(${tableColumnsNames.join(', ')})`),
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
                if (matchedRelation) return `${matchedRelation}ID`
                return undefined
              },
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
          const aliasTableName = uuid()
          const newAliasTable = alias(adapter.tables[newTableName], aliasTableName)

          if (field.localized && adapter.payload.config.localization) {
            const aliasLocaleTableName = uuid()
            const aliasLocaleTable = alias(
              adapter.tables[`${rootTableName}${adapter.localesSuffix}`],
              aliasLocaleTableName,
            )
            joins.push({
              condition: and(
                eq(aliasLocaleTable._parentID, adapter.tables[rootTableName].id),
                eq(aliasLocaleTable._locale, locale),
              ),
              table: aliasLocaleTable,
            })
            joins.push({
              condition: eq(aliasLocaleTable[columnName], newAliasTable.id),
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
      if (field.localized && adapter.payload.config.localization) {
        // If localized, we go to localized table and set aliasTable to undefined
        // so it is not picked up below to be used as targetTable
        const parentTable = aliasTable || adapter.tables[tableName]
        newTableName = `${tableName}${adapter.localesSuffix}`

        joins.push({
          condition: eq(parentTable.id, adapter.tables[newTableName]._parentID),
          table: adapter.tables[newTableName],
        })

        aliasTable = undefined

        if (locale !== 'all') {
          constraints.push({
            columnName: '_locale',
            table: adapter.tables[newTableName],
            value: locale,
          })
        }
      }

      const targetTable = aliasTable || adapter.tables[newTableName]

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
