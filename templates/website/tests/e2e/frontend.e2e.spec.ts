import { test, expect, Page } from '@playwright/test'
import { describe } from 'node:test'

test.describe('Frontend', () => {
  let page: Page

  test.beforeAll(async ({ browser }, testInfo) => {
    const context = await browser.newContext()
    page = await context.newPage()
  })

  test('can go on homepage', async ({ page }) => {
    await page.goto('http://localhost:3000')
    await expect(page).toHaveTitle(/Payload Website Template/)
    const heading = page.locator('h1').first()
    await expect(heading).toHaveText('Payload Website Template')
  })

  describe('Admin Panel', () => {
    test('can navigate to dashboard', async ({ page }) => {
      await page.goto('http://localhost:3000/admin')
    })

    test('can navigate to list view', async ({ page }) => {
      await page.goto('http://localhost:3000/admin/collections/pages')
    })

    test('can navigate to edit view', async ({ page }) => {
      await page.goto('http://localhost:3000/admin/collections/pages/create')
      const titleField = page.locator('input[name="title"]')
      await titleField.fill('Test Page')
      expect(await titleField.inputValue()).toBe('Test Page')
    })
  })
})
