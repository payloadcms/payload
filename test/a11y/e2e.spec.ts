import type { Page, TestInfo } from '@playwright/test'

import { expect, test } from '@playwright/test'
import * as path from 'path'
import { fileURLToPath } from 'url'

import { ensureCompilationIsDone, initPageConsoleErrorCatch } from '../helpers.js'
import { AdminUrlUtil } from '../helpers/adminUrlUtil.js'
import { checkFocusIndicators } from '../helpers/e2e/checkFocusIndicators.js'
import { runAxeScan } from '../helpers/e2e/runAxeScan.js'
import { initPayloadE2ENoConfig } from '../helpers/initPayloadE2ENoConfig.js'
import { TEST_TIMEOUT_LONG } from '../playwright.config.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

test.describe('A11y', () => {
  let page: Page
  let postsUrl: AdminUrlUtil
  let mediaUrl: AdminUrlUtil
  let serverURL: string

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

  test('Dashboard', async ({}, testInfo) => {
    await page.goto(postsUrl.admin)

    await page.locator('.dashboard').waitFor()

    const accessibilityScanResults = await runAxeScan(page, testInfo)

    expect.soft(accessibilityScanResults.violations.length).toEqual(0)
  })

  test('Account page', async ({}, testInfo) => {
    await page.goto(postsUrl.account)

    await page.locator('.account').waitFor()

    const accessibilityScanResults = await runAxeScan(page, testInfo)

    expect.soft(accessibilityScanResults.violations.length).toBe(0)
  })

  test.describe('Posts Collection', () => {
    test('list view', async ({}, testInfo) => {
      await page.goto(postsUrl.list)

      await page.locator('.list-controls').waitFor()

      const accessibilityScanResults = await runAxeScan(page, testInfo)

      expect.soft(accessibilityScanResults.violations.length).toBe(0)
    })

    test('create view', async ({}, testInfo) => {
      await page.goto(postsUrl.create)

      await page.locator('#field-title').waitFor()

      const accessibilityScanResults = await runAxeScan(page, testInfo)

      expect.soft(accessibilityScanResults.violations.length).toBe(0)
    })

    test('edit view', async ({}, testInfo) => {
      await page.goto(postsUrl.list)

      await page.locator('.table a').first().click()
      await page.locator('#field-title').waitFor()

      const accessibilityScanResults = await runAxeScan(page, testInfo)

      expect.soft(accessibilityScanResults.violations.length).toBe(0)
    })
  })

  test.describe('Media Collection', () => {
    test('list view', async ({}, testInfo) => {
      await page.goto(mediaUrl.list)

      await page.locator('.list-controls').waitFor()

      const accessibilityScanResults = await runAxeScan(page, testInfo)

      expect.soft(accessibilityScanResults.violations.length).toBe(0)
    })

    test('create view', async ({}, testInfo) => {
      await page.goto(mediaUrl.create)

      await page.locator('input[type="file"]').waitFor()

      const accessibilityScanResults = await runAxeScan(page, testInfo)

      expect.soft(accessibilityScanResults.violations.length).toBe(0)
    })
  })

  test.describe('Keyboard Navigation & Focus Indicators', () => {
    test('Dashboard - should have visible focus indicators', async ({}, testInfo) => {
      await page.goto(postsUrl.admin)

      await page.locator('.dashboard').waitFor()

      const result = await checkFocusIndicators({
        page,
        testInfo,
        verbose: false,
      })

      expect.soft(result.totalFocusableElements).toBeGreaterThan(0)
      expect.soft(result.elementsWithoutIndicators).toBe(0)
    })

    test('Posts create view - fields should have visible focus indicators', async ({}, testInfo) => {
      await page.goto(postsUrl.create)

      await page.locator('#field-title').waitFor()

      const result = await checkFocusIndicators({
        page,
        selector: 'main.collection-edit',
        testInfo,
      })

      expect.soft(result.totalFocusableElements).toBeGreaterThan(0)
      expect.soft(result.elementsWithoutIndicators).toBe(0)
    })

    test('Posts create view - breadcrumbs should have visible focus indicators', async ({}, testInfo) => {
      await page.goto(postsUrl.create)

      await page.locator('#field-title').waitFor()

      const result = await checkFocusIndicators({
        page,
        selector: '.app-header__controls-wrapper',
        testInfo,
      })

      expect.soft(result.totalFocusableElements).toBeGreaterThan(0)
      expect.soft(result.elementsWithoutIndicators).toBe(0)
    })

    test('Navigation sidebar - should have visible focus indicators', async ({}, testInfo) => {
      await page.goto(postsUrl.admin)

      await page.locator('.nav').waitFor()

      const result = await checkFocusIndicators({
        page,
        selector: '.nav',
        testInfo,
      })

      expect.soft(result.totalFocusableElements).toBeGreaterThan(0)
      expect.soft(result.elementsWithoutIndicators).toBe(0)
    })

    test('Account page - should have visible focus indicators', async ({}, testInfo) => {
      await page.goto(postsUrl.account)

      await page.locator('.account').waitFor()

      const result = await checkFocusIndicators({
        page,
        testInfo,
        verbose: false,
      })

      expect.soft(result.totalFocusableElements).toBeGreaterThan(0)
      expect.soft(result.elementsWithoutIndicators).toBe(0)
    })
  })
})
