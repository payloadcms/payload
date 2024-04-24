import type { PostgresAdapter } from '../types.js'

type Args = {
  adapter: PostgresAdapter
  defaultTableName: string
}

export const getTableName = ({ adapter, defaultTableName }: Args) => {
  return adapter.tableNameMap.get(defaultTableName)
}
