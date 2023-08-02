/* eslint-disable no-param-reassign */
import { AnyPgColumnBuilder, integer, pgEnum, pgTable, serial, uniqueIndex, text, varchar, PgColumn, PgTableExtraConfig, index, numeric, PgColumnHKT, IndexBuilder } from 'drizzle-orm/pg-core';
import { Field } from 'payload/types';
import { Relation, relations } from 'drizzle-orm';
import { fieldAffectsData } from 'payload/dist/fields/config/types';
import { GenericColumns, GenericTable, PostgresAdapter } from '../types';
import { formatName } from '../utilities/formatName';
import { mapFields } from './mapFields';

type Args = {
  adapter: PostgresAdapter
  tableName: string
  fields: Field[]
}

export const buildTable = ({
  adapter,
  tableName,
  fields,
}: Args): void => {
  const formattedTableName = formatName(tableName);
  const columns: Record<string, AnyPgColumnBuilder> = {};
  const indexes: Record<string, (cols: GenericColumns) => IndexBuilder> = {};

  let hasLocalizedField = false;
  const localesColumns: Record<string, AnyPgColumnBuilder> = {};
  const localesIndexes: Record<string, (cols: GenericColumns) => IndexBuilder> = {};
  let localesTable: GenericTable;

  const relationships: Set<string> = new Set();
  let relationshipsTable: GenericTable;

  const idField = fields.find((field) => fieldAffectsData(field) && field.name === 'id');

  if (idField) {
    columns.id = idField.type === 'number' ? integer('id').primaryKey() : text('id').primaryKey();
  } else {
    columns.id = serial('id').primaryKey();
  }

  ({ hasLocalizedField } = mapFields({
    adapter,
    columns,
    fields,
    indexes,
    localesColumns,
    localesIndexes,
    tableName,
    relationships,
  }));

  const table = pgTable(formattedTableName, columns, (cols) => {
    return Object.entries(indexes).reduce((acc, [colName, func]) => {
      acc[colName] = func(cols);
      return acc;
    }, {});
  });

  adapter.tables[formattedTableName] = table;

  if (hasLocalizedField) {
    const localeTableName = `${formattedTableName}_locales`;

    localesTable = pgTable(localeTableName, localesColumns, (cols) => {
      return Object.entries(localesIndexes).reduce((acc, [colName, func]) => {
        acc[colName] = func(cols);
        return acc;
      }, {});
    });

    adapter.tables[localeTableName] = localesTable;
  }

  if (relationships.size) {
    const relationshipColumns: Record<string, AnyPgColumnBuilder> = {
      id: serial('id').primaryKey(),
      parent: integer('parent_id').references(() => table.id).notNull(),
      path: varchar('path').notNull(),
      order: integer('order'),
    };

    relationships.forEach((relationTo) => {
      const formattedRelationTo = formatName(relationTo);
      relationshipColumns[`${relationTo}ID`] = integer(`${formattedRelationTo}_id`).references(() => adapter.tables[formattedRelationTo].id);
    });

    relationshipsTable = pgTable(`${formattedTableName}_relationships`, relationshipColumns);

    adapter.tables[`${formattedTableName}_relationships`] = relationshipsTable;
  }

  const tableRelations = relations(table, ({ many }) => {
    const result: Record<string, Relation<string>> = {};

    if (hasLocalizedField) {
      result._locales = many(localesTable);
    }

    if (relationships.size) {
      result._relationships = many(relationshipsTable, {
        relationName: '_relationships',
      });
    }

    return result;
  });

  adapter.relations[`${formattedTableName}`] = tableRelations;
};
