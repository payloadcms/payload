/* eslint-disable payload/no-relative-monorepo-imports -- Exercise internal admin handlers against the real Payload fixture. */
import type { Payload } from 'payload'

import { createPayloadRequest, getAccessResults } from 'payload'
import { renderToStaticMarkup } from 'react-dom/server'
import { expect } from 'vitest'

import { buildTableStateHandler } from '../../packages/ui/src/utilities/buildTableState.js'
import { copyDataFromLocale } from '../../packages/ui/src/utilities/copyDataFromLocale.js'
import { getDocumentPermissions } from '../../packages/ui/src/utilities/getDocumentPermissions.js'
import { getVersions } from '../../packages/ui/src/utilities/getVersions.js'
import { CollectionQueryWidget } from '../../packages/ui/src/widgets/CollectionQuery/index.js'
import { test } from '../__helpers/int/vitest.js'
import { devUser } from '../credentials.js'
import {
  categoriesSlug,
  homepageGlobalSlug,
  localizedSlug,
  pagesSlug,
  postsSlug,
} from './shared.js'

const branch = 'halloween-updates'

test.suite('Branching: UI request context', { config: './config.ts' }, () => {
  test('should copy a branch-only document between locales', async ({ payload }) => {
    const doc = await payload.create({
      branch,
      collection: localizedSlug,
      data: { title: 'Branch English title' },
      draft: true,
      locale: 'en',
      overrideAccess: true,
    })
    const req = await getRequest({ payload })

    await copyDataFromLocale({
      collectionSlug: localizedSlug,
      docID: doc.id,
      fromLocale: 'en',
      overrideData: true,
      req,
      toLocale: 'es',
    })

    const copied = await payload.findByID({
      id: doc.id,
      branch,
      collection: localizedSlug,
      draft: true,
      locale: 'es',
      overrideAccess: true,
    })

    expect(copied.title).toBe('Branch English title')
  })

  test('should copy global locale data from the selected branch', async ({ payload }) => {
    await payload.updateGlobal({
      slug: homepageGlobalSlug,
      data: { localizedTitle: 'Main English' },
      locale: 'en',
      overrideAccess: true,
    })
    await payload.updateGlobal({
      slug: homepageGlobalSlug,
      branch,
      data: { localizedTitle: 'Branch English' },
      draft: true,
      locale: 'en',
      overrideAccess: true,
    })
    const req = await getRequest({ payload })

    await copyDataFromLocale({
      fromLocale: 'en',
      globalSlug: homepageGlobalSlug,
      overrideData: true,
      req,
      toLocale: 'es',
    })

    const copied = await payload.findGlobal({
      slug: homepageGlobalSlug,
      branch,
      draft: true,
      locale: 'es',
      overrideAccess: true,
    })

    expect(copied.localizedTitle).toBe('Branch English')
  })

  test('should reload relationship tables from the selected branch', async ({ payload }) => {
    await payload.create({
      branch,
      collection: postsSlug,
      data: { title: 'Branch-only row' },
      overrideAccess: true,
    })
    const req = await getRequest({ payload })
    const result = await buildTableStateHandler({
      cookies: new Map(),
      importMap: payload.importMap,
      user: req.user,
      collectionSlug: postsSlug,
      enableRowSelections: false,
      permissions: await getAccessResults({ req }),
      query: { limit: 10 },
      req,
    })

    expect(result.data.docs).toEqual([expect.objectContaining({ title: 'Branch-only row' })])
  })

  test('should reload polymorphic joins whose parent exists only on a branch', async ({
    payload,
  }) => {
    const parent = await payload.create({
      branch,
      collection: categoriesSlug,
      data: { name: 'Branch parent' },
      overrideAccess: true,
    })
    await payload.create({
      branch,
      collection: postsSlug,
      data: { category: parent.id, title: 'Branch child' },
      overrideAccess: true,
    })
    const req = await getRequest({ payload })
    const result = await buildTableStateHandler({
      cookies: new Map(),
      importMap: payload.importMap,
      user: req.user,
      collectionSlug: [postsSlug, pagesSlug],
      enableRowSelections: false,
      parent: { collectionSlug: categoriesSlug, id: parent.id, joinPath: 'content' },
      permissions: await getAccessResults({ req }),
      query: { limit: 10 },
      req,
    })

    expect(result.data.docs).toEqual([
      expect.objectContaining({
        relationTo: postsSlug,
        value: expect.objectContaining({ title: 'Branch child' }),
      }),
    ])
  })

  test('should query dashboard widgets in the selected branch', async ({ payload }) => {
    await payload.create({
      branch,
      collection: postsSlug,
      data: { title: 'Branch widget result' },
      overrideAccess: true,
    })
    const req = await getRequest({ payload })
    const widget = await CollectionQueryWidget({
      cookies: new Map(),
      locale: { code: 'en', label: 'English' },
      permissions: await getAccessResults({ req }),
      req,
      user: req.user,
      widgetData: { relatedCollection: postsSlug },
      widgetSlug: 'collection-query',
    })

    expect(renderToStaticMarkup(widget)).toContain('Branch widget result')
  })

  test('should count global versions from the selected branch', async ({ payload }) => {
    await payload.updateGlobal({
      slug: homepageGlobalSlug,
      data: { heroTitle: 'Main published', _status: 'published' },
      overrideAccess: true,
    })
    await payload.updateGlobal({
      slug: homepageGlobalSlug,
      branch,
      data: { heroTitle: 'First branch draft' },
      draft: true,
      overrideAccess: true,
    })
    const doc = await payload.updateGlobal({
      slug: homepageGlobalSlug,
      branch,
      data: { heroTitle: 'Second branch draft' },
      draft: true,
      overrideAccess: true,
    })
    const req = await getRequest({ payload })
    const globalConfig = payload.globals.config.find(({ slug }) => slug === homepageGlobalSlug)!
    const { docPermissions } = await getDocumentPermissions({ data: {}, globalConfig, req })
    const expected = await payload.findGlobalVersions({
      branch,
      slug: homepageGlobalSlug,
      limit: 1,
      overrideAccess: true,
    })
    const main = await payload.findGlobalVersions({
      branch: 'main',
      slug: homepageGlobalSlug,
      limit: 1,
      overrideAccess: true,
    })

    expect(expected.totalDocs).not.toBe(main.totalDocs)

    const result = await getVersions({
      branch,
      doc,
      docPermissions,
      globalConfig,
      locale: 'en',
      payload,
      user: req.user!,
    })

    expect(result.versionCount).toBe(expected.totalDocs)
  })
})

async function getRequest({ payload }: { payload: Payload }) {
  const { docs } = await payload.find({
    collection: 'users',
    overrideAccess: true,
    where: { email: { equals: devUser.email } },
  })

  return createPayloadRequest({ branch, payload, user: { ...docs[0]!, collection: 'users' } })
}
