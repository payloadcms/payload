import type { Client } from '@libsql/client'

import type { DrizzleMigrationHint } from '../types.js'

import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { integer as pgInteger, pgTable, text as pgText } from 'drizzle-orm/pg-core'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { requireDrizzleKit as requirePostgresKit } from '../postgres/requireDrizzleKit.js'
import { createRequireDrizzleKit } from '../sqlite/createRequireDrizzleKit.js'
import {
  getDroppedEntitiesFromError,
  getDroppedSnapshotEntities,
  invertMigrationHints,
  resolveMigrationHints,
} from './resolveMigrationHints.js'

const requireSQLiteKit = createRequireDrizzleKit({ from: import.meta.url })

const postsBefore = pgTable('posts', { id: pgInteger().primaryKey(), title: pgText() })
const postsAfter = pgTable('posts', { id: pgInteger().primaryKey(), heading: pgText() })

const generatePostsMigration = async () => {
  const { generateDrizzleJson, generateMigration } = await requirePostgresKit()
  const before = await generateDrizzleJson({ posts: postsBefore })
  const after = await generateDrizzleJson({ posts: postsAfter })

  return { after, before, generateMigration }
}

describe('resolveMigrationHints', () => {
  it('should rename a column when the user picks a dropped column as its source', async () => {
    const { after, before, generateMigration } = await generatePostsMigration()
    const chooseRenameSource = vi.fn(({ candidates }) => Promise.resolve(candidates[0]))

    const statements = await resolveMigrationHints({
      chooseRenameSource,
      getDroppedEntities: () => getDroppedSnapshotEntities({ after, before }),
      run: (hints) => generateMigration(before, after, { hints }),
    })

    expect(chooseRenameSource).toHaveBeenCalledWith({
      candidates: [{ entity: ['public', 'posts', 'title'], kind: 'column' }],
      hint: { type: 'rename_or_create', entity: ['public', 'posts', 'heading'], kind: 'column' },
    })
    expect(statements).toEqual(['ALTER TABLE "posts" RENAME COLUMN "title" TO "heading";'])
  })

  it('should create the column and drop the old one when the user picks create', async () => {
    const { after, before, generateMigration } = await generatePostsMigration()

    const statements = await resolveMigrationHints({
      chooseRenameSource: () => Promise.resolve(null),
      getDroppedEntities: () => getDroppedSnapshotEntities({ after, before }),
      run: (hints) => generateMigration(before, after, { hints }),
    })

    expect(statements.join('\n')).toContain('ADD COLUMN "heading" text')
    expect(statements.join('\n')).toContain('DROP COLUMN "title"')
  })

  it('should create without asking when nothing was dropped to rename from', async () => {
    const chooseRenameSource = vi.fn()
    const { generateDrizzleJson, generateMigration } = await requirePostgresKit()
    const before = await generateDrizzleJson({ posts: postsBefore })
    const after = await generateDrizzleJson({
      posts: pgTable('posts', { id: pgInteger().primaryKey(), title: pgText() }),
      authors: pgTable('authors', { id: pgInteger().primaryKey() }),
    })

    const statements = await resolveMigrationHints({
      chooseRenameSource,
      getDroppedEntities: () => getDroppedSnapshotEntities({ after, before }),
      run: (hints) => generateMigration(before, after, { hints }),
    })

    expect(chooseRenameSource).not.toHaveBeenCalled()
    expect(statements.join('\n')).toContain('CREATE TABLE "authors"')
  })

  it('should throw a clear error when a rename decision is needed but prompting is disabled', async () => {
    const { after, before, generateMigration } = await generatePostsMigration()

    await expect(
      resolveMigrationHints({
        getDroppedEntities: () => getDroppedSnapshotEntities({ after, before }),
        run: (hints) => generateMigration(before, after, { hints }),
      }),
    ).rejects.toThrow('column "heading" in "posts" was renamed or newly created')
  })

  it('should reverse the chosen renames in the DOWN migration without asking again', async () => {
    const { after, before, generateMigration } = await generatePostsMigration()
    let upHints: DrizzleMigrationHint[] = []

    await resolveMigrationHints({
      chooseRenameSource: ({ candidates }) => Promise.resolve(candidates[0]),
      getDroppedEntities: () => getDroppedSnapshotEntities({ after, before }),
      run: (hints) => {
        upHints = hints
        return generateMigration(before, after, { hints })
      },
    })

    const chooseRenameSource = vi.fn()
    const downStatements = await resolveMigrationHints({
      chooseRenameSource,
      getDroppedEntities: () => [],
      initialHints: invertMigrationHints({ hints: upHints }),
      run: (hints) => generateMigration(after, before, { hints }),
    })

    expect(chooseRenameSource).not.toHaveBeenCalled()
    expect(downStatements).toEqual(['ALTER TABLE "posts" RENAME COLUMN "heading" TO "title";'])
  })

  describe('SQLite push', () => {
    let client: Client

    afterEach(() => client?.close())

    const setup = async () => {
      client = createClient({ url: 'file::memory:' })
      await client.execute('CREATE TABLE posts (id integer PRIMARY KEY, title text)')
      await client.execute("INSERT INTO posts (id, title) VALUES (1, 'Hello')")

      const { pushSchema } = await requireSQLiteKit()
      const db = drizzle({ client })
      const schema = {
        posts: sqliteTable('posts', { id: integer().primaryKey(), heading: text() }),
      }

      const push = (hints: DrizzleMigrationHint[]) =>
        pushSchema(schema, db as never, undefined, undefined, { hints })

      const getDroppedEntities = async ({ hints, pending }) => {
        try {
          await push([
            ...hints,
            ...pending.map(({ entity, kind }) => ({ type: 'create' as const, entity, kind })),
          ])
          return []
        } catch (error) {
          return getDroppedEntitiesFromError({ error })
        }
      }

      return { getDroppedEntities, push }
    }

    it('should keep existing data when a renamed column is pushed as a rename', async () => {
      const { getDroppedEntities, push } = await setup()

      const { apply } = await resolveMigrationHints({
        chooseRenameSource: ({ candidates }) => Promise.resolve(candidates[0]),
        getDroppedEntities,
        run: push,
      })

      await apply()

      const result = await client.execute('SELECT heading FROM posts')

      expect(result.rows[0]?.heading).toBe('Hello')
    })

    it('should ask for data-loss confirmation when a renamed column is pushed as a create', async () => {
      const { getDroppedEntities, push } = await setup()
      const confirmDataLoss = vi.fn(() => Promise.resolve(true))

      const { sqlStatements } = await resolveMigrationHints({
        chooseRenameSource: () => Promise.resolve(null),
        confirmDataLoss,
        getDroppedEntities,
        run: push,
      })

      expect(confirmDataLoss).toHaveBeenCalledWith({
        hints: [expect.objectContaining({ entity: ['public', 'posts', 'title'], kind: 'column' })],
      })
      expect(sqlStatements.join('\n')).toMatch(/DROP COLUMN [`"]title[`"]/)
    })
  })
})
