import type { Payload, PayloadRequest } from 'payload'

import { branchChangesCollectionSlug, resolveBranch } from 'payload'
import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { articlesSlug, authorsSlug, organizationsSlug } from './shared.js'

test.suite('Branch related distinct values', { config: './config.ts', db: 'drizzle' }, () => {
  for (const scenario of [
    { field: 'author.name', locale: 'en', expected: 'Branch author' },
    { field: 'author.org.name', locale: 'en', expected: 'Branch org' },
    { field: 'localizedAuthor.name', locale: 'en', expected: 'Branch author' },
    { field: 'localizedAuthor.org.name', locale: 'es', expected: 'Branch org es' },
  ]) {
    test(`should select only visible ${scenario.field} values in ${scenario.locale}`, async ({
      payload,
    }) => {
      await seedRelatedRows({ payload })

      const result = await payload.db.findDistinct({
        collection: articlesSlug,
        branch: 'work',
        field: scenario.field,
        locale: scenario.locale,
        limit: 1,
        req: { payload, branch: 'work', context: {} },
      })

      expect(result.values).toEqual([{ [scenario.field]: scenario.expected }])
      expect(result.totalDocs).toBe(1)
      expect(result.hasNextPage).toBe(false)
    })
  }

  for (const code of ['other', 'other-branch']) {
    test(`should correlate suffix-colliding targets when filtering coauthor by ${code}`, async ({
      payload,
    }) => {
      await seedRelatedRows({ payload })

      const result = await payload.db.findDistinct({
        collection: articlesSlug,
        branch: 'work',
        field: 'author.code',
        sort: 'coauthor.code',
        locale: 'en',
        relatedAccess: { author: { code: { equals: 'branch' } } },
        where: { 'coauthor.code': { equals: code } },
        req: { payload, branch: 'work', context: {} },
      })

      expect(result.values).toEqual(code === 'other' ? [] : [{ 'author.code': 'branch' }])
    })
  }

  test('should honor an explicit branch override for every relationship hop', async ({
    payload,
  }) => {
    await seedRelatedRows({ payload })

    const req = { payload, branch: 'main', context: {} }

    resolveBranch({ req: req as PayloadRequest })

    const result = await payload.db.findDistinct({
      collection: articlesSlug,
      branch: 'work',
      field: 'author.org.name',
      locale: 'en',
      req,
    })

    expect(result.values).toEqual([{ 'author.org.name': 'Branch org' }])
    expect(resolveBranch({ req: req as PayloadRequest })).toBe('main')
  })
  for (const branch of ['main', false] as const) {
    test(`should honor the ${branch === false ? 'bypass' : 'main'} override on related joins`, async ({
      payload,
    }) => {
      await seedRelatedRows({ payload })

      const result = await payload.db.findDistinct({
        collection: articlesSlug,
        branch,
        field: 'author.code',
        locale: 'en',
        req: { payload, branch: 'work', context: {} },
      })

      expect(result.values.map((value) => value['author.code']).sort()).toEqual(
        branch === false ? ['branch', 'main'] : ['main'],
      )
    })
  }
})

const seedRelatedRows = async ({ payload }: { payload: Payload }) => {
  for (const [collection, data] of [
    [
      organizationsSlug,
      { id: 'org', _branch: 'main', name: { en: 'Main org', es: 'Main org es' } },
    ],
    [
      organizationsSlug,
      {
        id: 'org-shadow',
        _branch: 'work',
        _branchDocID: 'org',
        name: { en: 'Branch org', es: 'Branch org es' },
      },
    ],
    [
      organizationsSlug,
      { id: 'other-org', _branch: 'main', name: { en: 'Other org', es: 'Other org es' } },
    ],
    [
      authorsSlug,
      {
        id: 'author',
        code: 'main',
        _branch: 'main',
        name: { en: 'Main author', es: 'Main author es' },
        org: 'org',
      },
    ],
    [
      authorsSlug,
      {
        id: 'author-shadow',
        code: 'branch',
        _branch: 'work',
        _branchDocID: 'author',
        name: { en: 'Branch author', es: 'Branch author es' },
        org: 'org',
      },
    ],
    [
      authorsSlug,
      {
        id: 'other-author',
        code: 'other',
        _branch: 'main',
        name: { en: 'Other author', es: 'Other author es' },
        org: 'other-org',
      },
    ],
    [
      authorsSlug,
      {
        id: 'other-author-shadow',
        code: 'other-branch',
        _branch: 'work',
        _branchDocID: 'other-author',
        name: { en: 'Other branch author', es: 'Other branch author es' },
        org: 'other-org',
      },
    ],
    [
      articlesSlug,
      {
        id: 'article',
        _branch: 'main',
        author: 'author',
        coauthor: 'other-author',
        localizedAuthor: { en: 'author', es: 'author' },
      },
    ],
  ] as const) {
    await payload.db.create({ collection, customID: data.id, data })
  }

  for (const [collectionSlug, documentID] of [
    [organizationsSlug, 'org'],
    [authorsSlug, 'author'],
    [authorsSlug, 'other-author'],
  ]) {
    await payload.db.create({
      collection: branchChangesCollectionSlug,
      data: {
        branch: 'work',
        collectionSlug,
        documentID,
        entityType: 'collection',
        operation: 'update',
      },
    })
  }
}
