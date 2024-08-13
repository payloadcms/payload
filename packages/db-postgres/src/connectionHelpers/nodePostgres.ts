import type { TransactionPg } from '@payloadcms/drizzle/types'
import type { DrizzleConfig } from 'drizzle-orm'
import type { NodePgClient } from 'drizzle-orm/node-postgres'

import { drizzle } from 'drizzle-orm/node-postgres'

import type { PostgresDB } from '../types.js'

export const nodePostgres = (args: {
  client: NodePgClient
  config?: Pick<DrizzleConfig, 'logger' | 'schema'>
}): { drizzle: PostgresDB | TransactionPg } => {
  return drizzle(args.client, args.config) as unknown as { drizzle: PostgresDB | TransactionPg }
}
