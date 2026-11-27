import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { localizedQueryReferencesSlug, localizedQueryTargetsSlug, spanishLocale } from './shared.js'

test.suite('Localized relationship queries', { config: './config.ts' }, () => {
  test('should constrain localized relationship queries for drafts', async ({ payload }) => {
    const internalTarget = await payload.create({
      collection: localizedQueryTargetsSlug,
      data: { category: 'internal', title: 'Planning' },
      locale: spanishLocale,
      overrideAccess: true,
    })
    const sharedTarget = await payload.create({
      collection: localizedQueryTargetsSlug,
      data: { category: 'shared', title: 'Updates' },
      locale: spanishLocale,
      overrideAccess: true,
    })
    const internalReference = await payload.create({
      collection: localizedQueryReferencesSlug,
      data: { target: internalTarget.id },
      draft: true,
      locale: spanishLocale,
      overrideAccess: true,
    })
    const sharedReference = await payload.create({
      collection: localizedQueryReferencesSlug,
      data: { target: sharedTarget.id },
      draft: true,
      locale: spanishLocale,
      overrideAccess: true,
    })

    const internalResult = await payload.find({
      collection: localizedQueryReferencesSlug,
      draft: true,
      locale: spanishLocale,
      overrideAccess: false,
      where: { 'target.title': { equals: 'Planning' } },
    })
    const sharedResult = await payload.find({
      collection: localizedQueryReferencesSlug,
      draft: true,
      locale: spanishLocale,
      overrideAccess: false,
      where: { 'target.title': { equals: 'Updates' } },
    })
    const unrestrictedResult = await payload.find({
      collection: localizedQueryReferencesSlug,
      draft: true,
      locale: spanishLocale,
      overrideAccess: true,
      where: { 'target.title': { equals: 'Planning' } },
    })
    const allLocalesInternalResult = await payload.find({
      collection: localizedQueryReferencesSlug,
      draft: true,
      locale: 'all',
      overrideAccess: false,
      where: { 'target.title.es': { equals: 'Planning' } },
    })
    const allLocalesSharedResult = await payload.find({
      collection: localizedQueryReferencesSlug,
      draft: true,
      locale: 'all',
      overrideAccess: false,
      where: { 'target.title.es': { equals: 'Updates' } },
    })

    expect(internalResult.docs).toHaveLength(0)
    expect(sharedResult.docs.map(({ id }) => id)).toEqual([sharedReference.id])
    expect(unrestrictedResult.docs.map(({ id }) => id)).toEqual([internalReference.id])
    expect(allLocalesInternalResult.docs).toHaveLength(0)
    expect(allLocalesSharedResult.docs.map(({ id }) => id)).toEqual([sharedReference.id])
  })
})
