import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { describe, expect, it } from 'vitest'

import { requireDrizzleKit } from './requireDrizzleKit.js'

const legacySnapshot = {
  id: '00000000-0000-0000-0000-000000000001',
  _meta: { columns: {}, tables: {} },
  dialect: 'sqlite',
  prevId: '00000000-0000-0000-0000-000000000000',
  tables: {
    entries: {
      name: 'entries',
      checkConstraints: {},
      columns: {
        id: { name: 'id', type: 'integer', autoincrement: false, notNull: true, primaryKey: true },
        title: {
          name: 'title',
          type: 'text',
          autoincrement: false,
          notNull: false,
          primaryKey: false,
        },
      },
      compositePrimaryKeys: {},
      foreignKeys: {},
      indexes: {},
      uniqueConstraints: {},
    },
  },
  version: '6',
  views: {},
}

describe('SQLite snapshot upgrades', () => {
  it('should return the upgraded snapshot directly and preserve existing table definitions', async () => {
    const { generateDrizzleJson, generateMigration, upSnapshot } = requireDrizzleKit()
    const upgraded = upSnapshot(legacySnapshot)

    expect(upgraded).toMatchObject({
      id: legacySnapshot.id,
      dialect: 'sqlite',
      prevIds: [legacySnapshot.prevId],
      version: '7',
      ddl: expect.arrayContaining([
        expect.objectContaining({ entityType: 'tables', name: 'entries' }),
        expect.objectContaining({ entityType: 'columns', name: 'title', table: 'entries' }),
      ]),
    })

    const after = await generateDrizzleJson({
      entries: sqliteTable('entries', {
        id: integer().primaryKey(),
        description: text(),
        title: text(),
      }),
    })
    const statements = await generateMigration(upgraded, after)

    expect(statements).toHaveLength(1)
    expect(statements[0]).toMatch(/ALTER TABLE ["`]entries["`] ADD ["`]description["`] text/)
  })
})
