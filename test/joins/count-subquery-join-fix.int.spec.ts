import { jest } from '@jest/globals'

import { initPayloadInt } from '../helpers/initPayloadInt.js'

describe('Join Field Count Subquery with WHERE - Issue Fix', () => {
  let payload

  beforeAll(async () => {
    ;({ payload } = await initPayloadInt(__dirname))
  })

  afterAll(async () => {
    await payload.destroy()
  })

  it('should handle count queries with joins that require WHERE clauses on joined columns', async () => {
    // This test specifically targets the issue described in the GitHub issue
    // where count subqueries for join fields fail when they reference columns
    // from joined tables that weren't included in the count subquery

    // Create a category
    const category = await payload.create({
      collection: 'categories',
      data: {
        name: 'Test Category for Join Count Issue',
      },
    })

    // Create posts with isFiltered field (which has default where filtering)
    await payload.create({
      collection: 'posts',
      data: {
        title: 'Visible Post',
        category: category.id,
        isFiltered: false, // This should be included in filtered join
      },
    })

    await payload.create({
      collection: 'posts',
      data: {
        title: 'Hidden Post',
        category: category.id,
        isFiltered: true, // This should be excluded from filtered join
      },
    })

    // The 'filtered' join field is configured with: where: { isFiltered: { not_equals: true } }
    // Before the fix, this would fail because the count subquery didn't include necessary joins
    // After the fix, it should work correctly
    const result = await payload.findByID({
      id: category.id,
      collection: 'categories',
      joins: {
        filtered: {
          count: true,
        },
      },
    })

    // Verify the count is correct - should only count posts where isFiltered != true
    expect(result.filtered).toBeDefined()
    expect(result.filtered.totalDocs).toBe(1) // Only the "Visible Post" should be counted
  })
})
