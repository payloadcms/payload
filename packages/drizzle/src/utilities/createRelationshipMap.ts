// Flatten rows to object with path keys
// for easier retrieval
export const createPathMap = (rows: unknown): Record<string, Record<string, unknown>[]> => {
  let rowsByPath = {}

  if (Array.isArray(rows)) {
    rowsByPath = rows.reduce((res, row) => {
      const formattedRow = {
        ...row,
      }

      delete formattedRow.path

      if (!res[row.path]) {
        res[row.path] = []
      }
      res[row.path].push(row)

      return res
    }, {})
  }

  return rowsByPath
}
