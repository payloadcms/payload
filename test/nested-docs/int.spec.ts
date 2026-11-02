import { createPayloadRequest } from 'payload'
import { createClientCollectionConfig } from 'payload/shared'
import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { articlesSlug, foldersSlug, pagesSlug } from './shared.js'

test.suite('Nested documents', { config: './config.ts' }, () => {
  test('should validate the published graph when publishing an unchanged draft parent', async ({
    payload,
  }) => {
    const second = await payload.create({
      collection: pagesSlug,
      data: { _status: 'published', title: 'Second' },
    })
    const first = await payload.create({
      collection: pagesSlug,
      data: { _status: 'published', parent: second.id, title: 'First' },
    })

    await payload.update({
      id: first.id,
      collection: pagesSlug,
      data: { parent: null },
      draft: true,
    })
    await payload.update({
      id: second.id,
      collection: pagesSlug,
      data: { parent: first.id },
      draft: true,
    })

    await expect(
      payload.update({ id: second.id, collection: pagesSlug, data: { _status: 'published' } }),
    ).rejects.toThrow()
  })
  test('should reject a published cycle hidden by an unpublished parent change', async ({
    payload,
  }) => {
    const second = await payload.create({
      collection: pagesSlug,
      data: { _status: 'published', title: 'Second' },
    })
    const first = await payload.create({
      collection: pagesSlug,
      data: { _status: 'published', parent: second.id, title: 'First' },
    })

    await payload.update({
      id: first.id,
      collection: pagesSlug,
      data: { parent: null },
      draft: true,
    })

    await expect(
      payload.update({
        id: second.id,
        collection: pagesSlug,
        data: { _status: 'published', parent: first.id },
      }),
    ).rejects.toThrow()
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
  test('should serialize the nested preset without sending server functions to the client', async ({
    payload,
  }) => {
    const req = await createPayloadRequest({ payload })
    const client = createClientCollectionConfig({
      collection: payload.collections[pagesSlug].config,
      defaultIDType: payload.db.defaultIDType,
      i18n: req.i18n,
      importMap: payload.importMap,
    })

    expect(client.nestedDocs).toBe(true)
    expect(client.hierarchy).toMatchObject({
      admin: { injectSidebarTab: false },
      parentFieldName: 'parent',
    })
    expect(client.hierarchy).not.toHaveProperty('slugify')
  })

  test('should promote children when a custom-parent document moves to trash', async ({
    payload,
  }) => {
    const parent = await payload.create({ collection: articlesSlug, data: { title: 'Parent' } })
    const child = await payload.create({
      collection: articlesSlug,
      data: { ancestor: parent.id, title: 'Child' },
    })

    await payload.update({
      id: parent.id,
      collection: articlesSlug,
      data: { deletedAt: new Date().toISOString() },
    })

    expect(
      (await payload.findByID({ id: child.id, collection: articlesSlug, depth: 0 })).ancestor,
    ).toBeNull()
    await payload.delete({ id: parent.id, collection: articlesSlug, trash: true })
    expect(
      (await payload.findByID({ id: child.id, collection: articlesSlug, depth: 0 })).ancestor,
    ).toBeNull()
  })
  test('should preserve folder membership when nesting a page', async ({ payload }) => {
    const folder = await payload.create({ collection: foldersSlug, data: { title: 'Editorial' } })
    const parent = await payload.create({ collection: pagesSlug, data: { title: 'About' } })
    const child = await payload.create({
      collection: pagesSlug,
      data: { '_h_page-folders': folder.id, parent: parent.id, title: 'Team' },
      depth: 0,
    })

    expect(child.parent).toBe(parent.id)
    expect(child['_h_page-folders']).toBe(folder.id)
  })

  test('should promote direct children when deleting a nested parent', async ({ payload }) => {
    const root = await payload.create({ collection: pagesSlug, data: { title: 'About' } })
    const parent = await payload.create({
      collection: pagesSlug,
      data: { parent: root.id, title: 'Team' },
    })
    const child = await payload.create({
      collection: pagesSlug,
      data: { parent: parent.id, title: 'Careers' },
    })
    const grandchild = await payload.create({
      collection: pagesSlug,
      data: { parent: child.id, title: 'Roles' },
    })

    await payload.delete({ id: parent.id, collection: pagesSlug })

    expect((await payload.findByID({ id: child.id, collection: pagesSlug, depth: 0 })).parent).toBe(
      root.id,
    )
    expect(
      (await payload.findByID({ id: grandchild.id, collection: pagesSlug, depth: 0 })).parent,
    ).toBe(child.id)
  })

  test('should promote children to root when deleting a root page', async ({ payload }) => {
    const parent = await payload.create({ collection: pagesSlug, data: { title: 'About' } })
    const child = await payload.create({
      collection: pagesSlug,
      data: { parent: parent.id, title: 'Team' },
    })

    await payload.delete({ id: parent.id, collection: pagesSlug })

    expect(
      (await payload.findByID({ id: child.id, collection: pagesSlug, depth: 0 })).parent,
    ).toBeNull()
  })

  test('should reject parenting a page beneath its descendant', async ({ payload }) => {
    const parent = await payload.create({ collection: pagesSlug, data: { title: 'About' } })
    const child = await payload.create({
      collection: pagesSlug,
      data: { parent: parent.id, title: 'Team' },
    })

    await expect(
      payload.update({ id: parent.id, collection: pagesSlug, data: { parent: child.id } }),
    ).rejects.toThrow()
  })

  test('should reject self parenting', async ({ payload }) => {
    const page = await payload.create({ collection: pagesSlug, data: { title: 'About' } })

    await expect(
      payload.update({ id: page.id, collection: pagesSlug, data: { parent: page.id } }),
    ).rejects.toThrow()
  })

  test('should reject a cycle formed entirely by draft parent changes', async ({ payload }) => {
    const first = await payload.create({
      collection: pagesSlug,
      data: { _status: 'published', title: 'First root' },
    })
    const second = await payload.create({
      collection: pagesSlug,
      data: { _status: 'published', title: 'Second root' },
    })

    await payload.update({
      id: first.id,
      collection: pagesSlug,
      data: { parent: second.id },
      draft: true,
    })

    await expect(
      payload.update({
        id: second.id,
        collection: pagesSlug,
        data: { parent: first.id },
        draft: true,
      }),
    ).rejects.toThrow()
  })

  test('should reparent children internally despite denied collection updates', async ({
    payload,
  }) => {
    const parent = await payload.create({ collection: pagesSlug, data: { title: 'About' } })
    const child = await payload.create({
      collection: pagesSlug,
      data: { parent: parent.id, title: 'Team' },
    })

    await payload.delete({
      id: parent.id,
      collection: pagesSlug,
      context: { denyPageUpdates: true },
      overrideAccess: false,
    })

    expect(
      (await payload.findByID({ id: child.id, collection: pagesSlug, depth: 0 })).parent,
    ).toBeNull()
  })

  test('should preserve unsaved draft content when promoting a published child', async ({
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
    const child = await payload.create({
      collection: pagesSlug,
      data: { _status: 'published', parent: parent.id, title: 'Published title' },
    })

    await payload.update({
      id: child.id,
      collection: pagesSlug,
      data: { title: 'Draft title' },
      draft: true,
    })
    await payload.delete({ id: parent.id, collection: pagesSlug })

    const published = await payload.findByID({ id: child.id, collection: pagesSlug, depth: 0 })
    const draft = await payload.findByID({
      id: child.id,
      collection: pagesSlug,
      depth: 0,
      draft: true,
    })

    expect(published.title).toBe('Published title')
    expect(draft.title).toBe('Draft title')
    expect(published.parent).toBe(root.id)
    expect(draft.parent).toBe(root.id)
  })

  test('should roll back earlier promotions when a later child hook fails', async ({ payload }) => {
    const parent = await payload.create({ collection: pagesSlug, data: { title: 'Parent' } })
    const first = await payload.create({
      collection: pagesSlug,
      data: { parent: parent.id, title: 'First' },
    })
    const second = await payload.create({
      collection: pagesSlug,
      data: { parent: parent.id, title: 'Second' },
    })

    await expect(
      payload.delete({
        id: parent.id,
        collection: pagesSlug,
        context: { failReparentID: second.id },
        overrideAccess: false,
      }),
    ).rejects.toThrow()

    expect((await payload.findByID({ id: first.id, collection: pagesSlug, depth: 0 })).parent).toBe(
      parent.id,
    )
    expect(
      (await payload.findByID({ id: second.id, collection: pagesSlug, depth: 0 })).parent,
    ).toBe(parent.id)
    expect((await payload.findByID({ id: parent.id, collection: pagesSlug })).id).toBe(parent.id)
  })

  test('should reparent children internally despite denied parent field updates', async ({
    payload,
  }) => {
    const parent = await payload.create({ collection: pagesSlug, data: { title: 'Parent' } })
    const child = await payload.create({
      collection: pagesSlug,
      data: { parent: parent.id, title: 'Child' },
    })

    await payload.delete({
      id: parent.id,
      collection: pagesSlug,
      context: { denyParentUpdates: true },
      overrideAccess: false,
    })

    expect(
      (await payload.findByID({ id: child.id, collection: pagesSlug, depth: 0 })).parent,
    ).toBeNull()
  })

  test('should respect delete access on the parent before reparenting children', async ({
    payload,
  }) => {
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

    expect((await payload.findByID({ id: child.id, collection: pagesSlug, depth: 0 })).parent).toBe(
      parent.id,
    )
    expect((await payload.findByID({ id: parent.id, collection: pagesSlug })).id).toBe(parent.id)
  })

  test('should retain published status when promoting a child with no pending draft', async ({
    payload,
  }) => {
    const parent = await payload.create({
      collection: pagesSlug,
      data: { _status: 'published', title: 'Published parent' },
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
})
