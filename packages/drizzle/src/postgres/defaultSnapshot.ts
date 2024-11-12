import type { DrizzleSnapshotJSON } from 'drizzle-kit/api'

export const defaultDrizzleSnapshot: DrizzleSnapshotJSON = {
  id: '00000000-0000-0000-0000-000000000000',
  _meta: {
    columns: {},
    schemas: {},
    tables: {},
  },
  dialect: 'postgresql',
  enums: {},
  policies: {},
  prevId: '00000000-0000-0000-0000-00000000000',
  roles: {},
  schemas: {},
  sequences: {},
  tables: {},
  version: '7',
  views: {},
}
