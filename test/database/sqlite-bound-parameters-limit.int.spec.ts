import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'

test.suite(
  'database - sqlite bound parameters limit',
  { config: './config.ts', db: (adapter) => adapter.startsWith('sqlite') },
  () => {
    test('should not use bound parameters for where querying on ID with IN if limitedBoundParameters: true', async ({
      payload,
    }) => {
      const defaultExecute = payload.db.drizzle.$client.execute.bind(payload.db.drizzle.$client)

      // Limit bounds parameters length
      payload.db.drizzle.$client.execute = async function execute(...args) {
        const res = await defaultExecute(...args)
        const [{ args: boundParameters }] = args as [{ args: any[] }]

        if (boundParameters.length > 100) {
          throw new Error('Exceeded limit of bound parameters!')
        }
        return res
      }

      payload.db.limitedBoundParameters = false

      const IN = Array.from({ length: 300 }, (_, i) => i)

      // Should fail here because too the length exceeds the limit
      await expect(
        payload.find({
          collection: 'simple',
          pagination: false,
          where: { id: { in: IN } },
          overrideAccess: true,
        }),
      ).rejects.toBeTruthy()

      // Should fail here because too the length exceeds the limit
      await expect(
        payload.find({
          collection: 'simple',
          pagination: false,
          where: { id: { not_in: IN } },
          overrideAccess: true,
        }),
      ).rejects.toBeTruthy()

      payload.db.limitedBoundParameters = true

      // Should not fail because limitedBoundParameters: true
      await expect(
        payload.find({
          collection: 'simple',
          pagination: false,
          where: { id: { in: IN } },
          overrideAccess: true,
        }),
      ).resolves.toBeTruthy()

      // Should not fail because limitedBoundParameters: true
      await expect(
        payload.find({
          collection: 'simple',
          pagination: false,
          where: { id: { not_in: IN } },
          overrideAccess: true,
        }),
      ).resolves.toBeTruthy()

      // Verify that "in" still works properly

      const docs = await Promise.all(
        Array.from({ length: 300 }, () => payload.create({ collection: 'simple', data: {}, overrideAccess: true })),
      )

      const res = await payload.find({
        collection: 'simple',
        pagination: false,
        where: { id: { in: docs.map((e) => e.id) } },
        overrideAccess: true,
      })

      expect(res.totalDocs).toBe(300)
      for (const docInRes of res.docs) {
        expect(docs.some((doc) => doc.id === docInRes.id)).toBeTruthy()
      }
    })

    test('should size batch inserts by the widest row when limitedBoundParameters: true', async ({
      payload,
    }) => {
      // Repro for https://github.com/payloadcms/payload/issues/16964
      const originalExecute = payload.db.drizzle.$client.execute.bind(payload.db.drizzle.$client)

      payload.db.drizzle.$client.execute = async function execute(...args) {
        const [{ args: boundParameters }] = args as [{ args: any[] }]

        if (Array.isArray(boundParameters) && boundParameters.length > 100) {
          throw new Error('Exceeded limit of bound parameters!')
        }

        return await originalExecute(...args)
      }

      payload.db.limitedBoundParameters = true

      const items = Array.from({ length: 20 }, (_, i) =>
        i === 0
          ? { text1: 'only-first' }
          : Object.fromEntries(Array.from({ length: 8 }, (_, j) => [`text${j + 1}`, `r${i}-${j}`])),
      )

      let created: Awaited<ReturnType<typeof payload.create>> | undefined

      await expect(
        (async () => {
          created = await payload.create({
            collection: 'draft-with-array',
            data: { items },
          })
        })(),
      ).resolves.toBeUndefined()

      payload.db.drizzle.$client.execute = originalExecute

      expect(created!.items).toHaveLength(20)
      expect(created!.items[0].text1).toBe('only-first')
      expect(created!.items[19].text8).toBe('r19-7')

      await payload.delete({ id: created!.id, collection: 'draft-with-array' })
    })

    test('should avoid ambiguous column name errors when limitedBoundParameters: true and multiple joins are present', async ({
      payload,
    }) => {
      payload.db.limitedBoundParameters = true

      const simpleLocalizedDoc = await payload.create({
        collection: 'simple-localized',
        data: {
          text: 'Test',
        },
        locale: 'en',
        overrideAccess: true,
      })

      const res = await payload.find({
        collection: 'simple-localized',
        pagination: false,
        where: {
          text: {
            equals: 'Test',
          },
          id: {
            in: [simpleLocalizedDoc.id],
          },
        },
        locale: 'en',
        overrideAccess: true,
      })

      expect(res.totalDocs).toBe(1)
      expect(res.docs[0].id).toBe(simpleLocalizedDoc.id)
      expect(res.docs[0].text).toBe('Test')
    })
  },
)
