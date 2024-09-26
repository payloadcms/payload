import type { Relation } from 'drizzle-orm'
import type {
  AnySQLiteColumn,
  ForeignKeyBuilder,
  IndexBuilder,
  SQLiteColumnBuilder,
  SQLiteTableWithColumns,
  UniqueConstraintBuilder,
} from 'drizzle-orm/sqlite-core'
import type { Field } from 'payload'

import { createTableName } from '@payloadcms/drizzle'
import { relations, sql } from 'drizzle-orm'
import {
  foreignKey,
  index,
  integer,
  numeric,
  sqliteTable,
  text,
  unique,
} from 'drizzle-orm/sqlite-core'
import toSnakeCase from 'to-snake-case'

import type { GenericColumns, GenericTable, IDType, SQLiteAdapter } from '../types.js'

import { createIndex } from './createIndex.js'
import { getIDColumn } from './getIDColumn.js'
import { setColumnID } from './setColumnID.js'
import { traverseFields } from './traverseFields.js'

export type BaseExtraConfig = Record<
  string,
  (cols: {
    [x: string]: AnySQLiteColumn
  }) => ForeignKeyBuilder | IndexBuilder | UniqueConstraintBuilder
>

export type RelationMap = Map<
  string,
  {
    localized: boolean
    relationName?: string
    target: string
    type: 'many' | 'one'
  }
>

type Args = {
  adapter: SQLiteAdapter
  baseColumns?: Record<string, SQLiteColumnBuilder>
  /**
   * After table is created, run these functions to add extra config to the table
   * ie. indexes, multiple columns, etc
   */
  baseExtraConfig?: BaseExtraConfig
  buildNumbers?: boolean
  buildRelationships?: boolean
  disableNotNull: boolean
  disableRelsTableUnique?: boolean
  disableUnique: boolean
  fields: Field[]
  locales?: [string, ...string[]]
  rootRelationships?: Set<string>
  rootRelationsToBuild?: RelationMap
  rootTableIDColType?: IDType
  rootTableName?: string
  rootUniqueRelationships?: Set<string>
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
  baseExtraConfig = {},
  disableNotNull,
  disableRelsTableUnique,
  disableUnique = false,
  fields,
  locales,
  rootRelationships,
  rootRelationsToBuild,
  rootTableIDColType,
  rootTableName: incomingRootTableName,
  rootUniqueRelationships,
  tableName,
  timestamps,
  versions,
  withinLocalizedArrayOrBlock,
}: Args): Result => {
  const isRoot = !incomingRootTableName
  const rootTableName = incomingRootTableName || tableName
  const columns: Record<string, SQLiteColumnBuilder> = baseColumns
  const indexes: Record<string, (cols: GenericColumns) => IndexBuilder> = {}

  const localesColumns: Record<string, SQLiteColumnBuilder> = {}
  const localesIndexes: Record<string, (cols: GenericColumns) => IndexBuilder> = {}
  let localesTable: GenericTable | SQLiteTableWithColumns<any>
  let textsTable: GenericTable | SQLiteTableWithColumns<any>
  let numbersTable: GenericTable | SQLiteTableWithColumns<any>

  // Relationships to the base collection
  const relationships: Set<string> = rootRelationships || new Set()
  const uniqueRelationships: Set<string> = rootUniqueRelationships || new Set()

  let relationshipsTable: GenericTable | SQLiteTableWithColumns<any>

  // Drizzle relations
  const relationsToBuild: RelationMap = new Map()

  const idColType: IDType = setColumnID({ columns, fields })

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
    locales,
    localesColumns,
    localesIndexes,
    newTableName: tableName,
    parentTableName: tableName,
    relationships,
    relationsToBuild,
    rootRelationsToBuild: rootRelationsToBuild || relationsToBuild,
    rootTableIDColType: rootTableIDColType || idColType,
    rootTableName,
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
    columns.createdAt = text('created_at')
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`)
      .notNull()
    columns.updatedAt = text('updated_at')
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`)
      .notNull()
  }

  const table = sqliteTable(tableName, columns, (cols) => {
    const extraConfig = Object.entries(baseExtraConfig).reduce((config, [key, func]) => {
      config[key] = func(cols)
      return config
    }, {})

    const result = Object.entries(indexes).reduce((acc, [colName, func]) => {
      acc[colName] = func(cols)
      return acc
    }, extraConfig)

    return result
  })

  adapter.tables[tableName] = table

  if (hasLocalizedField || localizedRelations.size) {
    const localeTableName = `${tableName}${adapter.localesSuffix}`
    localesColumns.id = integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true })
    localesColumns._locale = text('_locale', { enum: locales }).notNull()
    localesColumns._parentID = getIDColumn({
      name: '_parent_id',
      type: idColType,
      notNull: true,
      primaryKey: false,
    })

    localesTable = sqliteTable(localeTableName, localesColumns, (cols) => {
      return Object.entries(localesIndexes).reduce(
        (acc, [colName, func]) => {
          acc[colName] = func(cols)
          return acc
        },
        {
          _localeParent: unique(`${localeTableName}_locale_parent_id_unique`).on(
            cols._locale,
            cols._parentID,
          ),
          _parentIdFk: foreignKey({
            name: `${localeTableName}_parent_id_fk`,
            columns: [cols._parentID],
            foreignColumns: [table.id],
          }).onDelete('cascade'),
        },
      )
    })

    adapter.tables[localeTableName] = localesTable

    adapter.relations[`relations_${localeTableName}`] = relations(localesTable, ({ many, one }) => {
      const result: Record<string, Relation<string>> = {}

      result._parentID = one(table, {
        fields: [localesTable._parentID],
        references: [table.id],
        // name the relationship by what the many() relationName is
        relationName: '_locales',
      })

      localizedRelations.forEach(({ type, target }, key) => {
        if (type === 'one') {
          result[key] = one(adapter.tables[target], {
            fields: [localesTable[key]],
            references: [adapter.tables[target].id],
            relationName: key,
          })
        }
        if (type === 'many') {
          result[key] = many(adapter.tables[target], {
            relationName: key,
          })
        }
      })

      return result
    })
  }

  if (isRoot) {
    if (hasManyTextField) {
      const textsTableName = `${rootTableName}_texts`
      const columns: Record<string, SQLiteColumnBuilder> = {
        id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
        order: integer('order').notNull(),
        parent: getIDColumn({
          name: 'parent_id',
          type: idColType,
          notNull: true,
          primaryKey: false,
        }),
        path: text('path').notNull(),
        text: text('text'),
      }

      if (hasLocalizedManyTextField) {
        columns.locale = text('locale', { enum: locales })
      }

      textsTable = sqliteTable(textsTableName, columns, (cols) => {
        const config: Record<string, ForeignKeyBuilder | IndexBuilder> = {
          orderParentIdx: index(`${textsTableName}_order_parent_idx`).on(cols.order, cols.parent),
          parentFk: foreignKey({
            name: `${textsTableName}_parent_fk`,
            columns: [cols.parent],
            foreignColumns: [table.id],
          }).onDelete('cascade'),
        }

        if (hasManyTextField === 'index') {
          config.text_idx = index(`${textsTableName}_text_idx`).on(cols.text)
        }

        if (hasLocalizedManyTextField) {
          config.localeParent = index(`${textsTableName}_locale_parent`).on(
            cols.locale,
            cols.parent,
          )
        }

        return config
      })

      adapter.tables[textsTableName] = textsTable

      adapter.relations[`relations_${textsTableName}`] = relations(textsTable, ({ one }) => ({
        parent: one(table, {
          fields: [textsTable.parent],
          references: [table.id],
          relationName: '_texts',
        }),
      }))
    }

    if (hasManyNumberField) {
      const numbersTableName = `${rootTableName}_numbers`
      const columns: Record<string, SQLiteColumnBuilder> = {
        id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
        number: numeric('number'),
        order: integer('order').notNull(),
        parent: getIDColumn({
          name: 'parent_id',
          type: idColType,
          notNull: true,
          primaryKey: false,
        }),
        path: text('path').notNull(),
      }

      if (hasLocalizedManyNumberField) {
        columns.locale = text('locale', { enum: locales })
      }

      numbersTable = sqliteTable(numbersTableName, columns, (cols) => {
        const config: Record<string, ForeignKeyBuilder | IndexBuilder> = {
          orderParentIdx: index(`${numbersTableName}_order_parent_idx`).on(cols.order, cols.parent),
          parentFk: foreignKey({
            name: `${numbersTableName}_parent_fk`,
            columns: [cols.parent],
            foreignColumns: [table.id],
          }).onDelete('cascade'),
        }

        if (hasManyNumberField === 'index') {
          config.numberIdx = index(`${numbersTableName}_number_idx`).on(cols.number)
        }

        if (hasLocalizedManyNumberField) {
          config.localeParent = index(`${numbersTableName}_locale_parent`).on(
            cols.locale,
            cols.parent,
          )
        }

        return config
      })

      adapter.tables[numbersTableName] = numbersTable

      adapter.relations[`relations_${numbersTableName}`] = relations(numbersTable, ({ one }) => ({
        parent: one(table, {
          fields: [numbersTable.parent],
          references: [table.id],
          relationName: '_numbers',
        }),
      }))
    }

    if (relationships.size) {
      const relationshipColumns: Record<string, SQLiteColumnBuilder> = {
        id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
        order: integer('order'),
        parent: getIDColumn({
          name: 'parent_id',
          type: idColType,
          notNull: true,
          primaryKey: false,
        }),
        path: text('path').notNull(),
      }

      if (hasLocalizedRelationshipField) {
        relationshipColumns.locale = text('locale', { enum: locales })
      }

      const relationExtraConfig: BaseExtraConfig = {}
      const relationshipsTableName = `${tableName}${adapter.relationshipsSuffix}`

      relationships.forEach((relationTo) => {
        const relationshipConfig = adapter.payload.collections[relationTo].config
        const formattedRelationTo = createTableName({
          adapter,
          config: relationshipConfig,
        })
        let colType: IDType = 'integer'
        const relatedCollectionCustomIDType =
          adapter.payload.collections[relationshipConfig.slug]?.customIDType

        if (relatedCollectionCustomIDType === 'number') {
          colType = 'numeric'
        }
        if (relatedCollectionCustomIDType === 'text') {
          colType = 'text'
        }

        const colName = `${relationTo}ID`

        relationshipColumns[colName] = getIDColumn({
          name: `${formattedRelationTo}_id`,
          type: colType,
          primaryKey: false,
        })

        relationExtraConfig[`${relationTo}IdFk`] = (cols) =>
          foreignKey({
            name: `${relationshipsTableName}_${toSnakeCase(relationTo)}_fk`,
            columns: [cols[colName]],
            foreignColumns: [adapter.tables[formattedRelationTo].id],
          }).onDelete('cascade')

        const indexName = [colName]

        const unique = !disableUnique && uniqueRelationships.has(relationTo)

        if (unique) {
          indexName.push('path')
        }
        if (hasLocalizedRelationshipField) {
          indexName.push('locale')
        }

        relationExtraConfig[`${relationTo}IdIdx`] = createIndex({
          name: indexName,
          columnName: `${formattedRelationTo}_id`,
          tableName: relationshipsTableName,
          unique,
        })
      })

      relationshipsTable = sqliteTable(relationshipsTableName, relationshipColumns, (cols) => {
        const result: Record<string, ForeignKeyBuilder | IndexBuilder> = Object.entries(
          relationExtraConfig,
        ).reduce(
          (config, [key, func]) => {
            config[key] = func(cols)
            return config
          },
          {
            order: index(`${relationshipsTableName}_order_idx`).on(cols.order),
            parentFk: foreignKey({
              name: `${relationshipsTableName}_parent_fk`,
              columns: [cols.parent],
              foreignColumns: [table.id],
            }).onDelete('cascade'),
            parentIdx: index(`${relationshipsTableName}_parent_idx`).on(cols.parent),
            pathIdx: index(`${relationshipsTableName}_path_idx`).on(cols.path),
          },
        )

        if (hasLocalizedRelationshipField) {
          result.localeIdx = index(`${relationshipsTableName}_locale_idx`).on(cols.locale)
        }

        return result
      })

      adapter.tables[relationshipsTableName] = relationshipsTable

      adapter.relations[`relations_${relationshipsTableName}`] = relations(
        relationshipsTable,
        ({ one }) => {
          const result: Record<string, Relation<string>> = {
            parent: one(table, {
              fields: [relationshipsTable.parent],
              references: [table.id],
              relationName: '_rels',
            }),
          }

          relationships.forEach((relationTo) => {
            const relatedTableName = createTableName({
              adapter,
              config: adapter.payload.collections[relationTo].config,
            })
            const idColumnName = `${relationTo}ID`
            result[idColumnName] = one(adapter.tables[relatedTableName], {
              fields: [relationshipsTable[idColumnName]],
              references: [adapter.tables[relatedTableName].id],
              relationName: relationTo,
            })
          })

          return result
        },
      )
    }
  }

  adapter.relations[`relations_${tableName}`] = relations(table, ({ many, one }) => {
    const result: Record<string, Relation<string>> = {}

    nonLocalizedRelations.forEach(({ type, relationName, target }, key) => {
      if (type === 'one') {
        result[key] = one(adapter.tables[target], {
          fields: [table[key]],
          references: [adapter.tables[target].id],
          relationName: key,
        })
      }
      if (type === 'many') {
        result[key] = many(adapter.tables[target], { relationName: relationName || key })
      }
    })

    if (hasLocalizedField) {
      result._locales = many(localesTable, { relationName: '_locales' })
    }

    if (hasManyTextField) {
      result._texts = many(textsTable, { relationName: '_texts' })
    }

    if (hasManyNumberField) {
      result._numbers = many(numbersTable, { relationName: '_numbers' })
    }

    if (relationships.size && relationshipsTable) {
      result._rels = many(relationshipsTable, {
        relationName: '_rels',
      })
    }

    return result
  })

  return {
    hasLocalizedManyNumberField,
    hasLocalizedManyTextField,
    hasLocalizedRelationshipField,
    hasManyNumberField,
    hasManyTextField,
    relationsToBuild,
  }
}
