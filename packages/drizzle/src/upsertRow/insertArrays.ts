import type { ArrayRowToInsert } from '../transform/write/types.js'
import type { DrizzleAdapter, DrizzleTransaction } from '../types.js'

type Args = {
  adapter: DrizzleAdapter
  arrays: {
    [tableName: string]: ArrayRowToInsert[]
  }[]
  db: DrizzleAdapter['drizzle'] | DrizzleTransaction
  parentRows: Record<string, unknown>[]
  uuidMap?: Record<string, number | string>
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
  db,
  parentRows,
  uuidMap = {},
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
        }
      }

      const parentID = parentRows[parentRowIndex].id

      // Add any sub arrays that need to be created
      // We will call this recursively below
      arrayRows.forEach((arrayRow, i) => {
        if (Object.keys(arrayRow.arrays).length > 0) {
          rowsByTable[tableName].arrays.push(arrayRow.arrays)
        }

        // Set up parent IDs for both row and locale row
        arrayRow.row._parentID = parentID
        rowsByTable[tableName].rows.push(arrayRow.row)

        Object.entries(arrayRow.locales).forEach(([arrayRowLocale, arrayRowLocaleData]) => {
          arrayRowLocaleData._parentID = arrayRow.row.id
          arrayRowLocaleData._locale = arrayRowLocale
          rowsByTable[tableName].locales.push(arrayRowLocaleData)
          if (!arrayRow.row.id) {
            arrayRowLocaleData._getParentID = (rows: { _uuid: string; id: number }[]) => {
              const { id } = rows.find((each) => each._uuid === arrayRow.row._uuid)
              return id
            }
          }
        })
      })
    })
  })

  // Insert all corresponding arrays
  // (one insert per array table)
  for (const [tableName, row] of Object.entries(rowsByTable)) {
    // the nested arrays need the ID for the parentID foreign key
    let insertedRows: Args['parentRows']
    if (row.rows.length > 0) {
      insertedRows = await adapter.insert({
        db,
        tableName,
        values: row.rows,
      })

      insertedRows.forEach((row) => {
        if (
          typeof row._uuid === 'string' &&
          (typeof row.id === 'string' || typeof row.id === 'number')
        ) {
          uuidMap[row._uuid] = row.id
        }
      })
    }

    // Insert locale rows
    if (adapter.tables[`${tableName}${adapter.localesSuffix}`] && row.locales.length > 0) {
      if (!row.locales[0]._parentID) {
        row.locales = row.locales.map((localeRow) => {
          if (typeof localeRow._getParentID === 'function') {
            localeRow._parentID = localeRow._getParentID(insertedRows)
            delete localeRow._getParentID
          }
          return localeRow
        })
      }
      await adapter.insert({
        db,
        tableName: `${tableName}${adapter.localesSuffix}`,
        values: row.locales,
      })
    }

    // If there are sub arrays, call this function recursively
    if (row.arrays.length > 0) {
      await insertArrays({
        adapter,
        arrays: row.arrays,
        db,
        parentRows: insertedRows,
      })
    }
  }
}
