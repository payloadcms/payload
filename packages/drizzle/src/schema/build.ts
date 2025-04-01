import type { FlattenedField, SanitizedCompoundIndex } from 'payload'

import { InvalidConfiguration } from 'payload'
import toSnakeCase from 'to-snake-case'

import type {
  DrizzleAdapter,
  IDType,
  RawColumn,
  RawForeignKey,
  RawIndex,
  RawRelation,
  RawTable,
  RelationMap,
  SetColumnID,
} from '../types.js'

import { createTableName } from '../createTableName.js'
import { buildIndexName } from '../utilities/buildIndexName.js'
import { traverseFields } from './traverseFields.js'

type Args = {
  adapter: DrizzleAdapter
  baseColumns?: Record<string, RawColumn>
  /**
   * After table is created, run these functions to add extra config to the table
   * ie. indexes, multiple columns, etc
   */
  baseForeignKeys?: Record<string, RawForeignKey>
  /**
   * After table is created, run these functions to add extra config to the table
   * ie. indexes, multiple columns, etc
   */
  baseIndexes?: Record<string, RawIndex>
  buildNumbers?: boolean
  buildRelationships?: boolean
  compoundIndexes?: SanitizedCompoundIndex[]
  disableNotNull: boolean
  disableRelsTableUnique?: boolean
  disableUnique: boolean
  fields: FlattenedField[]
  parentIsLocalized: boolean
  rootRelationships?: Set<string>
  rootRelationsToBuild?: RelationMap
  rootTableIDColType?: IDType
  rootTableName?: string
  rootUniqueRelationships?: Set<string>
  setColumnID: SetColumnID
  tableName: string
  timestamps?: boolean
  versions: boolean
  /**
   * Tracks whether or not this table is built
   * from the result of a localized array or block field at some point
   */
  withinLocalizedArrayOrBlock?: boolean
}

type Result = {
  hasLocalizedManyNumberField: boolean
  hasLocalizedManyTextField: boolean
  hasLocalizedRelationshipField: boolean
  hasManyNumberField: 'index' | boolean
  hasManyTextField: 'index' | boolean
  relationsToBuild: RelationMap
}

export const buildTable = ({
  adapter,
  baseColumns = {},
  baseForeignKeys = {},
  baseIndexes = {},
  compoundIndexes,
  disableNotNull,
  disableRelsTableUnique = false,
  disableUnique = false,
  fields,
  parentIsLocalized,
  rootRelationships,
  rootRelationsToBuild,
  rootTableIDColType,
  rootTableName: incomingRootTableName,
  rootUniqueRelationships,
  setColumnID,
  tableName,
  timestamps,
  versions,
  withinLocalizedArrayOrBlock,
}: Args): Result => {
  const isRoot = !incomingRootTableName
  const rootTableName = incomingRootTableName || tableName
  const columns: Record<string, RawColumn> = baseColumns
  const indexes: Record<string, RawIndex> = baseIndexes

  const localesColumns: Record<string, RawColumn> = {}
  const localesIndexes: Record<string, RawIndex> = {}
  let localesTable: RawTable
  let textsTable: RawTable
  let numbersTable: RawTable

  // Relationships to the base collection
  const relationships: Set<string> = rootRelationships || new Set()

  // Unique relationships to the base collection
  const uniqueRelationships: Set<string> = rootUniqueRelationships || new Set()

  let relationshipsTable: RawTable

  // Drizzle relations
  const relationsToBuild: RelationMap = new Map()

  const idColType: IDType = setColumnID({ adapter, columns, fields })

  const {
    hasLocalizedField,
    hasLocalizedManyNumberField,
    hasLocalizedManyTextField,
    hasLocalizedRelationshipField,
    hasManyNumberField,
    hasManyTextField,
  } = traverseFields({
    adapter,
    columns,
    disableNotNull,
    disableRelsTableUnique,
    disableUnique,
    fields,
    indexes,
    localesColumns,
    localesIndexes,
    newTableName: tableName,
    parentIsLocalized,
    parentTableName: tableName,
    relationships,
    relationsToBuild,
    rootRelationsToBuild: rootRelationsToBuild || relationsToBuild,
    rootTableIDColType: rootTableIDColType || idColType,
    rootTableName,
    setColumnID,
    uniqueRelationships,
    versions,
    withinLocalizedArrayOrBlock,
  })

  // split the relationsToBuild by localized and non-localized
  const localizedRelations = new Map()
  const nonLocalizedRelations = new Map()

  relationsToBuild.forEach(({ type, localized, relationName, target }, key) => {
    const map = localized ? localizedRelations : nonLocalizedRelations
    map.set(key, { type, relationName, target })
  })

  if (timestamps) {
    columns.createdAt = {
      name: 'created_at',
      type: 'timestamp',
      defaultNow: true,
      mode: 'string',
      notNull: true,
      precision: 3,
      withTimezone: true,
    }

    columns.updatedAt = {
      name: 'updated_at',
      type: 'timestamp',
      defaultNow: true,
      mode: 'string',
      notNull: true,
      precision: 3,
      withTimezone: true,
    }
  }

  const table: RawTable = {
    name: tableName,
    columns,
    foreignKeys: baseForeignKeys,
    indexes,
  }

  adapter.rawTables[tableName] = table

  if (hasLocalizedField || localizedRelations.size) {
    const localeTableName = `${tableName}${adapter.localesSuffix}`
    localesColumns.id = {
      name: 'id',
      type: 'serial',
      primaryKey: true,
    }

    localesColumns._locale = {
      name: '_locale',
      type: 'enum',
      locale: true,
      notNull: true,
    }

    localesColumns._parentID = {
      name: '_parent_id',
      type: idColType,
      notNull: true,
    }

    localesIndexes._localeParent = {
      name: `${localeTableName}_locale_parent_id_unique`,
      on: ['_locale', '_parentID'],
      unique: true,
    }

    localesTable = {
      name: localeTableName,
      columns: localesColumns,
      foreignKeys: {
        _parentIdFk: {
          name: `${localeTableName}_parent_id_fk`,
          columns: ['_parentID'],
          foreignColumns: [
            {
              name: 'id',
              table: tableName,
            },
          ],
          onDelete: 'cascade',
        },
      },
      indexes: localesIndexes,
    }

    adapter.rawTables[localeTableName] = localesTable

    const localeRelations: Record<string, RawRelation> = {
      _parentID: {
        type: 'one',
        fields: [
          {
            name: '_parentID',
            table: localeTableName,
          },
        ],
        references: ['id'],
        relationName: '_locales',
        to: tableName,
      },
    }

    localizedRelations.forEach(({ type, target }, key) => {
      if (type === 'one') {
        localeRelations[key] = {
          type: 'one',
          fields: [
            {
              name: key,
              table: localeTableName,
            },
          ],
          references: ['id'],
          relationName: key,
          to: target,
        }
      }
      if (type === 'many') {
        localeRelations[key] = {
          type: 'many',
          relationName: key,
          to: target,
        }
      }
    })
    adapter.rawRelations[localeTableName] = localeRelations
  }

  if (compoundIndexes) {
    for (const index of compoundIndexes) {
      let someLocalized: boolean | null = null
      const columns: string[] = []

      const getTableToUse = () => {
        if (someLocalized) {
          return localesTable
        }

        return table
      }

      for (const { path, pathHasLocalized } of index.fields) {
        if (someLocalized === null) {
          someLocalized = pathHasLocalized
        }

        if (someLocalized !== pathHasLocalized) {
          throw new InvalidConfiguration(
            `Compound indexes within localized and non localized fields are not supported in SQL. Expected ${path} to be ${someLocalized ? 'non' : ''} localized.`,
          )
        }

        const columnPath = path.replaceAll('.', '_')

        if (!getTableToUse().columns[columnPath]) {
          throw new InvalidConfiguration(
            `Column ${columnPath} for compound index on ${path} was not found in the ${getTableToUse().name} table.`,
          )
        }

        columns.push(columnPath)
      }

      if (someLocalized) {
        columns.push('_locale')
      }

      let name = columns.join('_')
      // truncate against the limit, buildIndexName will handle collisions
      if (name.length > 63) {
        name = 'compound_index'
      }

      const indexName = buildIndexName({ name, adapter })

      getTableToUse().indexes[indexName] = {
        name: indexName,
        on: columns,
        unique: disableUnique ? false : index.unique,
      }
    }
  }

  if (isRoot) {
    if (hasManyTextField) {
      const textsTableName = `${rootTableName}_texts`

      const columns: Record<string, RawColumn> = {
        id: {
          name: 'id',
          type: 'serial',
          primaryKey: true,
        },
        order: {
          name: 'order',
          type: 'integer',
          notNull: true,
        },
        parent: {
          name: 'parent_id',
          type: idColType,
          notNull: true,
        },
        path: {
          name: 'path',
          type: 'varchar',

          notNull: true,
        },
        text: {
          name: 'text',
          type: 'varchar',
        },
      }

      if (hasLocalizedManyTextField) {
        columns.locale = {
          name: 'locale',
          type: 'enum',
          locale: true,
        }
      }

      const textsTableIndexes: Record<string, RawIndex> = {
        orderParentIdx: {
          name: `${textsTableName}_order_parent_idx`,
          on: ['order', 'parent'],
        },
      }

      if (hasManyTextField === 'index') {
        textsTableIndexes.text_idx = {
          name: `${textsTableName}_text_idx`,
          on: 'text',
        }
      }

      if (hasLocalizedManyTextField) {
        textsTableIndexes.localeParent = {
          name: `${textsTableName}_locale_parent`,
          on: ['locale', 'parent'],
        }
      }

      textsTable = {
        name: textsTableName,
        columns,
        foreignKeys: {
          parentFk: {
            name: `${textsTableName}_parent_fk`,
            columns: ['parent'],
            foreignColumns: [
              {
                name: 'id',
                table: tableName,
              },
            ],
            onDelete: 'cascade',
          },
        },
        indexes: textsTableIndexes,
      }

      adapter.rawTables[textsTableName] = textsTable

      adapter.rawRelations[textsTableName] = {
        parent: {
          type: 'one',
          fields: [
            {
              name: 'parent',
              table: textsTableName,
            },
          ],
          references: ['id'],
          relationName: '_texts',
          to: tableName,
        },
      }
    }

    if (hasManyNumberField) {
      const numbersTableName = `${rootTableName}_numbers`
      const columns: Record<string, RawColumn> = {
        id: {
          name: 'id',
          type: 'serial',
          primaryKey: true,
        },
        number: {
          name: 'number',
          type: 'numeric',
        },
        order: {
          name: 'order',
          type: 'integer',
          notNull: true,
        },
        parent: {
          name: 'parent_id',
          type: idColType,
          notNull: true,
        },
        path: {
          name: 'path',
          type: 'varchar',
          notNull: true,
        },
      }

      if (hasLocalizedManyNumberField) {
        columns.locale = {
          name: 'locale',
          type: 'enum',
          locale: true,
        }
      }

      const numbersTableIndexes: Record<string, RawIndex> = {
        orderParentIdx: { name: `${numbersTableName}_order_parent_idx`, on: ['order', 'parent'] },
      }

      if (hasManyNumberField === 'index') {
        numbersTableIndexes.numberIdx = {
          name: `${numbersTableName}_number_idx`,
          on: 'number',
        }
      }

      if (hasLocalizedManyNumberField) {
        numbersTableIndexes.localeParent = {
          name: `${numbersTableName}_locale_parent`,
          on: ['locale', 'parent'],
        }
      }

      numbersTable = {
        name: numbersTableName,
        columns,
        foreignKeys: {
          parentFk: {
            name: `${numbersTableName}_parent_fk`,
            columns: ['parent'],
            foreignColumns: [
              {
                name: 'id',
                table: tableName,
              },
            ],
            onDelete: 'cascade',
          },
        },
        indexes: numbersTableIndexes,
      }

      adapter.rawTables[numbersTableName] = numbersTable

      adapter.rawRelations[numbersTableName] = {
        parent: {
          type: 'one',
          fields: [
            {
              name: 'parent',
              table: numbersTableName,
            },
          ],
          references: ['id'],
          relationName: '_numbers',
          to: tableName,
        },
      }
    }

    if (relationships.size) {
      const relationshipColumns: Record<string, RawColumn> = {
        id: {
          name: 'id',
          type: 'serial',
          primaryKey: true,
        },
        order: {
          name: 'order',
          type: 'integer',
        },
        parent: {
          name: 'parent_id',
          type: idColType,
          notNull: true,
        },
        path: {
          name: 'path',
          type: 'varchar',
          notNull: true,
        },
      }

      if (hasLocalizedRelationshipField) {
        relationshipColumns.locale = {
          name: 'locale',
          type: 'enum',
          locale: true,
        }
      }

      const relationshipsTableName = `${tableName}${adapter.relationshipsSuffix}`

      const relationshipIndexes: Record<string, RawIndex> = {
        order: {
          name: `${relationshipsTableName}_order_idx`,
          on: 'order',
        },
        parentIdx: {
          name: `${relationshipsTableName}_parent_idx`,
          on: 'parent',
        },
        pathIdx: {
          name: `${relationshipsTableName}_path_idx`,
          on: 'path',
        },
      }

      if (hasLocalizedRelationshipField) {
        relationshipIndexes.localeIdx = {
          name: `${relationshipsTableName}_locale_idx`,
          on: 'locale',
        }
      }

      const relationshipForeignKeys: Record<string, RawForeignKey> = {
        parentFk: {
          name: `${relationshipsTableName}_parent_fk`,
          columns: ['parent'],
          foreignColumns: [
            {
              name: 'id',
              table: tableName,
            },
          ],
          onDelete: 'cascade',
        },
      }

      relationships.forEach((relationTo) => {
        const relationshipConfig = adapter.payload.collections[relationTo].config
        const formattedRelationTo = createTableName({
          adapter,
          config: relationshipConfig,
          throwValidationError: true,
        })
        let colType: 'integer' | 'numeric' | 'uuid' | 'varchar' =
          adapter.idType === 'uuid' ? 'uuid' : 'integer'
        const relatedCollectionCustomIDType =
          adapter.payload.collections[relationshipConfig.slug]?.customIDType

        if (relatedCollectionCustomIDType === 'number') {
          colType = 'numeric'
        }
        if (relatedCollectionCustomIDType === 'text') {
          colType = 'varchar'
        }

        const colName = `${relationTo}ID`

        relationshipColumns[colName] = {
          name: `${formattedRelationTo}_id`,
          type: colType,
        }

        relationshipForeignKeys[`${relationTo}IdFk`] = {
          name: `${relationshipsTableName}_${toSnakeCase(relationTo)}_fk`,
          columns: [colName],
          foreignColumns: [
            {
              name: 'id',
              table: formattedRelationTo,
            },
          ],
          onDelete: 'cascade',
        }

        const indexColumns = [colName]

        const unique = !disableUnique && uniqueRelationships.has(relationTo)

        if (unique) {
          indexColumns.push('path')
        }
        if (hasLocalizedRelationshipField) {
          indexColumns.push('locale')
        }

        const indexName = buildIndexName({
          name: `${relationshipsTableName}_${formattedRelationTo}_id`,
          adapter,
        })

        relationshipIndexes[indexName] = {
          name: indexName,
          on: indexColumns,
          unique,
        }
      })

      relationshipsTable = {
        name: relationshipsTableName,
        columns: relationshipColumns,
        foreignKeys: relationshipForeignKeys,
        indexes: relationshipIndexes,
      }

      adapter.rawTables[relationshipsTableName] = relationshipsTable

      const relationshipsTableRelations: Record<string, RawRelation> = {
        parent: {
          type: 'one',
          fields: [
            {
              name: 'parent',
              table: relationshipsTableName,
            },
          ],
          references: ['id'],
          relationName: '_rels',
          to: tableName,
        },
      }

      relationships.forEach((relationTo) => {
        const relatedTableName = createTableName({
          adapter,
          config: adapter.payload.collections[relationTo].config,
          throwValidationError: true,
        })
        const idColumnName = `${relationTo}ID`

        relationshipsTableRelations[idColumnName] = {
          type: 'one',
          fields: [
            {
              name: idColumnName,
              table: relationshipsTableName,
            },
          ],
          references: ['id'],
          relationName: relationTo,
          to: relatedTableName,
        }
      })
      adapter.rawRelations[relationshipsTableName] = relationshipsTableRelations
    }
  }

  const tableRelations: Record<string, RawRelation> = {}

  nonLocalizedRelations.forEach(({ type, relationName, target }, key) => {
    if (type === 'one') {
      tableRelations[key] = {
        type: 'one',
        fields: [
          {
            name: key,
            table: tableName,
          },
        ],
        references: ['id'],
        relationName: key,
        to: target,
      }
    }
    if (type === 'many') {
      tableRelations[key] = {
        type: 'many',
        relationName: relationName || key,
        to: target,
      }
    }
  })

  if (hasLocalizedField) {
    tableRelations._locales = {
      type: 'many',
      relationName: '_locales',
      to: localesTable.name,
    }
  }

  if (isRoot && textsTable) {
    tableRelations._texts = {
      type: 'many',
      relationName: '_texts',
      to: textsTable.name,
    }
  }

  if (isRoot && numbersTable) {
    tableRelations._numbers = {
      type: 'many',
      relationName: '_numbers',
      to: numbersTable.name,
    }
  }

  if (relationships.size && relationshipsTable) {
    tableRelations._rels = {
      type: 'many',
      relationName: '_rels',
      to: relationshipsTable.name,
    }
  }

  adapter.rawRelations[tableName] = tableRelations

  return {
    hasLocalizedManyNumberField,
    hasLocalizedManyTextField,
    hasLocalizedRelationshipField,
    hasManyNumberField,
    hasManyTextField,
    relationsToBuild,
  }
}
