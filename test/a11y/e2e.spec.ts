import type { Page, TestInfo } from '@playwright/test'
import type AxeResults from 'axe-core'

import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import * as path from 'path'
import { fileURLToPath } from 'url'

import { ensureCompilationIsDone, initPageConsoleErrorCatch } from '../helpers.js'
import { AdminUrlUtil } from '../helpers/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../helpers/initPayloadE2ENoConfig.js'
import { TEST_TIMEOUT_LONG } from '../playwright.config.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

async function runAxeScan(page: Page, testInfo: TestInfo) {
  const scanResults = await new AxeBuilder({ page }).analyze()

  expect(scanResults).toBeDefined()

  await testInfo.attach('accessibility-scan-results', {
    body: JSON.stringify(scanResults, null, 2),
    contentType: 'application/json',
  })

  await testInfo.attach('accessibility-scan-results-violations', {
    body: JSON.stringify(scanResults.violations, null, 2),
    contentType: 'application/json',
  })

  return scanResults
}

test.describe('A11y', () => {
  let page: Page
  let url: AdminUrlUtil

  test.beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)

    const { payload, serverURL } = await initPayloadE2ENoConfig({ dirname })
    url = new AdminUrlUtil(serverURL, 'posts')

    const context = await browser.newContext()
    page = await context.newPage()
    initPageConsoleErrorCatch(page)
    await ensureCompilationIsDone({ page, serverURL })
  })

  test('Dashboard', async ({}, testInfo) => {
    await page.goto(url.admin)

    await page.locator('.dashboard').waitFor()

    const accessibilityScanResults = await runAxeScan(page, testInfo)

    expect(accessibilityScanResults).toBeDefined()
    expect(accessibilityScanResults.violations.length).toBe(0)
  })

  test.describe('Collections', () => {
    test('list view', async ({}, testInfo) => {
      await page.goto(url.list)

      const accessibilityScanResults = await runAxeScan(page, testInfo)

      console.log({
        violations: accessibilityScanResults.violations,
        results: accessibilityScanResults,
      })

      expect(accessibilityScanResults.violations).toEqual([])
    })
  })
})
