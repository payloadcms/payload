import { createPayloadRequest, getNestedDocsData } from 'payload'
import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { pagesSlug } from './shared.js'

test.suite('Nested document branch metadata', { config: './config.ts' }, () => {
  test('should respect read access and list filters when detecting children', async ({
    payload,
  }) => {
    const parent = await payload.create({ collection: pagesSlug, data: { title: 'Parent' } })
    const hidden = await payload.create({
      collection: pagesSlug,
      data: { title: 'Secret', parent: parent.id },
    })
    await payload.create({
      collection: pagesSlug,
      data: { title: 'Other tenant', parent: parent.id },
    })
    const req = await createPayloadRequest({ payload, context: { denyReadID: hidden.id } })
    const data = await payload.find({
      collection: pagesSlug,
      req,
      overrideAccess: false,
      where: { id: { equals: parent.id } },
    })
    const result = await getNestedDocsData({
      data,
      findArgs: {
        collection: pagesSlug,
        draft: true,
        depth: 0,
        where: { title: { not_equals: 'Other tenant' } },
      },
      parentFieldName: 'parent',
      req,
    })
    expect(result.data.docs.map(({ id }) => id)).toEqual([parent.id])
    expect(result.rows[String(parent.id)].hasChildren).toBe(false)
    expect(result.rows).not.toHaveProperty(String(hidden.id))
    await payload.create({ collection: pagesSlug, data: { title: 'Visible', parent: parent.id } })
    const visible = await getNestedDocsData({
      data,
      findArgs: {
        collection: pagesSlug,
        draft: true,
        depth: 0,
        where: { title: { not_equals: 'Other tenant' } },
      },
      parentFieldName: 'parent',
      req,
    })
    expect(visible.rows[String(parent.id)].hasChildren).toBe(true)
  })
})
