import { test, expect, Page } from '@playwright/test'

test.describe('Frontend', () => {
  let _page: Page

  test.beforeAll(async ({ browser }, _testInfo) => {
    const context = await browser.newContext()
    _page = await context.newPage()
  })

  test('can load homepage', async ({ page }) => {
    await page.goto(process.env.NEXT_PUBLIC_SERVER_URL! || process.env.__NEXT_PRIVATE_ORIGIN!)
    await expect(page).toHaveTitle(/Belteq/)
    const heading = page.locator('h1').first()
    await expect(heading).toHaveText('Belteq')
  })
})
