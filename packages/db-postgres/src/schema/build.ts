/* eslint-disable no-param-reassign */
import type { Relation } from 'drizzle-orm'
import type {
  IndexBuilder,
  PgColumnBuilder,
  PgTableWithColumns,
  UniqueConstraintBuilder,
} from 'drizzle-orm/pg-core'
import type { Field } from 'payload/types'

import { relations } from 'drizzle-orm'
import { index, integer, numeric, serial, timestamp, unique, varchar } from 'drizzle-orm/pg-core'
import { fieldAffectsData } from 'payload/types'

import type { GenericColumns, GenericTable, IDType, PostgresAdapter } from '../types'

import { getTableName } from './getTableName'
import { parentIDColumnMap } from './parentIDColumnMap'
import { setColumnID } from './setColumnID'
import { traverseFields } from './traverseFields'

type Args = {
  adapter: PostgresAdapter
  baseColumns?: Record<string, PgColumnBuilder>
  baseExtraConfig?: Record<string, (cols: GenericColumns) => IndexBuilder | UniqueConstraintBuilder>
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

  let hasLocalizedField = false
  let hasLocalizedRelationshipField = false
  let hasManyTextField: 'index' | boolean = false
  let hasManyNumberField: 'index' | boolean = false
  let hasLocalizedManyTextField = false
  let hasLocalizedManyNumberField = false

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

  ;({
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
  }))

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

    return Object.entries(indexes).reduce((acc, [colName, func]) => {
      acc[colName] = func(cols)
      return acc
    }, extraConfig)
  })

  adapter.tables[tableName] = table

  if (hasLocalizedField) {
    const localeTableName = `${tableName}${adapter.localesSuffix}`
    localesColumns.id = serial('id').primaryKey()
    localesColumns._locale = adapter.enums.enum__locales('_locale').notNull()
    localesColumns._parentID = parentIDColumnMap[idColType]('_parent_id')
      .references(() => table.id, { onDelete: 'cascade' })
      .notNull()

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
      parent: parentIDColumnMap[idColType]('parent_id')
        .references(() => table.id, { onDelete: 'cascade' })
        .notNull(),
      path: varchar('path').notNull(),
      text: varchar('text'),
    }

    if (hasLocalizedManyTextField) {
      columns.locale = adapter.enums.enum__locales('locale')
    }

    textsTable = adapter.pgSchema.table(textsTableName, columns, (cols) => {
      const indexes: Record<string, IndexBuilder> = {
        orderParentIdx: index(`${textsTableName}_order_parent_idx`).on(cols.order, cols.parent),
      }

      if (hasManyTextField === 'index') {
        indexes.text_idx = index(`${textsTableName}_text_idx`).on(cols.text)
      }

      if (hasLocalizedManyTextField) {
        indexes.localeParent = index(`${textsTableName}_locale_parent`).on(cols.locale, cols.parent)
      }

      return indexes
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
      parent: parentIDColumnMap[idColType]('parent_id')
        .references(() => table.id, { onDelete: 'cascade' })
        .notNull(),
      path: varchar('path').notNull(),
    }

    if (hasLocalizedManyNumberField) {
      columns.locale = adapter.enums.enum__locales('locale')
    }

    numbersTable = adapter.pgSchema.table(numbersTableName, columns, (cols) => {
      const indexes: Record<string, IndexBuilder> = {
        orderParentIdx: index(`${numbersTableName}_order_parent_idx`).on(cols.order, cols.parent),
      }

      if (hasManyNumberField === 'index') {
        indexes.numberIdx = index(`${numbersTableName}_number_idx`).on(cols.number)
      }

      if (hasLocalizedManyNumberField) {
        indexes.localeParent = index(`${numbersTableName}_locale_parent`).on(
          cols.locale,
          cols.parent,
        )
      }

      return indexes
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
        parent: parentIDColumnMap[idColType]('parent_id')
          .references(() => table.id, { onDelete: 'cascade' })
          .notNull(),
        path: varchar('path').notNull(),
      }

      if (hasLocalizedRelationshipField) {
        relationshipColumns.locale = adapter.enums.enum__locales('locale')
      }

      relationships.forEach((relationTo) => {
        const relationshipConfig = adapter.payload.collections[relationTo].config
        const formattedRelationTo = getTableName({
          adapter,
          config: relationshipConfig,
          throwValidationError: true,
        })
        let colType = adapter.idType === 'uuid' ? 'uuid' : 'integer'
        const relatedCollectionCustomID = relationshipConfig.fields.find(
          (field) => fieldAffectsData(field) && field.name === 'id',
        )
        if (relatedCollectionCustomID?.type === 'number') colType = 'numeric'
        if (relatedCollectionCustomID?.type === 'text') colType = 'varchar'

        relationshipColumns[`${relationTo}ID`] = parentIDColumnMap[colType](
          `${formattedRelationTo}_id`,
        ).references(() => adapter.tables[formattedRelationTo].id, { onDelete: 'cascade' })
      })

      const relationshipsTableName = `${tableName}${adapter.relationshipsSuffix}`

      relationshipsTable = adapter.pgSchema.table(
        relationshipsTableName,
        relationshipColumns,
        (cols) => {
          const result: Record<string, unknown> = {
            order: index(`${relationshipsTableName}_order_idx`).on(cols.order),
            parentIdx: index(`${relationshipsTableName}_parent_idx`).on(cols.parent),
            pathIdx: index(`${relationshipsTableName}_path_idx`).on(cols.path),
          }

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
          const relatedTableName = getTableName({
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
