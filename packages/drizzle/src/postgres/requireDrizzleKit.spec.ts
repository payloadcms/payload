import { integer, pgSchema } from 'drizzle-orm/pg-core'
import { describe, expect, it } from 'vitest'

import { defaultDrizzleSnapshot } from './defaultSnapshot.js'
import { requireDrizzleKit } from './requireDrizzleKit.js'

describe('PostgreSQL migration generation', () => {
  it('should allow initial migrations to run against a pre-created schema', async () => {
    const schema = pgSchema('custom')
    const { generateDrizzleJson, generateMigration } = requireDrizzleKit()
    const after = await generateDrizzleJson({
      schema,
      entries: schema.table('entries', { id: integer().primaryKey() }),
    })
    const statements = await generateMigration(defaultDrizzleSnapshot, after)

    expect(statements).toContain('CREATE SCHEMA IF NOT EXISTS "custom";\n')
    expect(
      statements.some((statement) => statement.startsWith('CREATE TABLE "custom"."entries"')),
    ).toBe(true)
  })
})
