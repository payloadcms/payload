/**
 * @todo remove this function and subsequent hooks in v4
 * They are used to transform the old shape of `columnPreferences` to new shape
 * i.e. ({ accessor: string, active: boolean })[] to ({ [accessor: string]: boolean })[]
 * In v4 can we use the new shape directly
 */
export const migrateColumns = (value: Record<string, any>) => {
  if (value && typeof value === 'object' && 'columns' in value && Array.isArray(value.columns)) {
    value.columns = value.columns.map((col) => {
      if ('accessor' in col) {
        return { [col.accessor]: col.active }
      }

      return col
    })
  }

  return value
}
