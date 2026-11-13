import type { VercelPostgresAdapter } from '@payloadcms/db-vercel-postgres'
import type { Payload } from 'payload'
import type { Pool } from 'pg'

import { Locked } from 'payload'
import { expect } from 'vitest'

import { test } from '../../__helpers/int/vitest.js'
import { simpleSlug, usersSlug } from '../slugs.js'

const lockedDocumentsSlug = 'payload-locked-documents'

test.suite(
  'Vercel Postgres document locks',
  { config: './config.ts', db: (adapter) => adapter === 'postgres' },
  () => {
    test('should commit a save without a spare pool connection', async ({ payload }) => {
      const doc = await payload.create({
        collection: simpleSlug,
        data: { fieldA: 'before' },
        overrideAccess: true,
      })

      await withoutSpareConnection({
        payload,
        operation: () =>
          payload.update({
            collection: simpleSlug,
            id: doc.id,
            data: { fieldA: 'after' },
            overrideAccess: true,
            overrideLock: false,
          }),
      })

      const persisted = await payload.findByID({
        collection: simpleSlug,
        id: doc.id,
        overrideAccess: true,
      })

      expect(persisted.fieldA).toBe('after')
    })

    test('should commit a bulk delete without a spare pool connection', async ({ payload }) => {
      const doc = await payload.create({
        collection: simpleSlug,
        data: {},
        overrideAccess: true,
      })

      const result = await withoutSpareConnection({
        payload,
        operation: () =>
          payload.delete({
            collection: simpleSlug,
            where: { id: { equals: doc.id } },
            overrideAccess: true,
            overrideLock: false,
          }),
      })

      expect(result.errors).toEqual([])
      expect(result.docs.map(({ id }) => id)).toEqual([doc.id])

      const remaining = await payload.find({
        collection: simpleSlug,
        where: { id: { equals: doc.id } },
        overrideAccess: true,
      })

      expect(remaining.docs).toEqual([])
    })

    for (const isolationLevel of ['read committed', 'repeatable read', 'serializable'] as const) {
      test(`should reject a save locked after the first ${isolationLevel} read`, async ({
        payload,
      }) => {
        const doc = await payload.create({
          collection: simpleSlug,
          data: { fieldA: 'before' },
          overrideAccess: true,
        })
        const otherUser = await payload.create({
          collection: usersSlug,
          data: { email: 'locker@payloadcms.com', password: 'test' },
          overrideAccess: true,
        })
        const transactionID = await payload.db.beginTransaction({ isolationLevel })

        if (!transactionID) {
          throw new Error('Expected a Vercel Postgres transaction')
        }

        try {
          const req = { transactionID }

          await payload.findByID({
            collection: simpleSlug,
            id: doc.id,
            overrideAccess: true,
            req,
          })
          await payload.create({
            collection: lockedDocumentsSlug,
            data: {
              document: { relationTo: simpleSlug, value: doc.id },
              user: { relationTo: usersSlug, value: otherUser.id },
            },
            overrideAccess: true,
          })

          await expect(
            payload.update({
              collection: simpleSlug,
              id: doc.id,
              data: { fieldA: 'after' },
              overrideAccess: true,
              overrideLock: false,
              req,
            }),
          ).rejects.toBeInstanceOf(Locked)
        } finally {
          await payload.db.rollbackTransaction(transactionID)
        }

        const remaining = await payload.findByID({
          collection: simpleSlug,
          id: doc.id,
          overrideAccess: true,
        })

        expect(remaining.fieldA).toBe('before')
      })
    }
  },
)

async function withoutSpareConnection<T>({
  operation,
  payload,
}: {
  operation: () => Promise<T>
  payload: Payload
}): Promise<T> {
  const adapter = payload.db as unknown as VercelPostgresAdapter
  const { $client: pool } = adapter.drizzle as { $client: Pool } & VercelPostgresAdapter['drizzle']
  // Reserve one client; the API operation starts its own transaction on the only remaining one.
  const reservedClient = await pool.connect()

  try {
    return await operation()
  } finally {
    reservedClient.release()
  }
}
