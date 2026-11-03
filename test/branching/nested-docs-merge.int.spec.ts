import { expect } from 'vitest'

import { test } from '../__helpers/int/vitest.js'
import { nestedCategoriesSlug } from './nested-docs-merge.config.js'
import { branchesSlug } from './shared.js'
import { createTrustedPayload } from './trustedPayload.js'

test.suite('Branching: nested docs merge', { config: './nested-docs-merge.config.ts' }, () => {
  test('should merge a branch-created category with a breadcrumb referring to itself', async ({
    payload: instance,
  }) => {
    const payload = createTrustedPayload(instance)
    const branch = 'nested-category-create'

    await payload.create({
      collection: branchesSlug,
      data: { name: branch },
    })

    const category = await payload.create({
      branch,
      collection: nestedCategoriesSlug,
      data: { title: 'Branch category' },
      locale: 'en',
    })
    const preview = await payload.branches.merge({ branch, dryRun: true })

    expect(preview.canMerge).toBe(true)

    const result = await payload.branches.merge({ branch })
    const mergedCategory = await payload.findByID({
      id: category.id,
      collection: nestedCategoriesSlug,
      depth: 0,
      locale: 'en',
    })

    expect(result.canMerge).toBe(true)
    expect(mergedCategory.breadcrumbs).toEqual([
      expect.objectContaining({ doc: category.id, label: 'Branch category' }),
    ])
  })

  test('should merge a category title change with nested docs enabled', async ({
    payload: instance,
  }) => {
    const payload = createTrustedPayload(instance)
    const category = await payload.create({
      collection: nestedCategoriesSlug,
      data: { title: 'Main category' },
    })
    const branch = 'nested-category-edit'

    await payload.create({
      collection: branchesSlug,
      data: { name: branch },
    })
    await payload.update({
      id: category.id,
      branch,
      collection: nestedCategoriesSlug,
      data: { title: 'Edited category' },
    })

    const preview = await payload.branches.merge({ branch, dryRun: true })

    expect(preview.validationErrors).toEqual([])
    expect(preview.canMerge).toBe(true)

    const result = await payload.branches.merge({ branch })
    const mergedCategory = await payload.findByID({
      id: category.id,
      collection: nestedCategoriesSlug,
    })

    expect(result.validationErrors).toEqual([])
    expect(result.canMerge).toBe(true)
    expect(mergedCategory.title).toBe('Edited category')
    expect(mergedCategory.breadcrumbs).toEqual([
      expect.objectContaining({ label: 'Edited category' }),
    ])
  })
})
