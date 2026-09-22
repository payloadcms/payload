import { test, expect } from '@playwright/test'

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

  test('should not apply Payload component styles', async ({ page }) => {
    await page.goto('http://localhost:3000')

    const bannerDisplay = await page.evaluate(() => {
      const banner = document.createElement('div')
      banner.className = 'banner'
      document.body.append(banner)

      const display = getComputedStyle(banner).display

      banner.remove()

      return display
    })

    expect(bannerDisplay).toBe('block')
  })
})
