import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import * as path from 'path'
import { fileURLToPath } from 'url'

import { AdminUrlUtil } from '../__helpers/shared/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../__helpers/shared/initPayloadE2ENoConfig.js'
import { initPage } from '../__setup/e2e/initPage.js'
import { devUser } from '../credentials.js'
import { TEST_TIMEOUT_LONG } from '../playwright.config.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

test.describe('Community', () => {
  let page: Page
  let url: AdminUrlUtil

  test.beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)

    const { serverURL } = await initPayloadE2ENoConfig({ dirname })
    url = new AdminUrlUtil(serverURL, 'posts')

    const context = await browser.newContext()
    ;({ page } = await initPage({ context, serverURL }))
  })

  test('example test', async () => {
    await page.goto(url.list)

    const textCell = page.locator('.row-1 .cell-title')
    await expect(textCell).toHaveText('example post')
  })

  test('should show the built-in dashboard widgets before optional widgets', async () => {
    await page.goto(url.admin)

    const widgets = page.locator('.modular-dashboard > .widget')
    await expect(widgets).toHaveCount(3)
    await expect(widgets.nth(0)).toHaveAttribute('data-slug', 'welcome-0')
    await expect(widgets.nth(0)).toHaveAttribute('data-width', 'full')
    await expect(widgets.nth(0).getByRole('heading', { level: 1 })).toHaveText(
      `Welcome, ${devUser.email}`,
    )
    await expect(widgets.nth(1)).toHaveAttribute('data-slug', 'activity-1')
    await expect(widgets.nth(1)).toHaveAttribute('data-width', 'full')
    await expect(widgets.nth(2)).toHaveAttribute('data-slug', 'collections-2')
    await expect(widgets.nth(2)).toHaveAttribute('data-width', 'full')
  })

  test('should keep the Welcome delete control inside the compact widget while editing', async () => {
    await page.goto(url.admin)
    await page.getByRole('button', { name: 'Dashboard' }).click()
    await page.getByText('Edit Dashboard').click()

    const welcomeWidget = page.locator('.widget-wrapper:has(.welcome-widget)')
    const deleteButton = welcomeWidget.locator('.widget-wrapper__delete-btn')

    for (const width of [1280, 320]) {
      await page.setViewportSize({ height: 720, width })
      await welcomeWidget.hover()
      await expect(deleteButton).toBeVisible()

      const widgetBox = await welcomeWidget.boundingBox()
      const headingBox = await welcomeWidget.locator('.welcome-widget__heading').boundingBox()
      const controlBox = await deleteButton.boundingBox()

      if (!widgetBox || !headingBox || !controlBox) {
        throw new Error('Welcome widget or delete control is not rendered')
      }

      expect(controlBox.y).toBeGreaterThanOrEqual(widgetBox.y)
      expect(controlBox.y + controlBox.height).toBeLessThanOrEqual(widgetBox.y + widgetBox.height)

      if (width === 1280) {
        const widgetCenter = widgetBox.y + widgetBox.height / 2

        expect(Math.abs(headingBox.y + headingBox.height / 2 - widgetCenter)).toBeLessThanOrEqual(2)
        expect(Math.abs(controlBox.y + controlBox.height / 2 - widgetCenter)).toBeLessThanOrEqual(2)
      }
    }

    await page.setViewportSize({ height: 720, width: 1280 })
  })
})
