import type { DrizzleMySQLSnapshotJSON } from 'drizzle-kit/api'

// TODO: check, prob right
export const defaultDrizzleSnapshot: DrizzleMySQLSnapshotJSON = {
  id: '00000000-0000-0000-0000-000000000000',
  _meta: {
    columns: {},
    tables: {},
  },
  dialect: 'mysql',
  prevId: '00000000-0000-0000-0000-00000000000',
  tables: {},
  version: '5',
  views: {},
}
