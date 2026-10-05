/* eslint vitest/no-standalone-expect: ["error", { "additionalTestBlockFunctions": ["test"] }] -- Tests use the shared fixture wrapper. */
import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { maxPostsSlug } from './slugs.js'

test.suite('Active draft version retention', { config: './max-config.ts' }, () => {
  test('should retain the active draft when published history exceeds its maximum', async ({
    payload,
  }) => {
    const doc = await payload.create({
      collection: maxPostsSlug,
      data: { title: 'Published' },
      version: 'published',
    })

    await payload.update({
      id: doc.id,
      collection: maxPostsSlug,
      data: { title: 'Pending' },
      version: 'draft',
    })
    await payload.update({
      id: doc.id,
      collection: maxPostsSlug,
      data: { title: 'Published correction' },
      version: 'published',
    })
    await payload.update({
      id: doc.id,
      collection: maxPostsSlug,
      data: { title: 'Second published correction' },
      version: 'published',
    })

    const draft = await payload.findByID({
      id: doc.id,
      collection: maxPostsSlug,
      version: 'draft',
    })
    const published = await payload.findByID({ id: doc.id, collection: maxPostsSlug })

    expect(draft.title).toBe('Pending')
    expect(published.title).toBe('Second published correction')
  })
})
