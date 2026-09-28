import { test, expect, Page } from '@playwright/test'
import { login } from '../helpers/login'
import { seedTestUser, cleanupTestUser, testUser } from '../helpers/seedUser'

test.describe('Admin Panel', () => {
  let page: Page

  test.beforeAll(async ({ browser }, testInfo) => {
    await seedTestUser()

    const context = await browser.newContext()
    page = await context.newPage()

    await login({ page, user: testUser })
  })

  test.afterAll(async () => {
    await cleanupTestUser()
  })

  test('can navigate to dashboard', async () => {
    await page.goto('http://localhost:3000/admin')
    await expect(page).toHaveURL('http://localhost:3000/admin')
    const dashboardArtifact = page.locator('.step-nav__first').first()
    await expect(dashboardArtifact).toBeVisible()
    await expect(
      page.getByRole('heading', { level: 1, name: `Welcome, ${testUser.email}` }),
    ).toBeVisible()
  })

  test('should keep the Welcome delete control inside the widget while editing', async () => {
    await page.goto('http://localhost:3000/admin')
    await page.getByRole('button', { name: 'Dashboard' }).click()
    await page.getByText('Edit Dashboard').click()

    const welcomeWidget = page.locator('.widget-wrapper:has(.welcome-widget)')
    const deleteButton = welcomeWidget.locator('.widget-wrapper__delete-btn')

    for (const width of [1280, 320]) {
      await page.setViewportSize({ width, height: 720 })
      await welcomeWidget.hover()
      await expect(deleteButton).toBeVisible()

      const widgetBox = await welcomeWidget.boundingBox()
      const controlBox = await deleteButton.boundingBox()

      if (!widgetBox || !controlBox) {
        throw new Error('Welcome widget or delete control is not rendered')
      }

      expect(controlBox.y - widgetBox.y).toBe(6)
      expect(controlBox.y + controlBox.height).toBeLessThanOrEqual(widgetBox.y + widgetBox.height)
    }

    await page.setViewportSize({ width: 1280, height: 720 })
  })

  test('can navigate to list view', async () => {
    await page.goto('http://localhost:3000/admin/collections/users')
    await expect(page).toHaveURL('http://localhost:3000/admin/collections/users')
    const listViewArtifact = page.locator('h1', { hasText: 'Users' }).first()
    await expect(listViewArtifact).toBeVisible()
  })

  test('can navigate to edit view', async () => {
    await page.goto('http://localhost:3000/admin/collections/users/create')
    await expect(page).toHaveURL(/\/admin\/collections\/users\/[a-zA-Z0-9-_]+/)
    const editViewArtifact = page.locator('input[name="email"]')
    await expect(editViewArtifact).toBeVisible()
  })
})
