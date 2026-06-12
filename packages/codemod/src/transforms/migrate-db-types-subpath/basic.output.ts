import type { BuildQueryJoinAliases, DrizzleAdapter } from '@payloadcms/drizzle'
import type { PostgresAdapter } from '@payloadcms/db-postgres'
import type { SQLiteAdapter } from '@payloadcms/db-sqlite'
import type { VercelPostgresAdapter } from '@payloadcms/db-vercel-postgres'
import type { SQLiteD1Adapter } from '@payloadcms/db-d1-sqlite'

export type MyAdapter = DrizzleAdapter
export type MyPostgresAdapter = PostgresAdapter
export type MySQLiteAdapter = SQLiteAdapter
