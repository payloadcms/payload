import { createPayloadRequest } from 'payload'
import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'

// D1 allows at most 100 bound parameters per query. One more document than that is enough to hit it
// wherever Payload binds one parameter per ID or value.
const overLimit = 101

test.suite(
  'database - d1 bound parameters limit',
  { config: './config.ts', db: (adapter) => adapter === 'd1' },
  () => {
    test('should query `in` and `not_in` lists longer than the limit', async ({ payload }) => {
      const docs = await Promise.all(
        Array.from({ length: overLimit }, (_, i) =>
          payload.create({
            collection: 'simple',
            data: { text: `text-${i}` },
            overrideAccess: true,
          }),
        ),
      )
      const texts = docs.map((doc) => doc.text!)

      const inResult = await payload.find({
        collection: 'simple',
        overrideAccess: true,
        pagination: false,
        where: { text: { in: texts } },
      })

      expect(inResult.totalDocs).toBe(overLimit)

      const notInResult = await payload.find({
        collection: 'simple',
        overrideAccess: true,
        pagination: false,
        where: { text: { not_in: texts.slice(1) } },
      })

      expect(notInResult.docs.map((doc) => doc.id)).toEqual([docs[0]!.id])
    })

    test('should bulk update and delete documents while checking their locks', async ({
      payload,
    }) => {
      // `payload-locked-documents.document` relates to every collection, so the lock check binds each
      // ID once per collection.
      const docs = await Promise.all(
        Array.from({ length: overLimit }, () =>
          payload.create({ collection: 'simple', data: {}, overrideAccess: true }),
        ),
      )
      const ids = docs.map((doc) => doc.id)

      const updated = await payload.update({
        collection: 'simple',
        data: { text: 'updated' },
        overrideAccess: true,
        overrideLock: false,
        where: { id: { in: ids } },
      })

      expect(updated.errors).toEqual([])
      expect(updated.docs).toHaveLength(overLimit)

      const deleted = await payload.delete({
        collection: 'simple',
        overrideAccess: true,
        overrideLock: false,
        where: { id: { in: ids } },
      })

      expect(deleted.errors).toEqual([])
      expect(deleted.docs).toHaveLength(overLimit)
    })

    test('should find and delete documents matched through a joined table', async ({ payload }) => {
      // Querying a localized field joins the locales table, so Payload first selects the matching
      // IDs and then fetches or deletes the documents by those IDs.
      await Promise.all(
        Array.from({ length: overLimit }, () =>
          payload.create({
            collection: 'simple-localized',
            data: { text: 'joined' },
            locale: 'en',
            overrideAccess: true,
          }),
        ),
      )

      const found = await payload.find({
        collection: 'simple-localized',
        locale: 'en',
        overrideAccess: true,
        pagination: false,
        where: { text: { equals: 'joined' } },
      })

      expect(found.totalDocs).toBe(overLimit)

      await payload.db.deleteMany({
        collection: 'simple-localized',
        req: await createPayloadRequest({ locale: 'en', payload }),
        where: { text: { equals: 'joined' } },
      })

      const { totalDocs } = await payload.count({
        collection: 'simple-localized',
        overrideAccess: true,
      })

      expect(totalDocs).toBe(0)
    })
  },
)
