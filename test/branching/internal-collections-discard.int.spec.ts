import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'

import { branchesSlug, categoriesSlug, postsSlug } from './shared.js'

test.suite('Branching internal collections', { config: './config.ts' }, () => {
  test('should preserve main relationships when discarding branch-created targets', async ({
    payload,
  }) => {
    const branch = await payload.create({
      collection: branchesSlug,
      data: { name: 'Relationship Discard' },
      overrideAccess: true,
    })
    const mainCategory = await payload.create({
      collection: categoriesSlug,
      data: { name: 'main category' },
      overrideAccess: true,
    })
    const mainPost = await payload.create({
      collection: postsSlug,
      data: { category: mainCategory.id, title: 'main post' },
      overrideAccess: true,
    })
    const branchCategory = await payload.create({
      branch: branch.slug,
      collection: categoriesSlug,
      data: { name: 'branch category' },
      overrideAccess: true,
    })

    await payload.update({
      id: mainPost.id,
      branch: branch.slug,
      collection: postsSlug,
      data: { category: branchCategory.id },
      overrideAccess: true,
    })
    await payload.branches.discard({
      branch: branch.slug,
      overrideAccess: true,
    })

    const preservedMainPost = await payload.findByID({
      id: mainPost.id,
      collection: postsSlug,
      depth: 1,
      overrideAccess: true,
    })

    expect((preservedMainPost.category as { id: number | string }).id).toBe(mainCategory.id)
  })
})
