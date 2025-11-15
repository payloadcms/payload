import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

import { ensureCompilationIsDone, initPageConsoleErrorCatch } from '../helpers.js'
import { initPayloadE2ENoConfig } from '../helpers/initPayloadE2ENoConfig.js'
import { TEST_TIMEOUT_LONG } from '../playwright.config.js'

const { beforeAll, describe } = test
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

describe('Empty Dashboard', () => {
  let serverURL: string
  let page: Page

  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)

    // Initialize Payload
    ;({ serverURL } = await initPayloadE2ENoConfig({ dirname }))

    // Set up browser context
    const context = await browser.newContext()
    page = await context.newPage()
    initPageConsoleErrorCatch(page)

    // Wait for compilation to complete
    await ensureCompilationIsDone({ page, serverURL })
  })

  test('should display empty dashboard component', async () => {
    // Navigate to admin dashboard
    await page.goto(`${serverURL}/admin`)

    // Wait for the empty dashboard to be visible
    const emptyDashboard = page.locator('.empty-dashboard')
    await expect(emptyDashboard).toBeVisible()

    // Verify the content
    const title = emptyDashboard.locator('h4')
    await expect(title).toHaveText('Empty Dashboard')

    const description = emptyDashboard.locator('p')
    await expect(description).toContainText('This is a custom empty dashboard component.')
  })
})
