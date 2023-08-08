/* eslint-disable no-param-reassign */
import { PostgresAdapter } from '../types';
import { RowToInsert } from './types';

type Args = {
  adapter: PostgresAdapter
  rowsToInsert: RowToInsert[]
  parentRows: Record<string, unknown>[]
}

type RowsByTable = {
  [tableName: string]: {
    rows: Record<string, unknown>[]
    locales: Record<string, unknown>[]
    columnName: string
    rowIndexMap: [number, number][]
  }
}

export const insertArrays = async ({
  adapter,
  rowsToInsert,
  parentRows,
}: Args): Promise<void> => {
  const rowsByTable: RowsByTable = {};

  rowsToInsert.forEach(({ arrays }, parentRowIndex) => {
    Object.entries(arrays).forEach(([tableName, arrayRows]) => {
      if (!rowsByTable[tableName]) {
        rowsByTable[tableName] = {
          rows: [],
          locales: [],
          columnName: arrayRows[0]?.columnName,
          rowIndexMap: [],
        };
      }

      const parentID = parentRows[parentRowIndex].id;

      rowsByTable[tableName].rowIndexMap.push([
        rowsByTable[tableName].rows.length, arrayRows.length,
      ]);

      arrayRows.forEach((arrayRow) => {
        arrayRow.row._parentID = parentID;
        rowsByTable[tableName].rows.push(arrayRow.row);
        arrayRow.locale._parentID = arrayRow.row.id;
        rowsByTable[tableName].locales.push(arrayRow.locale);
      });
    });
  });

  await Promise.all(Object.entries(rowsByTable).map(async (
    [tableName, { locales, rows }],
  ) => {
    const insertedRows = await adapter.db.insert(adapter.tables[tableName])
      .values(rows).returning();

    rowsByTable[tableName].rows = insertedRows;

    if (adapter.tables[`${tableName}_locales`]) {
      const insertedLocaleRows = await adapter.db.insert(adapter.tables[`${tableName}_locales`])
        .values(locales).returning();

      insertedLocaleRows.forEach((localeRow, i) => {
        rowsByTable[tableName].rows[i]._locales = [localeRow];
      });
    }

    // await insertRows({
    //   adapter,
    //   parentRows: rowsByTable[tableName].rows,
    // });
  }));

  Object.values(rowsByTable).forEach(({ rows, columnName, rowIndexMap }) => {
    rowIndexMap.forEach(([start, finish], i) => {
      parentRows[i][columnName] = rows.slice(start, finish);
    });
  });

  console.log(parentRows);

  // Recursively call arrays at this point
};
