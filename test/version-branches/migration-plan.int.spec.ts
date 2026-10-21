/* eslint-disable payload/no-relative-monorepo-imports -- Validate offline migration planning and head persistence before adding a runtime cutover path. */
import { createPayloadRequest } from 'payload'
import { expect } from 'vitest'

import { compileBranchScopeFields } from '../../packages/payload/src/versions/branches/compileBranchScopeFields.js'
import { composeBranchScopeData } from '../../packages/payload/src/versions/branches/composeBranchScopeData.js'
import { planLegacyBranchHeads } from '../../packages/payload/src/versions/branches/migrations/planLegacyBranchHeads.js'
import { projectBranchScopeData } from '../../packages/payload/src/versions/branches/projectBranchScopeData.js'
import {
  readBranchHead,
  writeBranchHead,
} from '../../packages/payload/src/versions/branches/storage/branchHeadStore.js'
import { test } from '../__helpers/int/vitest.js'
import { articleHeadsSlug, articlesSlug } from './slugs.js'

test.suite('Existing drafts migration head planning', { config: './config.ts' }, () => {
  test('should keep reordered working rows attached to inheriting main translations', async ({
    payload,
  }) => {
    const article = await payload.create({
      collection: articlesSlug,
      data: {
        _status: 'published',
        sections: [
          { label: 'First', translation: 'First English' },
          { label: 'Second', translation: 'Second English' },
        ],
        title: 'English live',
      },
      locale: 'en',
    })
    const sections = article.sections!

    await payload.update({
      id: article.id,
      collection: articlesSlug,
      data: {
        _status: 'published',
        sections: sections.map(({ id, label }) => ({ id, label, translation: `${label} French` })),
        title: 'French live',
      },
      locale: 'fr',
    })

    const materialized = await payload.db.findOne({
      collection: articlesSlug,
      locale: 'all',
      where: { id: { equals: article.id } },
    })

    await payload.update({
      id: article.id,
      collection: articlesSlug,
      data: { sections: [...sections].reverse() },
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
    const plan = planLegacyBranchHeads({
      fields,
      locales: ['en', 'fr'],
      materialized: {
        data: materialized!,
        version: { generation: 1, id: 'materialized-baseline' },
      },
      statusMode: 'localized',
      working: { data: docs[0]!.version, version: { generation: 1, id: docs[0]!.id } },
    })

    expect(
      plan.heads.filter(({ branchID }) => branchID === 'drafts').map(({ scope }) => scope),
    ).toStrictEqual([{ type: 'shared' }])

    await payload.update({
      id: article.id,
      collection: articlesSlug,
      data: {
        _status: 'published',
        sections: sections.map(({ id, label }) => ({
          id,
          label,
          translation: `${label} new French`,
        })),
        title: 'French live',
      },
      locale: 'fr',
    })

    const updatedMain = await payload.db.findOne({
      collection: articlesSlug,
      locale: 'all',
      where: { id: { equals: article.id } },
    })
    const composed = composeBranchScopeData({
      fields,
      locales: ['en', 'fr'].map((locale) => ({
        data: projectBranchScopeData({
          data: updatedMain!,
          fields,
          scope: { locale, type: 'locale' },
        }),
        locale,
      })),
      shared: projectBranchScopeData({ data: docs[0]!.version, fields, scope: { type: 'shared' } }),
    })

    expect(composed.sections).toStrictEqual(
      [...sections].reverse().map(({ id, label, translation }) => ({
        id,
        label,
        translation: { en: translation, fr: `${label} new French` },
      })),
    )
  })

  test('should seed distinct live and working references without changing document content or history', async ({
    payload,
  }) => {
    const article = await payload.create({
      collection: articlesSlug,
      data: { _status: 'published', shared: 'live shared', title: 'English live' },
      locale: 'en',
    })

    await payload.update({
      id: article.id,
      collection: articlesSlug,
      data: { _status: 'published', title: 'French live' },
      locale: 'fr',
    })

    const materialized = await payload.db.findOne({
      collection: articlesSlug,
      locale: 'all',
      where: { id: { equals: article.id } },
    })
    const liveVersions = await payload.db.findVersions({
      collection: articlesSlug,
      limit: 1,
      locale: 'all',
      sort: '-updatedAt',
      where: { and: [{ parent: { equals: article.id } }, { latest: { equals: true } }] },
    })

    await payload.update({
      id: article.id,
      collection: articlesSlug,
      data: { title: 'English working' },
      draft: true,
      locale: 'en',
    })

    const workingVersions = await payload.db.findVersions({
      collection: articlesSlug,
      limit: 1,
      locale: 'all',
      sort: '-updatedAt',
      where: { and: [{ parent: { equals: article.id } }, { latest: { equals: true } }] },
    })
    const beforeHistory = await payload.db.findVersions({
      collection: articlesSlug,
      locale: 'all',
      sort: 'id',
      where: { parent: { equals: article.id } },
    })
    const fields = compileBranchScopeFields({
      fields: payload.collections[articlesSlug].config.fields,
    })
    const plan = planLegacyBranchHeads({
      fields,
      locales: ['en', 'fr'],
      materialized: {
        data: materialized!,
        version: { generation: 1, id: liveVersions.docs[0]!.id },
      },
      statusMode: 'localized',
      working: {
        data: workingVersions.docs[0]!.version,
        version: { generation: 1, id: workingVersions.docs[0]!.id },
      },
    })
    const req = await createPayloadRequest({ payload })
    const target = { collection: articleHeadsSlug, parentID: article.id }

    for (const head of plan.heads) {
      await writeBranchHead({
        base: head.base,
        expected: { branchID: head.branchID, generation: null, scope: head.scope, state: null },
        nextState: head.state,
        req,
        target,
      })
    }

    const mainEnglish = await readBranchHead({
      branchID: 'main',
      req,
      scope: { locale: 'en', type: 'locale' },
      target,
    })
    const draftEnglish = await readBranchHead({
      branchID: 'drafts',
      req,
      scope: { locale: 'en', type: 'locale' },
      target,
    })
    const draftFrench = await readBranchHead({
      branchID: 'drafts',
      req,
      scope: { locale: 'fr', type: 'locale' },
      target,
    })
    const after = await payload.db.findOne({
      collection: articlesSlug,
      locale: 'all',
      where: { id: { equals: article.id } },
    })
    const afterHistory = await payload.db.findVersions({
      collection: articlesSlug,
      locale: 'all',
      sort: 'id',
      where: { parent: { equals: article.id } },
    })

    expect(mainEnglish?.state).toMatchObject({
      type: 'version',
      version: { id: liveVersions.docs[0]!.id },
    })
    expect(draftEnglish?.state).toMatchObject({
      type: 'version',
      version: { id: workingVersions.docs[0]!.id },
    })
    expect(draftFrench).toBeNull()
    expect(after).toStrictEqual(materialized)
    expect(afterHistory).toStrictEqual(beforeHistory)
    expect(plan.legacyWorkingVersion?.id).toBe(workingVersions.docs[0]!.id)
  })
})
