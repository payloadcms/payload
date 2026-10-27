import { integer as pgInteger, pgTable } from 'drizzle-orm/pg-core'
import { integer as sqliteInteger, sqliteTable } from 'drizzle-orm/sqlite-core'
import { describe, expect, it, vi } from 'vitest'

import { requireDrizzleKit as requirePostgresKit } from '../postgres/requireDrizzleKit.js'
import { requireDrizzleKit as requireSQLiteKit } from '../sqlite/requireDrizzleKit.js'
import { generateMigrationWithCreateHints } from './generateMigrationWithCreateHints.js'

describe('generateMigrationWithCreateHints', () => {
  it.each([
    [
      'postgres',
      requirePostgresKit,
      pgTable('before', { id: pgInteger().primaryKey() }),
      pgTable('after', { id: pgInteger().primaryKey() }),
    ],
    [
      'sqlite',
      requireSQLiteKit,
      sqliteTable('before', { id: sqliteInteger().primaryKey() }),
      sqliteTable('after', { id: sqliteInteger().primaryKey() }),
    ],
  ] as const)(
    'should create replacement tables without renaming old ones for %s',
    async (_dialect, requireKit, oldTable, newTable) => {
      const { generateDrizzleJson, generateMigration } = requireKit()
      const before = await generateDrizzleJson({ oldTable })
      const after = await generateDrizzleJson({ newTable })

      await expect(generateMigration(before, after)).rejects.toMatchObject({
        code: 'missing_hints',
      })

      const statements = await generateMigrationWithCreateHints({
        after,
        before,
        generateMigration,
      })

      expect(statements.join('\n')).toMatch(/CREATE TABLE ["`]after["`]/)
      expect(statements.join('\n')).toMatch(/DROP TABLE ["`]before["`]/)
      expect(statements.join('\n')).not.toContain('RENAME')
    },
  )

  it('should propagate data-loss confirmations instead of accepting them', async () => {
    const error = {
      code: 'missing_hints',
      missingHints: [{ type: 'confirm_data_loss', kind: 'table', entity: ['public', 'old'] }],
    }
    const generateMigration = vi.fn().mockRejectedValue(error)

    await expect(
      generateMigrationWithCreateHints({ after: {}, before: {}, generateMigration }),
    ).rejects.toBe(error)
    expect(generateMigration).toHaveBeenCalledTimes(1)
  })

  it('should stop if Drizzle repeats a decision that was already supplied', async () => {
    const error = {
      code: 'missing_hints',
      missingHints: [{ type: 'rename_or_create', kind: 'table', entity: ['public', 'new'] }],
    }
    const generateMigration = vi.fn().mockRejectedValue(error)

    await expect(
      generateMigrationWithCreateHints({ after: {}, before: {}, generateMigration }),
    ).rejects.toBe(error)
    expect(generateMigration).toHaveBeenCalledTimes(2)
    expect(generateMigration).toHaveBeenLastCalledWith(
      {},
      {},
      { hints: [{ type: 'create', kind: 'table', entity: ['public', 'new'] }] },
    )
  })
})
