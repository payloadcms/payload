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
})
