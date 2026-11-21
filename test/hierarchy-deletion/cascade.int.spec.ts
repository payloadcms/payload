import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import {
  articlesSlug,
  contentSlug,
  folderFieldName,
  foldersSlug,
  hierarchyPresets,
  pagesSlug,
  tagFieldName,
  tagsSlug,
} from './shared.js'

test.suite('Explicit hierarchy cascade', { config: './config.ts' }, () => {
  for (const { collection, parentField } of hierarchyPresets) {
    test(`should cascade only hierarchy descendants for ${collection}`, async ({ payload }) => {
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
      const sibling = await payload.create({
        collection,
        data: { [parentField]: root.id, title: 'Sibling' },
      })
      const content =
        collection === foldersSlug || collection === tagsSlug
          ? await payload.create({
              collection: contentSlug,
              data: {
                ...(collection === foldersSlug
                  ? { [folderFieldName]: child.id }
                  : { [tagFieldName]: [parent.id, child.id] }),
                title: 'Assigned content survives',
              },
            })
          : undefined

      await payload.delete({
        id: parent.id,
        collection,
        context: { hierarchyDeleteStrategy: 'cascade' },
      })

      for (const id of [parent.id, child.id, grandchild.id]) {
        await expect(payload.findByID({ id, collection })).rejects.toThrow()
      }
      expect((await payload.findByID({ id: root.id, collection })).id).toBe(root.id)
      expect((await payload.findByID({ id: sibling.id, collection, depth: 0 }))[parentField]).toBe(
        root.id,
      )
      const survivingContent = content
        ? await payload.findByID({ id: content.id, collection: contentSlug, depth: 0 })
        : undefined

      expect(survivingContent?.title).toBe(content ? 'Assigned content survives' : undefined)
    })
  }

  test('should soft-trash descendants when cascading a trash transition', async ({ payload }) => {
    const parent = await payload.create({ collection: articlesSlug, data: { title: 'Parent' } })
    const child = await payload.create({
      collection: articlesSlug,
      data: { ancestor: parent.id, title: 'Child' },
    })
    const grandchild = await payload.create({
      collection: articlesSlug,
      data: { ancestor: child.id, title: 'Grandchild' },
    })

    await payload.update({
      id: parent.id,
      collection: articlesSlug,
      context: { hierarchyDeleteStrategy: 'cascade' },
      data: { deletedAt: new Date().toISOString() },
    })

    for (const id of [parent.id, child.id, grandchild.id]) {
      await expect(payload.findByID({ id, collection: articlesSlug })).rejects.toThrow()
      expect(
        (await payload.findByID({ id, collection: articlesSlug, trash: true })).deletedAt,
      ).toBeTruthy()
    }
  })

  for (const overrideAccess of [false, true]) {
    test(`should enforce child delete access during cascade with caller overrideAccess ${overrideAccess}`, async ({
      payload,
    }) => {
      const parent = await payload.create({ collection: pagesSlug, data: { title: 'Parent' } })
      const child = await payload.create({
        collection: pagesSlug,
        data: { parent: parent.id, title: 'Protected child' },
      })

      await expect(
        payload.delete({
          id: parent.id,
          collection: pagesSlug,
          context: { denyDeleteID: child.id, hierarchyDeleteStrategy: 'cascade' },
          overrideAccess,
        }),
      ).rejects.toThrow()

      expect((await payload.findByID({ id: parent.id, collection: pagesSlug })).id).toBe(parent.id)
      expect(
        (await payload.findByID({ id: child.id, collection: pagesSlug, depth: 0 })).parent,
      ).toBe(parent.id)
    })
  }

  test(`should roll back earlier child cascade changes when a later hook rejects`, async ({
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
          hierarchyDeleteStrategy: 'cascade',
          deleteTrace: trace,
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

  test('should reject an invalid deletion strategy even when the document has no children', async ({
    payload,
  }) => {
    const parent = await payload.create({ collection: pagesSlug, data: { title: 'Parent' } })

    await expect(
      payload.delete({
        id: parent.id,
        collection: pagesSlug,
        context: { hierarchyDeleteStrategy: 'delete-everything' as never },
      }),
    ).rejects.toThrow()

    expect((await payload.findByID({ id: parent.id, collection: pagesSlug })).id).toBe(parent.id)
  })

  test('should reject a null deletion strategy without deleting a leaf', async ({ payload }) => {
    const leaf = await payload.create({ collection: pagesSlug, data: { title: 'Leaf' } })

    await expect(
      payload.delete({
        id: leaf.id,
        collection: pagesSlug,
        context: { hierarchyDeleteStrategy: null as never },
      }),
    ).rejects.toThrow()

    expect((await payload.findByID({ id: leaf.id, collection: pagesSlug })).id).toBe(leaf.id)
  })

  test('should roll back cascade for a legacy published/draft union cycle', async ({ payload }) => {
    const first = await payload.create({
      collection: pagesSlug,
      data: { _status: 'published', title: 'First' },
    })
    const second = await payload.create({
      collection: pagesSlug,
      data: { _status: 'published', title: 'Second' },
    })

    await payload.update({
      id: first.id,
      collection: pagesSlug,
      data: { parent: second.id, title: 'First draft' },
      draft: true,
    })
    await payload.update({
      id: second.id,
      collection: pagesSlug,
      data: { parent: null, title: 'Second draft' },
      draft: true,
    })
    await payload.db.updateOne({
      id: second.id,
      collection: pagesSlug,
      data: { parent: first.id },
    })

    await expect(
      payload.delete({
        id: first.id,
        collection: pagesSlug,
        context: { hierarchyDeleteStrategy: 'cascade' },
      }),
    ).rejects.toThrow()

    const publishedFirst = await payload.findByID({
      id: first.id,
      collection: pagesSlug,
      depth: 0,
    })
    const publishedSecond = await payload.findByID({
      id: second.id,
      collection: pagesSlug,
      depth: 0,
    })
    const draftFirst = await payload.findByID({
      id: first.id,
      collection: pagesSlug,
      depth: 0,
      draft: true,
    })
    const draftSecond = await payload.findByID({
      id: second.id,
      collection: pagesSlug,
      depth: 0,
      draft: true,
    })

    expect(publishedFirst.parent ?? null).toBeNull()
    expect(publishedSecond.parent).toBe(first.id)
    expect(draftFirst).toMatchObject({ parent: second.id, title: 'First draft' })
    expect(draftSecond).toMatchObject({ parent: null, title: 'Second draft' })
  })

  test('should traverse an already trashed child during cascade without changing its trash timestamp', async ({
    payload,
  }) => {
    const parent = await payload.create({ collection: articlesSlug, data: { title: 'Parent' } })
    const child = await payload.create({
      collection: articlesSlug,
      data: { ancestor: parent.id, title: 'Legacy trashed child' },
    })
    const grandchild = await payload.create({
      collection: articlesSlug,
      data: { ancestor: child.id, title: 'Live grandchild' },
    })
    const deletedAt = '2025-01-01T00:00:00.000Z'

    await payload.db.updateOne({
      id: child.id,
      collection: articlesSlug,
      data: { deletedAt },
    })
    await payload.update({
      id: parent.id,
      collection: articlesSlug,
      context: { hierarchyDeleteStrategy: 'cascade' },
      data: { deletedAt: new Date().toISOString() },
    })

    const trashedChild = await payload.findByID({
      id: child.id,
      collection: articlesSlug,
      depth: 0,
      trash: true,
    })
    const trashedGrandchild = await payload.findByID({
      id: grandchild.id,
      collection: articlesSlug,
      depth: 0,
      trash: true,
    })

    expect(trashedChild.deletedAt).toBe(deletedAt)
    expect(trashedGrandchild.deletedAt).toBeTruthy()
    await expect(
      payload.findByID({ id: grandchild.id, collection: articlesSlug }),
    ).rejects.toThrow()
  })

  test('should roll back earlier cascades when a later bulk root has a denied descendant', async ({
    payload,
  }) => {
    const roots = [
      await payload.create({ collection: pagesSlug, data: { title: 'First root' } }),
      await payload.create({ collection: pagesSlug, data: { title: 'Second root' } }),
    ]
    const where = { id: { in: roots.map(({ id }) => id) } }
    const { docs: orderedRoots } = await payload.db.find({ collection: pagesSlug, where })
    const firstChild = await payload.create({
      collection: pagesSlug,
      data: { parent: orderedRoots[0].id, title: 'Allowed child' },
    })
    const deniedChild = await payload.create({
      collection: pagesSlug,
      data: { parent: orderedRoots[1].id, title: 'Denied child' },
    })
    const trace = { ids: [] as (number | string)[], targetIDs: [firstChild.id] }
    const originalBulkOperationsSingleTransaction = payload.db.bulkOperationsSingleTransaction

    try {
      payload.db.bulkOperationsSingleTransaction = false

      await expect(
        payload.delete({
          collection: pagesSlug,
          context: {
            deleteTrace: trace,
            denyDeleteID: deniedChild.id,
            hierarchyDeleteStrategy: 'cascade',
          },
          overrideAccess: true,
          where,
        }),
      ).rejects.toThrow()
    } finally {
      payload.db.bulkOperationsSingleTransaction = originalBulkOperationsSingleTransaction
    }

    expect(trace.ids).toEqual([firstChild.id])
    for (const { id } of roots) {
      expect((await payload.findByID({ id, collection: pagesSlug })).id).toBe(id)
    }
    for (const [child, parent] of [
      [firstChild, orderedRoots[0]],
      [deniedChild, orderedRoots[1]],
    ]) {
      expect(
        (await payload.findByID({ id: child.id, collection: pagesSlug, depth: 0 })).parent,
      ).toBe(parent.id)
    }
  })

  test('should cascade overlapping bulk selections without deleting their surviving ancestor', async ({
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
      data: { parent: child.id, title: 'Grandchild' },
    })
    const originalBulkOperationsSingleTransaction = payload.db.bulkOperationsSingleTransaction

    try {
      payload.db.bulkOperationsSingleTransaction = false

      const result = await payload.delete({
        collection: pagesSlug,
        context: { hierarchyDeleteStrategy: 'cascade' },
        overrideAccess: true,
        where: { id: { in: [parent.id, child.id] } },
      })

      expect(result.errors).toEqual([])
    } finally {
      payload.db.bulkOperationsSingleTransaction = originalBulkOperationsSingleTransaction
    }

    expect((await payload.findByID({ id: root.id, collection: pagesSlug })).id).toBe(root.id)
    for (const id of [parent.id, child.id, grandchild.id]) {
      await expect(payload.findByID({ id, collection: pagesSlug })).rejects.toThrow()
    }
  })
})
