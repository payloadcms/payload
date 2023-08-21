/* eslint-disable no-param-reassign */
import { Field } from 'payload/types';
import { PostgresAdapter } from '../types';
import { transform } from '../transform/read';
import { BlockRowToInsert } from '../transform/write/types';
import { insertArrays } from '../insertArrays';
import { transformForWrite } from '../transform/write';

type Args = {
  adapter: PostgresAdapter
  data: Record<string, unknown>
  fallbackLocale?: string | false
  fields: Field[]
  locale: string
  path?: string
  tableName: string
}

export const insertRow = async ({
  adapter,
  data,
  fallbackLocale,
  fields,
  locale,
  path = '',
  tableName,
}: Args): Promise<Record<string, unknown>> => {
  // Split out the incoming data into the corresponding:
  // base row, locales, relationships, blocks, and arrays
  const rowToInsert = transformForWrite({
    data,
    fields,
    locale,
    path,
    tableName,
  });

  // First, we insert the main row
  const [insertedRow] = await adapter.db.insert(adapter.tables[tableName])
    .values(rowToInsert.row).returning();


  let localeToInsert: Record<string, unknown>;
  const relationsToInsert: Record<string, unknown>[] = [];
  const blocksToInsert: { [blockType: string]: BlockRowToInsert[] } = {};

  // Maintain a list of promises to run locale, blocks, and relationships
  // all in parallel
  const promises = [];

  // If there is a locale row with data, add the parent and locale
  if (Object.keys(rowToInsert.locale).length > 0) {
    rowToInsert.locale._parentID = insertedRow.id;
    rowToInsert.locale._locale = locale;
    localeToInsert = rowToInsert.locale;
  }

  // If there are relationships, add parent to each
  if (rowToInsert.relationships.length > 0) {
    rowToInsert.relationships.forEach((relation) => {
      relation.parent = insertedRow.id;
      relationsToInsert.push(relation);
    });
  }

  // If there are blocks, add parent to each, and then
  // store by table name and rows
  Object.keys(rowToInsert.blocks).forEach((blockName) => {
    rowToInsert.blocks[blockName].forEach((blockRow) => {
      blockRow.row._parentID = insertedRow.id;
      if (!blocksToInsert[blockName]) blocksToInsert[blockName] = [];
      blocksToInsert[blockName].push(blockRow);
    });
  });

  // //////////////////////////////////
  // INSERT LOCALES
  // //////////////////////////////////

  let insertedLocaleRow;

  if (localeToInsert) {
    promises.push(async () => {
      [insertedLocaleRow] = await adapter.db.insert(adapter.tables[`${tableName}_locales`])
        .values(localeToInsert).returning();
    });
  }

  // //////////////////////////////////
  // INSERT RELATIONSHIPS
  // //////////////////////////////////

  let insertedRelationshipRows: Record<string, unknown>[];

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
    // For each block, push insert into promises to run parallel
    promises.push(async () => {
      insertedBlockRows[blockName] = await adapter.db.insert(adapter.tables[`${tableName}_${blockName}`])
        .values(blockRows.map(({ row }) => row)).returning();

      insertedBlockRows[blockName].forEach((row, i) => {
        delete row._parentID;
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
          delete blockLocaleRow._parentID;
          insertedBlockRows[blockName][blockLocaleIndexMap[i]]._locales = [blockLocaleRow];
        });
      }

      await insertArrays({
        adapter,
        arrays: blockRows.map(({ arrays }) => arrays),
        parentRows: insertedBlockRows[blockName],
      });
    });
  });

  // //////////////////////////////////
  // INSERT ARRAYS RECURSIVELY
  // //////////////////////////////////

  promises.push(async () => {
    await insertArrays({
      adapter,
      arrays: [rowToInsert.arrays],
      parentRows: [insertedRow],
    });
  });

  await Promise.all(promises.map((promise) => promise()));

  // //////////////////////////////////
  // TRANSFORM DATA
  // //////////////////////////////////

  if (insertedLocaleRow) insertedRow._locales = [insertedLocaleRow];
  if (insertedRelationshipRows?.length > 0) insertedRow._relationships = insertedRelationshipRows;

  Object.entries(insertedBlockRows).forEach(([blockName, blocks]) => {
    if (blocks.length > 0) insertedRow[`_blocks_${blockName}`] = blocks;
  });

  const result = transform({
    config: adapter.payload.config,
    data: insertedRow,
    fallbackLocale,
    fields,
    locale,
  });

  return result;
};
