import { test, expect, Page } from '@playwright/test'
import {
  cleanupRelatedPosts,
  relatedPostsFixture,
  seedRelatedPosts,
} from '../helpers/seedRelatedPosts'

test.describe('Frontend', () => {
  let page: Page

  test.beforeAll(async ({ browser }, testInfo) => {
    const context = await browser.newContext()
    page = await context.newPage()
  })

  test('can load homepage', async ({ page }) => {
    await page.goto('http://localhost:3000')
    await expect(page).toHaveTitle(/Payload Website Template/)
    const heading = page.locator('h1').first()
    await expect(heading).toHaveText('Payload Website Template')
  })

  test.describe('post detail', () => {
    test.beforeAll(async () => {
      await seedRelatedPosts()
    })

    test.afterAll(async () => {
      await cleanupRelatedPosts()
    })

    test('should render related post cards with their image and category', async ({ page }) => {
      await page.goto(`http://localhost:3000/posts/${relatedPostsFixture.postSlug}`)

      await expect(page.locator('h1')).toHaveText(relatedPostsFixture.postTitle)

      const postCards = page.locator('article article')

      const relatedCard = postCards.filter({
        has: page.getByRole('link', { name: relatedPostsFixture.relatedPostTitle }),
      })

      await expect(relatedCard).toHaveCount(1)
      await expect(relatedCard.locator('img')).toBeAttached()
      await expect(relatedCard).toContainText(relatedPostsFixture.categoryTitle)
    })
  })
})
