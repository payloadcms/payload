import type { PostgresAdapter } from '@payloadcms/db-postgres'
import type { Payload, PayloadRequest } from 'payload'

import { Locked } from 'payload'
import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { menuSlug } from './globals/Menu/index.js'
import { postsSlug } from './slugs.js'

// Reserve every connection to reproduce concurrent writes exhausting the pool. The operation
// must use its existing transaction rather than acquire a second connection to read locks.
const withFullPool = async ({
  payload,
  operation,
}: {
  operation: (req: Partial<PayloadRequest>) => Promise<void>
  payload: Payload
}): Promise<void> => {
  const adapter = payload.db as unknown as PostgresAdapter
  const originalTimeout = adapter.pool.options.connectionTimeoutMillis
  const transactionIDs: string[] = []

  adapter.pool.options.connectionTimeoutMillis = 1000

  try {
    for (let i = 0; i < adapter.pool.options.max; i++) {
      const transactionID = await adapter.beginTransaction()

      if (!transactionID) {
        throw new Error('Expected an active PostgreSQL transaction')
      }
      transactionIDs.push(String(transactionID))
    }

    await operation({ transactionID: transactionIDs[0] })
  } finally {
    try {
      await Promise.all(transactionIDs.map((id) => adapter.rollbackTransaction(id)))
    } finally {
      adapter.pool.options.connectionTimeoutMillis = originalTimeout
    }
  }
}

test.suite(
  'Document locks with an exhausted PostgreSQL pool',
  { config: './config.ts', db: (adapter) => adapter === 'postgres' },
  () => {
    test('should update a document using its existing connection', async ({ payload }) => {
      const post = await payload.create({
        collection: postsSlug,
        data: { text: 'original' },
        overrideAccess: true,
      })

      await withFullPool({
        payload,
        operation: async (req) => {
          const updated = await payload.update({
            collection: postsSlug,
            data: { text: 'updated' },
            id: post.id,
            overrideAccess: true,
            overrideLock: false,
            req,
          })

          expect(updated.text).toBe('updated')
        },
      })
    })

    test('should delete a document using its existing connection', async ({ payload }) => {
      const post = await payload.create({
        collection: postsSlug,
        data: { text: 'original' },
        overrideAccess: true,
      })

      await withFullPool({
        payload,
        operation: async (req) => {
          const deleted = await payload.delete({
            collection: postsSlug,
            id: post.id,
            overrideAccess: true,
            overrideLock: false,
            req,
          })

          expect(deleted.id).toBe(post.id)
        },
      })
    })

    test('should update a global using its existing connection', async ({ payload }) => {
      await withFullPool({
        payload,
        operation: async (req) => {
          const updated = await payload.updateGlobal({
            slug: menuSlug,
            data: { globalText: 'updated' },
            overrideAccess: true,
            overrideLock: false,
            req,
          })

          expect(updated.globalText).toBe('updated')
        },
      })
    })

    test('should bulk delete documents using their existing connection', async ({ payload }) => {
      const post = await payload.create({
        collection: postsSlug,
        data: { text: 'original' },
        overrideAccess: true,
      })

      await withFullPool({
        payload,
        operation: async (req) => {
          const deleted = await payload.delete({
            collection: postsSlug,
            overrideAccess: true,
            overrideLock: false,
            req,
            where: { id: { equals: post.id } },
          })

          expect(deleted.errors).toHaveLength(0)
          expect(deleted.docs.map(({ id }) => id)).toEqual([post.id])
        },
      })
    })

    test('should still reject a lock held by another user when the pool is exhausted', async ({
      payload,
    }) => {
      const post = await payload.create({
        collection: postsSlug,
        data: { text: 'original' },
        overrideAccess: true,
      })
      const user = await payload.create({
        collection: 'users',
        data: { email: 'lock-owner@payloadcms.com', password: 'test' },
        overrideAccess: true,
      })

      await payload.create({
        collection: 'payload-locked-documents',
        overrideAccess: true,
        data: {
          document: { relationTo: postsSlug, value: post.id },
          user: { relationTo: 'users', value: user.id },
        },
      })

      await withFullPool({
        payload,
        operation: async (req) => {
          await expect(
            payload.update({
              collection: postsSlug,
              data: { text: 'updated' },
              id: post.id,
              overrideAccess: true,
              overrideLock: false,
              req,
            }),
          ).rejects.toBeInstanceOf(Locked)
        },
      })

      const unchanged = await payload.findByID({
        collection: postsSlug,
        id: post.id,
        overrideAccess: true,
      })

      expect(unchanged.text).toBe('original')
    })
  },
)
