/* eslint-disable no-param-reassign */
import { PostgresAdapter } from '../types';
import { ArrayRowToInsert } from '../transform/write/types';

type Args = {
  adapter: PostgresAdapter
  arrays: {
    [tableName: string]: ArrayRowToInsert[]
  }[]
  parentRows: Record<string, unknown>[]
}

type RowsByTable = {
  [tableName: string]: {
    arrays: {
      [tableName: string]: ArrayRowToInsert[]
    }[]
    locales: Record<string, unknown>[]
    rows: Record<string, unknown>[]
  }
}

export const insertArrays = async ({
  adapter,
  arrays,
  parentRows,
}: Args): Promise<void> => {
  // Maintain a map of flattened rows by table
  const rowsByTable: RowsByTable = {}

  arrays.forEach((arraysByTable, parentRowIndex) => {
    Object.entries(arraysByTable).forEach(([tableName, arrayRows]) => {
      // If the table doesn't exist in map, initialize it
      if (!rowsByTable[tableName]) {
        rowsByTable[tableName] = {
          arrays: [],
          locales: [],
          rows: [],
        };
      }

      const parentID = parentRows[parentRowIndex].id

      // Add any sub arrays that need to be created
      // We will call this recursively below
      arrayRows.forEach((arrayRow) => {
        if (Object.keys(arrayRow.arrays).length > 0) {
          rowsByTable[tableName].arrays.push(arrayRow.arrays)
        }

        // Set up parent IDs for both row and locale row
        arrayRow.row._parentID = parentID;
        rowsByTable[tableName].rows.push(arrayRow.row);

        Object.entries(arrayRow.locales).forEach(([arrayRowLocale, arrayRowLocaleData]) => {
          arrayRowLocaleData._parentID = arrayRow.row.id;
          arrayRowLocaleData._locale = arrayRowLocale;
          rowsByTable[tableName].locales.push(arrayRowLocaleData);
        });
      });
    });
  });

  // Insert all corresponding arrays in parallel
  // (one insert per array table)
  await Promise.all(Object.entries(rowsByTable).map(async (
    [tableName, row],
  ) => {
    await adapter.db.insert(adapter.tables[tableName])
      .values(row.rows).returning();

    // Insert locale rows
    if (adapter.tables[`${tableName}_locales`]) {
      await adapter.db.insert(adapter.tables[`${tableName}_locales`])
        .values(row.locales).returning();
    }

    // If there are sub arrays, call this function recursively
    if (row.arrays.length > 0) {
      await insertArrays({
        adapter,
        arrays: row.arrays,
        parentRows: row.rows,
      });
    }
  }));
};
