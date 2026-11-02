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

  test('should use a custom parent relationship independently of the default name', async ({
    payload,
  }) => {
    const parent = await payload.create({ collection: articlesSlug, data: { title: 'Parent' } })
    const child = await payload.create({
      collection: articlesSlug,
      data: { ancestor: parent.id, title: 'Child' },
      depth: 0,
    })

    expect(child.ancestor).toBe(parent.id)
    expect(child).not.toHaveProperty('_h_parent')
  })
})
