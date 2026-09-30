import type { DrizzleAdapter } from '@payloadcms/drizzle'
import type { Payload, PayloadRequest } from 'payload'

import { pushDevSchema } from '@payloadcms/drizzle'
import { commitTransaction, initTransaction } from 'payload'
import { expect, vi } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { isFlociReachable } from './auroraSetup.js'

const flociAvailable = await isFlociReachable()

const LIFECYCLE_MIGRATION = '20260929_lifecycle'
const LIFECYCLE_TABLE = 'lifecycle_marker'

/**
 * Checks for a table through `information_schema`, the same catalog drizzle-kit introspects over
 * the Data API, so this exercises the adapter's `execute` path rather than a cached schema object.
 */
const tableExists = async (payload: Payload, tableName: string): Promise<boolean> => {
  const db = payload.db as unknown as DrizzleAdapter

  const result = (await db.execute({
    drizzle: db.drizzle,
    raw: `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '${tableName}') AS "exists"`,
  })) as { rows?: { exists?: boolean }[] }

  return Boolean(result.rows?.[0]?.exists)
}

test.suite(
  'Aurora Serverless / RDS Data API',
  { config: './config.ts', db: () => flociAvailable, resetBetweenTests: false },
  () => {
    test('completes a create, find, update and delete round trip', async ({ payload }) => {
      const created = await payload.create({
        collection: 'posts',
        data: {
          tags: [{ label: 'first' }, { label: 'second' }],
          title: 'Hello floci',
        },
        overrideAccess: true,
      })

      expect(created.id).toBeDefined()
      expect(created.title).toBe('Hello floci')
      expect(created.tags?.map((tag) => tag.label)).toEqual(['first', 'second'])

      const found = await payload.find({
        collection: 'posts',
        overrideAccess: true,
        where: { id: { equals: created.id } },
      })

      expect(found.totalDocs).toBe(1)
      expect(found.docs[0]?.title).toBe('Hello floci')
      expect(found.docs[0]?.tags?.map((tag) => tag.label)).toEqual(['first', 'second'])

      const updated = await payload.update({
        collection: 'posts',
        data: { title: 'Updated via floci' },
        id: created.id,
        overrideAccess: true,
      })

      expect(updated.title).toBe('Updated via floci')

      const updatedFind = await payload.findByID({
        collection: 'posts',
        id: created.id,
        overrideAccess: true,
      })

      expect(updatedFind.title).toBe('Updated via floci')

      await payload.delete({ collection: 'posts', id: created.id, overrideAccess: true })

      const afterDelete = await payload.find({
        collection: 'posts',
        overrideAccess: true,
        where: { id: { equals: created.id } },
      })

      expect(afterDelete.totalDocs).toBe(0)
    })

    test('persists array fields and relationships through the Data API', async ({ payload }) => {
      const first = await payload.create({
        collection: 'categories',
        data: { name: 'First category' },
        overrideAccess: true,
      })
      const second = await payload.create({
        collection: 'categories',
        data: { name: 'Second category' },
        overrideAccess: true,
      })

      const post = await payload.create({
        collection: 'posts',
        data: {
          categories: [first.id, second.id],
          primaryCategory: first.id,
          tags: [{ label: 'alpha' }, { label: 'beta' }],
          title: 'Post with relationships',
        },
        overrideAccess: true,
      })

      const readBack = await payload.findByID({
        collection: 'posts',
        depth: 0,
        id: post.id,
        overrideAccess: true,
      })

      expect(readBack.categories).toEqual([first.id, second.id])
      expect(readBack.primaryCategory).toEqual(first.id)
      expect(readBack.tags?.map((tag) => tag.label)).toEqual(['alpha', 'beta'])

      const populated = await payload.findByID({
        collection: 'posts',
        depth: 2,
        id: post.id,
        overrideAccess: true,
      })

      expect(populated.categories?.map((category) => category.id)).toEqual([first.id, second.id])
      expect(populated.categories?.[0]?.name).toBe('First category')
      expect(populated.primaryCategory?.name).toBe('First category')

      const categoryWithPosts = await payload.findByID({
        collection: 'categories',
        id: first.id,
        joins: { posts: {} },
        overrideAccess: true,
      })

      expect(categoryWithPosts.posts?.docs?.map((joined) => joined.id)).toContain(post.id)

      await payload.delete({ collection: 'posts', id: post.id, overrideAccess: true })
      await payload.delete({ collection: 'categories', id: first.id, overrideAccess: true })
      await payload.delete({ collection: 'categories', id: second.id, overrideAccess: true })
    })

    test('commits multiple writes made within a transaction', async ({ payload }) => {
      const req = { payload } as PayloadRequest

      await initTransaction(req)
      expect(req.transactionID).toBeTruthy()

      const category = await payload.create({
        collection: 'categories',
        data: { name: 'Transaction category' },
        overrideAccess: true,
        req,
      })
      const post = await payload.create({
        collection: 'posts',
        data: {
          categories: [category.id],
          primaryCategory: category.id,
          title: 'Committed post',
        },
        overrideAccess: true,
        req,
      })

      await commitTransaction(req)
      expect(req.transactionID).toBeUndefined()

      const foundPost = await payload.findByID({
        collection: 'posts',
        depth: 0,
        id: post.id,
        overrideAccess: true,
      })
      const foundCategory = await payload.findByID({
        collection: 'categories',
        id: category.id,
        joins: { posts: {} },
        overrideAccess: true,
      })

      expect(foundPost.title).toBe('Committed post')
      expect(foundPost.categories).toEqual([category.id])
      expect(foundCategory.name).toBe('Transaction category')
      expect(foundCategory.posts?.docs?.map((joined) => joined.id)).toContain(post.id)

      await payload.delete({ collection: 'posts', id: post.id, overrideAccess: true })
      await payload.delete({ collection: 'categories', id: category.id, overrideAccess: true })
    })

    test('rolls back a transaction that fails part-way', async ({ payload }) => {
      const category = await payload.create({
        collection: 'categories',
        data: { name: 'Rollback category' },
        overrideAccess: true,
      })
      const req = { payload } as PayloadRequest

      await initTransaction(req)

      const partial = await payload.create({
        collection: 'posts',
        data: {
          categories: [category.id],
          primaryCategory: category.id,
          title: 'Partially written post',
        },
        overrideAccess: true,
        req,
      })

      await expect(
        payload.create({
          collection: 'posts',
          data: { title: 'trigger-transaction-error' },
          overrideAccess: true,
          req,
        }),
      ).rejects.toThrow('Intentional failure')

      expect(req.transactionID).toBeFalsy()

      await commitTransaction(req)

      const afterRollback = await payload.find({
        collection: 'posts',
        overrideAccess: true,
        where: { id: { equals: partial.id } },
      })
      const categoryAfterRollback = await payload.findByID({
        collection: 'categories',
        id: category.id,
        joins: { posts: {} },
        overrideAccess: true,
      })

      expect(afterRollback.totalDocs).toBe(0)
      expect(categoryAfterRollback.posts?.docs ?? []).toHaveLength(0)

      await payload.delete({ collection: 'categories', id: category.id, overrideAccess: true })
    })

    test('runs a migration up and then down over the Data API', async ({ payload }) => {
      const db = payload.db as unknown as DrizzleAdapter

      expect(await tableExists(payload, LIFECYCLE_TABLE)).toBe(false)

      const up = await db.migrate({ forceAcceptWarning: true, shouldPrompt: false })

      expect(up?.migrated).toContain(LIFECYCLE_MIGRATION)
      expect(await tableExists(payload, LIFECYCLE_TABLE)).toBe(true)

      const down = await db.migrateDown()

      expect(down?.rolledBack).toContain(LIFECYCLE_MIGRATION)
      expect(await tableExists(payload, LIFECYCLE_TABLE)).toBe(false)
    })

    test('drops and recreates the schema over the Data API', async ({ payload }) => {
      const db = payload.db as unknown as DrizzleAdapter

      const before = await payload.create({
        collection: 'posts',
        data: { title: 'Before drop' },
        overrideAccess: true,
      })

      expect(before.id).toBeDefined()

      const executeSpy = vi.spyOn(db, 'execute')

      await db.dropDatabase({ adapter: db })

      const rawStatements = executeSpy.mock.calls
        .map(([args]) => (args as { raw?: string }).raw)
        .filter(Boolean)

      // The Data API accepts one statement per call, so the drop and recreate must be separate.
      expect(rawStatements).toContain('drop schema if exists public cascade;')
      expect(rawStatements).toContain('create schema public;')
      expect(await tableExists(payload, 'posts')).toBe(false)

      executeSpy.mockRestore()

      const previousForcePush = process.env.PAYLOAD_FORCE_DRIZZLE_PUSH
      process.env.PAYLOAD_FORCE_DRIZZLE_PUSH = 'true'

      try {
        await pushDevSchema(db as unknown as DrizzleAdapter)
      } finally {
        if (previousForcePush === undefined) {
          delete process.env.PAYLOAD_FORCE_DRIZZLE_PUSH
        } else {
          process.env.PAYLOAD_FORCE_DRIZZLE_PUSH = previousForcePush
        }
      }

      expect(await tableExists(payload, 'posts')).toBe(true)

      const recreated = await payload.create({
        collection: 'posts',
        data: { title: 'After recreate' },
        overrideAccess: true,
      })
      const found = await payload.find({
        collection: 'posts',
        overrideAccess: true,
        where: { id: { equals: recreated.id } },
      })

      expect(found.totalDocs).toBe(1)
      expect(found.docs[0]?.title).toBe('After recreate')
    })
  },
)
