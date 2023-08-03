import { Field } from 'payload/types';
import toSnakeCase from 'to-snake-case';
import { fieldAffectsData } from 'payload/dist/fields/config/types';
import { PostgresAdapter } from '../types';
import { traverseFields } from './traverseFields';
import { transform } from '../transform';

type Args = {
  adapter: PostgresAdapter
  data: Record<string, unknown>
  fallbackLocale?: string | false
  fields: Field[]
  locale: string
  tableName: string
}

export const insertRows = async ({
  adapter,
  data,
  fallbackLocale,
  fields,
  locale,
  tableName,
}: Args): Promise<Record<string, unknown>> => {
  const row: Record<string, unknown> = {};
  const localeRow: Record<string, unknown> = {};
  const relationshipRows: Record<string, unknown>[] = [];

  await traverseFields({
    adapter,
    data,
    fields,
    locale,
    localeRow,
    relationshipRows,
    row,
    tableName,
  });

  const [insertedRow] = await adapter.db.insert(adapter.tables[tableName])
    .values(row).returning();

  const result: Record<string, unknown> = { ...insertedRow };

  if (Object.keys(localeRow).length > 0) {
    localeRow._parentID = insertedRow.id;
    localeRow._locale = locale;
    const [insertedLocaleRow] = await adapter.db.insert(adapter.tables[`${tableName}_locales`])
      .values(localeRow).returning();

    result._locales = insertedLocaleRow;
  }

  if (relationshipRows.length > 0) {
    const insertedRelationshipRows = await adapter.db.insert(adapter.tables[`${tableName}_relationships`])
      .values(relationshipRows.map((relationRow) => ({
        ...relationRow,
        parent: insertedRow.id,
      }))).returning();

    result._relationships = insertedRelationshipRows;
  }

  return transform({
    config: adapter.payload.config,
    data: result,
    fallbackLocale,
    fields,
    locale,
  });
};
