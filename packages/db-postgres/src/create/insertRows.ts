/* eslint-disable no-param-reassign */
import { Field } from 'payload/types';
import { PostgresAdapter } from '../types';
import { traverseFields } from './traverseFields';
import { transform } from '../transform';
import { BlockRowToInsert, RowToInsert } from './types';
import { insertArrays } from './insertArrays';

type Args = {
  adapter: PostgresAdapter
  fallbackLocale?: string | false
  fields: Field[]
  locale: string
  operation: 'create' | 'update'
  path?: string
  rows: Record<string, unknown>[]
  tableName: string
}

export const insertRows = async ({
  adapter,
  fallbackLocale,
  fields,
  locale,
  operation,
  path = '',
  rows,
  tableName,
}: Args): Promise<Record<string, unknown>[]> => {
  const rowsToInsert: RowToInsert[] = [];

  rows.forEach((data, i) => {
    rowsToInsert.push({
      row: {},
      locale: {},
      relationships: [],
      blocks: {},
      arrays: {},
    });

    traverseFields({
      adapter,
      arrays: rowsToInsert[i].arrays,
      blocks: rowsToInsert[i].blocks,
      columnPrefix: '',
      data,
      fields,
      locale,
      localeRow: rowsToInsert[i].locale,
      newTableName: tableName,
      parentTableName: tableName,
      path,
      relationships: rowsToInsert[i].relationships,
      row: rowsToInsert[i].row,
    });
  });

  const insertedRows = await adapter.db.insert(adapter.tables[tableName])
    .values(rowsToInsert.map(({ row }) => row)).returning();

  const localesToInsert: Record<string, unknown>[] = [];
  const relationsToInsert: Record<string, unknown>[] = [];
  const blocksToInsert: { [blockType: string]: BlockRowToInsert[] } = {};

  const promises = [];

  insertedRows.forEach((insertedRow, i) => {
    if (Object.keys(rowsToInsert[i].locale).length > 0) {
      rowsToInsert[i].locale._parentID = insertedRow.id;
      rowsToInsert[i].locale._locale = locale;
      localesToInsert.push(rowsToInsert[i].locale);
    }

    if (rowsToInsert[i].relationships) {
      rowsToInsert[i].relationships.forEach((relation) => {
        relation.parent = insertedRow.id;
        relationsToInsert.push(relation);
      });
    }

    Object.keys(rowsToInsert[i].blocks).forEach((blockName) => {
      rowsToInsert[i].blocks[blockName].forEach((blockRow) => {
        blockRow.row._parentID = insertedRow.id;
        if (!blocksToInsert[blockName]) blocksToInsert[blockName] = [];
        blocksToInsert[blockName].push(blockRow);
      });
    });
  });

  await insertArrays({
    adapter,
    rowsToInsert,
    parentRows: insertedRows,
  });

  // //////////////////////////////////
  // INSERT LOCALES
  // //////////////////////////////////

  let insertedLocaleRows;

  if (localesToInsert.length > 0) {
    promises.push(async () => {
      insertedLocaleRows = await adapter.db.insert(adapter.tables[`${tableName}_locales`])
        .values(localesToInsert).returning();
    });
  }

  // //////////////////////////////////
  // INSERT RELATIONSHIPS
  // //////////////////////////////////

  let insertedRelationshipRows;

  if (relationsToInsert.length > 0) {
    promises.push(async () => {
      insertedRelationshipRows = await adapter.db.insert(adapter.tables[`${tableName}_relationships`])
        .values(relationsToInsert).returning();
    });
  }

  // //////////////////////////////////
  // INSERT BLOCKS
  // //////////////////////////////////

  const insertedBlockRows: Record<string, Record<string, unknown>[]> = {};

  Object.entries(blocksToInsert).forEach(([blockName, blockRows]) => {
    promises.push(async () => {
      insertedBlockRows[blockName] = await adapter.db.insert(adapter.tables[`${tableName}_${blockName}`])
        .values(blockRows.map(({ row }) => row)).returning();

      insertedBlockRows[blockName].forEach((row, i) => {
        blockRows[i].row = row;
      });

      const blockLocaleIndexMap: number[] = [];

      const blockLocaleRowsToInsert = blockRows.reduce((acc, blockRow, i) => {
        if (Object.keys(blockRow.locale).length > 0) {
          blockRow.locale._parentID = blockRow.row.id;
          blockRow.locale._locale = locale;
          acc.push(blockRow.locale);
          blockLocaleIndexMap.push(i);
          return acc;
        }

        return acc;
      }, []);

      if (blockLocaleRowsToInsert.length > 0) {
        const insertedBlockLocaleRows = await adapter.db.insert(adapter.tables[`${tableName}_${blockName}_locales`])
          .values(blockLocaleRowsToInsert).returning();

        insertedBlockLocaleRows.forEach((blockLocaleRow, i) => {
          insertedBlockRows[blockName][blockLocaleIndexMap[i]]._locales = [blockLocaleRow];
        });
      }
    });
  });

  await Promise.all(promises.map((promise) => promise()));

  // //////////////////////////////////
  // TRANSFORM DATA
  // //////////////////////////////////

  return insertedRows.map((row) => {
    const matchedLocaleRow = insertedLocaleRows?.find(({ _parentID }) => _parentID === row.id);
    if (matchedLocaleRow) row._locales = [matchedLocaleRow];

    const matchedRelationshipRows = insertedRelationshipRows?.filter(({ parent }) => parent === row.id);
    if (matchedRelationshipRows?.length > 0) row._relationships = matchedRelationshipRows;

    Object.entries(insertedBlockRows).forEach(([blockName, blocks]) => {
      const matchedBlocks = blocks.filter(({ _parentID }) => _parentID === row.id);
      if (matchedBlocks.length > 0) row[`_blocks_${blockName}`] = matchedBlocks;
    });

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
