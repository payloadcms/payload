/* eslint-disable no-param-reassign */
import type { Relation } from 'drizzle-orm'
import type { IndexBuilder, PgColumnBuilder, UniqueConstraintBuilder } from 'drizzle-orm/pg-core'
import type { Field } from 'payload/types'

import { relations } from 'drizzle-orm'
import {
  PgNumericBuilder,
  PgVarcharBuilder,
  integer,
  jsonb,
  numeric,
  text,
  unique,
  varchar,
} from 'drizzle-orm/pg-core'
import { fieldAffectsData } from 'payload/types'
import toSnakeCase from 'to-snake-case'

import type { GenericColumns, PostgresAdapter } from '../types'

import { hasLocalesTable } from '../utilities/hasLocalesTable'
import { buildTable } from './build'
import { createIndex } from './createIndex'
import { parentIDColumnMap } from './parentIDColumnMap'

type Args = {
  adapter: PostgresAdapter
  arrayBlockRelations: Map<string, string>
  buildRelationships: boolean
  columnPrefix?: string
  columns: Record<string, PgColumnBuilder>
  fieldPrefix?: string
  fields: Field[]
  forceLocalized?: boolean
  indexes: Record<string, (cols: GenericColumns) => IndexBuilder>
  localesColumns: Record<string, PgColumnBuilder>
  localesIndexes: Record<string, (cols: GenericColumns) => IndexBuilder>
  newTableName: string
  parentTableName: string
  relationships: Set<string>
}

type Result = {
  hasLocalizedField: boolean
  hasLocalizedRelationshipField: boolean
}

export const traverseFields = ({
  adapter,
  arrayBlockRelations,
  buildRelationships,
  columnPrefix,
  columns,
  fieldPrefix,
  fields,
  forceLocalized,
  indexes,
  localesColumns,
  localesIndexes,
  newTableName,
  parentTableName,
  relationships,
}: Args): Result => {
  let hasLocalizedField = false
  let hasLocalizedRelationshipField = false

  let parentIDColType = 'integer'
  if (columns.id instanceof PgNumericBuilder) parentIDColType = 'numeric'
  if (columns.id instanceof PgVarcharBuilder) parentIDColType = 'varchar'

  fields.forEach((field) => {
    if ('name' in field && field.name === 'id') return
    let columnName: string

    let targetTable = columns
    let targetIndexes = indexes

    if (fieldAffectsData(field)) {
      columnName = `${columnPrefix || ''}${toSnakeCase(field.name)}`

      // If field is localized,
      // add the column to the locale table instead of main table
      if (adapter.payload.config.localization && (field.localized || forceLocalized)) {
        hasLocalizedField = true
        targetTable = localesColumns
        targetIndexes = localesIndexes
      }

      if (
        (field.unique || field.index) &&
        !['array', 'blocks', 'group', 'relationship', 'upload'].includes(field.type)
      ) {
        targetIndexes[`${field.name}Idx`] = createIndex({
          name: field.name,
          columnName,
          unique: field.unique,
        })
      }
    }

    switch (field.type) {
      case 'text':
      case 'email':
      case 'code':
      case 'textarea': {
        // TODO: handle hasMany
        // TODO: handle min / max length
        targetTable[`${fieldPrefix || ''}${field.name}`] = varchar(columnName)
        break
      }

      case 'number': {
        // TODO: handle hasMany
        // TODO: handle min / max
        targetTable[`${fieldPrefix || ''}${field.name}`] = numeric(columnName)
        break
      }

      case 'richText':
      case 'json': {
        targetTable[`${fieldPrefix || ''}${field.name}`] = jsonb(columnName)
        break
      }

      case 'date': {
        break
      }

      case 'point': {
        break
      }

      case 'radio': {
        break
      }

      case 'select': {
        break
      }

      case 'array': {
        const baseColumns: Record<string, PgColumnBuilder> = {
          _order: integer('_order').notNull(),
          _parentID: parentIDColumnMap[parentIDColType]('_parent_id')
            .references(() => adapter.tables[parentTableName].id, { onDelete: 'cascade' })
            .notNull(),
        }

        const baseExtraConfig: Record<
          string,
          (cols: GenericColumns) => IndexBuilder | UniqueConstraintBuilder
        > = {}

        if (field.localized && adapter.payload.config.localization) {
          baseColumns._locale = adapter.enums._locales('_locale').notNull()
          baseExtraConfig._parentOrderLocale = (cols) =>
            unique().on(cols._parentID, cols._order, cols._locale)
        } else {
          baseExtraConfig._parentOrder = (cols) => unique().on(cols._parentID, cols._order)
        }

        const arrayTableName = `${newTableName}_${toSnakeCase(field.name)}`

        const { arrayBlockRelations: subArrayBlockRelations } = buildTable({
          adapter,
          baseColumns,
          baseExtraConfig,
          fields: field.fields,
          tableName: arrayTableName,
        })

        arrayBlockRelations.set(`${fieldPrefix || ''}${field.name}`, arrayTableName)

        const arrayTableRelations = relations(adapter.tables[arrayTableName], ({ many, one }) => {
          const result: Record<string, Relation<string>> = {
            _parentID: one(adapter.tables[parentTableName], {
              fields: [adapter.tables[arrayTableName]._parentID],
              references: [adapter.tables[parentTableName].id],
            }),
          }

          if (hasLocalesTable(field.fields)) {
            result._locales = many(adapter.tables[`${arrayTableName}_locales`])
          }

          subArrayBlockRelations.forEach((val, key) => {
            result[key] = many(adapter.tables[val])
          })

          return result
        })

        adapter.relations[`relations_${arrayTableName}`] = arrayTableRelations

        break
      }

      case 'blocks': {
        field.blocks.forEach((block) => {
          const blockTableName = `${newTableName}_${toSnakeCase(block.slug)}`
          if (!adapter.tables[blockTableName]) {
            const baseColumns: Record<string, PgColumnBuilder> = {
              _order: integer('_order').notNull(),
              _parentID: parentIDColumnMap[parentIDColType]('_parent_id')
                .references(() => adapter.tables[parentTableName].id, { onDelete: 'cascade' })
                .notNull(),
              _path: text('_path').notNull(),
            }

            const baseExtraConfig: Record<
              string,
              (cols: GenericColumns) => IndexBuilder | UniqueConstraintBuilder
            > = {}

            if (field.localized && adapter.payload.config.localization) {
              baseColumns._locale = adapter.enums._locales('_locale').notNull()
              baseExtraConfig._parentPathOrderLocale = (cols) =>
                unique().on(cols._parentID, cols._path, cols._order, cols._locale)
            } else {
              baseExtraConfig._parentPathOrder = (cols) =>
                unique().on(cols._parentID, cols._path, cols._order)
            }

            const { arrayBlockRelations: subArrayBlockRelations } = buildTable({
              adapter,
              baseColumns,
              baseExtraConfig,
              fields: block.fields,
              tableName: blockTableName,
            })

            const blockTableRelations = relations(
              adapter.tables[blockTableName],
              ({ many, one }) => {
                const result: Record<string, Relation<string>> = {
                  _parentID: one(adapter.tables[parentTableName], {
                    fields: [adapter.tables[blockTableName]._parentID],
                    references: [adapter.tables[parentTableName].id],
                  }),
                }

                if (hasLocalesTable(block.fields)) {
                  result._locales = many(adapter.tables[`${blockTableName}_locales`])
                }

                subArrayBlockRelations.forEach((val, key) => {
                  result[key] = many(adapter.tables[val])
                })

                return result
              },
            )

            adapter.relations[`relations_${blockTableName}`] = blockTableRelations
          }

          arrayBlockRelations.set(`_blocks_${block.slug}`, blockTableName)
        })

        break
      }

      case 'group': {
        const {
          hasLocalizedField: groupHasLocalizedField,
          hasLocalizedRelationshipField: groupHasLocalizedRelationshipField,
        } = traverseFields({
          adapter,
          arrayBlockRelations,
          buildRelationships,
          columnPrefix: `${columnName}_`,
          columns,
          fieldPrefix: `${fieldPrefix || ''}${field.name}_`,
          fields: field.fields,
          forceLocalized: field.localized,
          indexes,
          localesColumns,
          localesIndexes,
          newTableName: `${parentTableName}_${toSnakeCase(field.name)}`,
          parentTableName,
          relationships,
        })

        if (groupHasLocalizedField) hasLocalizedField = true
        if (groupHasLocalizedRelationshipField) hasLocalizedRelationshipField = true
        break
      }

      case 'tabs': {
        field.tabs.forEach((tab) => {
          if ('name' in tab) {
            const {
              hasLocalizedField: tabHasLocalizedField,
              hasLocalizedRelationshipField: tabHasLocalizedRelationshipField,
            } = traverseFields({
              adapter,
              arrayBlockRelations,
              buildRelationships,
              columnPrefix: `${columnPrefix || ''}${toSnakeCase(tab.name)}_`,
              columns,
              fieldPrefix: `${fieldPrefix || ''}${tab.name}_`,
              fields: tab.fields,
              indexes,
              localesColumns,
              localesIndexes,
              newTableName: `${parentTableName}_${toSnakeCase(tab.name)}`,
              parentTableName,
              relationships,
            })

            if (tabHasLocalizedField) hasLocalizedField = true
            if (tabHasLocalizedRelationshipField) hasLocalizedRelationshipField = true
          } else {
            ;({ hasLocalizedField, hasLocalizedRelationshipField } = traverseFields({
              adapter,
              arrayBlockRelations,
              buildRelationships,
              columnPrefix,
              columns,
              fieldPrefix,
              fields: tab.fields,
              indexes,
              localesColumns,
              localesIndexes,
              newTableName: parentTableName,
              parentTableName,
              relationships,
            }))
          }
        })
        break
      }

      case 'row':
      case 'collapsible': {
        ;({ hasLocalizedField, hasLocalizedRelationshipField } = traverseFields({
          adapter,
          arrayBlockRelations,
          buildRelationships,
          columnPrefix,
          columns,
          fieldPrefix,
          fields: field.fields,
          indexes,
          localesColumns,
          localesIndexes,
          newTableName: parentTableName,
          parentTableName,
          relationships,
        }))
        break
      }

      case 'relationship':
      case 'upload':
        if (Array.isArray(field.relationTo)) {
          field.relationTo.forEach((relation) => relationships.add(relation))
        } else {
          relationships.add(field.relationTo)
        }

        if (field.localized && adapter.payload.config.localization) {
          hasLocalizedRelationshipField = true
        }
        break

      default:
        break
    }
  })

  return { hasLocalizedField, hasLocalizedRelationshipField }
}
