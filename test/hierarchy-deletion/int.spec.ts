import { expect, vi } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import {
  articlesSlug,
  contentSlug,
  folderFieldName,
  foldersSlug,
  hierarchyPresets,
  localizedPagesSlug,
  pagesSlug,
  tagFieldName,
  tagsSlug,
} from './shared.js'

test.suite('Hierarchy child reparenting', { config: './config.ts' }, () => {
  for (const { collection, parentField } of hierarchyPresets) {
    test(`should reparent only direct children by default for ${collection}`, async ({
      payload,
    }) => {
      const root = await payload.create({ collection, data: { title: 'Root' } })
      const parent = await payload.create({
        collection,
        data: { [parentField]: root.id, title: 'Parent' },
      })
      const child = await payload.create({
        collection,
        data: { [parentField]: parent.id, title: 'Child' },
      })
      const grandchild = await payload.create({
        collection,
        data: { [parentField]: child.id, title: 'Grandchild' },
      })

      await payload.delete({ id: parent.id, collection })

      expect((await payload.findByID({ id: child.id, collection, depth: 0 }))[parentField]).toBe(
        root.id,
      )
      expect(
        (await payload.findByID({ id: grandchild.id, collection, depth: 0 }))[parentField],
      ).toBe(child.id)
    })
  }

  for (const collection of [foldersSlug, tagsSlug]) {
    test(`should preserve assigned content when deleting a hierarchy item in ${collection}`, async ({
      payload,
    }) => {
      const parent = await payload.create({ collection, data: { title: 'Parent' } })
      const content = await payload.create({
        collection: contentSlug,
        data: {
          title: 'Assigned content',
          ...(collection === foldersSlug
            ? { [folderFieldName]: parent.id }
            : { [tagFieldName]: [parent.id] }),
        },
      })

      await payload.delete({ id: parent.id, collection })

      const retainedContent = await payload.findByID({
        id: content.id,
        collection: contentSlug,
        depth: 0,
      })

      expect(retainedContent.title).toBe('Assigned content')
      expect(retainedContent[collection === foldersSlug ? folderFieldName : tagFieldName]).toEqual(
        collection === foldersSlug ? null : [],
      )
    })
  }

  for (const collection of [foldersSlug, tagsSlug]) {
    test(`should retain assignments when trashing a hierarchy item in ${collection}`, async ({
      payload,
    }) => {
      const parent = await payload.create({ collection, data: { title: 'Parent' } })
      const fieldName = collection === foldersSlug ? folderFieldName : tagFieldName
      const assignment = collection === foldersSlug ? parent.id : [parent.id]
      const content = await payload.create({
        collection: contentSlug,
        data: { [fieldName]: assignment, title: 'Assigned content' },
      })

      await payload.update({
        id: parent.id,
        collection,
        data: { deletedAt: new Date().toISOString() },
      })

      const retainedContent = await payload.findByID({
        id: content.id,
        collection: contentSlug,
        depth: 0,
      })

      expect(retainedContent.title).toBe('Assigned content')
      expect(retainedContent[fieldName]).toEqual(assignment)
    })
  }

  test('should promote children to root when deleting a root document', async ({ payload }) => {
    const parent = await payload.create({ collection: pagesSlug, data: { title: 'Parent' } })
    const child = await payload.create({
      collection: pagesSlug,
      data: { parent: parent.id, title: 'Child' },
    })

    await payload.delete({
      id: parent.id,
      collection: pagesSlug,
    })

    expect(
      (await payload.findByID({ id: child.id, collection: pagesSlug, depth: 0 })).parent,
    ).toBeNull()
  })

  test('should reparent once on trash and leave the child in place through restore and permanent deletion', async ({
    payload,
  }) => {
    const root = await payload.create({ collection: articlesSlug, data: { title: 'Root' } })
    const parent = await payload.create({
      collection: articlesSlug,
      data: { ancestor: root.id, title: 'Parent' },
    })
    const child = await payload.create({
      collection: articlesSlug,
      data: { ancestor: parent.id, title: 'Child' },
    })
    const grandchild = await payload.create({
      collection: articlesSlug,
      data: { ancestor: child.id, title: 'Grandchild' },
    })
    const destination = await payload.create({
      collection: articlesSlug,
      data: { title: 'New destination' },
    })

    await payload.update({
      id: parent.id,
      collection: articlesSlug,
      data: { deletedAt: new Date().toISOString() },
    })

    expect(
      (await payload.findByID({ id: child.id, collection: articlesSlug, depth: 0 })).ancestor,
    ).toBe(root.id)
    expect(
      (await payload.findByID({ id: grandchild.id, collection: articlesSlug, depth: 0 })).ancestor,
    ).toBe(child.id)

    await payload.update({
      id: child.id,
      collection: articlesSlug,
      data: { ancestor: destination.id },
    })
    await payload.update({
      id: parent.id,
      collection: articlesSlug,
      data: { title: 'Edited in trash' },
      trash: true,
    })
    await payload.update({
      id: parent.id,
      collection: articlesSlug,
      data: { deletedAt: null },
      trash: true,
    })

    expect(
      (await payload.findByID({ id: child.id, collection: articlesSlug, depth: 0 })).ancestor,
    ).toBe(destination.id)

    await payload.delete({ id: parent.id, collection: articlesSlug, trash: true })

    expect(
      (await payload.findByID({ id: child.id, collection: articlesSlug, depth: 0 })).ancestor,
    ).toBe(destination.id)
  })

  for (const contextKey of ['denyPageUpdates', 'denyParentUpdates']) {
    test(`should internally reparent despite ${contextKey}`, async ({ payload }) => {
      const parent = await payload.create({ collection: pagesSlug, data: { title: 'Parent' } })
      const child = await payload.create({
        collection: pagesSlug,
        data: { parent: parent.id, title: 'Child' },
      })

      await payload.delete({
        id: parent.id,
        collection: pagesSlug,
        context: { [contextKey]: true },
        overrideAccess: false,
      })

      expect(
        (await payload.findByID({ id: child.id, collection: pagesSlug, depth: 0 })).parent,
      ).toBeNull()
    })
  }

  test('should retain parent delete access before reparenting children', async ({ payload }) => {
    const parent = await payload.create({ collection: pagesSlug, data: { title: 'Parent' } })
    const child = await payload.create({
      collection: pagesSlug,
      data: { parent: parent.id, title: 'Child' },
    })

    await expect(
      payload.delete({
        id: parent.id,
        collection: pagesSlug,
        context: { denyPageDeletes: true },
        overrideAccess: false,
      }),
    ).rejects.toThrow()

    expect((await payload.findByID({ id: parent.id, collection: pagesSlug })).id).toBe(parent.id)
    expect((await payload.findByID({ id: child.id, collection: pagesSlug, depth: 0 })).parent).toBe(
      parent.id,
    )
  })

  for (const hasIndependentDraftParent of [false, true]) {
    test(`should preserve published and pending draft content with independent draft parent ${hasIndependentDraftParent}`, async ({
      payload,
    }) => {
      const root = await payload.create({
        collection: pagesSlug,
        data: { _status: 'published', title: 'Root' },
      })
      const parent = await payload.create({
        collection: pagesSlug,
        data: { _status: 'published', parent: root.id, title: 'Parent' },
      })
      const destination = await payload.create({
        collection: pagesSlug,
        data: { _status: 'published', title: 'Independent destination' },
      })
      const child = await payload.create({
        collection: pagesSlug,
        data: { _status: 'published', parent: parent.id, title: 'Published title' },
      })

      await payload.update({
        id: child.id,
        collection: pagesSlug,
        data: {
          ...(hasIndependentDraftParent ? { parent: destination.id } : {}),
          title: 'Pending draft title',
        },
        draft: true,
      })
      const hierarchyEvents: {
        id: number | string
        originalParent: null | number | string
        originalTitle: string
        parent: null | number | string
        title: string
      }[] = []

      await payload.delete({
        id: parent.id,
        collection: pagesSlug,
        context: { hierarchyEvents },
      })

      const published = await payload.findByID({ id: child.id, collection: pagesSlug, depth: 0 })
      const draft = await payload.findByID({
        id: child.id,
        collection: pagesSlug,
        depth: 0,
        draft: true,
      })

      expect(published.title).toBe('Published title')
      expect(published._status).toBe('published')
      expect(published.parent).toBe(root.id)
      expect(draft.title).toBe('Pending draft title')
      expect(draft.parent).toBe(hasIndependentDraftParent ? destination.id : root.id)
      expect(hierarchyEvents).toEqual(
        expect.arrayContaining(
          hasIndependentDraftParent
            ? [
                {
                  id: child.id,
                  originalParent: parent.id,
                  originalTitle: 'Published title',
                  parent: root.id,
                  title: 'Published title',
                },
                {
                  id: child.id,
                  originalParent: destination.id,
                  originalTitle: 'Pending draft title',
                  parent: destination.id,
                  title: 'Pending draft title',
                },
              ]
            : [],
        ),
      )
    })
  }

  test('should retain published status when reparenting without a pending draft', async ({
    payload,
  }) => {
    const parent = await payload.create({
      collection: pagesSlug,
      data: { _status: 'published', title: 'Parent' },
    })
    const child = await payload.create({
      collection: pagesSlug,
      data: { _status: 'published', parent: parent.id, title: 'Published child' },
    })

    await payload.delete({ id: parent.id, collection: pagesSlug })

    const promoted = await payload.findByID({
      id: child.id,
      collection: pagesSlug,
      depth: 0,
      draft: true,
    })

    expect(promoted._status).toBe('published')
    expect(promoted.parent).toBeNull()
  })

  test('should roll back earlier child reparent changes when a later hook rejects', async ({
    payload,
  }) => {
    const parent = await payload.create({ collection: pagesSlug, data: { title: 'Parent' } })
    const first = await payload.create({
      collection: pagesSlug,
      data: { parent: parent.id, title: 'First' },
    })
    const second = await payload.create({
      collection: pagesSlug,
      data: { parent: parent.id, title: 'Second' },
    })
    const trace = { ids: [] as (number | string)[], targetIDs: [first.id, second.id] }

    await expect(
      payload.delete({
        id: parent.id,
        collection: pagesSlug,
        context: {
          reparentTrace: trace,
        },
        overrideAccess: false,
      }),
    ).rejects.toThrow(/second child/)

    expect(trace.ids).toHaveLength(2)
    expect((await payload.findByID({ id: parent.id, collection: pagesSlug })).id).toBe(parent.id)
    for (const id of [first.id, second.id]) {
      expect((await payload.findByID({ id, collection: pagesSlug, depth: 0 })).parent).toBe(
        parent.id,
      )
    }
  })

  test('should roll back bulk deletion when a later child promotion hook rejects', async ({
    payload,
  }) => {
    const parent = await payload.create({ collection: pagesSlug, data: { title: 'Parent' } })
    const first = await payload.create({
      collection: pagesSlug,
      data: { parent: parent.id, title: 'First child' },
    })
    const second = await payload.create({
      collection: pagesSlug,
      data: { parent: parent.id, title: 'Second child' },
    })
    const trace = { ids: [] as (number | string)[], targetIDs: [first.id, second.id] }
    const originalBulkOperationsSingleTransaction = payload.db.bulkOperationsSingleTransaction

    try {
      payload.db.bulkOperationsSingleTransaction = false

      await expect(
        payload.delete({
          collection: pagesSlug,
          context: { reparentTrace: trace },
          where: { id: { equals: parent.id } },
        }),
      ).rejects.toThrow(/second child/)
    } finally {
      payload.db.bulkOperationsSingleTransaction = originalBulkOperationsSingleTransaction
    }

    expect(trace.ids).toHaveLength(2)
    expect((await payload.findByID({ id: parent.id, collection: pagesSlug })).id).toBe(parent.id)
    for (const id of [first.id, second.id]) {
      expect((await payload.findByID({ id, collection: pagesSlug, depth: 0 })).parent).toBe(
        parent.id,
      )
    }
  })

  test('should roll back earlier bulk trash updates when a later hook rejects', async ({
    payload,
  }) => {
    const roots = [
      await payload.create({ collection: articlesSlug, data: { title: 'First root' } }),
      await payload.create({ collection: articlesSlug, data: { title: 'Second root' } }),
    ]
    const where = { id: { in: roots.map(({ id }) => id) } }
    const { docs: orderedRoots } = await payload.db.find({ collection: articlesSlug, where })
    const child = await payload.create({
      collection: articlesSlug,
      data: { ancestor: orderedRoots[0].id, title: 'First root child' },
    })
    const collectionConfig = payload.collections[articlesSlug].config
    const originalBeforeChange = collectionConfig.hooks.beforeChange
    const originalBulkOperationsSingleTransaction = payload.db.bulkOperationsSingleTransaction
    const visitedRootIDs: (number | string)[] = []

    try {
      payload.db.bulkOperationsSingleTransaction = false
      collectionConfig.hooks.beforeChange = [
        ...originalBeforeChange,
        ({ data, originalDoc }) => {
          if (data.deletedAt && roots.some(({ id }) => id === originalDoc.id)) {
            visitedRootIDs.push(originalDoc.id)
            if (originalDoc.id === orderedRoots[1].id) {
              throw new Error('Trash hook rejected the second root')
            }
          }
          return data
        },
      ]

      await expect(
        payload.update({
          collection: articlesSlug,
          data: { deletedAt: new Date().toISOString() },
          where,
        }),
      ).rejects.toThrow(/second root/)
    } finally {
      collectionConfig.hooks.beforeChange = originalBeforeChange
      payload.db.bulkOperationsSingleTransaction = originalBulkOperationsSingleTransaction
    }

    expect(visitedRootIDs).toEqual(orderedRoots.map(({ id }) => id))
    for (const { id } of roots) {
      expect((await payload.findByID({ id, collection: articlesSlug })).deletedAt).toBeFalsy()
    }
    expect(
      (await payload.findByID({ id: child.id, collection: articlesSlug, depth: 0 })).ancestor,
    ).toBe(orderedRoots[0].id)
  })

  test('should reparent a surviving grandchild past both ancestors selected for bulk deletion', async ({
    payload,
  }) => {
    const root = await payload.create({ collection: pagesSlug, data: { title: 'Surviving root' } })
    const parent = await payload.create({
      collection: pagesSlug,
      data: { parent: root.id, title: 'Selected parent' },
    })
    const child = await payload.create({
      collection: pagesSlug,
      data: { parent: parent.id, title: 'Selected child' },
    })
    const grandchild = await payload.create({
      collection: pagesSlug,
      data: { parent: child.id, title: 'Surviving grandchild' },
    })
    const originalBulkOperationsSingleTransaction = payload.db.bulkOperationsSingleTransaction

    try {
      payload.db.bulkOperationsSingleTransaction = false

      const result = await payload.delete({
        collection: pagesSlug,
        overrideAccess: true,
        where: { id: { in: [parent.id, child.id] } },
      })

      expect(result.errors).toEqual([])
    } finally {
      payload.db.bulkOperationsSingleTransaction = originalBulkOperationsSingleTransaction
    }

    expect(
      (await payload.findByID({ id: grandchild.id, collection: pagesSlug, depth: 0 })).parent,
    ).toBe(root.id)
    for (const id of [parent.id, child.id]) {
      await expect(payload.findByID({ id, collection: pagesSlug })).rejects.toThrow()
    }
  })

  test('should reparent surviving children past overlapping bulk trash selections', async ({
    payload,
  }) => {
    const root = await payload.create({
      collection: articlesSlug,
      data: { title: 'Surviving root' },
    })
    const parent = await payload.create({
      collection: articlesSlug,
      data: { title: 'Selected parent', ancestor: root.id },
    })
    const child = await payload.create({
      collection: articlesSlug,
      data: { title: 'Selected child', ancestor: parent.id },
    })
    const grandchild = await payload.create({
      collection: articlesSlug,
      data: { title: 'Surviving grandchild', ancestor: child.id },
    })
    const originalBulkOperationsSingleTransaction = payload.db.bulkOperationsSingleTransaction

    try {
      payload.db.bulkOperationsSingleTransaction = false
      const result = await payload.update({
        collection: articlesSlug,
        where: { id: { in: [parent.id, child.id] } },
        data: { deletedAt: new Date().toISOString() },
      })
      expect(result.errors).toEqual([])
    } finally {
      payload.db.bulkOperationsSingleTransaction = originalBulkOperationsSingleTransaction
    }

    expect(
      (await payload.findByID({ collection: articlesSlug, id: grandchild.id, depth: 0 })).ancestor,
    ).toBe(root.id)
  })
  test('should reject localized publication status without changing existing content', async ({
    payload,
  }) => {
    const parent = await payload.create({
      collection: localizedPagesSlug,
      data: { title: 'Parent', _status: 'published' },
    })
    const child = await payload.create({
      collection: localizedPagesSlug,
      data: { title: 'Published English', parent: parent.id, _status: 'published' },
    })
    await payload.update({
      collection: localizedPagesSlug,
      id: child.id,
      locale: 'es',
      publishAllLocales: true,
      data: { title: 'Published Spanish', _status: 'published' },
    })
    await payload.update({
      collection: localizedPagesSlug,
      id: child.id,
      locale: 'en',
      draft: true,
      data: { title: 'Draft English' },
    })
    const storedBefore = await payload.findByID({
      collection: localizedPagesSlug,
      id: child.id,
      locale: 'all',
      depth: 0,
    })
    const draftBefore = await payload.findByID({
      collection: localizedPagesSlug,
      id: child.id,
      locale: 'all',
      depth: 0,
      draft: true,
    })

    await expect(payload.delete({ collection: localizedPagesSlug, id: parent.id })).rejects.toThrow(
      'localized draft status',
    )

    const stored = await payload.findByID({
      collection: localizedPagesSlug,
      id: child.id,
      locale: 'all',
      depth: 0,
    })
    const draft = await payload.findByID({
      collection: localizedPagesSlug,
      id: child.id,
      locale: 'all',
      depth: 0,
      draft: true,
    })
    expect(stored).toMatchObject({
      parent: parent.id,
      title: storedBefore.title,
      _status: storedBefore._status,
    })
    expect(draft).toMatchObject({
      parent: parent.id,
      title: draftBefore.title,
      _status: draftBefore._status,
    })
    expect((await payload.findByID({ collection: localizedPagesSlug, id: parent.id })).id).toBe(
      parent.id,
    )
  })

  test('should retain one latest draft version when structural writes share a timestamp', async ({
    payload,
  }) => {
    const parent = await payload.create({
      collection: pagesSlug,
      data: { title: 'Parent', _status: 'published' },
    })
    const child = await payload.create({
      collection: pagesSlug,
      data: { title: 'Published title', parent: parent.id, _status: 'published' },
    })
    await payload.update({
      collection: pagesSlug,
      id: child.id,
      draft: true,
      data: { title: 'Pending draft title' },
    })

    const updateVersion = payload.db.updateVersion.bind(payload.db)
    const versionUpdate = vi.spyOn(payload.db, 'updateVersion').mockImplementation(async (args) => {
      const isMarkerCleanup = args.versionData.latest === false && !args.versionData.version

      if (!isMarkerCleanup) {
        return updateVersion(args)
      }

      const before = await payload.db.findVersions({
        collection: pagesSlug,
        pagination: false,
        req: args.req,
        where: { id: { equals: args.id } },
      })
      const result = await updateVersion(args)
      const after = await payload.db.findVersions({
        collection: pagesSlug,
        pagination: false,
        req: args.req,
        where: { id: { equals: args.id } },
      })

      expect(after.docs[0]).toMatchObject({
        createdAt: before.docs[0].createdAt,
        updatedAt: before.docs[0].updatedAt,
        version: before.docs[0].version,
      })
      return result
    })

    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(Date.now() + 1000))
    try {
      await payload.delete({ collection: pagesSlug, id: parent.id })
      const versions = await payload.db.findVersions({
        collection: pagesSlug,
        pagination: false,
        where: { and: [{ parent: { equals: child.id } }, { latest: { equals: true } }] },
      })
      expect(versions.docs).toHaveLength(1)
      expect(versions.docs[0].version).toMatchObject({
        parent: null,
        title: 'Pending draft title',
        _status: 'draft',
      })
      expect(
        (await payload.findByID({ collection: pagesSlug, id: child.id, draft: true })).title,
      ).toBe('Pending draft title')
    } finally {
      versionUpdate.mockRestore()
      vi.useRealTimers()
    }
  })
  for (const contextKey of ['denyCollectionParentTarget', 'denyFieldParentTarget']) {
    test(`should reparent published pointers internally despite ${contextKey}`, async ({
      payload,
    }) => {
      const grandparent = await payload.create({
        collection: pagesSlug,
        data: { _status: 'published', title: 'Protected destination' },
      })
      const parent = await payload.create({
        collection: pagesSlug,
        data: { _status: 'published', parent: grandparent.id, title: 'Deleted parent' },
      })
      const permitted = await payload.create({
        collection: pagesSlug,
        data: { _status: 'published', title: 'Permitted draft destination' },
      })
      const child = await payload.create({
        collection: pagesSlug,
        data: { _status: 'published', parent: parent.id, title: 'Child' },
      })

      await payload.update({
        id: child.id,
        collection: pagesSlug,
        data: { parent: permitted.id },
        draft: true,
      })

      await payload.delete({
        id: parent.id,
        collection: pagesSlug,
        context: { [contextKey]: grandparent.id },
        overrideAccess: false,
      })

      const published = await payload.findByID({ id: child.id, collection: pagesSlug, depth: 0 })
      const draft = await payload.findByID({
        id: child.id,
        collection: pagesSlug,
        depth: 0,
        draft: true,
      })

      expect(published.parent).toBe(grandparent.id)
      expect(draft.parent).toBe(permitted.id)
    })
  }
})
