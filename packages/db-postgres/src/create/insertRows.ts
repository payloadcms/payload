/* eslint-disable no-param-reassign */
import { Field } from 'payload/types';
import toSnakeCase from 'to-snake-case';
import { Block, fieldAffectsData } from 'payload/dist/fields/config/types';
import { PostgresAdapter } from '../types';
import { traverseFields } from './traverseFields';
import { transform } from '../transform';
import { ArrayRowPromisesMap, BlockRowsToInsert, RowInsertionGroup } from './types';

type Args = {
  adapter: PostgresAdapter
  addRowIndexToPath?: boolean
  rows: Record<string, unknown>[]
  fallbackLocale?: string | false
  fields: Field[]
  initialRowData?: Record<string, unknown>[]
  incomingRelationshipRows?: Record<string, unknown>[]
  incomingBlockRows?: { [blockType: string]: BlockRowsToInsert }
  locale: string
  operation: 'create' | 'update'
  path?: string
  tableName: string
}

export const insertRows = async ({
  adapter,
  addRowIndexToPath,
  rows,
  fallbackLocale,
  fields,
  initialRowData,
  incomingBlockRows,
  incomingRelationshipRows,
  locale,
  operation,
  path = '',
  tableName,
}: Args): Promise<Record<string, unknown>[]> => {
  const insertions: RowInsertionGroup[] = [];

  await Promise.all(rows.map(async (data, i) => {
    const insertion: RowInsertionGroup = {
      row: { ...initialRowData?.[i] || {} },
      localeRow: {},
      relationshipRows: incomingRelationshipRows || [],
      blockRows: incomingBlockRows || {},
      arrayRowPromises: {},
    };

    await traverseFields({
      adapter,
      arrayRowPromises: insertion.arrayRowPromises,
      blockRows: insertion.blockRows,
      data,
      fallbackLocale,
      fields,
      locale,
      localeRow: insertion.localeRow,
      operation,
      path: addRowIndexToPath ? `${path}${i}.` : path,
      relationshipRows: insertion.relationshipRows,
      row: insertion.row,
      tableName,
    });

    insertions.push(insertion);
  }));

  const insertedRows = await adapter.db.insert(adapter.tables[tableName])
    .values(insertions.map(({ row }) => row)).returning();

  let insertedLocaleRows: Record<string, unknown>[] = [];
  let insertedRelationshipRows: Record<string, unknown>[] = [];

  const relatedRowPromises = [];

  // Fill related rows with parent IDs returned from database
  insertedRows.forEach((row, i) => {
    insertions[i].row = row;
    const { localeRow, relationshipRows, blockRows, arrayRowPromises } = insertions[i];

    if (Object.keys(arrayRowPromises).length > 0) {
      Object.entries(arrayRowPromises).forEach(([key, func]) => {
        relatedRowPromises.push(async () => {
          insertions[i].row[key] = await func({ parentID: row.id as string });
        });
      });
    }

    if (!incomingBlockRows && Object.keys(blockRows).length > 0) {
      Object.entries(blockRows).forEach(([blockType, { block, rows: blockRowsToInsert }]) => {
        relatedRowPromises.push(async () => {
          const result = await insertRows({
            adapter,
            addRowIndexToPath: true,
            rows: blockRowsToInsert,
            fallbackLocale,
            fields: block.fields,
            initialRowData: blockRowsToInsert.map((initialBlockRow) => ({
              _order: initialBlockRow._order,
              _parentID: row.id,
              _path: initialBlockRow._path,
            })),
            incomingBlockRows,
            incomingRelationshipRows,
            locale,
            operation,
            path,
            tableName: `${tableName}_${toSnakeCase(blockType)}`,
          });

          return result;
        });
      });
    }

    if (Object.keys(localeRow).length > 0) {
      localeRow._parentID = row.id;
      localeRow._locale = locale;
      insertedLocaleRows.push(localeRow);
    }

    if (relationshipRows.length > 0) {
      insertedRelationshipRows = insertedRelationshipRows.concat(relationshipRows.map((relationshipRow) => {
        relationshipRow.parent = row.id;
        return relationshipRow;
      }));
    }
  });

  // Insert locales
  if (insertedLocaleRows.length > 0) {
    relatedRowPromises.push(async () => {
      insertedLocaleRows = await adapter.db.insert(adapter.tables[`${tableName}_locales`])
        .values(insertedLocaleRows).returning();
    });
  }

  // Insert relationships
  // NOTE - only do this if there are no incoming relationship rows
  // because `insertRows` is recursive and relationships should only happen at the top level
  if (!incomingRelationshipRows && insertedRelationshipRows.length > 0) {
    relatedRowPromises.push(async () => {
      insertedRelationshipRows = await adapter.db.insert(adapter.tables[`${tableName}_relationships`])
        .values(insertedRelationshipRows).returning();
    });
  }

  await Promise.all(relatedRowPromises.map((promise) => promise()));

  return insertedRows.map((row) => {
    const matchedLocaleRow = insertedLocaleRows.find(({ _parentID }) => _parentID === row.id);
    if (matchedLocaleRow) row._locales = [matchedLocaleRow];

    const matchedRelationshipRows = insertedRelationshipRows.filter(({ parent }) => parent === row.id);
    if (matchedRelationshipRows.length > 0) row._relationships = matchedRelationshipRows;

    const result = transform({
      config: adapter.payload.config,
      data: row,
      fallbackLocale,
      fields,
      locale,
    });

    return result;
  });
};
