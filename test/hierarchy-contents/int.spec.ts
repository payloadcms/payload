import type { Payload, PayloadRequest, RequestContext } from 'payload'

import { createPayloadRequest, getHierarchyContents } from 'payload'
import { expect } from 'vitest'

// eslint-disable-next-line payload/no-relative-monorepo-imports -- Test the internal Admin handler without adding a public export.
import { getHierarchyContentsHandler } from '../../packages/ui/src/utilities/getHierarchyContents.js'
import { test } from '../__helpers/int/vitest.js'
import {
  assetsSlug,
  containerParentField,
  containersSlug,
  foldersSlug,
  guardedMembersSlug,
  postsSlug,
  usersSlug,
} from './shared.js'

test.suite('Authorized hierarchy contents', { config: './config.ts' }, () => {
  test('should read child containers and each connected collection from a custom hierarchy', async ({
    payload,
  }) => {
    const { parent, req } = await setup({ payload })
    const child = await payload.create({
      collection: containersSlug,
      data: { name: 'Child container', [containerParentField]: parent.id },
      overrideAccess: true,
    })
    const post = await payload.create({
      collection: postsSlug,
      data: { headline: 'Post', [containerParentField]: parent.id },
      overrideAccess: true,
    })
    const asset = await payload.create({
      collection: assetsSlug,
      data: { caption: 'Asset', [containerParentField]: parent.id },
      overrideAccess: true,
    })
    await payload.create({
      collection: postsSlug,
      data: { headline: 'Unassigned post' },
      overrideAccess: true,
    })
    const result = await getHierarchyContents({
      collectionSlug: containersSlug,
      parentID: parent.id,
      req,
    })

    expect(result.sources[0]?.collectionSlug).toBe(containersSlug)
    expect(sourceDocs({ result, slug: containersSlug }).map(({ id }) => id)).toEqual([child.id])
    expect(sourceDocs({ result, slug: postsSlug }).map(({ id }) => id)).toEqual([post.id])
    expect(sourceDocs({ result, slug: assetsSlug }).map(({ id }) => id)).toEqual([asset.id])
    expect(result.allowedCollections).toEqual([])
  })

  test('should support the folder preset through the same operation', async ({ payload }) => {
    const { req } = await setup({ payload })
    const parent = await payload.create({
      collection: foldersSlug,
      data: { name: 'Folder' },
      overrideAccess: true,
    })
    const child = await payload.create({
      collection: foldersSlug,
      data: { name: 'Child', '_h_content-folders': parent.id },
      overrideAccess: true,
    })
    const post = await payload.create({
      collection: postsSlug,
      data: { headline: 'Filed post', '_h_content-folders': parent.id },
      overrideAccess: true,
    })
    const result = await getHierarchyContents({
      collectionSlug: foldersSlug,
      parentID: parent.id,
      req,
    })

    expect(sourceDocs({ result, slug: foldersSlug }).map(({ id }) => id)).toEqual([child.id])
    expect(sourceDocs({ result, slug: postsSlug }).map(({ id }) => id)).toEqual([post.id])
    expect(result.allowedCollections).toBeUndefined()
  })

  test('should page sources independently while preserving read access and base filters', async ({
    payload,
  }) => {
    const { parent, req } = await setup({ payload })
    const ids = []
    for (let index = 0; index < 5; index++) {
      const post = await payload.create({
        collection: postsSlug,
        data: { headline: `Post ${index}`, [containerParentField]: parent.id },
        overrideAccess: true,
      })
      ids.push(post.id)
    }
    await payload.create({
      collection: postsSlug,
      data: { headline: 'Hidden post', hidden: true, [containerParentField]: parent.id },
      overrideAccess: true,
    })
    req.context.denyPostID = ids[1]
    const first = await getHierarchyContents({
      collectionSlug: containersSlug,
      parentID: parent.id,
      source: postsSlug,
      limit: 2,
      req,
    })
    const second = await getHierarchyContents({
      collectionSlug: containersSlug,
      parentID: parent.id,
      source: postsSlug,
      limit: 2,
      page: 2,
      req,
    })

    expect(first.sources).toHaveLength(1)
    expect(first.sources[0]?.totalDocs).toBe(4)
    expect(first.sources[0]?.hasNextPage).toBe(true)
    expect(second.sources[0]?.hasNextPage).toBe(false)
    expect(
      [
        ...sourceDocs({ result: first, slug: postsSlug }),
        ...sourceDocs({ result: second, slug: postsSlug }),
      ].map(({ id }) => id),
    ).toEqual([ids[0], ids[2], ids[3], ids[4]])
  })

  test('should omit a denied collection while retaining other readable sources', async ({
    payload,
  }) => {
    const { parent, req } = await setup({ payload })
    req.context.denyPosts = true
    const result = await getHierarchyContents({
      collectionSlug: containersSlug,
      parentID: parent.id,
      req,
    })

    expect(result.sources.some(({ collectionSlug }) => collectionSlug === postsSlug)).toBe(false)
    expect(result.sources.some(({ collectionSlug }) => collectionSlug === assetsSlug)).toBe(true)
  })

  test('should omit sources whose membership field has a read rule', async ({ payload }) => {
    const { parent, req } = await setup({ payload })
    await payload.create({
      collection: guardedMembersSlug,
      data: { title: 'Protected membership', [containerParentField]: parent.id },
      overrideAccess: true,
    })
    const result = await getHierarchyContents({
      collectionSlug: containersSlug,
      parentID: parent.id,
      req,
    })

    expect(result.sources.some(({ collectionSlug }) => collectionSlug === guardedMembersSlug)).toBe(
      false,
    )
    expect(JSON.stringify(result)).not.toContain('Protected membership')
  })

  test('should respect source field access without sorting on a guarded title', async ({
    payload,
  }) => {
    const { parent, req } = await setup({ payload })
    await payload.create({
      collection: postsSlug,
      data: {
        headline: 'Private title',
        secret: 'Private secret',
        [containerParentField]: parent.id,
      },
      overrideAccess: true,
    })
    req.context.denyPostTitles = true
    const result = await getHierarchyContents({
      collectionSlug: containersSlug,
      parentID: parent.id,
      source: postsSlug,
      req,
    })

    expect(result.sources[0]?.docs).toHaveLength(1)
    expect(result.sources[0]?.docs[0]).not.toHaveProperty('headline')
    expect(result.sources[0]?.docs[0]).not.toHaveProperty('secret')
    expect(JSON.stringify(result)).not.toContain('Private title')
  })

  test('should authorize a readable parent despite its guarded default sort field', async ({
    payload,
  }) => {
    const { parent, req } = await setup({ payload })
    req.context.denyContainerTitles = true

    await expect(
      getHierarchyContents({
        collectionSlug: containersSlug,
        parentID: parent.id,
        source: postsSlug,
        req,
      }),
    ).resolves.toMatchObject({ parentID: parent.id })
  })

  test('should reject expansion of an unreadable parent before returning related contents', async ({
    payload,
  }) => {
    const { parent, req } = await setup({ payload })
    await payload.create({
      collection: postsSlug,
      data: { headline: 'Readable post', [containerParentField]: parent.id },
      overrideAccess: true,
    })
    req.context.denyContainerID = parent.id

    await expect(
      getHierarchyContents({ collectionSlug: containersSlug, parentID: parent.id, req }),
    ).rejects.toThrow()
  })

  test('should reject a direct parent hidden by its Admin base filter', async ({ payload }) => {
    const { req } = await setup({ payload })
    const parent = await payload.create({
      collection: containersSlug,
      data: { name: 'Hidden container', hidden: true },
      overrideAccess: true,
    })

    await expect(
      getHierarchyContents({ collectionSlug: containersSlug, parentID: parent.id, req }),
    ).rejects.toThrow()
  })

  test('should require hierarchy collection read access even for the root', async ({ payload }) => {
    const { req } = await setup({ payload })
    req.context.denyContainers = true

    await expect(getHierarchyContents({ collectionSlug: containersSlug, req })).rejects.toThrow()
  })

  test('should return only unassigned documents at the root and no parent restrictions', async ({
    payload,
  }) => {
    const { parent, req } = await setup({ payload })
    const unassigned = await payload.create({
      collection: postsSlug,
      data: { headline: 'Unassigned post' },
      overrideAccess: true,
    })
    await payload.create({
      collection: postsSlug,
      data: { headline: 'Assigned post', [containerParentField]: parent.id },
      overrideAccess: true,
    })
    const result = await getHierarchyContents({ collectionSlug: containersSlug, req })

    expect(sourceDocs({ result, slug: postsSlug }).map(({ id }) => id)).toEqual([unassigned.id])
    expect(result.allowedCollections).toBeUndefined()
  })

  test('should preserve each root container’s own allowed collections', async ({ payload }) => {
    const { req } = await setup({ payload })
    const postsContainer = await payload.create({
      collection: containersSlug,
      data: { name: 'Posts container', hierarchyType: [postsSlug] },
      overrideAccess: true,
    })
    const assetsContainer = await payload.create({
      collection: containersSlug,
      data: { name: 'Assets container', hierarchyType: [assetsSlug] },
      overrideAccess: true,
    })
    const result = await getHierarchyContents({ collectionSlug: containersSlug, req })
    const docs = sourceDocs({ result, slug: containersSlug })

    expect(docs.find(({ id }) => id === postsContainer.id)?.hierarchyType).toEqual([postsSlug])
    expect(docs.find(({ id }) => id === assetsContainer.id)?.hierarchyType).toEqual([assetsSlug])
    expect(result.allowedCollections).toBeUndefined()
  })

  test('should omit unreadable allowed collections on returned container documents', async ({
    payload,
  }) => {
    const { req } = await setup({ payload })
    const container = await payload.create({
      collection: containersSlug,
      data: { name: 'Restricted metadata', hierarchyType: [postsSlug] },
      overrideAccess: true,
    })
    const field = payload.collections[containersSlug].config.flattenedFields.find(
      (item) => 'name' in item && item.name === 'hierarchyType',
    )!
    const access = field.access

    field.access = { ...access, read: () => false }
    try {
      const result = await getHierarchyContents({ collectionSlug: containersSlug, req })
      const doc = sourceDocs({ result, slug: containersSlug }).find(({ id }) => id === container.id)

      expect(doc).toBeDefined()
      expect(doc).not.toHaveProperty('hierarchyType')
      expect(result.allowedCollections).toBeUndefined()
    } finally {
      field.access = access
    }
  })

  test('should return allowed collection hints from the authorized parent read', async ({
    payload,
  }) => {
    const { req } = await setup({ payload })
    const parent = await payload.create({
      collection: containersSlug,
      data: { name: 'Post container', hierarchyType: [postsSlug] },
      overrideAccess: true,
    })
    const result = await getHierarchyContents({
      collectionSlug: containersSlug,
      parentID: parent.id,
      req,
    })

    expect(result.allowedCollections).toEqual([postsSlug])
  })

  test('should leave allowed collection hints unavailable when their field is unreadable', async ({
    payload,
  }) => {
    const { parent, req } = await setup({ payload })
    const field = payload.collections[containersSlug].config.flattenedFields.find(
      (item) => 'name' in item && item.name === 'hierarchyType',
    )!
    const access = field.access
    field.access = { ...access, read: () => false }
    try {
      const result = await getHierarchyContents({
        collectionSlug: containersSlug,
        parentID: parent.id,
        req,
      })

      expect(result.allowedCollections).toBeUndefined()
    } finally {
      field.access = access
    }
  })

  test('should expose lock state through the ordinary authorized read pipeline', async ({
    payload,
  }) => {
    const { parent, req } = await setup({ payload })
    const post = await payload.create({
      collection: postsSlug,
      data: { headline: 'Locked post', [containerParentField]: parent.id },
      overrideAccess: true,
    })
    const locker = await payload.create({
      collection: usersSlug,
      data: {
        email: 'locker@payload.test',
        password: 'test',
        name: 'Locker',
        secret: 'Lock user secret',
      },
      overrideAccess: true,
    })
    await payload.create({
      collection: 'payload-locked-documents',
      data: {
        document: { relationTo: postsSlug, value: post.id },
        user: { relationTo: usersSlug, value: locker.id },
      },
      overrideAccess: true,
    })
    const result = await getHierarchyContents({
      collectionSlug: containersSlug,
      parentID: parent.id,
      source: postsSlug,
      req,
    })

    expect(result.sources[0]?.docs[0]?._isLocked).toBe(true)
    expect(result.sources[0]?.docs[0]?._userEditing).toMatchObject({
      id: locker.id,
      name: 'Locker',
    })
    expect(result.sources[0]?.docs[0]?._userEditing).not.toHaveProperty('secret')
  })

  test('should support timestamp-disabled source collections', async ({ payload }) => {
    const { parent, req } = await setup({ payload })
    await payload.create({
      collection: assetsSlug,
      data: { caption: 'Asset', [containerParentField]: parent.id },
      overrideAccess: true,
    })
    const result = await getHierarchyContents({
      collectionSlug: containersSlug,
      parentID: parent.id,
      source: assetsSlug,
      req,
    })

    expect(result.sources[0]?.docs).toHaveLength(1)
    expect(result.sources[0]?.docs[0]).not.toHaveProperty('updatedAt')
  })

  test('should reject malformed pagination and unregistered collections', async ({ payload }) => {
    const { req } = await setup({ payload })

    await expect(
      getHierarchyContents({ collectionSlug: containersSlug, source: usersSlug, req }),
    ).rejects.toThrow()
    await expect(getHierarchyContents({ collectionSlug: postsSlug, req })).rejects.toThrow()
    await expect(
      getHierarchyContents({ collectionSlug: containersSlug, limit: 1000, req }),
    ).rejects.toThrow()
    await expect(
      getHierarchyContents({ collectionSlug: containersSlug, page: -1, req }),
    ).rejects.toThrow()
  })

  test('should reject anonymous core requests even when content reads are public', async ({
    payload,
  }) => {
    const req = await createPayloadRequest({ payload })

    await expect(getHierarchyContents({ collectionSlug: containersSlug, req })).rejects.toThrow()
  })

  test('should enforce Admin access in the registered server function', async ({ payload }) => {
    const { parent, req } = await setup({ payload })
    const args = {
      collectionSlug: containersSlug,
      cookies: new Map<string, string>(),
      importMap: {},
      parentID: parent.id,
      permissions: {},
      req,
    }

    await expect(getHierarchyContentsHandler(args)).resolves.toMatchObject({ parentID: parent.id })
    req.context.denyAdmin = true
    await expect(getHierarchyContentsHandler(args)).rejects.toThrow()
  })
})

async function setup({
  payload,
  context = {},
}: {
  context?: RequestContext
  payload: Payload
}): Promise<{ parent: { id: number | string }; req: PayloadRequest }> {
  const user = await payload.create({
    collection: usersSlug,
    data: { email: 'editor@payload.test', password: 'test', name: 'Editor' },
    overrideAccess: true,
  })
  const req = await createPayloadRequest({
    context,
    payload,
    user: { ...user, collection: usersSlug },
  })
  const parent = await payload.create({
    collection: containersSlug,
    data: { name: 'Editorial', hierarchyType: [] },
    overrideAccess: true,
  })

  return { parent, req }
}

function sourceDocs({
  result,
  slug,
}: {
  result: Awaited<ReturnType<typeof getHierarchyContents>>
  slug: string
}) {
  return result.sources.find(({ collectionSlug }) => collectionSlug === slug)?.docs ?? []
}
