import type { Payload, PayloadRequest, RequestContext } from 'payload'

import { createPayloadRequest } from 'payload'
import { expect } from 'vitest'

// eslint-disable-next-line payload/no-relative-monorepo-imports -- Exercise the Admin read without making it public API.
import {
  canUseFlatFolderContents,
  getFlatFolderContents,
} from '../../packages/ui/src/views/List/getFlatFolderContents.js'
// eslint-disable-next-line payload/no-relative-monorepo-imports -- Verify the initial hierarchy page matches the continuation read.
import { handleHierarchy } from '../../packages/ui/src/views/List/handleHierarchy.js'
import { test } from '../__helpers/int/vitest.js'
import { getCurrentDatabaseAdapter } from '../dbAdapters.js'
import { articlesSlug, folderField, foldersSlug, pagesSlug } from './shared.js'

test.suite('Flat folder contents', { config: './config.ts' }, () => {
  test('should page mixed published documents and folders independently without repeats', async ({
    payload,
  }) => {
    const { parent, req } = await setup({ payload })
    const timestamp = '2026-01-01T12:00:00.000Z'

    for (let index = 0; index < 12; index++) {
      await payload.create({
        collection: index % 2 === 0 ? pagesSlug : articlesSlug,
        data: {
          title: `Document ${index}`,
          scope: 'public',
          visible: true,
          createdAt: timestamp,
          updatedAt: timestamp,
          [folderField]: parent.id,
        },
        overrideAccess: true,
      })
      await payload.create({
        collection: foldersSlug,
        data: { name: `Child ${index}`, scope: 'public', [folderField]: parent.id },
        overrideAccess: true,
      })
    }

    const first = await getFlatFolderContents({
      args: { collectionSlug: foldersSlug, parentID: parent.id },
      req,
    })
    const secondDocuments = await getFlatFolderContents({
      args: { collectionSlug: foldersSlug, parentID: parent.id, page: 2, source: 'documents' },
      req,
    })
    const secondFolders = await getFlatFolderContents({
      args: { collectionSlug: foldersSlug, parentID: parent.id, page: 2, source: 'folders' },
      req,
    })
    const documents = [...first.documents.docs, ...secondDocuments.documents.docs]
    const folders = [...first.folders.docs, ...secondFolders.folders.docs]

    expect(first.documents.docs).toHaveLength(10)
    expect(first.folders.docs).toHaveLength(10)
    expect(first.documents.hasNextPage).toBe(true)
    expect(first.folders.hasNextPage).toBe(true)
    expect(secondDocuments.documents.hasNextPage).toBe(false)
    expect(secondFolders.folders.hasNextPage).toBe(false)
    expect(documents).toHaveLength(12)
    expect(folders).toHaveLength(12)
    expect(new Set(documents.map((doc) => `${doc._collectionSlug}:${doc.id}`)).size).toBe(12)
    expect(new Set(folders.map((doc) => doc.id)).size).toBe(12)
    expect(new Set(documents.map((doc) => doc.updatedAt))).toEqual(new Set([timestamp]))
    expect(new Set(documents.map((doc) => doc._collectionSlug))).toEqual(
      new Set([pagesSlug, articlesSlug]),
    )

    if (getCurrentDatabaseAdapter() === 'mongodb') {
      const adapter = payload.db as typeof payload.db & { useJoinAggregations: boolean }
      const previousMode = adapter.useJoinAggregations

      adapter.useJoinAggregations = false
      try {
        expect(
          canUseFlatFolderContents({
            collectionConfig: payload.collections[foldersSlug].config,
            req,
          }),
        ).toBe(false)
      } finally {
        adapter.useJoinAggregations = previousMode
      }
    }
  })

  test('should apply Admin filters, row access, and type filters before counting', async ({
    payload,
  }) => {
    const { parent, req } = await setup({ payload })

    await payload.create({
      collection: pagesSlug,
      data: { title: 'Visible Page', scope: 'public', visible: true, [folderField]: parent.id },
      overrideAccess: true,
    })
    await payload.create({
      collection: pagesSlug,
      data: { title: 'Hidden Page', scope: 'public', visible: false, [folderField]: parent.id },
      overrideAccess: true,
    })
    await payload.create({
      collection: pagesSlug,
      data: { title: 'Private Page', scope: 'private', visible: true, [folderField]: parent.id },
      overrideAccess: true,
    })
    await payload.create({
      collection: articlesSlug,
      data: { title: 'Visible Article', scope: 'public', visible: true, [folderField]: parent.id },
      overrideAccess: true,
    })

    const visible = await getFlatFolderContents({
      args: { collectionSlug: foldersSlug, parentID: parent.id },
      req,
    })

    expect(visible.documents.totalDocs).toBe(2)
    expect(visible.documents.docs.map((doc) => doc.title).sort()).toEqual([
      'Visible Article',
      'Visible Page',
    ])
    expect(JSON.stringify(visible)).not.toContain('Hidden Page')
    expect(JSON.stringify(visible)).not.toContain('Private Page')

    req.context.denyArticles = true
    const denied = await getFlatFolderContents({
      args: { collectionSlug: foldersSlug, parentID: parent.id },
      req,
    })

    expect(denied.documents.totalDocs).toBe(1)
    expect(denied.documents.docs.map((doc) => doc.title)).toEqual(['Visible Page'])
    expect(JSON.stringify(denied)).not.toContain('Visible Article')

    const filtered = await getFlatFolderContents({
      args: { collectionSlug: foldersSlug, parentID: parent.id, typeFilter: [articlesSlug] },
      req,
    })

    expect(filtered.documents.totalDocs).toBe(0)
  })

  test('should keep flat subfolders visible while grouped views apply type filters', async ({
    payload,
  }) => {
    const { parent, req } = await setup({ payload })
    const collectionConfig = payload.collections[foldersSlug].config
    const baseFilter = { scope: { equals: 'public' as const } }

    for (let index = 0; index < 12; index++) {
      await payload.create({
        collection: foldersSlug,
        data: { name: `Child ${index}`, scope: 'public', [folderField]: parent.id },
        overrideAccess: true,
      })
    }
    await payload.create({
      collection: foldersSlug,
      data: { name: 'Private Child', scope: 'private', [folderField]: parent.id },
      overrideAccess: true,
    })
    await payload.create({
      collection: pagesSlug,
      data: { title: 'Visible Page', scope: 'public', visible: true, [folderField]: parent.id },
      overrideAccess: true,
    })

    const initial = await handleHierarchy({
      baseFilter,
      collectionConfig,
      collectionSlug: foldersSlug,
      flat: true,
      parentId: parent.id,
      req,
      typeFilter: [articlesSlug],
      user: req.user,
    })
    const continued = await getFlatFolderContents({
      args: {
        collectionSlug: foldersSlug,
        page: 2,
        parentID: parent.id,
        source: 'folders',
        typeFilter: [articlesSlug],
      },
      req,
    })
    const fallback = await handleHierarchy({
      baseFilter,
      collectionConfig,
      collectionSlug: foldersSlug,
      parentId: parent.id,
      req,
      typeFilter: [articlesSlug],
      user: req.user,
    })
    const root = await handleHierarchy({
      baseFilter,
      collectionConfig,
      collectionSlug: foldersSlug,
      parentId: null,
      req,
      typeFilter: [articlesSlug],
      user: req.user,
    })
    const foldersOnly = await getFlatFolderContents({
      args: { collectionSlug: foldersSlug, parentID: parent.id, typeFilter: [] },
      req,
    })
    const folderIDs = [...initial.childrenData.docs, ...continued.folders.docs].map((doc) => doc.id)

    expect(initial.childrenData.totalDocs).toBe(12)
    expect(initial.childrenData.docs).toHaveLength(10)
    expect(continued.folders.totalDocs).toBe(12)
    expect(continued.folders.docs).toHaveLength(2)
    expect(new Set(folderIDs).size).toBe(12)
    expect(fallback.childrenData.totalDocs).toBe(0)
    expect(root.childrenData.totalDocs).toBe(0)
    expect(foldersOnly.folders.totalDocs).toBe(12)
    expect(foldersOnly.documents.totalDocs).toBe(0)
  })

  test('should hide folders outside the Admin base filter while allowing direct navigation', async ({
    payload,
  }) => {
    const { parent, req } = await setup({ payload })

    await payload.create({
      collection: foldersSlug,
      data: { name: 'Private Child', scope: 'private', [folderField]: parent.id },
      overrideAccess: true,
    })
    const contents = await getFlatFolderContents({
      args: { collectionSlug: foldersSlug, parentID: parent.id },
      req,
    })

    expect(contents.folders.totalDocs).toBe(0)

    const privateFolder = await payload.create({
      collection: foldersSlug,
      data: { name: 'Private Folder', scope: 'private' },
      overrideAccess: true,
    })

    const privateContents = await getFlatFolderContents({
      args: { collectionSlug: foldersSlug, parentID: privateFolder.id },
      req,
    })

    expect(privateContents.folders.totalDocs).toBe(0)
    expect(privateContents.documents.totalDocs).toBe(0)
  })

  test('should decline a join with a different membership path', async ({ payload }) => {
    const { req } = await setup({ payload })
    const config = payload.collections[foldersSlug].config
    const join = config.polymorphicJoins[0]!
    const previousOn = join.field.on

    join.field.on = 'otherFolder'
    try {
      expect(canUseFlatFolderContents({ collectionConfig: config, req })).toBe(false)
    } finally {
      join.field.on = previousOn
    }
  })

  test('should decline a join with a different target collection', async ({ payload }) => {
    const { req } = await setup({ payload })
    const config = payload.collections[foldersSlug].config
    const join = config.polymorphicJoins[0]!
    const previousCollections = join.field.collection

    join.field.collection = [foldersSlug, pagesSlug]
    try {
      expect(canUseFlatFolderContents({ collectionConfig: config, req })).toBe(false)
    } finally {
      join.field.collection = previousCollections
    }
  })

  test('should decline conflicting target field definitions', async ({ payload }) => {
    const { req } = await setup({ payload })
    const config = payload.collections[foldersSlug].config
    const pageScope = payload.collections[pagesSlug].config.flattenedFields.find(
      (field) => field.name === 'scope',
    )!
    const previousType = pageScope.type

    expect(canUseFlatFolderContents({ collectionConfig: config, req })).toBe(true)
    Reflect.set(pageScope, 'type', 'number')
    try {
      expect(canUseFlatFolderContents({ collectionConfig: config, req })).toBe(false)
    } finally {
      Reflect.set(pageScope, 'type', previousType)
    }
  })

  test('should reject a folder contents request without an Admin user', async ({ payload }) => {
    const { parent, req } = await setup({ payload })

    req.user = null
    await expect(
      getFlatFolderContents({ args: { collectionSlug: foldersSlug, parentID: parent.id }, req }),
    ).rejects.toThrow()
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
    collection: 'users',
    data: { email: 'editor@payload.test', password: 'test' },
    overrideAccess: true,
  })
  const req = await createPayloadRequest({
    context,
    payload,
    user: { ...user, collection: 'users' },
  })
  const parent = await payload.create({
    collection: foldersSlug,
    data: { name: 'Editorial', scope: 'public' },
    overrideAccess: true,
  })

  return { parent, req }
}
