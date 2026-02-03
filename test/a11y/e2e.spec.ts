import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import { openNav } from 'helpers/e2e/toggleNav.js'
import * as path from 'path'
import { fileURLToPath } from 'url'

import { ensureCompilationIsDone, initPageConsoleErrorCatch } from '../helpers.js'
import { AdminUrlUtil } from '@tools/test-utils/e2e'
import { assertAllElementsHaveFocusIndicators } from '@tools/test-utils/e2e'
import {
  assertNoHorizontalOverflow,
  checkHorizontalOverflow,
} from '@tools/test-utils/e2e'
import { runAxeScan } from '@tools/test-utils/e2e'
import { initPayloadE2ENoConfig } from '@tools/test-utils/e2e'
import { TEST_TIMEOUT_LONG } from '../playwright.config.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

test.describe('A11y', () => {
  let page: Page
  let postsUrl: AdminUrlUtil
  let mediaUrl: AdminUrlUtil
  let serverURL: string

  const DEFAULT_VIEWPORT = { width: 1280, height: 720 }

  test.beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)

    const { serverURL: url } = await initPayloadE2ENoConfig({ dirname })
    serverURL = url
    postsUrl = new AdminUrlUtil(serverURL, 'posts')
    mediaUrl = new AdminUrlUtil(serverURL, 'media')

    const context = await browser.newContext()
    page = await context.newPage()
    initPageConsoleErrorCatch(page)
    await ensureCompilationIsDone({ page, serverURL })
  })

  // Reset viewport before each test to ensure consistent starting state
  test.beforeEach(async () => {
    await page.setViewportSize(DEFAULT_VIEWPORT)
  })

  test('Dashboard', async ({}, testInfo) => {
    await page.goto(postsUrl.admin)

    await expect(page.locator('.dashboard')).toBeVisible()

    const accessibilityScanResults = await runAxeScan({ page, testInfo })

    expect.soft(accessibilityScanResults.violations.length).toEqual(0)
  })

  test.fixme('Collection API tab', async ({}, testInfo) => {
    await page.goto(postsUrl.list)

    await page.locator('.cell-title a').first().click()

    await page.locator('.doc-tabs__tabs a', { hasText: 'API' }).click()

    const accessibilityScanResults = await runAxeScan({ page, testInfo })

    expect.soft(accessibilityScanResults.violations.length).toEqual(0)
  })

  test.fixme('Account page', async ({}, testInfo) => {
    await page.goto(postsUrl.account)

    await expect(page.locator('.auth-fields')).toBeVisible()

    const accessibilityScanResults = await runAxeScan({
      page,
      testInfo,
      exclude: ['.react-select'],
    })

    expect.soft(accessibilityScanResults.violations.length).toBe(0)
  })

  test.describe('Posts Collection', () => {
    test.fixme('list view', async ({}, testInfo) => {
      await page.goto(postsUrl.list)

      await expect(page.locator('.list-controls')).toBeVisible()

      const accessibilityScanResults = await runAxeScan({ page, testInfo })

      expect.soft(accessibilityScanResults.violations.length).toBe(0)
    })

    test.fixme('create view', async ({}, testInfo) => {
      await page.goto(postsUrl.create)

      await expect(page.locator('#field-title')).toBeVisible()

      const accessibilityScanResults = await runAxeScan({ page, testInfo })

      expect.soft(accessibilityScanResults.violations.length).toBe(0)
    })

    test.fixme('edit view', async ({}, testInfo) => {
      await page.goto(postsUrl.list)

      await page.locator('.table a').first().click()
      await expect(page.locator('#field-title')).toBeVisible()

      const accessibilityScanResults = await runAxeScan({ page, testInfo })

      expect.soft(accessibilityScanResults.violations.length).toBe(0)
    })
  })

  test.describe('Media Collection', () => {
    test('list view', async ({}, testInfo) => {
      await page.goto(mediaUrl.list)

      await expect(page.locator('.list-controls')).toBeVisible()

      const accessibilityScanResults = await runAxeScan({ page, testInfo })

      expect.soft(accessibilityScanResults.violations.length).toBe(0)
    })

    test.fixme('create view', async ({}, testInfo) => {
      await page.goto(mediaUrl.create)

      await expect(page.locator('.file-field').first()).toBeVisible()

      const accessibilityScanResults = await runAxeScan({ page, testInfo })

      expect.soft(accessibilityScanResults.violations.length).toBe(0)
    })
  })

  test.describe('Keyboard Navigation & Focus Indicators', () => {
    test('Dashboard - should have visible focus indicators', async ({}, testInfo) => {
      await page.goto(postsUrl.admin)

      await expect(page.locator('.dashboard')).toBeVisible()

      await assertAllElementsHaveFocusIndicators({
        page,
        testInfo,
        verbose: false,
        selector: '.dashboard',
      })
    })

    test('Posts create view - fields should have visible focus indicators', async ({}, testInfo) => {
      await page.goto(postsUrl.create)

      await expect(page.locator('#field-title')).toBeVisible()

      await assertAllElementsHaveFocusIndicators({
        page,
        selector: 'main.collection-edit',
        testInfo,
      })
    })

    test.fixme(
      'Posts create view - breadcrumbs should have visible focus indicators',
      async ({}, testInfo) => {
        await page.goto(postsUrl.create)

        await expect(page.locator('#field-title')).toBeVisible()

        await assertAllElementsHaveFocusIndicators({
          page,
          selector: '.app-header__controls-wrapper',
          testInfo,
        })
      },
    )

    test.fixme(
      'Navigation sidebar - should have visible focus indicators',
      async ({}, testInfo) => {
        await page.goto(postsUrl.admin)

        await expect(page.locator('.nav')).toBeVisible()

        await openNav(page)

        await assertAllElementsHaveFocusIndicators({
          page,
          selector: '.nav',
          testInfo,
        })
      },
    )

    test.fixme('Account page - should have visible focus indicators', async ({}, testInfo) => {
      await page.goto(postsUrl.account)

      await expect(page.locator('.auth-fields')).toBeVisible()

      await assertAllElementsHaveFocusIndicators({
        page,
        testInfo,
        verbose: false,
      })
    })
  })

  test.describe('WCAG 2.1 - Reflow (320px width)', () => {
    test('Dashboard - should not have horizontal overflow at 320px', async ({}, testInfo) => {
      await page.setViewportSize({ width: 320, height: 568 })
      await page.goto(postsUrl.admin)
      await expect(page.locator('.dashboard')).toBeVisible()

      await assertNoHorizontalOverflow(page, testInfo)
    })

    test('Account page - should not have horizontal overflow at 320px', async ({}, testInfo) => {
      await page.setViewportSize({ width: 320, height: 568 })
      await page.goto(postsUrl.account)
      await expect(page.locator('.auth-fields')).toBeVisible()

      await assertNoHorizontalOverflow(page, testInfo)
    })

    test('Posts list view - should not have horizontal overflow at 320px', async ({}, testInfo) => {
      await page.setViewportSize({ width: 320, height: 568 })
      await page.goto(postsUrl.list)
      await expect(page.locator('.collection-list')).toBeVisible()

      await assertNoHorizontalOverflow(page, testInfo)
    })

    test('Posts create view - should not have horizontal overflow at 320px', async ({}, testInfo) => {
      await page.setViewportSize({ width: 320, height: 568 })
      await page.goto(postsUrl.create)
      await expect(page.locator('#field-title')).toBeVisible()

      await assertNoHorizontalOverflow(page, testInfo)
    })

    test('Posts edit view - should not have horizontal overflow at 320px', async ({}, testInfo) => {
      await page.setViewportSize({ width: 320, height: 568 })
      await page.goto(postsUrl.list)
      await page.locator('.table a').first().click()
      await expect(page.locator('#field-title')).toBeVisible()

      await assertNoHorizontalOverflow(page, testInfo)
    })

    test('Media list view - should not have horizontal overflow at 320px', async ({}, testInfo) => {
      await page.setViewportSize({ width: 320, height: 568 })
      await page.goto(mediaUrl.list)
      await expect(page.locator('.list-controls')).toBeVisible()

      await assertNoHorizontalOverflow(page, testInfo)
    })

    test('Media create view - should not have horizontal overflow at 320px', async ({}, testInfo) => {
      await page.setViewportSize({ width: 320, height: 568 })
      await page.goto(mediaUrl.create)
      await expect(page.locator('.file-field').first()).toBeVisible()

      await assertNoHorizontalOverflow(page, testInfo)
    })

    test('Navigation sidebar - should not have horizontal overflow at 320px', async ({}, testInfo) => {
      await page.setViewportSize({ width: 320, height: 568 })
      await page.goto(postsUrl.admin)
      await expect(page.locator('.nav')).toBeVisible()

      await assertNoHorizontalOverflow(page, testInfo)
    })
  })

  test.describe('WCAG 2.1 - Resize Text (Zoom Levels)', () => {
    const zoomLevels = [
      { level: 100, scale: 1 },
      { level: 200, scale: 2 },
      { level: 300, scale: 3 },
      { level: 400, scale: 4 },
    ]

    test.describe('Dashboard', () => {
      for (const { level, scale } of zoomLevels) {
        test(`should be usable at ${level}% zoom`, async ({}, testInfo) => {
          await page.goto(postsUrl.admin)
          await expect(page.locator('.dashboard')).toBeVisible()

          // Simulate zoom by setting device scale factor
          await page.evaluate((zoomScale) => {
            document.body.style.zoom = String(zoomScale)
          }, scale)

          // Check for horizontal overflow after zoom
          const overflowResult = await checkHorizontalOverflow(page, testInfo)

          // At high zoom levels, some horizontal overflow might be acceptable
          // but we should at least verify the page is still functional
          // eslint-disable-next-line playwright/no-conditional-in-test
          if (level <= 200) {
            // At 200% or less, should not have overflow
            expect(overflowResult.hasHorizontalOverflow).toBe(false)
          }

          // Run axe scan at this zoom level
          const axeResults = await runAxeScan({ page, testInfo })
          expect(axeResults.violations.length).toBe(0)
        })
      }
    })

    test.describe('Posts create view', () => {
      for (const { level, scale } of zoomLevels) {
        test(`should be usable at ${level}% zoom`, async ({}, testInfo) => {
          await page.goto(postsUrl.create)
          await expect(page.locator('#field-title')).toBeVisible()

          await page.evaluate((zoomScale) => {
            document.body.style.zoom = String(zoomScale)
          }, scale)

          const overflowResult = await checkHorizontalOverflow(page, testInfo)

          if (level <= 200) {
            expect(overflowResult.hasHorizontalOverflow).toBe(false)
          }

          // Verify title field is still accessible
          const titleField = page.locator('#field-title')
          await expect(titleField).toBeVisible()

          // @todo: Excluding field descriptions due to known issue
          const axeResults = await runAxeScan({ page, testInfo, exclude: ['.field-description'] })
          expect(axeResults.violations.length).toBe(0)
        })
      }
    })

    test.describe('Posts list view', () => {
      for (const { level, scale } of zoomLevels) {
        test(`should be usable at ${level}% zoom`, async ({}, testInfo) => {
          await page.goto(postsUrl.list)
          await expect(page.locator('.list-controls')).toBeVisible()

          await page.evaluate((zoomScale) => {
            document.body.style.zoom = String(zoomScale)
          }, scale)

          const overflowResult = await checkHorizontalOverflow(page, testInfo)

          if (level <= 200) {
            expect(overflowResult.hasHorizontalOverflow).toBe(false)
          }

          // Verify list controls are still accessible
          const listControls = page.locator('.list-controls')
          await expect(listControls).toBeVisible()

          // @todo: Excluding checkbox-input due to known issue with bulk edit checkboxes
          const axeResults = await runAxeScan({ page, testInfo, exclude: ['.checkbox-input'] })
          expect(axeResults.violations.length).toBe(0)
        })
      }
    })

    test.describe('Account page', () => {
      for (const { level, scale } of zoomLevels) {
        test.fixme(`should be usable at ${level}% zoom`, async ({}, testInfo) => {
          await page.goto(postsUrl.account)
          await expect(page.locator('.auth-fields')).toBeVisible()

          await page.evaluate((zoomScale) => {
            document.body.style.zoom = String(zoomScale)
          }, scale)

          const overflowResult = await checkHorizontalOverflow(page, testInfo)

          if (level <= 200) {
            expect(overflowResult.hasHorizontalOverflow).toBe(false)
          }

          const axeResults = await runAxeScan({ page, testInfo })
          expect(axeResults.violations.length).toBe(0)
        })
      }
    })

    test.describe('Media collection', () => {
      for (const { level, scale } of zoomLevels) {
        test(`Media list view should be usable at ${level}% zoom`, async ({}, testInfo) => {
          await page.goto(mediaUrl.list)
          await expect(page.locator('.collection-list')).toBeVisible()

          await page.evaluate((zoomScale) => {
            document.body.style.zoom = String(zoomScale)
          }, scale)

          const overflowResult = await checkHorizontalOverflow(page, testInfo)

          if (level <= 200) {
            expect(overflowResult.hasHorizontalOverflow).toBe(false)
          }

          const axeResults = await runAxeScan({ page, testInfo })
          expect(axeResults.violations.length).toBe(0)
        })
      }
    })

    test.describe('Navigation sidebar', () => {
      for (const { level, scale } of zoomLevels) {
        test(`should be usable at ${level}% zoom`, async ({}, testInfo) => {
          await page.goto(postsUrl.admin)
          await expect(page.locator('.nav')).toBeVisible()

          await page.evaluate((zoomScale) => {
            document.body.style.zoom = String(zoomScale)
          }, scale)

          const overflowResult = await checkHorizontalOverflow(page, testInfo)

          if (level <= 200) {
            expect(overflowResult.hasHorizontalOverflow).toBe(false)
          }

          // Verify navigation is still accessible
          const nav = page.locator('.nav')
          await expect(nav).toBeVisible()

          const axeResults = await runAxeScan({ page, testInfo })
          expect(axeResults.violations.length).toBe(0)
        })
      }
    })
  })
})
