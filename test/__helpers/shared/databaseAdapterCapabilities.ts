const adaptersWithoutTransactions = new Set([
  'content-api',
  'cosmosdb',
  'd1',
  'firestore',
  'sqlite',
  'sqlite-uuid',
  'sqlite-uuidv7',
])

export const databaseAdapterSupportsTransactions = ({ adapter }: { adapter: string }): boolean =>
  !adaptersWithoutTransactions.has(adapter)

// The drizzle SQLite adapters, D1 included, don't implement `near`, `within` or `intersects`
const adaptersWithoutGeospatialQueries = new Set(['d1', 'sqlite', 'sqlite-uuid', 'sqlite-uuidv7'])

export const databaseAdapterSupportsGeospatialQueries = ({
  adapter,
}: {
  adapter: string
}): boolean => !adaptersWithoutGeospatialQueries.has(adapter)
