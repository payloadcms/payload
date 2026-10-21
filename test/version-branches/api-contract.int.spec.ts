import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { articlesSlug, protectedArticlesSlug } from './slugs.js'

test.suite('Legacy drafts API and access contracts', { config: './config.ts' }, () => {
  test('should return working content through REST only when draft mode is requested', async ({
    payload,
    restClient,
  }) => {
    const article = await payload.create({
      collection: articlesSlug,
      data: { _status: 'published', title: 'Live' },
      locale: 'en',
    })

    await payload.update({
      collection: articlesSlug,
      id: article.id,
      data: { title: 'Working' },
      draft: true,
      locale: 'en',
    })

    const liveResponse = await restClient.GET(`/${articlesSlug}/${article.id}`, {
      auth: false,
      query: { locale: 'en' },
    })
    const workingResponse = await restClient.GET(`/${articlesSlug}/${article.id}`, {
      auth: false,
      query: { draft: true, locale: 'en' },
    })

    expect(liveResponse.status).toBe(200)
    expect(workingResponse.status).toBe(200)
    expect(await liveResponse.json()).toMatchObject({ title: 'Live', _status: 'published' })
    expect(await workingResponse.json()).toMatchObject({ title: 'Working' })
  })

  test('should retain ordinary read policy visibility of a new draft identity anchor', async ({
    payload,
    restClient,
  }) => {
    const article = await payload.create({
      collection: articlesSlug,
      data: { title: 'Public policy permits drafts' },
      draft: true,
      locale: 'en',
    })
    const response = await restClient.GET(`/${articlesSlug}/${article.id}`, {
      auth: false,
      query: { locale: 'en' },
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({
      _status: 'draft',
      title: 'Public policy permits drafts',
    })
  })

  test('should enforce read predicates and version access in anonymous Local and REST operations', async ({
    payload,
    restClient,
  }) => {
    const article = await payload.create({
      collection: protectedArticlesSlug,
      overrideAccess: true,
      data: { title: 'Private draft' },
      draft: true,
      locale: 'en',
    })
    const local = await payload.find({
      collection: protectedArticlesSlug,
      draft: true,
      locale: 'en',
      overrideAccess: false,
      user: null,
    })
    const response = await restClient.GET(`/${protectedArticlesSlug}`, {
      auth: false,
      query: { draft: true, locale: 'en' },
    })
    const versions = await restClient.GET(`/${protectedArticlesSlug}/versions`, { auth: false })

    expect(local.docs).toHaveLength(0)
    expect(await response.json()).toMatchObject({ docs: [], totalDocs: 0 })
    expect(versions.status).toBe(403)
    await expect(
      payload.findVersions({
        collection: protectedArticlesSlug,
        overrideAccess: false,
        user: null,
      }),
    ).rejects.toMatchObject({ status: 403 })
    await expect(
      payload.update({
        collection: protectedArticlesSlug,
        id: article.id,
        data: { title: 'Forbidden' },
        draft: true,
        overrideAccess: false,
        user: null,
      }),
    ).rejects.toMatchObject({ status: 403 })

    const update = await restClient.PATCH(`/${protectedArticlesSlug}/${article.id}`, {
      auth: false,
      body: JSON.stringify({ title: 'Forbidden' }),
      query: { draft: true, locale: 'en' },
    })

    expect(update.status).toBe(403)
  })

  test('should apply draft filtering before counts and pagination', async ({
    payload,
    restClient,
  }) => {
    for (const title of ['A', 'B', 'C']) {
      const article = await payload.create({
        collection: articlesSlug,
        data: { _status: 'published', title: `live-${title}` },
        locale: 'en',
      })

      await payload.update({
        collection: articlesSlug,
        id: article.id,
        data: { title: `working-${title}` },
        draft: true,
        locale: 'en',
      })
    }

    const response = await restClient.GET(`/${articlesSlug}`, {
      auth: false,
      query: {
        draft: true,
        locale: 'en',
        where: { title: { contains: 'working-' } },
        sort: 'title',
        limit: 1,
        page: 2,
      },
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({
      docs: [{ title: 'working-B' }],
      totalDocs: 3,
      totalPages: 3,
      page: 2,
    })
  })
  test('should expose the same working read through GraphQL and the SDK', async ({
    payload,
    restClient,
    sdk,
  }) => {
    const article = await payload.create({
      collection: articlesSlug,
      data: { _status: 'published', title: 'Live API parity' },
      locale: 'en',
    })

    await payload.update({
      collection: articlesSlug,
      id: article.id,
      data: { title: 'Working API parity' },
      draft: true,
      locale: 'en',
    })

    const response = await restClient.GRAPHQL_POST({
      auth: false,
      body: JSON.stringify({
        query: '{ BranchHeadArticles(draft: true, locale: en) { docs { title } totalDocs } }',
      }),
    })
    const result = await sdk.find({ collection: articlesSlug, draft: true, locale: 'en' })

    expect(await response.json()).toMatchObject({
      data: { BranchHeadArticles: { docs: [{ title: 'Working API parity' }], totalDocs: 1 } },
    })
    expect(result.docs).toMatchObject([{ id: article.id, title: 'Working API parity' }])
  })
})
