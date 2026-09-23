import { expect, test } from '@playwright/test'

test.describe('Frontend', () => {
  test('can go on homepage', async ({ page }) => {
    await page.goto('http://localhost:3000')

    await expect(page).toHaveTitle(/Payload TanStack Blank Template/)

    const heading = page.locator('h1').first()

    await expect(heading).toHaveText('Welcome to your new project.')
  })

  test('should not load Payload admin styles or fonts', async ({ page }) => {
    await page.goto('http://localhost:3000')

    const payloadFontFamily = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--font-family-sans').trim(),
    )

    expect(payloadFontFamily).toBe('')
    await expect(page.locator('link[href*="fonts.googleapis.com"]')).toHaveCount(0)
  })

  test('should not load Payload component styles', async ({ page }) => {
    await page.goto('http://localhost:3000')

    const sentinel = page.locator('[data-test="payload-ui-barrel-sentinel"]')

    await expect(sentinel).toBeVisible()
    await expect
      .poll(() =>
        sentinel.evaluate((element) =>
          getComputedStyle(element).getPropertyValue('--payload-ui-barrel-loaded').trim(),
        ),
      )
      .toBe('')
  })
})
