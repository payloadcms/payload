import type { Payload } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'
import { afterAll, beforeAll, expect, it } from 'vitest'

import { initPayloadInt } from '../helpers/initPayloadInt.js'
import { describe } from '../helpers/vitest.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

let payload: Payload

describe(
  'database - sqlite bound parameters limit',
  { db: (type) => type.startsWith('sqlite') },
  () => {
    beforeAll(async () => {
      ;({ payload } = await initPayloadInt(dirname))
    })

    afterAll(async () => {
      await payload.destroy()
    })

    it('should not use bound parameters for where querying on ID with IN if limitedBoundParameters: true', async () => {
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
        }),
      ).rejects.toBeTruthy()

      // Should fail here because too the length exceeds the limit
      await expect(
        payload.find({
          collection: 'simple',
          pagination: false,
          where: { id: { not_in: IN } },
        }),
      ).rejects.toBeTruthy()

      payload.db.limitedBoundParameters = true

      // Should not fail because limitedBoundParameters: true
      await expect(
        payload.find({
          collection: 'simple',
          pagination: false,
          where: { id: { in: IN } },
        }),
      ).resolves.toBeTruthy()

      // Should not fail because limitedBoundParameters: true
      await expect(
        payload.find({
          collection: 'simple',
          pagination: false,
          where: { id: { not_in: IN } },
        }),
      ).resolves.toBeTruthy()

      // Verify that "in" still works properly

      const docs = await Promise.all(
        Array.from({ length: 300 }, () => payload.create({ collection: 'simple', data: {} })),
      )

      const res = await payload.find({
        collection: 'simple',
        pagination: false,
        where: { id: { in: docs.map((e) => e.id) } },
      })

      expect(res.totalDocs).toBe(300)
      for (const docInRes of res.docs) {
        expect(docs.some((doc) => doc.id === docInRes.id)).toBeTruthy()
      }
    })

    it('should avoid ambiguous column name errors when limitedBoundParameters: true and multiple joins are present', async () => {
      payload.db.limitedBoundParameters = true

      const simpleLocalizedDoc = await payload.create({
        collection: 'simple-localized',
        data: {
          text: 'Test',
        },
        locale: 'en',
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
      })

      expect(res.totalDocs).toBe(1)
      expect(res.docs[0].id).toBe(simpleLocalizedDoc.id)
      expect(res.docs[0].text).toBe('Test')
    })
  },
)
