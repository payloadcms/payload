import { test, expect } from '@playwright/test'
import { seedTestData, cleanupTestData, draftPostSlug } from './helpers/seedData'

test.describe('Security & Access Boundary', () => {
  test.beforeAll(async () => {
    await seedTestData()
  })

  test.afterAll(async () => {
    await cleanupTestData()
  })

  test('draft post is strictly excluded from public access (returns 404)', async ({ page }) => {
    const response = await page.goto(`/posts/${draftPostSlug}`)
    expect(response?.status()).toBe(404)
  })

  test('public REST API excludes draft posts for unauthenticated requests', async ({ request }) => {
    const response = await request.get(`/api/posts?where[slug][equals]=${draftPostSlug}`)
    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    expect(data.docs).toHaveLength(0)
  })
})
