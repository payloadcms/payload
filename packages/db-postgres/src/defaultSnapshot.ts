import type { DrizzleSnapshotJSON } from 'drizzle-kit/payload'

export const defaultDrizzleSnapshot: DrizzleSnapshotJSON = {
  id: '00000000-0000-0000-0000-000000000000',
  _meta: {
    columns: {},
    schemas: {},
    tables: {},
  },
  dialect: 'postgresql',
  enums: {},
  prevId: '00000000-0000-0000-0000-00000000000',
  schemas: {},
  tables: {},
  version: '7',
}
