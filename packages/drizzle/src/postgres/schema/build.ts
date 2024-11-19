import type { Relation } from 'drizzle-orm'
import type {
  ForeignKeyBuilder,
  IndexBuilder,
  PgColumnBuilder,
  PgTableWithColumns,
} from 'drizzle-orm/pg-core'
import type { Field, TabAsField } from 'payload'

import { relations } from 'drizzle-orm'
import {
  boolean,
  foreignKey,
  index,
  integer,
  jsonb,
  numeric,
  PgNumericBuilder,
  PgUUIDBuilder,
  PgVarcharBuilder,
  serial,
  text,
  timestamp,
  unique,
  varchar,
} from 'drizzle-orm/pg-core'
import { InvalidConfiguration } from 'payload'
import { fieldAffectsData, fieldIsVirtual, optionIsObject } from 'payload/shared'
import toSnakeCase from 'to-snake-case'

import type {
  BaseExtraConfig,
  BasePostgresAdapter,
  GenericColumns,
  GenericTable,
  IDType,
  RelationMap,
} from '../types.js'

import { createTableName } from '../../createTableName.js'
import { buildIndexName } from '../../utilities/buildIndexName.js'
import { hasLocalesTable } from '../../utilities/hasLocalesTable.js'
import { validateExistingBlockIsIdentical } from '../../utilities/validateExistingBlockIsIdentical.js'
import { createIndex } from './createIndex.js'
import { geometryColumn } from './geometryColumn.js'
import { idToUUID } from './idToUUID.js'
import { parentIDColumnMap } from './parentIDColumnMap.js'
import { setColumnID } from './setColumnID.js'
import { withDefault } from './withDefault.js'

type Args = {
  adapter: BasePostgresAdapter
  baseColumns?: Record<string, PgColumnBuilder>
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
  rootRelationships?: Set<string>
  rootRelationsToBuild?: RelationMap
  rootTableIDColType?: string
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
  disableRelsTableUnique = false,
  disableUnique = false,
  fields,
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
  const columns: Record<string, PgColumnBuilder> = baseColumns
  const indexes: Record<string, (cols: GenericColumns) => IndexBuilder> = {}

  const localesColumns: Record<string, PgColumnBuilder> = {}
  const localesIndexes: Record<string, (cols: GenericColumns) => IndexBuilder> = {}
  let localesTable: GenericTable | PgTableWithColumns<any>
  let textsTable: GenericTable | PgTableWithColumns<any>
  let numbersTable: GenericTable | PgTableWithColumns<any>

  // Relationships to the base collection
  const relationships: Set<string> = rootRelationships || new Set()

  // Unique relationships to the base collection
  const uniqueRelationships: Set<string> = rootUniqueRelationships || new Set()

  let relationshipsTable: GenericTable | PgTableWithColumns<any>

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

  if (hasLocalizedField || localizedRelations.size) {
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

      adapter.relations[`relations_${numbersTableName}`] = relations(numbersTable, ({ one }) => ({
        parent: one(table, {
          fields: [numbersTable.parent],
          references: [table.id],
          relationName: '_numbers',
        }),
      }))
    }

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
        const relatedCollectionCustomIDType =
          adapter.payload.collections[relationshipConfig.slug]?.customIDType

        if (relatedCollectionCustomIDType === 'number') {
          colType = 'numeric'
        }
        if (relatedCollectionCustomIDType === 'text') {
          colType = 'varchar'
        }

        const colName = `${relationTo}ID`

        relationshipColumns[colName] = parentIDColumnMap[colType](`${formattedRelationTo}_id`)

        relationExtraConfig[`${relationTo}IdFk`] = (cols) =>
          foreignKey({
            name: `${relationshipsTableName}_${toSnakeCase(relationTo)}_fk`,
            columns: [cols[colName]],
            foreignColumns: [adapter.tables[formattedRelationTo].id],
          }).onDelete('cascade')

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

        relationExtraConfig[indexName] = createIndex({
          name: indexColumns,
          indexName,
          unique,
        })
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
              throwValidationError: true,
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

type TraverseFieldsArgs = {
  adapter: BasePostgresAdapter
  columnPrefix?: string
  columns: Record<string, PgColumnBuilder>
  disableNotNull: boolean
  disableRelsTableUnique?: boolean
  disableUnique?: boolean
  fieldPrefix?: string
  fields: (Field | TabAsField)[]
  forceLocalized?: boolean
  indexes: Record<string, (cols: GenericColumns) => IndexBuilder>
  localesColumns: Record<string, PgColumnBuilder>
  localesIndexes: Record<string, (cols: GenericColumns) => IndexBuilder>
  newTableName: string
  parentTableName: string
  relationships: Set<string>
  relationsToBuild: RelationMap
  rootRelationsToBuild?: RelationMap
  rootTableIDColType: string
  rootTableName: string
  uniqueRelationships: Set<string>
  versions: boolean
  /**
   * Tracks whether or not this table is built
   * from the result of a localized array or block field at some point
   */
  withinLocalizedArrayOrBlock?: boolean
}

type TraverseFieldsResult = {
  hasLocalizedField: boolean
  hasLocalizedManyNumberField: boolean
  hasLocalizedManyTextField: boolean
  hasLocalizedRelationshipField: boolean
  hasManyNumberField: 'index' | boolean
  hasManyTextField: 'index' | boolean
}

export const traverseFields = ({
  adapter,
  columnPrefix,
  columns,
  disableNotNull,
  disableRelsTableUnique,
  disableUnique = false,
  fieldPrefix,
  fields,
  forceLocalized,
  indexes,
  localesColumns,
  localesIndexes,
  newTableName,
  parentTableName,
  relationships,
  relationsToBuild,
  rootRelationsToBuild,
  rootTableIDColType,
  rootTableName,
  uniqueRelationships,
  versions,
  withinLocalizedArrayOrBlock,
}: TraverseFieldsArgs): TraverseFieldsResult => {
  const throwValidationError = true
  let hasLocalizedField = false
  let hasLocalizedRelationshipField = false
  let hasManyTextField: 'index' | boolean = false
  let hasLocalizedManyTextField = false
  let hasManyNumberField: 'index' | boolean = false
  let hasLocalizedManyNumberField = false

  let parentIDColType: IDType = 'integer'
  if (columns.id instanceof PgUUIDBuilder) {
    parentIDColType = 'uuid'
  }
  if (columns.id instanceof PgNumericBuilder) {
    parentIDColType = 'numeric'
  }
  if (columns.id instanceof PgVarcharBuilder) {
    parentIDColType = 'varchar'
  }

  fields.forEach((field) => {
    if ('name' in field && field.name === 'id') {
      return
    }
    if (fieldIsVirtual(field)) {
      return
    }

    let columnName: string
    let fieldName: string

    let targetTable = columns
    let targetIndexes = indexes

    if (fieldAffectsData(field)) {
      columnName = `${columnPrefix || ''}${field.name[0] === '_' ? '_' : ''}${toSnakeCase(
        field.name,
      )}`
      fieldName = `${fieldPrefix?.replace('.', '_') || ''}${field.name}`

      // If field is localized,
      // add the column to the locale table instead of main table
      if (
        adapter.payload.config.localization &&
        (field.localized || forceLocalized) &&
        field.type !== 'array' &&
        field.type !== 'blocks' &&
        (('hasMany' in field && field.hasMany !== true) || !('hasMany' in field))
      ) {
        hasLocalizedField = true
        targetTable = localesColumns
        targetIndexes = localesIndexes
      }

      if (
        (field.unique || field.index || ['relationship', 'upload'].includes(field.type)) &&
        !['array', 'blocks', 'group'].includes(field.type) &&
        !('hasMany' in field && field.hasMany === true) &&
        !('relationTo' in field && Array.isArray(field.relationTo))
      ) {
        const unique = disableUnique !== true && field.unique
        if (unique) {
          const constraintValue = `${fieldPrefix || ''}${field.name}`
          if (!adapter.fieldConstraints?.[rootTableName]) {
            adapter.fieldConstraints[rootTableName] = {}
          }
          adapter.fieldConstraints[rootTableName][`${columnName}_idx`] = constraintValue
        }

        const indexName = buildIndexName({ name: `${newTableName}_${columnName}`, adapter })

        targetIndexes[indexName] = createIndex({
          name: field.localized ? [fieldName, '_locale'] : fieldName,
          indexName,
          unique,
        })
      }
    }

    switch (field.type) {
      case 'array': {
        const disableNotNullFromHere = Boolean(field.admin?.condition) || disableNotNull

        const arrayTableName = createTableName({
          adapter,
          config: field,
          parentTableName: newTableName,
          prefix: `${newTableName}_`,
          throwValidationError,
          versionsCustomName: versions,
        })

        const baseColumns: Record<string, PgColumnBuilder> = {
          _order: integer('_order').notNull(),
          _parentID: parentIDColumnMap[parentIDColType]('_parent_id').notNull(),
        }

        const baseExtraConfig: BaseExtraConfig = {
          _orderIdx: (cols) => index(`${arrayTableName}_order_idx`).on(cols._order),
          _parentIDFk: (cols) =>
            foreignKey({
              name: `${arrayTableName}_parent_id_fk`,
              columns: [cols['_parentID']],
              foreignColumns: [adapter.tables[parentTableName].id],
            }).onDelete('cascade'),
          _parentIDIdx: (cols) => index(`${arrayTableName}_parent_id_idx`).on(cols._parentID),
        }

        const isLocalized =
          Boolean(field.localized && adapter.payload.config.localization) ||
          withinLocalizedArrayOrBlock ||
          forceLocalized

        if (isLocalized) {
          baseColumns._locale = adapter.enums.enum__locales('_locale').notNull()
          baseExtraConfig._localeIdx = (cols) =>
            index(`${arrayTableName}_locale_idx`).on(cols._locale)
        }

        const {
          hasLocalizedManyNumberField: subHasLocalizedManyNumberField,
          hasLocalizedManyTextField: subHasLocalizedManyTextField,
          hasLocalizedRelationshipField: subHasLocalizedRelationshipField,
          hasManyNumberField: subHasManyNumberField,
          hasManyTextField: subHasManyTextField,
          relationsToBuild: subRelationsToBuild,
        } = buildTable({
          adapter,
          baseColumns,
          baseExtraConfig,
          disableNotNull: disableNotNullFromHere,
          disableRelsTableUnique: true,
          disableUnique,
          fields: disableUnique ? idToUUID(field.fields) : field.fields,
          rootRelationships: relationships,
          rootRelationsToBuild,
          rootTableIDColType,
          rootTableName,
          rootUniqueRelationships: uniqueRelationships,
          tableName: arrayTableName,
          versions,
          withinLocalizedArrayOrBlock: isLocalized,
        })

        if (subHasLocalizedManyNumberField) {
          hasLocalizedManyNumberField = subHasLocalizedManyNumberField
        }

        if (subHasLocalizedRelationshipField) {
          hasLocalizedRelationshipField = subHasLocalizedRelationshipField
        }

        if (subHasLocalizedManyTextField) {
          hasLocalizedManyTextField = subHasLocalizedManyTextField
        }

        if (subHasManyTextField) {
          if (!hasManyTextField || subHasManyTextField === 'index') {
            hasManyTextField = subHasManyTextField
          }
        }
        if (subHasManyNumberField) {
          if (!hasManyNumberField || subHasManyNumberField === 'index') {
            hasManyNumberField = subHasManyNumberField
          }
        }

        relationsToBuild.set(fieldName, {
          type: 'many',
          // arrays have their own localized table, independent of the base table.
          localized: false,
          target: arrayTableName,
        })

        adapter.relations[`relations_${arrayTableName}`] = relations(
          adapter.tables[arrayTableName],
          ({ many, one }) => {
            const result: Record<string, Relation<string>> = {
              _parentID: one(adapter.tables[parentTableName], {
                fields: [adapter.tables[arrayTableName]._parentID],
                references: [adapter.tables[parentTableName].id],
                relationName: fieldName,
              }),
            }

            if (hasLocalesTable(field.fields)) {
              result._locales = many(adapter.tables[`${arrayTableName}${adapter.localesSuffix}`], {
                relationName: '_locales',
              })
            }

            subRelationsToBuild.forEach(({ type, localized, target }, key) => {
              if (type === 'one') {
                const arrayWithLocalized = localized
                  ? `${arrayTableName}${adapter.localesSuffix}`
                  : arrayTableName
                result[key] = one(adapter.tables[target], {
                  fields: [adapter.tables[arrayWithLocalized][key]],
                  references: [adapter.tables[target].id],
                  relationName: key,
                })
              }
              if (type === 'many') {
                result[key] = many(adapter.tables[target], { relationName: key })
              }
            })

            return result
          },
        )

        break
      }
      case 'blocks': {
        const disableNotNullFromHere = Boolean(field.admin?.condition) || disableNotNull

        field.blocks.forEach((block) => {
          const blockTableName = createTableName({
            adapter,
            config: block,
            parentTableName: rootTableName,
            prefix: `${rootTableName}_blocks_`,
            throwValidationError,
            versionsCustomName: versions,
          })
          if (!adapter.tables[blockTableName]) {
            const baseColumns: Record<string, PgColumnBuilder> = {
              _order: integer('_order').notNull(),
              _parentID: parentIDColumnMap[rootTableIDColType]('_parent_id').notNull(),
              _path: text('_path').notNull(),
            }

            const baseExtraConfig: BaseExtraConfig = {
              _orderIdx: (cols) => index(`${blockTableName}_order_idx`).on(cols._order),
              _parentIdFk: (cols) =>
                foreignKey({
                  name: `${blockTableName}_parent_id_fk`,
                  columns: [cols._parentID],
                  foreignColumns: [adapter.tables[rootTableName].id],
                }).onDelete('cascade'),
              _parentIDIdx: (cols) => index(`${blockTableName}_parent_id_idx`).on(cols._parentID),
              _pathIdx: (cols) => index(`${blockTableName}_path_idx`).on(cols._path),
            }

            const isLocalized =
              Boolean(field.localized && adapter.payload.config.localization) ||
              withinLocalizedArrayOrBlock ||
              forceLocalized

            if (isLocalized) {
              baseColumns._locale = adapter.enums.enum__locales('_locale').notNull()
              baseExtraConfig._localeIdx = (cols) =>
                index(`${blockTableName}_locale_idx`).on(cols._locale)
            }

            const {
              hasLocalizedManyNumberField: subHasLocalizedManyNumberField,
              hasLocalizedManyTextField: subHasLocalizedManyTextField,
              hasLocalizedRelationshipField: subHasLocalizedRelationshipField,
              hasManyNumberField: subHasManyNumberField,
              hasManyTextField: subHasManyTextField,
              relationsToBuild: subRelationsToBuild,
            } = buildTable({
              adapter,
              baseColumns,
              baseExtraConfig,
              disableNotNull: disableNotNullFromHere,
              disableRelsTableUnique: true,
              disableUnique,
              fields: disableUnique ? idToUUID(block.fields) : block.fields,
              rootRelationships: relationships,
              rootRelationsToBuild,
              rootTableIDColType,
              rootTableName,
              rootUniqueRelationships: uniqueRelationships,
              tableName: blockTableName,
              versions,
              withinLocalizedArrayOrBlock: isLocalized,
            })

            if (subHasLocalizedManyNumberField) {
              hasLocalizedManyNumberField = subHasLocalizedManyNumberField
            }

            if (subHasLocalizedRelationshipField) {
              hasLocalizedRelationshipField = subHasLocalizedRelationshipField
            }

            if (subHasLocalizedManyTextField) {
              hasLocalizedManyTextField = subHasLocalizedManyTextField
            }

            if (subHasManyTextField) {
              if (!hasManyTextField || subHasManyTextField === 'index') {
                hasManyTextField = subHasManyTextField
              }
            }

            if (subHasManyNumberField) {
              if (!hasManyNumberField || subHasManyNumberField === 'index') {
                hasManyNumberField = subHasManyNumberField
              }
            }

            adapter.relations[`relations_${blockTableName}`] = relations(
              adapter.tables[blockTableName],
              ({ many, one }) => {
                const result: Record<string, Relation<string>> = {
                  _parentID: one(adapter.tables[rootTableName], {
                    fields: [adapter.tables[blockTableName]._parentID],
                    references: [adapter.tables[rootTableName].id],
                    relationName: `_blocks_${block.slug}`,
                  }),
                }

                if (hasLocalesTable(block.fields)) {
                  result._locales = many(
                    adapter.tables[`${blockTableName}${adapter.localesSuffix}`],
                    { relationName: '_locales' },
                  )
                }

                subRelationsToBuild.forEach(({ type, localized, target }, key) => {
                  if (type === 'one') {
                    const blockWithLocalized = localized
                      ? `${blockTableName}${adapter.localesSuffix}`
                      : blockTableName
                    result[key] = one(adapter.tables[target], {
                      fields: [adapter.tables[blockWithLocalized][key]],
                      references: [adapter.tables[target].id],
                      relationName: key,
                    })
                  }
                  if (type === 'many') {
                    result[key] = many(adapter.tables[target], { relationName: key })
                  }
                })

                return result
              },
            )
          } else if (process.env.NODE_ENV !== 'production' && !versions) {
            validateExistingBlockIsIdentical({
              block,
              localized: field.localized,
              rootTableName,
              table: adapter.tables[blockTableName],
              tableLocales: adapter.tables[`${blockTableName}${adapter.localesSuffix}`],
            })
          }
          // blocks relationships are defined from the collection or globals table down to the block, bypassing any subBlocks
          rootRelationsToBuild.set(`_blocks_${block.slug}`, {
            type: 'many',
            // blocks are not localized on the parent table
            localized: false,
            target: blockTableName,
          })
        })

        break
      }
      case 'checkbox': {
        targetTable[fieldName] = withDefault(boolean(columnName), field)
        break
      }
      case 'code':

      case 'email':

      case 'textarea': {
        targetTable[fieldName] = withDefault(varchar(columnName), field)
        break
      }
      case 'collapsible':

      case 'row': {
        const disableNotNullFromHere = Boolean(field.admin?.condition) || disableNotNull
        const {
          hasLocalizedField: rowHasLocalizedField,
          hasLocalizedManyNumberField: rowHasLocalizedManyNumberField,
          hasLocalizedManyTextField: rowHasLocalizedManyTextField,
          hasLocalizedRelationshipField: rowHasLocalizedRelationshipField,
          hasManyNumberField: rowHasManyNumberField,
          hasManyTextField: rowHasManyTextField,
        } = traverseFields({
          adapter,
          columnPrefix,
          columns,
          disableNotNull: disableNotNullFromHere,
          disableUnique,
          fieldPrefix,
          fields: field.fields,
          forceLocalized,
          indexes,
          localesColumns,
          localesIndexes,
          newTableName,
          parentTableName,
          relationships,
          relationsToBuild,
          rootRelationsToBuild,
          rootTableIDColType,
          rootTableName,
          uniqueRelationships,
          versions,
          withinLocalizedArrayOrBlock,
        })

        if (rowHasLocalizedField) {
          hasLocalizedField = true
        }
        if (rowHasLocalizedRelationshipField) {
          hasLocalizedRelationshipField = true
        }
        if (rowHasManyTextField) {
          hasManyTextField = true
        }
        if (rowHasLocalizedManyTextField) {
          hasLocalizedManyTextField = true
        }
        if (rowHasManyNumberField) {
          hasManyNumberField = true
        }
        if (rowHasLocalizedManyNumberField) {
          hasLocalizedManyNumberField = true
        }
        break
      }

      case 'date': {
        targetTable[fieldName] = withDefault(
          timestamp(columnName, {
            mode: 'string',
            precision: 3,
            withTimezone: true,
          }),
          field,
        )
        break
      }

      case 'group':
      case 'tab': {
        if (!('name' in field)) {
          const {
            hasLocalizedField: groupHasLocalizedField,
            hasLocalizedManyNumberField: groupHasLocalizedManyNumberField,
            hasLocalizedManyTextField: groupHasLocalizedManyTextField,
            hasLocalizedRelationshipField: groupHasLocalizedRelationshipField,
            hasManyNumberField: groupHasManyNumberField,
            hasManyTextField: groupHasManyTextField,
          } = traverseFields({
            adapter,
            columnPrefix,
            columns,
            disableNotNull,
            disableUnique,
            fieldPrefix,
            fields: field.fields,
            forceLocalized,
            indexes,
            localesColumns,
            localesIndexes,
            newTableName,
            parentTableName,
            relationships,
            relationsToBuild,
            rootRelationsToBuild,
            rootTableIDColType,
            rootTableName,
            uniqueRelationships,
            versions,
            withinLocalizedArrayOrBlock,
          })

          if (groupHasLocalizedField) {
            hasLocalizedField = true
          }
          if (groupHasLocalizedRelationshipField) {
            hasLocalizedRelationshipField = true
          }
          if (groupHasManyTextField) {
            hasManyTextField = true
          }
          if (groupHasLocalizedManyTextField) {
            hasLocalizedManyTextField = true
          }
          if (groupHasManyNumberField) {
            hasManyNumberField = true
          }
          if (groupHasLocalizedManyNumberField) {
            hasLocalizedManyNumberField = true
          }
          break
        }

        const disableNotNullFromHere = Boolean(field.admin?.condition) || disableNotNull

        const {
          hasLocalizedField: groupHasLocalizedField,
          hasLocalizedManyNumberField: groupHasLocalizedManyNumberField,
          hasLocalizedManyTextField: groupHasLocalizedManyTextField,
          hasLocalizedRelationshipField: groupHasLocalizedRelationshipField,
          hasManyNumberField: groupHasManyNumberField,
          hasManyTextField: groupHasManyTextField,
        } = traverseFields({
          adapter,
          columnPrefix: `${columnName}_`,
          columns,
          disableNotNull: disableNotNullFromHere,
          disableUnique,
          fieldPrefix: `${fieldName}.`,
          fields: field.fields,
          forceLocalized: field.localized,
          indexes,
          localesColumns,
          localesIndexes,
          newTableName: `${parentTableName}_${columnName}`,
          parentTableName,
          relationships,
          relationsToBuild,
          rootRelationsToBuild,
          rootTableIDColType,
          rootTableName,
          uniqueRelationships,
          versions,
          withinLocalizedArrayOrBlock: withinLocalizedArrayOrBlock || field.localized,
        })

        if (groupHasLocalizedField) {
          hasLocalizedField = true
        }
        if (groupHasLocalizedRelationshipField) {
          hasLocalizedRelationshipField = true
        }
        if (groupHasManyTextField) {
          hasManyTextField = true
        }
        if (groupHasLocalizedManyTextField) {
          hasLocalizedManyTextField = true
        }
        if (groupHasManyNumberField) {
          hasManyNumberField = true
        }
        if (groupHasLocalizedManyNumberField) {
          hasLocalizedManyNumberField = true
        }
        break
      }

      case 'json':

      case 'richText': {
        targetTable[fieldName] = withDefault(jsonb(columnName), field)
        break
      }

      case 'number': {
        if (field.hasMany) {
          const isLocalized =
            Boolean(field.localized && adapter.payload.config.localization) ||
            withinLocalizedArrayOrBlock ||
            forceLocalized

          if (isLocalized) {
            hasLocalizedManyNumberField = true
          }

          if (field.index) {
            hasManyNumberField = 'index'
          } else if (!hasManyNumberField) {
            hasManyNumberField = true
          }

          if (field.unique) {
            throw new InvalidConfiguration(
              'Unique is not supported in Postgres for hasMany number fields.',
            )
          }
        } else {
          targetTable[fieldName] = withDefault(numeric(columnName), field)
        }
        break
      }

      case 'point': {
        targetTable[fieldName] = withDefault(geometryColumn(columnName), field)
        if (!adapter.extensions.postgis) {
          adapter.extensions.postgis = true
        }
        break
      }
      case 'radio':

      case 'select': {
        const enumName = createTableName({
          adapter,
          config: field,
          parentTableName: newTableName,
          prefix: `enum_${newTableName}_`,
          target: 'enumName',
          throwValidationError,
        })

        adapter.enums[enumName] = adapter.pgSchema.enum(
          enumName,
          field.options.map((option) => {
            if (optionIsObject(option)) {
              return option.value
            }

            return option
          }) as [string, ...string[]],
        )

        if (field.type === 'select' && field.hasMany) {
          const selectTableName = createTableName({
            adapter,
            config: field,
            parentTableName: newTableName,
            prefix: `${newTableName}_`,
            throwValidationError,
            versionsCustomName: versions,
          })
          const baseColumns: Record<string, PgColumnBuilder> = {
            order: integer('order').notNull(),
            parent: parentIDColumnMap[parentIDColType]('parent_id').notNull(),
            value: adapter.enums[enumName]('value'),
          }

          const baseExtraConfig: BaseExtraConfig = {
            orderIdx: (cols) => index(`${selectTableName}_order_idx`).on(cols.order),
            parentFk: (cols) =>
              foreignKey({
                name: `${selectTableName}_parent_fk`,
                columns: [cols.parent],
                foreignColumns: [adapter.tables[parentTableName].id],
              }).onDelete('cascade'),
            parentIdx: (cols) => index(`${selectTableName}_parent_idx`).on(cols.parent),
          }

          const isLocalized =
            Boolean(field.localized && adapter.payload.config.localization) ||
            withinLocalizedArrayOrBlock ||
            forceLocalized

          if (isLocalized) {
            baseColumns.locale = adapter.enums.enum__locales('locale').notNull()
            baseExtraConfig.localeIdx = (cols) =>
              index(`${selectTableName}_locale_idx`).on(cols.locale)
          }

          if (field.index) {
            baseExtraConfig.value = (cols) => index(`${selectTableName}_value_idx`).on(cols.value)
          }

          buildTable({
            adapter,
            baseColumns,
            baseExtraConfig,
            disableNotNull,
            disableUnique,
            fields: [],
            rootTableName,
            tableName: selectTableName,
            versions,
          })

          relationsToBuild.set(fieldName, {
            type: 'many',
            // selects have their own localized table, independent of the base table.
            localized: false,
            target: selectTableName,
          })

          adapter.relations[`relations_${selectTableName}`] = relations(
            adapter.tables[selectTableName],
            ({ one }) => ({
              parent: one(adapter.tables[parentTableName], {
                fields: [adapter.tables[selectTableName].parent],
                references: [adapter.tables[parentTableName].id],
                relationName: fieldName,
              }),
            }),
          )
        } else {
          targetTable[fieldName] = withDefault(adapter.enums[enumName](columnName), field)
        }
        break
      }

      case 'relationship':
      case 'upload':
        if (Array.isArray(field.relationTo)) {
          field.relationTo.forEach((relation) => {
            relationships.add(relation)
            if (field.unique && !disableUnique && !disableRelsTableUnique) {
              uniqueRelationships.add(relation)
            }
          })
        } else if (field.hasMany) {
          relationships.add(field.relationTo)
          if (field.unique && !disableUnique && !disableRelsTableUnique) {
            uniqueRelationships.add(field.relationTo)
          }
        } else {
          // simple relationships get a column on the targetTable with a foreign key to the relationTo table
          const relationshipConfig = adapter.payload.collections[field.relationTo].config

          const tableName = adapter.tableNameMap.get(toSnakeCase(field.relationTo))

          // get the id type of the related collection
          let colType = adapter.idType === 'uuid' ? 'uuid' : 'integer'
          const relatedCollectionCustomID = relationshipConfig.fields.find(
            (field) => fieldAffectsData(field) && field.name === 'id',
          )
          if (relatedCollectionCustomID?.type === 'number') {
            colType = 'numeric'
          }
          if (relatedCollectionCustomID?.type === 'text') {
            colType = 'varchar'
          }

          // make the foreign key column for relationship using the correct id column type
          targetTable[fieldName] = parentIDColumnMap[colType](`${columnName}_id`).references(
            () => adapter.tables[tableName].id,
            { onDelete: 'set null' },
          )

          // add relationship to table
          relationsToBuild.set(fieldName, {
            type: 'one',
            localized: adapter.payload.config.localization && (field.localized || forceLocalized),
            target: tableName,
          })

          // add notNull when not required
          if (!disableNotNull && field.required && !field.admin?.condition) {
            targetTable[fieldName].notNull()
          }
          break
        }

        if (
          Boolean(field.localized && adapter.payload.config.localization) ||
          withinLocalizedArrayOrBlock
        ) {
          hasLocalizedRelationshipField = true
        }

        break

      case 'tabs': {
        const disableNotNullFromHere = Boolean(field.admin?.condition) || disableNotNull

        const {
          hasLocalizedField: tabHasLocalizedField,
          hasLocalizedManyNumberField: tabHasLocalizedManyNumberField,
          hasLocalizedManyTextField: tabHasLocalizedManyTextField,
          hasLocalizedRelationshipField: tabHasLocalizedRelationshipField,
          hasManyNumberField: tabHasManyNumberField,
          hasManyTextField: tabHasManyTextField,
        } = traverseFields({
          adapter,
          columnPrefix,
          columns,
          disableNotNull: disableNotNullFromHere,
          disableUnique,
          fieldPrefix,
          fields: field.tabs.map((tab) => ({ ...tab, type: 'tab' })),
          forceLocalized,
          indexes,
          localesColumns,
          localesIndexes,
          newTableName,
          parentTableName,
          relationships,
          relationsToBuild,
          rootRelationsToBuild,
          rootTableIDColType,
          rootTableName,
          uniqueRelationships,
          versions,
          withinLocalizedArrayOrBlock,
        })

        if (tabHasLocalizedField) {
          hasLocalizedField = true
        }
        if (tabHasLocalizedRelationshipField) {
          hasLocalizedRelationshipField = true
        }
        if (tabHasManyTextField) {
          hasManyTextField = true
        }
        if (tabHasLocalizedManyTextField) {
          hasLocalizedManyTextField = true
        }
        if (tabHasManyNumberField) {
          hasManyNumberField = true
        }
        if (tabHasLocalizedManyNumberField) {
          hasLocalizedManyNumberField = true
        }
        break
      }
      case 'text': {
        if (field.hasMany) {
          const isLocalized =
            Boolean(field.localized && adapter.payload.config.localization) ||
            withinLocalizedArrayOrBlock ||
            forceLocalized

          if (isLocalized) {
            hasLocalizedManyTextField = true
          }

          if (field.index) {
            hasManyTextField = 'index'
          } else if (!hasManyTextField) {
            hasManyTextField = true
          }

          if (field.unique) {
            throw new InvalidConfiguration(
              'Unique is not supported in Postgres for hasMany text fields.',
            )
          }
        } else {
          targetTable[fieldName] = withDefault(varchar(columnName), field)
        }
        break
      }

      default:
        break
    }

    const condition = field.admin && field.admin.condition

    if (
      !disableNotNull &&
      targetTable[fieldName] &&
      'required' in field &&
      field.required &&
      !condition
    ) {
      targetTable[fieldName].notNull()
    }
  })

  return {
    hasLocalizedField,
    hasLocalizedManyNumberField,
    hasLocalizedManyTextField,
    hasLocalizedRelationshipField,
    hasManyNumberField,
    hasManyTextField,
  }
}
