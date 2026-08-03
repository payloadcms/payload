import { stubAdapter } from './db-stub.js'

export const mongooseAdapter = (..._args: unknown[]) => stubAdapter
