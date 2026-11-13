import type { Payload, PayloadRequest } from 'payload'

import { createPayloadRequest, getHierarchyContents } from 'payload'
import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { articlesSlug, foldersSlug, pagesSlug, restrictedDocumentsSlug } from './shared.js'

test.suite('Mixed folder contents', { config: './config.ts' }, () => {
  test('should return direct child folders and connected collections independently', async ({
    payload,
  }) => {
    const { folder, req } = await setup({ payload })
    await payload.create({
      collection: restrictedDocumentsSlug,
      overrideAccess: true,
      data: { title: 'Protected membership', '_h_page-folders': folder.id },
    })
    const result = await getHierarchyContents({
      collectionSlug: foldersSlug,
      parentID: folder.id,
      req,
      limit: 2,
    })
    const folders = result.sources.find((source) => source.collectionSlug === foldersSlug)!
    const articles = result.sources.find((source) => source.collectionSlug === articlesSlug)!
    const pages = result.sources.find((source) => source.collectionSlug === pagesSlug)!

    expect(folders.docs.map((doc) => doc.title)).toEqual(['Campaigns'])
    expect(articles.docs).toHaveLength(2)
    expect(articles.hasNextPage).toBe(true)
    expect(pages.docs.map((doc) => doc.title).sort()).toEqual(['About us', 'Our team'])
    expect(result.sources.some((source) => source.collectionSlug === restrictedDocumentsSlug)).toBe(
      false,
    )

    const next = await getHierarchyContents({
      collectionSlug: foldersSlug,
      parentID: folder.id,
      req,
      source: articlesSlug,
      page: 2,
      limit: 2,
    })
    expect(next.sources).toHaveLength(1)
    expect(next.sources[0].docs).toHaveLength(2)
    expect(
      next.sources[0].docs
        .map(({ id }) => id)
        .some((id) => articles.docs.some((doc) => doc.id === id)),
    ).toBe(false)
  })

  test('should apply document access and the source collection base filter on every page', async ({
    payload,
  }) => {
    const { folder, req } = await setup({ payload })
    const hidden = await payload.create({
      collection: articlesSlug,
      data: { title: 'Hidden article', '_h_page-folders': folder.id },
    })
    const denied = await payload.create({
      collection: articlesSlug,
      data: { title: 'Denied article', '_h_page-folders': folder.id },
    })
    req.context.denyArticleID = denied.id
    const result = await getHierarchyContents({
      collectionSlug: foldersSlug,
      parentID: folder.id,
      source: articlesSlug,
      req,
      limit: 40,
    })

    expect(result.sources[0].docs).toHaveLength(12)
    expect(result.sources[0].docs.map(({ id }) => id)).not.toContain(hidden.id)
    expect(result.sources[0].docs.map(({ id }) => id)).not.toContain(denied.id)
  })

  test('should omit a denied collection without preventing readable sources', async ({
    payload,
  }) => {
    const { folder, req } = await setup({ payload })
    req.context.denyArticleReads = true
    const result = await getHierarchyContents({
      collectionSlug: foldersSlug,
      parentID: folder.id,
      req,
    })

    expect(result.sources.some((source) => source.collectionSlug === articlesSlug)).toBe(false)
    expect(result.sources.find((source) => source.collectionSlug === pagesSlug)?.docs).toHaveLength(
      2,
    )
  })

  test('should not derive row data from restricted title or secret fields', async ({ payload }) => {
    const { folder, req } = await setup({ payload })
    await payload.create({
      collection: articlesSlug,
      data: { title: 'Protected title', secret: 'private value', '_h_page-folders': folder.id },
    })
    req.context.denyArticleTitles = true
    const result = await getHierarchyContents({
      collectionSlug: foldersSlug,
      parentID: folder.id,
      source: articlesSlug,
      req,
      limit: 40,
    })

    expect(result.sources[0].docs.length).toBeGreaterThan(0)
    for (const doc of result.sources[0].docs) {
      expect(doc).not.toHaveProperty('title')
      expect(doc).not.toHaveProperty('secret')
    }
    expect(JSON.stringify(result)).not.toContain('Protected title')
  })

  test('should authorize a folder independently of a restricted default sort field', async ({
    payload,
  }) => {
    const { folder, req } = await setup({ payload })
    const config = payload.collections[foldersSlug].config
    const title = config.flattenedFields.find((field) => 'name' in field && field.name === 'title')
    if (title?.type !== 'text') {
      throw new Error('Missing fixture title field')
    }
    const originalAccess = title.access
    const originalSort = config.defaultSort
    const originalFilter = config.admin.baseFilter
    try {
      config.defaultSort = 'title'
      config.admin.baseFilter = undefined
      title.access = { ...title.access, read: () => false }
      const result = await getHierarchyContents({
        collectionSlug: foldersSlug,
        parentID: folder.id,
        source: foldersSlug,
        req,
      })
      expect(result.sources[0].docs).toHaveLength(1)
      expect(result.sources[0].docs[0]).not.toHaveProperty('title')
    } finally {
      title.access = originalAccess
      config.defaultSort = originalSort
      config.admin.baseFilter = originalFilter
    }
  })

  test('should reject direct expansion of a folder the user cannot read', async ({ payload }) => {
    const { folder, req } = await setup({ payload })
    req.context.denyFolderID = folder.id

    await expect(
      getHierarchyContents({ collectionSlug: foldersSlug, parentID: folder.id, req }),
    ).rejects.toThrow()
  })

  test('should exclude folders hidden by their Admin base filter', async ({ payload }) => {
    const { folder, req } = await setup({ payload })
    const hidden = await payload.create({
      collection: foldersSlug,
      data: { title: 'Hidden folder', '_h_page-folders': folder.id },
    })
    const result = await getHierarchyContents({
      collectionSlug: foldersSlug,
      parentID: folder.id,
      req,
    })

    expect(
      result.sources
        .find((source) => source.collectionSlug === foldersSlug)
        ?.docs.map(({ id }) => id),
    ).not.toContain(hidden.id)
    await expect(
      getHierarchyContents({ collectionSlug: foldersSlug, parentID: hidden.id, req }),
    ).rejects.toThrow()
  })

  test('should reject unregistered sources and malformed pagination', async ({ payload }) => {
    const { folder, req } = await setup({ payload })

    await expect(
      getHierarchyContents({
        collectionSlug: foldersSlug,
        parentID: folder.id,
        source: 'users',
        req,
      }),
    ).rejects.toThrow()
    await expect(
      getHierarchyContents({ collectionSlug: foldersSlug, parentID: folder.id, page: -1, req }),
    ).rejects.toThrow()
    await expect(
      getHierarchyContents({ collectionSlug: foldersSlug, parentID: folder.id, limit: 1000, req }),
    ).rejects.toThrow()
  })

  test('should require authentication even when the collections permit public reads', async ({
    payload,
    restClient,
  }) => {
    const req = await createPayloadRequest({ payload })
    await expect(getHierarchyContents({ collectionSlug: foldersSlug, req })).rejects.toThrow()
    const response = await restClient.GET(`/${foldersSlug}/hierarchy-contents`, { auth: false })

    expect([401, 403]).toContain(response.status)
  })

  test('should expose the same bounded contents through the registered endpoint', async ({
    payload,
    restClient,
  }) => {
    const { folder } = await setup({ payload })
    const response = await restClient.GET(`/${foldersSlug}/hierarchy-contents`, {
      query: { parentID: folder.id, source: articlesSlug, limit: 2 },
    })

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.sources).toHaveLength(1)
    expect(body.sources[0].collectionSlug).toBe(articlesSlug)
    expect(body.sources[0].docs).toHaveLength(2)
    expect(body.sources[0].hasNextPage).toBe(true)
  })
})

async function setup({
  payload,
}: {
  payload: Payload
}): Promise<{ folder: { id: number | string }; req: PayloadRequest }> {
  const user = (await payload.find({ collection: 'users', overrideAccess: true })).docs[0]
  const req = await createPayloadRequest({ payload, user })
  const folder = (
    await payload.find({ collection: foldersSlug, where: { title: { equals: 'Editorial' } } })
  ).docs[0]

  return { folder, req }
}
