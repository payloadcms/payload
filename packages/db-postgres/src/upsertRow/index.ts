/* eslint-disable no-param-reassign */
import { eq } from 'drizzle-orm';
import { transform } from '../transform/read';
import { BlockRowToInsert } from '../transform/write/types';
import { insertArrays } from './insertArrays';
import { transformForWrite } from '../transform/write';
import { Args } from './types';
import { deleteExistingRowsByPath } from './deleteExistingRowsByPath';
import { deleteExistingArrayRows } from './deleteExistingArrayRows';
import { buildFindManyArgs } from '../find/buildFindManyArgs';

export const upsertRow = async ({
  adapter,
  data,
  fields,
  id,
  operation,
  path = '',
  tableName,
  upsertTarget,
  where,
}: Args): Promise<Record<string, unknown>> => {
  // Split out the incoming data into the corresponding:
  // base row, locales, relationships, blocks, and arrays
  const rowToInsert = transformForWrite({
    data,
    fields,
    path,
    tableName,
  })

  // First, we insert the main row
  let insertedRow: Record<string, unknown>

  if (operation === 'update') {
    const target = upsertTarget || adapter.tables[tableName].id

    if (id) {
      rowToInsert.row.id = id
      ;[insertedRow] = await adapter.db
        .insert(adapter.tables[tableName])
        .values(rowToInsert.row)
        .onConflictDoUpdate({ set: rowToInsert.row, target })
        .returning()
    } else {
      ;[insertedRow] = await adapter.db
        .insert(adapter.tables[tableName])
        .values(rowToInsert.row)
        .onConflictDoUpdate({ set: rowToInsert.row, target, where })
        .returning()
    }
  } else {
    ;[insertedRow] = await adapter.db
      .insert(adapter.tables[tableName])
      .values(rowToInsert.row)
      .returning()
  }

  const localesToInsert: Record<string, unknown>[] = [];
  const relationsToInsert: Record<string, unknown>[] = [];
  const blocksToInsert: { [blockType: string]: BlockRowToInsert[] } = {};

  // Maintain a list of promises to run locale, blocks, and relationships
  // all in parallel
  const promises = []

  // If there are locale rows with data, add the parent and locale to each
  if (Object.keys(rowToInsert.locales).length > 0) {
    Object.entries(rowToInsert.locales).forEach(([locale, localeRow]) => {
      localeRow._parentID = insertedRow.id;
      localeRow._locale = locale;
      localesToInsert.push(localeRow);
    });
  }

  // If there are relationships, add parent to each
  if (rowToInsert.relationships.length > 0) {
    rowToInsert.relationships.forEach((relation) => {
      relation.parent = insertedRow.id
      relationsToInsert.push(relation)
    })
  }

  // If there are blocks, add parent to each, and then
  // store by table name and rows
  Object.keys(rowToInsert.blocks).forEach((blockName) => {
    rowToInsert.blocks[blockName].forEach((blockRow) => {
      blockRow.row._parentID = insertedRow.id
      if (!blocksToInsert[blockName]) blocksToInsert[blockName] = []
      blocksToInsert[blockName].push(blockRow)
    })
  })

  // //////////////////////////////////
  // INSERT LOCALES
  // //////////////////////////////////

  if (localesToInsert.length > 0) {
    const localeTable = adapter.tables[`${tableName}_locales`];

    promises.push(async () => {
      if (operation === 'update') {
        await adapter.db.delete(localeTable).where(eq(localeTable._parentID, insertedRow.id));
      }

      await adapter.db.insert(localeTable).values(localesToInsert);
    });
  }

  // //////////////////////////////////
  // INSERT RELATIONSHIPS
  // //////////////////////////////////

  if (relationsToInsert.length > 0) {
    promises.push(async () => {
      const relationshipsTableName = `${tableName}_relationships`;
      if (operation === 'update') {
        await deleteExistingRowsByPath({
          adapter,
          localeColumnName: 'locale',
          parentColumnName: 'parent',
          parentID: insertedRow.id,
          pathColumnName: 'path',
          newRows: relationsToInsert,
          tableName: relationshipsTableName,
        });
      }

      await adapter.db.insert(adapter.tables[relationshipsTableName])
        .values(relationsToInsert).returning();
    });
  }

  // //////////////////////////////////
  // INSERT BLOCKS
  // //////////////////////////////////

  const insertedBlockRows: Record<string, Record<string, unknown>[]> = {}

  Object.entries(blocksToInsert).forEach(([blockName, blockRows]) => {
    // For each block, push insert into promises to run parallel
    promises.push(async () => {
      if (operation === 'update') {
        await deleteExistingRowsByPath({
          adapter,
          parentID: insertedRow.id,
          pathColumnName: '_path',
          newRows: blockRows.map(({ row }) => row),
          tableName: `${tableName}_${blockName}`,
        });
      }

      insertedBlockRows[blockName] = await adapter.db.insert(adapter.tables[`${tableName}_${blockName}`])
        .values(blockRows.map(({ row }) => row)).returning();

      insertedBlockRows[blockName].forEach((row, i) => {
        blockRows[i].row = row;
      });

      const blockLocaleIndexMap: number[] = []

      const blockLocaleRowsToInsert = blockRows.reduce((acc, blockRow, i) => {
        if (Object.entries(blockRow.locales).length > 0) {
          Object.entries(blockRow.locales).forEach(([blockLocale, blockLocaleData]) => {
            if (Object.keys(blockLocaleData).length > 0) {
              blockLocaleData._parentID = blockRow.row.id;
              blockLocaleData._locale = blockLocale;
              acc.push(blockLocaleData);
              blockLocaleIndexMap.push(i);
            }
          });
        }

        return acc
      }, [])

      if (blockLocaleRowsToInsert.length > 0) {
        await adapter.db.insert(adapter.tables[`${tableName}_${blockName}_locales`])
          .values(blockLocaleRowsToInsert).returning();
      }

      await insertArrays({
        adapter,
        arrays: blockRows.map(({ arrays }) => arrays),
        parentRows: insertedBlockRows[blockName],
      })
    })
  })

  // //////////////////////////////////
  // INSERT ARRAYS RECURSIVELY
  // //////////////////////////////////

  promises.push(async () => {
    if (operation === 'update') {
      await Promise.all(Object.entries(rowToInsert.arrays).map(async ([arrayTableName, tableRows]) => {
        await deleteExistingArrayRows({
          adapter,
          parentID: insertedRow.id,
          tableName: arrayTableName,
        });
      }));
    }

    await insertArrays({
      adapter,
      arrays: [rowToInsert.arrays],
      parentRows: [insertedRow],
    })
  })

  await Promise.all(promises.map((promise) => promise()))

  // //////////////////////////////////
  // RETRIEVE NEWLY UPDATED ROW
  // //////////////////////////////////

  const findManyArgs = buildFindManyArgs({
    adapter,
    depth: 0,
    fields,
    tableName,
  });

  findManyArgs.where = eq(adapter.tables[tableName].id, insertedRow.id);

  const doc = await adapter.db.query[tableName].findFirst(findManyArgs);

  // //////////////////////////////////
  // TRANSFORM DATA
  // //////////////////////////////////

  const result = transform({
    config: adapter.payload.config,
    data: doc,
    fields,
  });

  return result
}
