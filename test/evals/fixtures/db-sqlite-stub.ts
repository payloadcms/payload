import { stubAdapter } from './db-stub.js'

export const sqliteAdapter = (..._args: unknown[]) => stubAdapter
