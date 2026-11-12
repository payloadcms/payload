import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'

test.suite('Blocks OR join alias (#19459)', { config: './config.ts', db: 'drizzle' }, () => {
  test('should query two text fields in the same block with or', async ({ payload }) => {
    const needle = 'blocks-or-join-alias-needle'

    const doc = await payload.create({
      collection: 'articles',
      data: {
        layout: [
          {
            blockType: 'card',
            heading: needle,
            caption: needle,
          },
        ],
      },
      overrideAccess: true,
    })

    const headingLike = {
      'layout.heading': {
        like: needle,
      },
    }
    const captionLike = {
      'layout.caption': {
        like: needle,
      },
    }

    const headingResult = await payload.find({
      collection: 'articles',
      depth: 0,
      where: headingLike,
      overrideAccess: true,
    })
    const captionResult = await payload.find({
      collection: 'articles',
      depth: 0,
      where: captionLike,
      overrideAccess: true,
    })
    const orResult = await payload.find({
      collection: 'articles',
      depth: 0,
      where: {
        or: [headingLike, captionLike],
      },
      overrideAccess: true,
    })
    const andResult = await payload.find({
      collection: 'articles',
      depth: 0,
      where: {
        and: [headingLike, captionLike],
      },
      overrideAccess: true,
    })

    expect(headingResult.totalDocs).toBe(1)
    expect(headingResult.docs[0]?.id).toBe(doc.id)
    expect(captionResult.totalDocs).toBe(1)
    expect(captionResult.docs[0]?.id).toBe(doc.id)
    expect(orResult.totalDocs).toBe(1)
    expect(orResult.docs[0]?.id).toBe(doc.id)
    expect(andResult.totalDocs).toBe(1)
    expect(andResult.docs[0]?.id).toBe(doc.id)
  })

  test('should keep distinct joins when OR/AND spans block fields in different locales', async ({
    payload,
  }) => {
    const enNeedle = 'blocks-or-join-alias-en-needle'
    const deNeedle = 'blocks-or-join-alias-de-needle'

    // en caption matches the de needle — a false positive if the de join is dropped
    // and the query reuses the en-joined row.
    const falsePositive = await payload.create({
      collection: 'articles',
      locale: 'en',
      data: {
        localizedLayout: [
          {
            blockType: 'card',
            heading: 'en-heading-false-positive',
            caption: deNeedle,
          },
        ],
      },
      overrideAccess: true,
    })

    await payload.update({
      collection: 'articles',
      id: falsePositive.id,
      locale: 'de',
      data: {
        localizedLayout: [
          {
            blockType: 'card',
            heading: 'de-heading-false-positive',
            caption: 'de-caption-other',
          },
        ],
      },
      overrideAccess: true,
    })

    const match = await payload.create({
      collection: 'articles',
      locale: 'en',
      data: {
        localizedLayout: [
          {
            blockType: 'card',
            heading: enNeedle,
            caption: 'en-caption-other',
          },
        ],
      },
      overrideAccess: true,
    })

    await payload.update({
      collection: 'articles',
      id: match.id,
      locale: 'de',
      data: {
        localizedLayout: [
          {
            blockType: 'card',
            heading: 'de-heading-other',
            caption: deNeedle,
          },
        ],
      },
      overrideAccess: true,
    })

    const enHeadingEquals = {
      'localizedLayout.en.heading': {
        equals: enNeedle,
      },
    }
    const deCaptionEquals = {
      'localizedLayout.de.caption': {
        equals: deNeedle,
      },
    }

    // Force the en join first; if the de join is discarded, de.caption reads the en row.
    const orResult = await payload.find({
      collection: 'articles',
      depth: 0,
      locale: 'all',
      where: {
        or: [
          {
            'localizedLayout.en.heading': {
              equals: 'no-match-forces-en-join',
            },
          },
          deCaptionEquals,
        ],
      },
      overrideAccess: true,
    })

    const andResult = await payload.find({
      collection: 'articles',
      depth: 0,
      locale: 'all',
      where: {
        and: [enHeadingEquals, deCaptionEquals],
      },
      overrideAccess: true,
    })

    const sameLocaleOrResult = await payload.find({
      collection: 'articles',
      depth: 0,
      locale: 'all',
      where: {
        or: [
          {
            'localizedLayout.de.heading': {
              equals: 'de-heading-other',
            },
          },
          deCaptionEquals,
        ],
      },
      overrideAccess: true,
    })

    expect(orResult.docs.map((doc) => doc.id)).toEqual([match.id])
    expect(orResult.totalDocs).toBe(1)
    expect(andResult.docs.map((doc) => doc.id)).toEqual([match.id])
    expect(andResult.totalDocs).toBe(1)
    expect(sameLocaleOrResult.docs.map((doc) => doc.id).sort()).toEqual([match.id].sort())
    expect(sameLocaleOrResult.totalDocs).toBe(1)
  })

  test('should keep distinct joins when OR/AND spans fields in different localized block types', async ({
    payload,
  }) => {
    const cardNeedle = 'blocks-or-join-alias-card-needle'
    const heroNeedle = 'blocks-or-join-alias-hero-needle'

    const cardDoc = await payload.create({
      collection: 'articles',
      locale: 'en',
      data: {
        localizedLayout: [
          {
            blockType: 'card',
            heading: cardNeedle,
            caption: 'card-caption-other',
          },
        ],
      },
      overrideAccess: true,
    })

    const heroDoc = await payload.create({
      collection: 'articles',
      locale: 'en',
      data: {
        localizedLayout: [
          {
            blockType: 'hero',
            heroTitle: heroNeedle,
          },
        ],
      },
      overrideAccess: true,
    })

    const cardHeadingLike = {
      'localizedLayout.heading': {
        like: cardNeedle,
      },
    }
    const heroTitleLike = {
      'localizedLayout.heroTitle': {
        like: heroNeedle,
      },
    }

    // Resolve card first so a shared queryPath would reuse the card join for heroTitle.
    const orResult = await payload.find({
      collection: 'articles',
      depth: 0,
      where: {
        or: [cardHeadingLike, heroTitleLike],
      },
      overrideAccess: true,
    })

    const andCardOnly = await payload.find({
      collection: 'articles',
      depth: 0,
      where: {
        and: [
          cardHeadingLike,
          {
            'localizedLayout.heroTitle': {
              like: 'no-match-forces-hero-join',
            },
          },
        ],
      },
      overrideAccess: true,
    })

    const andHeroOnly = await payload.find({
      collection: 'articles',
      depth: 0,
      where: {
        and: [
          {
            'localizedLayout.heading': {
              like: 'no-match-forces-card-join',
            },
          },
          heroTitleLike,
        ],
      },
      overrideAccess: true,
    })

    expect(orResult.docs.map((doc) => doc.id).sort()).toEqual([cardDoc.id, heroDoc.id].sort())
    expect(orResult.totalDocs).toBe(2)
    expect(andCardOnly.totalDocs).toBe(0)
    expect(andHeroOnly.totalDocs).toBe(0)
  })
})
