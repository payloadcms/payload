/* eslint-disable payload/no-relative-monorepo-imports -- Exercise internal scope transforms against real storage without adding public exports for tests. */
import { expect } from 'vitest'

import { compileBranchScopeFields } from '../../packages/payload/src/versions/branches/compileBranchScopeFields.js'
import { composeBranchScopeData } from '../../packages/payload/src/versions/branches/composeBranchScopeData.js'
import { projectBranchScopeData } from '../../packages/payload/src/versions/branches/projectBranchScopeData.js'
import { test } from '../__helpers/int/vitest.js'
import { articlesSlug } from './slugs.js'

test.suite('Branch content scope storage transforms', { config: './config.ts' }, () => {
  test('should compose locale heads from stored version data without publishing shared draft fields', async ({
    payload,
  }) => {
    const article = await payload.create({
      collection: articlesSlug,
      data: {
        _status: 'published',
        sections: [{ label: 'live row', translation: 'English live row' }],
        shared: 'shared live',
        title: 'English live',
      },
      locale: 'en',
    })
    const rowID = article.sections![0]!.id

    await payload.update({
      id: article.id,
      collection: articlesSlug,
      data: {
        _status: 'published',
        sections: [{ id: rowID, label: 'live row', translation: 'French live row' }],
        title: 'French live',
      },
      locale: 'fr',
    })

    const live = await payload.db.findOne({
      collection: articlesSlug,
      locale: 'all',
      where: { id: { equals: article.id } },
    })

    await payload.update({
      id: article.id,
      collection: articlesSlug,
      data: {
        sections: [{ id: rowID, label: 'unreviewed shared row', translation: 'English ready row' }],
        shared: 'unreviewed shared field',
        title: 'English ready',
      },
      draft: true,
      locale: 'en',
    })

    const { docs } = await payload.db.findVersions({
      collection: articlesSlug,
      limit: 1,
      locale: 'all',
      sort: '-updatedAt',
      where: { and: [{ parent: { equals: article.id } }, { latest: { equals: true } }] },
    })
    const fields = compileBranchScopeFields({
      fields: payload.collections[articlesSlug].config.fields,
    })
    const result = composeBranchScopeData({
      fields,
      locales: [
        {
          data: projectBranchScopeData({
            data: docs[0]!.version,
            fields,
            scope: { locale: 'en', type: 'locale' },
          }),
          locale: 'en',
        },
        {
          data: projectBranchScopeData({
            data: live!,
            fields,
            scope: { locale: 'fr', type: 'locale' },
          }),
          locale: 'fr',
        },
      ],
      shared: projectBranchScopeData({ data: live!, fields, scope: { type: 'shared' } }),
    })

    expect(result.shared).toBe('shared live')
    expect(result.title).toStrictEqual({ en: 'English ready', fr: 'French live' })
    expect(result.sections).toStrictEqual([
      {
        id: rowID,
        label: 'live row',
        translation: { en: 'English ready row', fr: 'French live row' },
      },
    ])
  })
})
