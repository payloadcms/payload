import { test, expect, Page } from '@playwright/test'

test.describe('Admin Panel', () => {
  let page: Page

  test.beforeAll(async ({ browser }, testInfo) => {
    const context = await browser.newContext()
    page = await context.newPage() // TODO: authenticate before tests
  })

  test('can navigate to dashboard', async ({ page }) => {
    await page.goto('http://localhost:3000/admin')
    await expect(page).toHaveURL('http://localhost:3000/admin')
    const dashboardArtifact = page.locator('span[title="Dashboard"]').first()
    await expect(dashboardArtifact).toBeVisible()
  })

  test('can navigate to list view', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/collections/pages')
    await expect(page).toHaveURL('http://localhost:3000/admin/collections/pages')
    const listViewArtifact = page.locator('h1', { hasText: 'Pages' }).first()
    await expect(listViewArtifact).toBeVisible()
  })

  test('can navigate to edit view', async ({ page }) => {
    await page.goto('http://localhost:3000/admin/collections/pages/create')
    await expect(page).toHaveURL(/\/admin\/collections\/pages\/[a-zA-Z0-9-_]+/)
    const editViewArtifact = page.locator('input[name="title"]')
    await expect(editViewArtifact).toBeVisible()
  })
})
