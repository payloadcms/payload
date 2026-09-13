import { test, expect } from '@playwright/test'
import { seedTestData, cleanupTestData, publishedPostSlug } from './helpers/seedData'

test.describe('Frontend & Content Delivery', () => {
  test.beforeAll(async () => {
    await seedTestData()
  })

  test.afterAll(async () => {
    await cleanupTestData()
  })

  test('homepage renders correctly with title and admin link', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h1')).toHaveText('Payload Fullstack Template')

    const adminLink = page.locator('a[href="/admin"]')
    await expect(adminLink).toBeVisible()
  })

  test('published post renders full content, tags, and all modular layout blocks', async ({
    page,
  }) => {
    await page.goto(`/posts/${publishedPostSlug}`)

    // 1. Post Header & Title
    await expect(page.locator('h1')).toHaveText('E2E Published Post Title')
    await expect(page.locator('.template-post__back')).toBeVisible()

    // 2. RichText content
    await expect(page.getByText('This is verified test content for E2E validation.')).toBeVisible()

    // 3. Modular Layout Blocks
    // Hero block
    await expect(page.locator('h2', { hasText: 'E2E Hero Block Headline' })).toBeVisible()
    await expect(page.getByText('E2E Hero Subheadline text')).toBeVisible()
    const heroCta = page.locator('a', { hasText: 'Explore CTA' })
    await expect(heroCta).toBeVisible()
    await expect(heroCta).toHaveAttribute('href', 'https://example.com/explore')

    // FeatureGrid block
    await expect(page.locator('h2', { hasText: 'E2E Feature Grid Title' })).toBeVisible()
    await expect(page.getByText('Feature Alpha')).toBeVisible()
    await expect(page.getByText('Feature Beta')).toBeVisible()

    // CallToAction block
    await expect(page.locator('h2', { hasText: 'Ready for Action?' })).toBeVisible()
    const ctaBtn = page.locator('a', { hasText: 'Get Started Now' })
    await expect(ctaBtn).toBeVisible()
    await expect(ctaBtn).toHaveAttribute('href', '/admin')
  })

  test('non-existent post slug returns 404', async ({ page }) => {
    const response = await page.goto('/posts/non-existent-random-slug-xyz')
    expect(response?.status()).toBe(404)
    await expect(page.getByText('404') || page.getByText('not found')).toBeDefined()
  })
})
