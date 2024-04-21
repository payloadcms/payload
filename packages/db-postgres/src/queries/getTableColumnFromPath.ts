/* eslint-disable no-param-reassign */
import type { SQL } from 'drizzle-orm'
import type { PgTableWithColumns } from 'drizzle-orm/pg-core'
import type { Field, FieldAffectingData, NumberField, TabAsField, TextField } from 'payload/types'

import { and, eq, like, sql } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { APIError } from 'payload/errors'
import { fieldAffectsData, tabHasName } from 'payload/types'
import { flattenTopLevelFields } from 'payload/utilities'
import toSnakeCase from 'to-snake-case'
import { v4 as uuid } from 'uuid'

import type { GenericColumn, GenericTable, PostgresAdapter } from '../types.js'
import type { BuildQueryJoinAliases, BuildQueryJoins } from './buildQuery.js'

import { getTableName } from '../schema/getTableName.js'

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
  joinAliases: BuildQueryJoinAliases
  joins: BuildQueryJoins
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
  joinAliases,
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
          joinAliases,
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
            joinAliases,
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
          joinAliases,
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
          newTableName = getTableName({
            adapter,
            config: field,
            locales: true,
            parentTableName: tableName,
            prefix: `${tableName}_`,
          })

          joins[tableName] = eq(
            adapter.tables[tableName].id,
            adapter.tables[newTableName]._parentID,
          )
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
          joinAliases,
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
          newTableName = getTableName({
            adapter,
            config: field,
            parentTableName: `${tableName}_${tableNameSuffix}`,
            prefix: `${tableName}_${tableNameSuffix}`,
          })

          if (locale && field.localized && adapter.payload.config.localization) {
            joins[newTableName] = and(
              eq(adapter.tables[tableName].id, adapter.tables[newTableName].parent),
              eq(adapter.tables[newTableName]._locale, locale),
            )
            if (locale !== 'all') {
              constraints.push({
                columnName: '_locale',
                table: adapter.tables[newTableName],
                value: locale,
              })
            }
          } else {
            joins[newTableName] = eq(
              adapter.tables[tableName].id,
              adapter.tables[newTableName].parent,
            )
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
            joins[newTableName] = and(
              ...joinConstraints,
              eq(adapter.tables[newTableName]._locale, locale),
            )
            if (locale !== 'all') {
              constraints.push({
                columnName: 'locale',
                table: adapter.tables[newTableName],
                value: locale,
              })
            }
          } else {
            joins[newTableName] = and(...joinConstraints)
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
        newTableName = getTableName({
          adapter,
          config: field,
          parentTableName: `${tableName}_${tableNameSuffix}`,
          prefix: `${tableName}_${tableNameSuffix}`,
        })
        constraintPath = `${constraintPath}${field.name}.%.`
        if (locale && field.localized && adapter.payload.config.localization) {
          joins[newTableName] = and(
            eq(adapter.tables[tableName].id, adapter.tables[newTableName]._parentID),
            eq(adapter.tables[newTableName]._locale, locale),
          )
          if (locale !== 'all') {
            constraints.push({
              columnName: '_locale',
              table: adapter.tables[newTableName],
              value: locale,
            })
          }
        } else {
          joins[newTableName] = eq(
            adapter.tables[tableName].id,
            adapter.tables[newTableName]._parentID,
          )
        }
        return getTableColumnFromPath({
          adapter,
          collectionPath,
          constraintPath,
          constraints,
          fields: field.fields,
          joinAliases,
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
            newTableName = getTableName({
              adapter,
              config: block,
              parentTableName: tableName,
              prefix: `${tableName}_blocks_`,
            })
            joins[newTableName] = eq(
              adapter.tables[tableName].id,
              adapter.tables[newTableName]._parentID,
            )
            constraints.push({
              columnName: '_path',
              table: adapter.tables[newTableName],
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
          newTableName = getTableName({
            adapter,
            config: block,
            parentTableName: tableName,
            prefix: `${tableName}_blocks_`,
          })
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
              joinAliases,
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
            joins[newTableName] = and(
              eq(adapter.tables[tableName].id, adapter.tables[newTableName]._parentID),
              eq(adapter.tables[newTableName]._locale, locale),
            )
            if (locale) {
              constraints.push({
                columnName: '_locale',
                table: adapter.tables[newTableName],
                value: locale,
              })
            }
          } else {
            joins[newTableName] = eq(
              adapter.tables[tableName].id,
              adapter.tables[newTableName]._parentID,
            )
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
        let relationshipFields
        const relationTableName = `${rootTableName}${adapter.relationshipsSuffix}`
        const newCollectionPath = pathSegments.slice(1).join('.')
        const aliasRelationshipTableName = uuid()
        const aliasRelationshipTable = alias(
          adapter.tables[relationTableName],
          aliasRelationshipTableName,
        )

        // Join in the relationships table
        if (locale && field.localized && adapter.payload.config.localization) {
          joinAliases.push({
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
          joinAliases.push({
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
          newTableName = getTableName({
            adapter,
            config: relationshipConfig,
          })
          // parent to relationship join table
          relationshipFields = relationshipConfig.fields

          newAliasTable = alias(adapter.tables[newTableName], toSnakeCase(uuid()))

          joinAliases.push({
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
          const tableColumnsNames = field.relationTo.map(
            (relationTo) =>
              `"${aliasRelationshipTableName}"."${getTableName({
                adapter,
                config: adapter.payload.collections[relationTo].config,
              })}_id"`,
          )
          return {
            constraints,
            field,
            rawColumn: sql.raw(`COALESCE(${tableColumnsNames.join(', ')})`),
            table: aliasRelationshipTable,
          }
        } else if (newCollectionPath === 'relationTo') {
          const relationTo = Array.isArray(field.relationTo) ? field.relationTo : [field.relationTo]

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
          joinAliases,
          joins,
          locale,
          pathSegments: pathSegments.slice(1),
          rootTableName: newTableName,
          selectFields,
          tableName: newTableName,
          value,
        })
      }
    }

    if (fieldAffectsData(field)) {
      if (field.localized && adapter.payload.config.localization) {
        // If localized, we go to localized table and set aliasTable to undefined
        // so it is not picked up below to be used as targetTable
        newTableName = `${tableName}${adapter.localesSuffix}`

        const parentTable = aliasTable || adapter.tables[tableName]

        joins[newTableName] = eq(parentTable.id, adapter.tables[newTableName]._parentID)

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
