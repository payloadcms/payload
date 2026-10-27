import type { DrizzleAdapter } from '@payloadcms/drizzle'

import { pushDevSchema } from '@payloadcms/drizzle'
import { randomUUID } from 'crypto'
import { expect, vi } from 'vitest'

import { test } from '../__helpers/int/vitest.js'

test.suite(
  'PostgreSQL schema push',
  {
    config: './config.ts',
    db: (adapter) => adapter.startsWith('postgres') || adapter === 'supabase',
  },
  () => {
    test('should preserve data in unrelated schemas when pushing the Payload schema', async ({
      payload,
    }) => {
      const adapter = payload.db as unknown as DrizzleAdapter
      const schemaName = `schema_push_${randomUUID().replaceAll('-', '')}`

      await adapter.execute({ drizzle: adapter.drizzle, raw: `CREATE SCHEMA "${schemaName}"` })

      try {
        await adapter.execute({
          drizzle: adapter.drizzle,
          raw: `CREATE TABLE "${schemaName}".accounts (id integer PRIMARY KEY); INSERT INTO "${schemaName}".accounts VALUES (1);`,
        })
        vi.stubEnv('PAYLOAD_FORCE_DRIZZLE_PUSH', 'true')

        await pushDevSchema(adapter)
        await pushDevSchema(adapter)

        const result = await adapter.execute({
          drizzle: adapter.drizzle,
          raw: `SELECT id FROM "${schemaName}".accounts`,
        })

        expect(result).toMatchObject({ rows: [{ id: 1 }] })
      } finally {
        vi.unstubAllEnvs()
        await adapter.execute({
          drizzle: adapter.drizzle,
          raw: `DROP SCHEMA "${schemaName}" CASCADE`,
        })
      }
    })
  },
)
