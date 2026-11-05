import { createPayloadRequest } from 'payload'
import { mergeListSearchAndWhere } from 'payload/shared'
import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { selectFieldsSlug } from './slugs.js'

test.suite('Select label list search', { config: './config.ts' }, () => {
  test('should find documents by a select label and retain existing filters', async ({
    payload,
  }) => {
    const selected = await payload.create({
      collection: selectFieldsSlug,
      overrideAccess: true,
      data: { select: 'two' },
    })
    const req = await createPayloadRequest({ payload })
    const collectionConfig = payload.collections[selectFieldsSlug].config
    const result = await payload.find({
      collection: selectFieldsSlug,
      overrideAccess: true,
      where: mergeListSearchAndWhere({
        collectionConfig,
        i18n: req.i18n,
        search: 'Value Two',
        where: { id: { equals: selected.id } },
      }),
    })

    expect(result.docs.map(({ id }) => id)).toEqual([selected.id])
  })

  test('should find documents by a label in a hasMany select field', async ({ payload }) => {
    const selected = await payload.create({
      collection: selectFieldsSlug,
      overrideAccess: true,
      data: { selectHasMany: ['one', 'two'] },
    })
    const req = await createPayloadRequest({ payload })
    const collectionConfig = {
      ...payload.collections[selectFieldsSlug].config,
      admin: {
        ...payload.collections[selectFieldsSlug].config.admin,
        listSearchableFields: ['selectHasMany'],
      },
    }
    const result = await payload.find({
      collection: selectFieldsSlug,
      overrideAccess: true,
      where: mergeListSearchAndWhere({
        collectionConfig,
        i18n: req.i18n,
        search: 'Value Two',
        where: { id: { equals: selected.id } },
      }),
    })

    expect(result.docs.map(({ id }) => id)).toEqual([selected.id])
  })
})
