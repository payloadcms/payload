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

export const isPostgresDatabaseAdapter = ({ adapter }: { adapter: string }): boolean =>
  adapter === 'supabase' || adapter.startsWith('postgres') || adapter.startsWith('vercel-postgres')
