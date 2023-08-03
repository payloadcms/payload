/* eslint-disable no-param-reassign */
import { AnyPgColumnBuilder, integer, pgEnum, pgTable, serial, uniqueIndex, text, varchar, PgColumn, PgTableExtraConfig, index, numeric, PgColumnHKT, IndexBuilder } from 'drizzle-orm/pg-core';
import { Field } from 'payload/types';
import toSnakeCase from 'to-snake-case';
import { fieldAffectsData } from 'payload/dist/fields/config/types';
import { GenericColumns, PostgresAdapter } from '../types';
import { createIndex } from './createIndex';
import { buildTable } from './build';

type Args = {
  adapter: PostgresAdapter
  buildRelationships: boolean
  columns: Record<string, AnyPgColumnBuilder>
  columnPrefix?: string
  fieldPrefix?: string
  fields: Field[]
  indexes: Record<string, (cols: GenericColumns) => IndexBuilder>
  localesColumns: Record<string, AnyPgColumnBuilder>
  localesIndexes: Record<string, (cols: GenericColumns) => IndexBuilder>
  tableName: string
  relationships: Set<string>
}

export const traverseFields = ({
  adapter,
  buildRelationships,
  columnPrefix,
  columns,
  fieldPrefix,
  fields,
  indexes,
  localesColumns,
  localesIndexes,
  tableName,
  relationships,
}: Args): { hasLocalizedField: boolean } => {
  let hasLocalizedField = false;

  fields.forEach((field) => {
    let columnName: string;

    let targetTable = columns;
    let targetIndexes = indexes;

    if (fieldAffectsData(field)) {
      columnName = `${columnPrefix || ''}${toSnakeCase(field.name)}`;

      // If field is localized,
      // add the column to the locale table
      if (field.localized) {
        hasLocalizedField = true;
        targetTable = localesColumns;
        targetIndexes = localesIndexes;
      }

      if (field.unique || field.index) {
        targetIndexes[`${field.name}Idx`] = createIndex({ columnName, name: field.name, unique: field.unique });
      }
    }

    switch (field.type) {
      case 'text':
      case 'email':
      case 'code':
      case 'textarea': {
        targetTable[`${fieldPrefix || ''}${field.name}`] = varchar(columnName);
        break;
      }

      case 'number': {
        targetTable[`${fieldPrefix || ''}${field.name}`] = numeric(columnName);
        break;
      }

      case 'array': {
        const baseColumns: Record<string, AnyPgColumnBuilder> = {
          _order: integer('_order').notNull(),
          _parentID: integer('_parent_id').references(() => adapter.tables[tableName].id).notNull(),
        };

        if (field.localized && adapter.payload.config.localization) {
          baseColumns._locale = adapter.enums._locales('_locale').notNull();
        }

        buildTable({
          adapter,
          baseColumns,
          fields: field.fields,
          tableName: `${tableName}_${toSnakeCase(field.name)}`,
        });

        break;
      }

      case 'group': {
        // Todo: determine what should happen if groups are set to localized
        const { hasLocalizedField: groupHasLocalizedField } = traverseFields({
          adapter,
          buildRelationships,
          columnPrefix: `${columnName}_`,
          columns,
          fieldPrefix: `${fieldPrefix || ''}${field.name}_`,
          fields: field.fields,
          indexes,
          localesColumns,
          localesIndexes,
          tableName: `${tableName}_${toSnakeCase(field.name)}`,
          relationships,
        });

        if (groupHasLocalizedField) hasLocalizedField = true;

        break;
      }

      case 'row':
        ({ hasLocalizedField } = traverseFields({
          adapter,
          buildRelationships,
          columns,
          fields: field.fields,
          indexes,
          localesColumns,
          localesIndexes,
          tableName,
          relationships,
        }));
        break;

      case 'relationship':
      case 'upload':
        if (Array.isArray(field.relationTo)) {
          field.relationTo.forEach((relation) => relationships.add(relation));
        } else {
          relationships.add(field.relationTo);
        }
        break;

      default:
        break;
    }
  });

  return { hasLocalizedField };
};
