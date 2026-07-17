import type { DrizzleSnapshotJSON } from '../types.js'

/**
 * Empty baseline snapshot in the drizzle-kit v1 format (DDL-snapshot based, version 7 for SQLite).
 * Used as the "before" state when generating the first migration.
 */
export const defaultDrizzleSnapshot: DrizzleSnapshotJSON = {
  id: '00000000-0000-0000-0000-000000000000',
  ddl: [],
  dialect: 'sqlite',
  prevIds: [],
  renames: [],
  version: '7',
}
