import type { Client } from '@libsql/client'

import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { afterAll, describe, expect, it, vi } from 'vitest'

import type { DrizzleAdapter } from '../types.js'

import { deleteExistingRowsByPath } from './deleteExistingRowsByPath.js'

const relationshipsTable = sqliteTable('documents_rels', {
  locale: text('locale'),
  parent: integer('parent_id').notNull(),
  path: text('path').notNull(),
})
const client: Client = createClient({ url: 'file::memory:' })
const db = drizzle(client)

afterAll(() => client.close())

describe('deleteExistingRowsByPath', () => {
  it('should preserve omitted locales when replacing localized rows', async () => {
    const deletionQueries: { params: unknown[]; sql: string }[] = []
    const adapter = {
      deleteWhere: vi.fn(({ where }) => {
        deletionQueries.push(db.delete(relationshipsTable).where(where).toSQL())
      }),
      tables: { documents_rels: relationshipsTable },
    } as unknown as DrizzleAdapter

    await deleteExistingRowsByPath({
      adapter,
      db,
      localeColumnName: 'locale',
      parentColumnName: 'parent',
      parentID: 12,
      pathColumnName: 'path',
      rows: [
        { locale: 'de', path: 'categories' },
        { locale: 'en', path: 'categories' },
      ],
      tableName: 'documents_rels',
    })

    expect(deletionQueries).toEqual([
      {
        params: [12, 'categories', 'de'],
        sql: 'delete from "documents_rels" where ("documents_rels"."parent_id" = ? and "documents_rels"."path" in (?) and "documents_rels"."locale" = ?)',
      },
      {
        params: [12, 'categories', 'en'],
        sql: 'delete from "documents_rels" where ("documents_rels"."parent_id" = ? and "documents_rels"."path" in (?) and "documents_rels"."locale" = ?)',
      },
    ])
  })
})
