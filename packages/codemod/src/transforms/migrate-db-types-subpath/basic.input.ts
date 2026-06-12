import type { BuildQueryJoinAliases, DrizzleAdapter } from '@payloadcms/drizzle/types'
import type { PostgresAdapter } from '@payloadcms/db-postgres/types'
import type { SQLiteAdapter } from '@payloadcms/db-sqlite/types'
import type { VercelPostgresAdapter } from '@payloadcms/db-vercel-postgres/types'
import type { SQLiteD1Adapter } from '@payloadcms/db-d1-sqlite/types'

export type MyAdapter = DrizzleAdapter
export type MyPostgresAdapter = PostgresAdapter
export type MySQLiteAdapter = SQLiteAdapter
