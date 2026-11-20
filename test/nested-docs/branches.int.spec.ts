import { createPayloadRequest, getNestedDocsBranch } from 'payload'
import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { articlesSlug, pagesSlug } from './shared.js'

test.suite('Nested document branches', { config: './config.ts' }, () => {
  test('should paginate roots without leaking descendant rows', async ({ payload }) => {
    const req = await createPayloadRequest({ payload })
    const result = await getNestedDocsBranch({
      collectionConfig: payload.collections[pagesSlug].config,
      parentID: null,
      query: { limit: 1, sort: 'title' },
      req,
    })

    expect(result.data.docs.map(({ title }) => title)).toEqual(['About us'])
    expect(result.data.totalDocs).toBe(2)
    expect(result.data.hasNextPage).toBe(true)
    expect(result.rows[String(result.data.docs[0]?.id)]?.hasChildren).toBe(true)
    expect(Object.keys(result.rows)).toHaveLength(1)
  })

  test('should hide inaccessible children from both metadata and branch results', async ({
    payload,
  }) => {
    const parent = await payload.create({
      collection: pagesSlug,
      data: { title: 'Restricted branch' },
    })
    const child = await payload.create({
      collection: pagesSlug,
      data: { title: 'Private child', parent: parent.id },
    })
    const req = await createPayloadRequest({ payload, context: { denyReadID: child.id } })
    const root = await getNestedDocsBranch({
      collectionConfig: payload.collections[pagesSlug].config,
      parentID: null,
      req,
    })
    const branch = await getNestedDocsBranch({
      collectionConfig: payload.collections[pagesSlug].config,
      parentID: parent.id,
      req,
    })

    expect(root.data.docs.some(({ id }) => id === parent.id)).toBe(true)
    expect(root.rows[String(parent.id)]?.hasChildren).toBe(false)
    expect(branch.data.docs).toEqual([])
  })

  test('should apply the configured base filter when checking child existence', async ({
    payload,
  }) => {
    const parent = await payload.create({
      collection: pagesSlug,
      data: { title: 'Filtered branch' },
    })

    await payload.create({
      collection: pagesSlug,
      data: { title: 'Hidden from tree', parent: parent.id },
    })

    const req = await createPayloadRequest({ payload })
    const root = await getNestedDocsBranch({
      collectionConfig: payload.collections[pagesSlug].config,
      parentID: null,
      req,
    })
    const branch = await getNestedDocsBranch({
      collectionConfig: payload.collections[pagesSlug].config,
      parentID: parent.id,
      req,
    })

    expect(root.rows[String(parent.id)]?.hasChildren).toBe(false)
    expect(branch.data.docs).toEqual([])
  })

  test('should load descendants through a custom parent relationship', async ({ payload }) => {
    const parent = await payload.create({ collection: articlesSlug, data: { title: 'Guide' } })
    const child = await payload.create({
      collection: articlesSlug,
      data: { title: 'Introduction', ancestor: parent.id },
    })
    const req = await createPayloadRequest({ payload })
    const result = await getNestedDocsBranch({
      collectionConfig: payload.collections[articlesSlug].config,
      parentID: parent.id,
      req,
    })

    expect(result.data.docs.map(({ id }) => id)).toEqual([child.id])
    expect(result.rows[String(child.id)]?.hasChildren).toBe(false)
  })
})
