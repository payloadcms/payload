import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'

import type { PayloadTestSDK } from '../../../helpers/sdk/index.js'
import type { Config } from '../../payload-types.js'

import { ensureCompilationIsDone, initPageConsoleErrorCatch } from '../../../helpers.js'
import { AdminUrlUtil } from '../../../helpers/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../../../helpers/initPayloadE2ENoConfig.js'

const { beforeAll, describe } = test

let payload: PayloadTestSDK<Config>
let page: Page
let serverURL: string
let adminUrl: AdminUrlUtil

describe('Sidebar Tabs', () => {
  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(testInfo.timeout + 60000)

    const config = await initPayloadE2ENoConfig({ dirname: __dirname, prebuild: true })
    serverURL = config.serverURL
    payload = config.payload

    adminUrl = new AdminUrlUtil(serverURL, 'admin')

    const context = await browser.newContext()
    page = await context.newPage()

    initPageConsoleErrorCatch(page)
    await ensureCompilationIsDone({ page, serverURL })
  })

  describe('Custom Tabs', () => {
    test('should render custom sidebar tab', async () => {
      await page.goto(adminUrl.admin)
      await page.waitForURL(adminUrl.admin)

      const customTabButton = page.locator('button[title="Custom Tab"]')

      await expect(customTabButton).toBeVisible()
    })

    test('should switch to custom tab when clicked', async () => {
      await page.goto(adminUrl.admin)
      await page.waitForURL(adminUrl.admin)

      const customTabButton = page.locator('button[title="Custom Tab"]')

      await customTabButton.click()

      const customTabContent = page.locator('text=This is a custom sidebar tab')

      await expect(customTabContent).toBeVisible()
    })

    test('should persist active tab in preferences', async () => {
      await page.goto(adminUrl.admin)
      await page.waitForURL(adminUrl.admin)

      const customTabButton = page.locator('button[title="Custom Tab"]')

      await customTabButton.click()

      await page.reload()

      const customTabContent = page.locator('text=This is a custom sidebar tab')

      await expect(customTabContent).toBeVisible()
      await expect(customTabButton).toHaveClass(/sidebar-tabs__tab--active/)
    })

    test('should render default nav tab', async () => {
      await page.goto(adminUrl.admin)
      await page.waitForURL(adminUrl.admin)

      const defaultNavButton = page.locator('button[title="Collections"]')

      await expect(defaultNavButton).toBeVisible()
    })

    test('should show collections when default nav tab is active', async () => {
      await page.goto(adminUrl.admin)
      await page.waitForURL(adminUrl.admin)

      const defaultNavButton = page.locator('button[title="Collections"]')

      await defaultNavButton.click()

      const postsLink = page.locator('a[id="nav-posts"]')

      await expect(postsLink).toBeVisible()
    })
  })
})
