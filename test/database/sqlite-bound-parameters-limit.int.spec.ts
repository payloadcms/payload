import type { Payload } from 'payload'

import { sql } from '@payloadcms/db-sqlite'
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
        Array.from({ length: 300 }, () =>
          payload.create({ collection: 'simple', data: {}, overrideAccess: true }),
        ),
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
            overrideAccess: true,
          })
        })(),
      ).resolves.toBeUndefined()

      payload.db.drizzle.$client.execute = originalExecute

      expect(created!.items).toHaveLength(20)
      expect(created!.items[0].text1).toBe('only-first')
      expect(created!.items[19].text8).toBe('r19-7')

      await payload.delete({
        id: created!.id,
        collection: 'draft-with-array',
        overrideAccess: true,
      })
    })

    test('should count omitted columns with defaults toward the bound parameters limit when batch inserting', async ({
      payload,
    }) => {
      // Drizzle binds a default for every omitted column that has one, so sizing batches by row keys undercounts
      const parent = await payload.create({
        collection: 'draft-with-array',
        data: {},
        overrideAccess: true,
      })

      const originalExecute = payload.db.drizzle.$client.execute.bind(payload.db.drizzle.$client)

      payload.db.drizzle.$client.execute = async function execute(...args) {
        const [{ args: boundParameters }] = args as [{ args: any[] }]

        if (Array.isArray(boundParameters) && boundParameters.length > 100) {
          throw new Error('Exceeded limit of bound parameters!')
        }

        return await originalExecute(...args)
      }

      payload.db.limitedBoundParameters = true

      const values = Array.from({ length: 30 }, (_, i) => ({
        id: `row-${i}`,
        _order: i + 1,
        _parentID: parent.id,
      }))

      let inserted: Record<string, unknown>[] | undefined

      try {
        inserted = await payload.db.insert({
          db: payload.db.drizzle,
          tableName: 'draft_with_array_items_with_defaults',
          values,
        })
      } finally {
        payload.db.drizzle.$client.execute = originalExecute
      }

      expect(inserted).toHaveLength(30)
      expect(inserted?.[29]?.text8).toBe('default8')

      await payload.delete({ id: parent.id, collection: 'draft-with-array', overrideAccess: true })
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

    test('should not use bound parameters for IN on a polymorphic relationship if limitedBoundParameters: true', async ({
      payload,
    }) => {
      // Each collection of the relationship is a separate column, so 60 values bind 120 parameters
      const IN = Array.from({ length: 60 }, (_, i) => i + 1)

      const restoreExecute = limitBoundParameters(payload)

      try {
        payload.db.limitedBoundParameters = false

        await expect(
          payload.find({
            collection: 'posts',
            pagination: false,
            where: { 'polymorphicRelations.value': { in: IN } },
            overrideAccess: true,
          }),
        ).rejects.toBeTruthy()

        payload.db.limitedBoundParameters = true

        await expect(
          payload.find({
            collection: 'posts',
            pagination: false,
            where: { 'polymorphicRelations.value': { in: IN } },
            overrideAccess: true,
          }),
        ).resolves.toBeTruthy()
      } finally {
        restoreExecute()
      }
    })

    test('should not use bound parameters for IN on other fields with ID-like values if limitedBoundParameters: true', async ({
      payload,
    }) => {
      const doc = await payload.create({
        collection: 'simple',
        data: { text: 'value-1' },
        overrideAccess: true,
      })

      const IN = Array.from({ length: 150 }, (_, i) => `value-${i}`)

      const restoreExecute = limitBoundParameters(payload)

      try {
        payload.db.limitedBoundParameters = false

        await expect(
          payload.find({
            collection: 'simple',
            pagination: false,
            where: { text: { in: IN } },
            overrideAccess: true,
          }),
        ).rejects.toBeTruthy()

        payload.db.limitedBoundParameters = true

        const res = await payload.find({
          collection: 'simple',
          pagination: false,
          where: { text: { in: IN } },
          overrideAccess: true,
        })

        expect(res.docs.map(({ id }) => id)).toStrictEqual([doc.id])

        // Values that can't be written into the statement safely stay bound
        const resWithBoundValues = await payload.find({
          collection: 'simple',
          pagination: false,
          where: { text: { in: ["it's", 'value-1'] } },
          overrideAccess: true,
        })

        expect(resWithBoundValues.docs.map(({ id }) => id)).toStrictEqual([doc.id])
      } finally {
        restoreExecute()
      }
    })

    test('should not use bound parameters for NOT IN on a relationship if limitedBoundParameters: true', async ({
      payload,
    }) => {
      const [excludedCategory, otherCategory] = await Promise.all(
        ['excluded', 'other'].map((title) =>
          payload.create({ collection: 'categories', data: { title }, overrideAccess: true }),
        ),
      )

      const [, postWithOtherCategory, postWithoutCategory] = await Promise.all(
        [excludedCategory!.id, otherCategory!.id, undefined].map((category, i) =>
          payload.create({
            collection: 'posts',
            data: { category, title: `post ${i}` },
            overrideAccess: true,
          }),
        ),
      )

      // The query sanitization adds each ID twice, so 61 IDs bind 122 parameters
      const NOT_IN = [excludedCategory!.id, ...Array.from({ length: 60 }, (_, i) => 100000 + i)]

      const restoreExecute = limitBoundParameters(payload)

      try {
        payload.db.limitedBoundParameters = false

        await expect(
          payload.find({
            collection: 'posts',
            pagination: false,
            where: { category: { not_in: NOT_IN } },
            overrideAccess: true,
          }),
        ).rejects.toBeTruthy()

        payload.db.limitedBoundParameters = true

        const res = await payload.find({
          collection: 'posts',
          pagination: false,
          where: { category: { not_in: NOT_IN } },
          overrideAccess: true,
        })

        expect(res.docs.map(({ id }) => id).sort()).toStrictEqual(
          [postWithOtherCategory!.id, postWithoutCategory!.id].sort(),
        )
      } finally {
        restoreExecute()
      }
    })

    test('should match null in IN the same way when limitedBoundParameters: true', async ({
      payload,
    }) => {
      const docs = await Promise.all(
        [null, 'value-1', 'other'].map((text) =>
          payload.create({ collection: 'simple', data: { text }, overrideAccess: true }),
        ),
      )

      const findIDs = async () => {
        const res = await payload.find({
          collection: 'simple',
          pagination: false,
          where: { text: { in: [null, 'value-1'] } },
          overrideAccess: true,
        })

        return res.docs.map(({ id }) => id).sort()
      }

      payload.db.limitedBoundParameters = false

      const expectedIDs = await findIDs()

      payload.db.limitedBoundParameters = true

      expect(expectedIDs).toStrictEqual([docs[0]!.id, docs[1]!.id].sort())
      expect(await findIDs()).toStrictEqual(expectedIDs)
    })

    test('should apply operator handlers instead of inlining IN values when limitedBoundParameters: true', async ({
      payload,
    }) => {
      await payload.create({
        collection: 'simple',
        data: { text: 'value-1' },
        overrideAccess: true,
      })

      const originalOperatorHandlers = payload.db.operatorHandlers

      payload.db.limitedBoundParameters = true
      payload.db.operatorHandlers = [
        { name: 'match-nothing', build: () => sql`0 = 1`, fieldTypes: ['text'], operators: ['in'] },
      ]

      try {
        const res = await payload.find({
          collection: 'simple',
          pagination: false,
          where: { text: { in: ['value-1'] } },
          overrideAccess: true,
        })

        expect(res.docs).toHaveLength(0)
      } finally {
        payload.db.operatorHandlers = originalOperatorHandlers
      }
    })

    test('should not use bound parameters for the IDs found through a join if limitedBoundParameters: true', async ({
      payload,
    }) => {
      const posts = await createPostsWithPolymorphicRelation({ count: 120, payload })

      // The join on the relationships table resolves the matching IDs first, then loads them by ID
      const where = { 'polymorphicRelations.relationTo': { equals: 'simple' } }

      const restoreExecute = limitBoundParameters(payload)

      try {
        payload.db.limitedBoundParameters = false

        await expect(
          payload.find({ collection: 'posts', pagination: false, where, overrideAccess: true }),
        ).rejects.toBeTruthy()

        payload.db.limitedBoundParameters = true

        const res = await payload.find({
          collection: 'posts',
          pagination: false,
          where,
          overrideAccess: true,
        })

        expect(res.docs.map(({ id }) => id).sort()).toStrictEqual(posts.map(({ id }) => id).sort())
      } finally {
        restoreExecute()
      }
    })

    test('should not use bound parameters for the IDs deleted through a join if limitedBoundParameters: true', async ({
      payload,
    }) => {
      await createPostsWithPolymorphicRelation({ count: 120, payload })

      const where = { 'polymorphicRelations.relationTo': { equals: 'simple' } }

      const restoreExecute = limitBoundParameters(payload)

      try {
        payload.db.limitedBoundParameters = false

        await expect(payload.db.deleteMany({ collection: 'posts', where })).rejects.toBeTruthy()

        payload.db.limitedBoundParameters = true

        await expect(payload.db.deleteMany({ collection: 'posts', where })).resolves.toBeUndefined()
      } finally {
        restoreExecute()
      }

      const { totalDocs } = await payload.count({ collection: 'posts', overrideAccess: true })

      expect(totalDocs).toBe(0)
    })
  },
)

const limitBoundParameters = (payload: Payload): (() => void) => {
  const originalExecute = payload.db.drizzle.$client.execute.bind(payload.db.drizzle.$client)

  payload.db.drizzle.$client.execute = async function execute(...args) {
    const [{ args: boundParameters }] = args as [{ args: any[] }]

    if (Array.isArray(boundParameters) && boundParameters.length > 100) {
      throw new Error('Exceeded limit of bound parameters!')
    }

    return await originalExecute(...args)
  }

  return () => {
    payload.db.drizzle.$client.execute = originalExecute
  }
}

const createPostsWithPolymorphicRelation = async ({
  count,
  payload,
}: {
  count: number
  payload: Payload
}) => {
  const simple = await payload.create({ collection: 'simple', data: {}, overrideAccess: true })

  return await Promise.all(
    Array.from({ length: count }, (_, i) =>
      payload.create({
        collection: 'posts',
        data: {
          polymorphicRelations: [{ relationTo: 'simple', value: simple.id }],
          title: `post ${i}`,
        },
        overrideAccess: true,
      }),
    ),
  )
}
