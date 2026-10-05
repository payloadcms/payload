/* eslint vitest/no-standalone-expect: ["error", { "additionalTestBlockFunctions": ["test"] }] -- Tests use the shared fixture wrapper. */
import { createPayloadRequest } from 'payload'
import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { draftPostsSlug } from './slugs.js'

test.suite('Version-aware ordering', { config: './orderable-config.ts' }, () => {
  test('should assign distinct ranks to unpublished drafts', async ({ payload }) => {
    const first = await payload.create({ collection: draftPostsSlug, data: { title: 'First' } })
    const second = await payload.create({ collection: draftPostsSlug, data: { title: 'Second' } })

    expect(first._order).toBeTruthy()
    expect(second._order).toBeTruthy()
    expect(second._order).not.toBe(first._order)
  })

  test('should initialize ranks on published and draft copies without forking published documents', async ({
    payload,
  }) => {
    const req = await createPayloadRequest({ payload })
    const docs = []

    for (const status of ['published', 'draft'] as const) {
      const data = { _status: status, title: status }
      const doc = await payload.db.create({ collection: draftPostsSlug, data, req })
      await payload.db.createVersion({
        collectionSlug: draftPostsSlug,
        createdAt: doc.createdAt,
        parent: doc.id,
        req,
        updatedAt: doc.updatedAt,
        versionData: data,
      })
      docs.push(doc)
    }

    req.json = () =>
      Promise.resolve({
        collectionSlug: draftPostsSlug,
        docsToMove: [String(docs[1].id)],
        newKeyWillBe: 'greater',
        orderableFieldName: '_order',
        target: { id: String(docs[0].id), key: '' },
      })
    const endpoint = payload.config.endpoints.find(({ path }) => path === '/reorder')!
    const response = await endpoint.handler(req)
    const published = await payload.findByID({ id: docs[0].id, collection: draftPostsSlug })
    const draft = await payload.findByID({
      id: docs[1].id,
      collection: draftPostsSlug,
      version: 'draft',
    })
    const pending = await payload.find({ collection: draftPostsSlug, version: 'draft' })

    expect(response.status).toBe(200)
    expect(published._order).toBeTruthy()
    expect(draft._order).toBeTruthy()
    expect(draft._order).not.toBe(published._order)
    expect(pending.docs.map(({ id }) => id)).toEqual([draft.id])
  })
})
