/* eslint-disable no-param-reassign */
import type { Relation } from 'drizzle-orm'
import type {
  ForeignKeyBuilder,
  IndexBuilder,
  PgColumnBuilder,
  PgTableWithColumns,
  UniqueConstraintBuilder,
} from 'drizzle-orm/pg-core'
import { Field, fieldAffectsData } from 'payload/types'

import { relations } from 'drizzle-orm'
import {
  foreignKey,
  index,
  integer,
  numeric,
  serial,
  timestamp,
  unique,
  varchar,
} from 'drizzle-orm/pg-core'
import toSnakeCase from 'to-snake-case'

import type { GenericColumns, GenericTable, IDType, PostgresAdapter } from '../types'

import { createTableName } from './createTableName'
import { parentIDColumnMap } from './parentIDColumnMap'
import { setColumnID } from './setColumnID'
import { traverseFields } from './traverseFields'

export type BaseExtraConfig = Record<
  string,
  (cols: GenericColumns) => ForeignKeyBuilder | IndexBuilder | UniqueConstraintBuilder
>

type Args = {
  adapter: PostgresAdapter
  baseColumns?: Record<string, PgColumnBuilder>
  baseExtraConfig?: BaseExtraConfig
  buildNumbers?: boolean
  buildRelationships?: boolean
  buildTexts?: boolean
  disableNotNull: boolean
  disableUnique: boolean
  fields: Field[]
  rootRelationsToBuild?: Map<string, string>
  rootRelationships?: Set<string>
  rootTableIDColType?: string
  rootTableName?: string
  tableName: string
  timestamps?: boolean
  versions: boolean
}

type Result = {
  hasManyNumberField: 'index' | boolean
  hasManyTextField: 'index' | boolean
  relationsToBuild: Map<string, string>
}

export const buildTable = ({
  adapter,
  baseColumns = {},
  baseExtraConfig = {},
  buildNumbers,
  buildRelationships,
  buildTexts,
  disableNotNull,
  disableUnique = false,
  fields,
  rootRelationsToBuild,
  rootRelationships,
  rootTableIDColType,
  rootTableName: incomingRootTableName,
  tableName,
  timestamps,
  versions,
}: Args): Result => {
  const rootTableName = incomingRootTableName || tableName
  const columns: Record<string, PgColumnBuilder> = baseColumns
  const indexes: Record<string, (cols: GenericColumns) => IndexBuilder> = {}

  const localesColumns: Record<string, PgColumnBuilder> = {}
  const localesIndexes: Record<string, (cols: GenericColumns) => IndexBuilder> = {}
  let localesTable: GenericTable | PgTableWithColumns<any>
  let textsTable: GenericTable | PgTableWithColumns<any>
  let numbersTable: GenericTable | PgTableWithColumns<any>

  // Relationships to the base collection
  const relationships: Set<string> = rootRelationships || new Set()

  let relationshipsTable: GenericTable | PgTableWithColumns<any>

  // Drizzle relations
  const relationsToBuild: Map<string, string> = new Map()

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
    buildNumbers,
    buildRelationships,
    buildTexts,
    columns,
    disableNotNull,
    disableUnique,
    fields,
    indexes,
    localesColumns,
    localesIndexes,
    newTableName: tableName,
    parentTableName: tableName,
    relationsToBuild,
    relationships,
    rootRelationsToBuild: rootRelationsToBuild || relationsToBuild,
    rootTableIDColType: rootTableIDColType || idColType,
    rootTableName,
    versions,
  })

  if (timestamps) {
    columns.createdAt = timestamp('created_at', {
      mode: 'string',
      precision: 3,
      withTimezone: true,
    })
      .defaultNow()
      .notNull()
    columns.updatedAt = timestamp('updated_at', {
      mode: 'string',
      precision: 3,
      withTimezone: true,
    })
      .defaultNow()
      .notNull()
  }

  const table = adapter.pgSchema.table(tableName, columns, (cols) => {
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

  if (hasLocalizedField) {
    const localeTableName = `${tableName}${adapter.localesSuffix}`
    localesColumns.id = serial('id').primaryKey()
    localesColumns._locale = adapter.enums.enum__locales('_locale').notNull()
    localesColumns._parentID = parentIDColumnMap[idColType]('_parent_id').notNull()

    localesTable = adapter.pgSchema.table(localeTableName, localesColumns, (cols) => {
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

    const localesTableRelations = relations(localesTable, ({ one }) => ({
      _parentID: one(table, {
        fields: [localesTable._parentID],
        references: [table.id],
      }),
    }))

    adapter.relations[`relations_${localeTableName}`] = localesTableRelations
  }

  if (hasManyTextField && buildTexts) {
    const textsTableName = `${rootTableName}_texts`
    const columns: Record<string, PgColumnBuilder> = {
      id: serial('id').primaryKey(),
      order: integer('order').notNull(),
      parent: parentIDColumnMap[idColType]('parent_id').notNull(),
      path: varchar('path').notNull(),
      text: varchar('text'),
    }

    if (hasLocalizedManyTextField) {
      columns.locale = adapter.enums.enum__locales('locale')
    }

    textsTable = adapter.pgSchema.table(textsTableName, columns, (cols) => {
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
        config.localeParent = index(`${textsTableName}_locale_parent`).on(cols.locale, cols.parent)
      }

      return config
    })

    adapter.tables[textsTableName] = textsTable

    const textsTableRelations = relations(textsTable, ({ one }) => ({
      parent: one(table, {
        fields: [textsTable.parent],
        references: [table.id],
      }),
    }))

    adapter.relations[`relations_${textsTableName}`] = textsTableRelations
  }

  if (hasManyNumberField && buildNumbers) {
    const numbersTableName = `${rootTableName}_numbers`
    const columns: Record<string, PgColumnBuilder> = {
      id: serial('id').primaryKey(),
      number: numeric('number'),
      order: integer('order').notNull(),
      parent: parentIDColumnMap[idColType]('parent_id').notNull(),
      path: varchar('path').notNull(),
    }

    if (hasLocalizedManyNumberField) {
      columns.locale = adapter.enums.enum__locales('locale')
    }

    numbersTable = adapter.pgSchema.table(numbersTableName, columns, (cols) => {
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

    const numbersTableRelations = relations(numbersTable, ({ one }) => ({
      parent: one(table, {
        fields: [numbersTable.parent],
        references: [table.id],
      }),
    }))

    adapter.relations[`relations_${numbersTableName}`] = numbersTableRelations
  }

  if (buildRelationships) {
    if (relationships.size) {
      const relationshipColumns: Record<string, PgColumnBuilder> = {
        id: serial('id').primaryKey(),
        order: integer('order'),
        parent: parentIDColumnMap[idColType]('parent_id').notNull(),
        path: varchar('path').notNull(),
      }

      if (hasLocalizedRelationshipField) {
        relationshipColumns.locale = adapter.enums.enum__locales('locale')
      }

      const relationExtraConfig: BaseExtraConfig = {}

      const relationshipsTableName = `${tableName}${adapter.relationshipsSuffix}`

      relationships.forEach((relationTo) => {
        const relationshipConfig = adapter.payload.collections[relationTo].config
        const formattedRelationTo = createTableName({
          adapter,
          config: relationshipConfig,
          throwValidationError: true,
        })
        let colType = adapter.idType === 'uuid' ? 'uuid' : 'integer'

        const relatedCollectionCustomID = relationshipConfig.fields.find(
          (field) => fieldAffectsData(field) && field.name === 'id',
        )
        const relatedCollectionCustomIDType = relatedCollectionCustomID?.type

        if (relatedCollectionCustomIDType === 'number') colType = 'numeric'
        if (relatedCollectionCustomIDType === 'text') colType = 'varchar'

        relationshipColumns[`${relationTo}ID`] = parentIDColumnMap[colType](
          `${formattedRelationTo}_id`,
        )

        relationExtraConfig[`${relationTo}IdFk`] = (cols) =>
          foreignKey({
            name: `${relationshipsTableName}_${toSnakeCase(relationTo)}_fk`,
            columns: [cols[`${relationTo}ID`]],
            foreignColumns: [adapter.tables[formattedRelationTo].id],
          }).onDelete('cascade')
      })

      relationshipsTable = adapter.pgSchema.table(
        relationshipsTableName,
        relationshipColumns,
        (cols) => {
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
        },
      )

      adapter.tables[relationshipsTableName] = relationshipsTable

      const relationshipsTableRelations = relations(relationshipsTable, ({ one }) => {
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
            throwValidationError: true,
          })
          const idColumnName = `${relationTo}ID`
          result[idColumnName] = one(adapter.tables[relatedTableName], {
            fields: [relationshipsTable[idColumnName]],
            references: [adapter.tables[relatedTableName].id],
          })
        })

        return result
      })

      adapter.relations[`relations_${relationshipsTableName}`] = relationshipsTableRelations
    }
  }

  const tableRelations = relations(table, ({ many }) => {
    const result: Record<string, Relation<string>> = {}

    relationsToBuild.forEach((val, key) => {
      result[key] = many(adapter.tables[val])
    })

    if (hasLocalizedField) {
      result._locales = many(localesTable)
    }

    if (hasManyTextField) {
      result._texts = many(textsTable)
    }
    if (hasManyNumberField) {
      result._numbers = many(numbersTable)
    }

    if (relationships.size && relationshipsTable) {
      result._rels = many(relationshipsTable, {
        relationName: '_rels',
      })
    }

    return result
  })

  adapter.relations[`relations_${tableName}`] = tableRelations

  return { hasManyNumberField, hasManyTextField, relationsToBuild }
}
