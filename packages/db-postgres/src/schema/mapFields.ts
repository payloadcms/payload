/* eslint-disable no-param-reassign */
import { AnyPgColumnBuilder, integer, pgEnum, pgTable, serial, uniqueIndex, text, varchar, PgColumn, PgTableExtraConfig, index, numeric, PgColumnHKT, IndexBuilder } from 'drizzle-orm/pg-core';
import { Field } from 'payload/types';
import { fieldAffectsData } from 'payload/dist/fields/config/types';
import { GenericColumns, PostgresAdapter } from '../types';
import { formatName } from '../utilities/formatName';
import { createIndex } from './createIndex';

type Args = {
  adapter: PostgresAdapter
  columns: Record<string, AnyPgColumnBuilder>
  fields: Field[]
  indexes: Record<string, (cols: GenericColumns) => IndexBuilder>
  localesColumns: Record<string, AnyPgColumnBuilder>
  localesIndexes: Record<string, (cols: GenericColumns) => IndexBuilder>
  tableName: string
  relationships: Set<string>
}

export const mapFields = ({
  adapter,
  columns,
  fields,
  indexes,
  localesColumns,
  localesIndexes,
  tableName,
  relationships,
}: Args): { hasLocalizedField: boolean } => {
  let hasLocalizedField = false;

  fields.forEach((field) => {
    const formattedName = 'name' in field ? formatName(field.name) : '';
    let targetTable = columns;
    let targetIndexes = indexes;

    if (fieldAffectsData(field)) {
      // If field is localized,
      // add the column to the locale table
      if (field.localized) {
        hasLocalizedField = true;
        targetTable = localesColumns;
        targetIndexes = localesIndexes;
      }

      if (field.unique || field.index) {
        targetIndexes[`${field.name}Idx`] = createIndex({ formattedName, name: field.name, unique: field.unique });
      }
    }

    switch (field.type) {
      case 'text':
      case 'email':
      case 'code':
      case 'textarea':
        targetTable[field.name] = varchar(formattedName);
        break;

      case 'number':
        targetTable[field.name] = numeric(formattedName);
        break;

      case 'row':
        ({ hasLocalizedField } = mapFields({
          adapter,
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
