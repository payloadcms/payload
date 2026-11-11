import type { PostgresAdapter } from '@payloadcms/db-postgres'
import type { SQLiteAdapter } from '@payloadcms/db-sqlite'
import type { PostgresDB } from '@payloadcms/drizzle'

import { eq, sql } from '@payloadcms/db-postgres/drizzle'
import { expect, vi } from 'vitest'

import type { Post } from './payload-types.js'

import { test } from '../__helpers/int/vitest.js'
import { postsSlug } from './shared.js'

test.suite('Conditional database updates', { config: './config.ts' }, () => {
  test.options(
    'should return null when no document matches the atomic predicate',
    { db: 'drizzle' },
    async ({ payload }) => {
      const result = await payload.db.updateOne({
        collection: postsSlug,
        data: { title: 'processing' },
        options: { atomic: true },
        where: { title: { equals: 'pending' } },
      })

      expect(result).toBeNull()
    },
  )

  test.options(
    'should allow exactly one concurrent atomic update to claim a matching document',
    { db: 'drizzle' },
    async ({ payload }) => {
      const post = await payload.create({
        collection: postsSlug,
        data: { title: 'pending' },
        overrideAccess: true,
      })
      const results = await Promise.all(
        Array.from({ length: 20 }, () =>
          payload.db.updateOne({
            collection: postsSlug,
            data: { title: 'processing' },
            options: { atomic: true },
            where: { and: [{ id: { equals: post.id } }, { title: { equals: 'pending' } }] },
          }),
        ),
      )

      expect(results.filter(Boolean)).toEqual([
        expect.objectContaining({ id: post.id, title: 'processing' }),
      ])
    },
  )

  test.options(
    'should update different matching documents when atomic updates run concurrently',
    { db: 'drizzle' },
    async ({ payload }) => {
      const matchingPosts = await Promise.all(
        Array.from({ length: 2 }, () =>
          payload.create({
            collection: postsSlug,
            data: { title: 'pending' },
            overrideAccess: true,
          }),
        ),
      )

      const results = (await Promise.all(
        matchingPosts.map(() =>
          payload.db.updateOne({
            collection: postsSlug,
            data: { title: 'processing' },
            options: { atomic: true },
            where: { title: { equals: 'pending' } },
          }),
        ),
      )) as unknown as (null | Post)[]

      expect(results.every(Boolean)).toBe(true)
      expect(new Set(results.flatMap((result) => (result ? [result.id] : [])))).toEqual(
        new Set(matchingPosts.map(({ id }) => id)),
      )
    },
  )

  test.options(
    'should update at most one document when the predicate matches multiple documents',
    { db: 'drizzle' },
    async ({ payload }) => {
      const matchingPosts = await Promise.all([
        payload.create({
          collection: postsSlug,
          data: { title: 'pending' },
          overrideAccess: true,
        }),
        payload.create({
          collection: postsSlug,
          data: { title: 'pending' },
          overrideAccess: true,
        }),
      ])

      const result = await payload.db.updateOne({
        collection: postsSlug,
        data: { title: 'processing' },
        options: { atomic: true },
        where: { title: { equals: 'pending' } },
      })
      const updatedPosts = await payload.find({
        collection: postsSlug,
        limit: 0,
        overrideAccess: true,
        where: { id: { in: matchingPosts.map(({ id }) => id) } },
      })

      expect(result).toBeTruthy()
      expect(result).toMatchObject({
        id: expect.toBeOneOf(matchingPosts.map(({ id }) => id)),
        title: 'processing',
      })
      expect(updatedPosts.docs.filter(({ title }) => title === 'processing')).toHaveLength(1)
      expect(updatedPosts.docs.filter(({ title }) => title === 'pending')).toHaveLength(1)
    },
  )

  test.options(
    'should reject atomic predicates requiring joins before changing documents',
    { db: 'drizzle' },
    async ({ payload }) => {
      const category = await payload.create({
        collection: 'categories',
        data: { title: 'pending' },
        overrideAccess: true,
      })
      const post = await payload.create({
        collection: postsSlug,
        data: { category: category.id, title: 'pending' },
        overrideAccess: true,
      })

      await expect(
        payload.db.updateOne({
          collection: postsSlug,
          data: { title: 'processing' },
          options: { atomic: true },
          where: { 'category.title': { equals: 'pending' } },
        }),
      ).rejects.toThrow('Atomic where updates do not support predicates that require joins')

      expect(
        (await payload.findByID({ collection: postsSlug, id: post.id, overrideAccess: true }))
          .title,
      ).toBe('pending')
    },
  )

  test.options(
    'should reject atomic writes to complex fields before changing documents',
    { db: 'drizzle' },
    async ({ payload }) => {
      const post = await payload.create({
        collection: postsSlug,
        data: { title: 'pending' },
        overrideAccess: true,
      })

      await expect(
        payload.db.updateOne({
          collection: postsSlug,
          data: { localized: 'changed', title: 'processing' },
          options: { atomic: true },
          where: { id: { equals: post.id } },
        }),
      ).rejects.toThrow('Atomic where updates only support fields stored on the main table')

      expect(
        (await payload.findByID({ collection: postsSlug, id: post.id, overrideAccess: true }))
          .title,
      ).toBe('pending')
    },
  )

  test.options(
    'should keep an atomic non-ID predicate within the D1 bound-parameter limit',
    { db: (adapter) => adapter.startsWith('sqlite') },
    async ({ payload }) => {
      const post = await payload.create({
        collection: postsSlug,
        data: { title: 'pending' },
        overrideAccess: true,
      })
      const db = payload.db as unknown as SQLiteAdapter
      const executeSpy = vi.spyOn(db.client, 'execute')

      try {
        const result = await payload.db.updateOne({
          collection: postsSlug,
          data: { title: 'processing' },
          options: { atomic: true },
          where: {
            title: {
              in: ['pending', ...Array.from({ length: 49 }, (_, index) => `other-${index}`)],
            },
          },
        })

        expect(result).toMatchObject({ id: post.id, title: 'processing' })
        expect(executeSpy).toHaveBeenCalled()

        for (const [statement] of executeSpy.mock.calls) {
          const parameters = typeof statement === 'string' ? undefined : statement.args

          expect(Object.keys(parameters ?? {}).length).toBeLessThanOrEqual(100)
        }
      } finally {
        executeSpy.mockRestore()
      }
    },
  )

  test.options(
    'should allow an atomic update while another transaction inserts a referencing document',
    { db: (adapter) => adapter.startsWith('postgres') },
    async ({ payload }) => {
      const category = await payload.create({
        collection: 'categories',
        data: { title: 'pending' },
        overrideAccess: true,
      })
      const db = payload.db as unknown as PostgresAdapter
      const referencingTransactionID = await db.beginTransaction()

      if (referencingTransactionID === null) {
        throw new Error('Expected PostgreSQL to start a transaction')
      }

      try {
        await payload.create({
          collection: postsSlug,
          data: { category: category.id, title: 'referencing' },
          overrideAccess: true,
          req: { transactionID: referencingTransactionID },
        })

        const updatingTransactionID = await db.beginTransaction()

        if (updatingTransactionID === null) {
          throw new Error('Expected PostgreSQL to start a transaction')
        }

        try {
          const transaction = db.sessions[updatingTransactionID]!.db as PostgresDB

          await transaction.execute(sql`SET LOCAL statement_timeout = '2s'`)

          const result = await payload.db.updateOne({
            collection: 'categories',
            data: { title: 'processing' },
            options: { atomic: true },
            req: { transactionID: updatingTransactionID },
            where: { and: [{ id: { equals: category.id } }, { title: { equals: 'pending' } }] },
          })

          expect(result).toMatchObject({ id: category.id, title: 'processing' })
        } finally {
          await db.rollbackTransaction(updatingTransactionID)
        }
      } finally {
        await db.rollbackTransaction(referencingTransactionID)
      }
    },
  )

  for (const shouldCommit of [true, false]) {
    test.options(
      shouldCommit
        ? 'should claim another matching document after a competing PostgreSQL update commits'
        : 'should claim the original document after a competing PostgreSQL update rolls back',
      { db: (adapter) => adapter.startsWith('postgres') },
      async ({ payload }) => {
        const firstPost = await payload.create({
          collection: postsSlug,
          data: { title: 'pending' },
          overrideAccess: true,
        })
        const secondPost = await payload.create({
          collection: postsSlug,
          data: { title: 'pending' },
          overrideAccess: true,
        })
        const db = payload.db as unknown as PostgresAdapter
        const table = db.tables[db.tableNameMap.get(postsSlug)!]!
        const candidate = await db.drizzle.execute<{ id: number | string }>(sql`
          SELECT id FROM ${table} WHERE title = 'pending' LIMIT 1
        `)
        const candidateID = candidate.rows[0]!.id
        const remainingID = candidateID === firstPost.id ? secondPost.id : firstPost.id
        const transactionID = await db.beginTransaction()

        if (transactionID === null) {
          throw new Error('Expected PostgreSQL to start a transaction')
        }

        try {
          const transaction = db.sessions[transactionID]!.db as PostgresDB

          await transaction.execute(sql`SET LOCAL statement_timeout = '10s'`)

          const backend = await transaction.execute<{ pid: number }>(
            sql`SELECT pg_backend_pid() AS pid`,
          )

          const competingWriter = await db.pool.connect()
          let pendingUpdate: ReturnType<typeof payload.db.updateOne> | undefined

          try {
            await competingWriter.query('BEGIN')
            const competingUpdate = db.drizzle
              .update(table)
              .set({ title: 'processing' })
              .where(eq(table.id, candidateID))
              .toSQL()

            await competingWriter.query(competingUpdate.sql, competingUpdate.params)

            pendingUpdate = payload.db.updateOne({
              collection: postsSlug,
              data: { title: 'claimed' },
              options: { atomic: true },
              req: { transactionID },
              where: { title: { equals: 'pending' } },
            })
            // Attach a handler immediately so cleanup also handles a query that fails while polling.
            void pendingUpdate.catch(() => {})

            await expect
              .poll(
                async () => {
                  const result = await db.pool.query<{ blocked: boolean }>(
                    'SELECT cardinality(pg_blocking_pids($1)) > 0 AS blocked',
                    [backend.rows[0]!.pid],
                  )

                  return result.rows[0]?.blocked ?? false
                },
                { timeout: 5000 },
              )
              .toBe(true)

            await competingWriter.query(shouldCommit ? 'COMMIT' : 'ROLLBACK')

            const result = await pendingUpdate

            expect(result).toMatchObject({
              id: shouldCommit ? remainingID : candidateID,
              title: 'claimed',
            })

            await db.rollbackTransaction(transactionID)

            expect(
              (
                await payload.findByID({
                  collection: postsSlug,
                  id: shouldCommit ? remainingID : candidateID,
                  overrideAccess: true,
                })
              ).title,
            ).toBe('pending')
          } finally {
            await competingWriter.query('ROLLBACK')
            await pendingUpdate?.catch(() => {})
            competingWriter.release()
          }
        } finally {
          await db.rollbackTransaction(transactionID)
        }
      },
    )
  }
})
