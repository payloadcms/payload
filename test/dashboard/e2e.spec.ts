/* eslint-disable playwright/expect-expect */
import { expect, test } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

import { ensureCompilationIsDone } from '../__helpers/e2e/helpers.js'
import { AdminUrlUtil } from '../__helpers/shared/adminUrlUtil.js'
import { reInitializeDB } from '../__helpers/shared/clearAndSeed/reInitializeDB.js'
import { initPayloadE2ENoConfig } from '../__helpers/shared/initPayloadE2ENoConfig.js'
import { TEST_TIMEOUT_LONG } from '../playwright.config.js'
import { DashboardHelper } from './utils.js'

const filename = fileURLToPath(import.meta.url)
const currentFolder = path.dirname(filename)
const dirname = path.resolve(currentFolder, '../../')

const { beforeAll, beforeEach, describe } = test

const { serverURL } = await initPayloadE2ENoConfig({
  dirname,
})

const url = new AdminUrlUtil(serverURL, 'users')

describe('Dashboard', () => {
  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    process.env.SEED_IN_CONFIG_ONINIT = 'false' // Makes it so the payload config onInit seed is not run. Otherwise, the seed would be run unnecessarily twice for the initial test run - once for beforeEach and once for onInit
    const page = await browser.newPage()
    await ensureCompilationIsDone({ page, serverURL })
    await page.close()
  })
  beforeEach(async ({ page }) => {
    await reInitializeDB({
      serverURL,
      snapshotKey: 'lexicalTest',
      uploadsDir: [path.resolve(dirname, './collections/Upload/uploads')],
    })
    await page.goto(url.admin)
  })

  test('initial dashboard', async ({ page }) => {
    const d = new DashboardHelper(page)
    await expect(d.widgets).toHaveCount(7)

    await d.assertIsEditing(false)
    await d.assertWidget(1, 'collections', 'full')
    await d.assertWidget(2, 'count', 'x-small')
    await d.assertWidget(3, 'count', 'x-small')
    await d.assertWidget(4, 'count', 'x-small')
    await d.assertWidget(5, 'count', 'x-small')
    await d.assertWidget(6, 'revenue', 'full')
    await d.assertWidget(7, 'private', 'full')
    await d.validateLayout()
  })

  test('respects min and max width', async ({ page }) => {
    const d = new DashboardHelper(page)
    await d.setEditing()
    await d.assertWidthRange({ position: 1, min: 'full', max: 'full' })
    await d.assertWidthRange({ position: 2, min: 'x-small', max: 'medium' })
    await d.assertWidthRange({ position: 3, min: 'x-small', max: 'medium' })
    await d.assertWidthRange({ position: 4, min: 'x-small', max: 'medium' })
    await d.assertWidthRange({ position: 5, min: 'x-small', max: 'medium' })
    await d.assertWidthRange({ position: 6, min: 'medium', max: 'full' })
    await d.assertWidthRange({ position: 7, min: 'x-small', max: 'full' })
  })

  test('resize widget', async ({ page }) => {
    const d = new DashboardHelper(page)
    await d.setEditing()
    await d.assertWidget(2, 'count', 'x-small')
    await d.resizeWidget(2, 'medium')
    await d.assertWidget(2, 'count', 'medium')
    await d.saveChangesAndValidate()
  })

  test('add widget', async ({ page }) => {
    const d = new DashboardHelper(page)
    await d.setEditing()
    await d.addWidget('revenue')
    await d.assertWidget(8, 'revenue', 'medium')
    await d.saveChangesAndValidate()
  })

  test('delete widget', async ({ page }) => {
    const d = new DashboardHelper(page)
    await d.setEditing()
    await d.deleteWidget(1)
    await d.assertWidget(1, 'count', 'x-small')
    await d.assertWidget(6, 'private', 'full')
    await expect(d.widgets).toHaveCount(6)
    await d.saveChangesAndValidate()
  })

  test('edit widget data is reverted when dashboard editing is canceled', async ({ page }) => {
    const d = new DashboardHelper(page)
    await d.setEditing()
    let secondWidget = d.widgetByPos(2)
    let secondWidgetTitle = secondWidget.locator('.count-widget h3')
    await expect(secondWidgetTitle).toHaveText('Tickets')

    await d.editWidget(2, 'Open Tickets')
    await expect(secondWidgetTitle).toHaveText('Open Tickets')

    await d.cancelEditing()

    secondWidget = d.widgetByPos(2)
    secondWidgetTitle = secondWidget.locator('.count-widget h3')
    await expect(secondWidgetTitle).toHaveText('Tickets')
  })

  test('edit widget data persists after dashboard save and reload', async ({ page }) => {
    const d = new DashboardHelper(page)
    await d.setEditing()
    const secondWidget = d.widgetByPos(2)
    const secondWidgetTitle = secondWidget.locator('.count-widget h3')
    await expect(secondWidgetTitle).toHaveText('Tickets')

    await d.editWidget(2, 'Open Tickets')
    await expect(secondWidgetTitle).toHaveText('Open Tickets')

    await d.stepNavLast.locator('button').nth(1).click()
    await expect(secondWidgetTitle).toHaveText('Open Tickets')

    // Re-enter edit mode without page refresh and edit again.
    await d.setEditing()
    await expect(secondWidgetTitle).toHaveText('Open Tickets')
    await d.editWidget(2, 'Title changed again')
    await expect(secondWidgetTitle).toHaveText('Title changed again')

    await d.saveChangesAndValidate()
    await expect(secondWidgetTitle).toHaveText('Title changed again')
  })

  test('empty dashboard - delete all widgets', async ({ page }) => {
    const d = new DashboardHelper(page)
    await d.setEditing()
    await d.deleteWidget(1)
    await d.deleteWidget(1)
    await d.deleteWidget(1)
    await d.deleteWidget(1)
    await d.deleteWidget(1)
    await d.deleteWidget(1)
    await d.deleteWidget(1)
    await expect(d.widgets).toHaveCount(0)
    await expect(page.getByText('There are no widgets on your dashboard')).toBeVisible()
    await d.saveChangesAndValidate()
  })

  test('Widgets should expand to the height of the tallest widget in the row', async ({ page }) => {
    // For this test we need to put 2 widgets with different default heights in the same row
    const d = new DashboardHelper(page)
    await d.setEditing()
    await d.deleteWidget(2)
    await d.deleteWidget(2)
    await d.resizeWidget(4, 'medium')
    // validateLayout already takes care of verifying that
    await d.saveChangesAndValidate()
  })

  test('cancel editing', async ({ page }) => {
    const d = new DashboardHelper(page)
    await d.setEditing()
    await d.addWidget('revenue')
    await d.cancelEditing()
    await expect(d.widgets).toHaveCount(7)
    await d.validateLayout()
  })

  test('reset layout', async ({ page }) => {
    const d = new DashboardHelper(page)
    await d.setEditing()
    await d.addWidget('revenue')
    await d.saveChangesAndValidate()
    await d.resetLayout()
    await expect(d.widgets).toHaveCount(7)
    await d.validateLayout()
  })

  test('move widgets', async ({ page }) => {
    const d = new DashboardHelper(page)
    await d.setEditing()
    // moveWidget already contains validations
    await d.moveWidget(2, 1) // to first position
    await d.moveWidget(1, 2, 'after') // after last in row
    await d.moveWidget(2, 7, 'after') // to last position
    await d.moveWidget(3, 6, 'before') // before first in row
    await d.saveChangesAndValidate()
  })

  test('cannot move or edit widgets when not editing', async ({ page }) => {
    const d = new DashboardHelper(page)
    await d.assertIsEditing(false)

    // Delete buttons should not be visible when not editing
    const widget = d.widgetByPos(1)
    await widget.hover()
    await expect(widget.getByText('Delete widget')).toBeHidden()

    // Widgets should not have draggable attributes when not editing
    await expect(widget.locator('.draggable')).not.toHaveAttribute('aria-disabled')

    // verify the opposite:
    await d.setEditing()
    await expect(widget.getByText('Delete widget')).toBeVisible()
    await expect(widget.locator('.draggable')).toHaveAttribute('aria-disabled', 'false')
  })

  test('Responsiveness - all widgets have a 100% width on mobile', async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 500, height: 667 })
    const d = new DashboardHelper(page)
    const widgets = await d.widgets.all()
    for (const widget of widgets) {
      await expect(async () => {
        const dashboardBox = (await d.dashboard.boundingBox())!
        const widgetBox = (await widget.boundingBox())!
        expect(widgetBox.width).toBe(dashboardBox.width)
      }).toPass({ timeout: 1000 })
    }
  })

  test('widget config drawer validates required fields on submit', async ({ page }) => {
    const d = new DashboardHelper(page)
    await d.setEditing()

    const widget = d.widgetByPos(2)
    await widget.hover()
    await widget.locator('.widget-wrapper__edit-btn').click()

    const drawer = page.locator('.drawer__content:visible')
    await expect(drawer).toBeVisible()

    const titleInput = drawer.locator('input[name="title"]').first()
    await expect(titleInput).toBeVisible({ timeout: 60000 })

    await titleInput.fill('')
    await page.waitForTimeout(500)
    await drawer.getByRole('button', { name: 'Save Changes' }).click()

    await expect(drawer.locator('.field-error')).toBeVisible()
    await expect(drawer).toBeVisible()

    await titleInput.fill('Valid Title')
    await page.waitForTimeout(500)
    await drawer.getByRole('button', { name: 'Save Changes' }).click()
    await expect(drawer).toBeHidden()
  })

  // TODO: reorder widgets with keyboard (for a11y reasons)
  // It's already working. But I'd like to test it properly with a screen reader and everything.

  test('widget labels are displayed correctly in the add widget drawer', async ({ page }) => {
    const d = new DashboardHelper(page)
    await d.setEditing()
    await d.openAddWidgetDrawer()

    // Verify custom labels are displayed (English)
    await expect(async () => {
      const labels = await d.getWidgetLabelsInDrawer()
      expect(labels).toContain('Count Widget')
      expect(labels).toContain('Private Widget')
      expect(labels).toContain('Revenue Chart')
      // The default 'collections' widget should use toWords fallback
      expect(labels).toContain('Collections')
    }).toPass({ timeout: 1000 })
  })

  test('widget re-renders when query params change (= modular dashboard RSC rerenders)', async ({
    page,
  }) => {
    const d = new DashboardHelper(page)
    await d.setEditing()
    await d.addWidget('page query')
    await d.assertWidget(8, 'page-query', 'x-small')
    await d.saveChangesAndValidate()

    // Find the page-query widget
    const pageQueryWidget = page.locator('.page-query-widget')
    await expect(pageQueryWidget).toBeVisible()

    // Initially, page should be 0 (default)
    await expect(pageQueryWidget.getByText(/Current page from query: 0/)).toBeVisible()

    // Click the increment button
    const incrementButton = pageQueryWidget.getByRole('button', { name: /Increment Page/ })
    await incrementButton.click()

    // The page number should update to 1 without a page refresh
    // This test will fail until the server component re-renders when query params change
    await expect(pageQueryWidget.getByText(/Current page from query: 1/)).toBeVisible()

    // Click again to increment to 2
    await incrementButton.click()
    await expect(pageQueryWidget.getByText(/Current page from query: 2/)).toBeVisible()
  })
})
