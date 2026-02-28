import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import path from 'path'
import { TEST_TIMEOUT_LONG } from 'playwright.config.js'
import { fileURLToPath } from 'url'

import type { Config } from '../../payload-types.js'

import { ensureCompilationIsDone, initPageConsoleErrorCatch } from '../../../helpers.js'
import { AdminUrlUtil } from '../../../helpers/adminUrlUtil.js'
import { openNav } from '../../../helpers/e2e/toggleNav.js'
import { initPayloadE2ENoConfig } from '../../../helpers/initPayloadE2ENoConfig.js'

const filename = fileURLToPath(import.meta.url)
const currentFolder = path.dirname(filename)
const dirname = path.resolve(currentFolder, '../../')

const { beforeAll, describe } = test

let page: Page
let serverURL: string
let adminUrl: AdminUrlUtil

describe('Sidebar Tabs', () => {
  beforeAll(async ({ browser }, testInfo) => {
    const prebuild = false // Boolean(process.env.CI)
    testInfo.setTimeout(TEST_TIMEOUT_LONG)

    const config = await initPayloadE2ENoConfig<Config>({ dirname, prebuild })
    serverURL = config.serverURL

    adminUrl = new AdminUrlUtil(serverURL, 'admin')

    const context = await browser.newContext()
    page = await context.newPage()

    initPageConsoleErrorCatch(page)
    await ensureCompilationIsDone({ page, serverURL })
  })

  describe('Custom Tabs', () => {
    test('should render custom sidebar tabs', async () => {
      await page.goto(adminUrl.admin)
      await page.waitForURL(adminUrl.admin)
      await openNav(page)

      const foldersTabButton = page.locator('button[title="Folders"]')
      const settingsTabButton = page.locator('button[title="Settings"]')

      await expect(foldersTabButton).toBeVisible()
      await expect(settingsTabButton).toBeVisible()
    })

    test('should switch to custom tab when clicked', async () => {
      await page.goto(adminUrl.admin)
      await page.waitForURL(adminUrl.admin)
      await openNav(page)

      const customTabButton = page.locator('button[title="Folders"]').first()

      await customTabButton.click()

      const customTabContent = page.locator('text=Example folders tab content.')

      await expect(customTabContent).toBeVisible()
    })

    test('should persist active tab in preferences', async () => {
      await page.goto(adminUrl.admin)
      await page.waitForURL(adminUrl.admin)
      await openNav(page)

      const customTabButton = page.locator('button[title="Folders"]').first()

      await customTabButton.click()

      await page.reload()
      await openNav(page)

      const customTabContent = page.locator('text=Example folders tab content.')

      await expect(customTabContent).toBeVisible()
      await expect(customTabButton).toHaveClass(/sidebar-tabs__tab--active/)
    })

    test('should render default nav tab', async () => {
      await page.goto(adminUrl.admin)
      await page.waitForURL(adminUrl.admin)
      await openNav(page)

      const defaultNavButton = page.locator('button[title="Collections"]')

      await expect(defaultNavButton).toBeVisible()
    })

    test('should show collections when default nav tab is active', async () => {
      await page.goto(adminUrl.admin)
      await page.waitForURL(adminUrl.admin)
      await openNav(page)

      const defaultNavButton = page.locator('button[title="Collections"]')

      await defaultNavButton.click()

      const postsLink = page.locator('a[id="nav-posts"]')

      await expect(postsLink).toBeVisible()
    })
  })
})
