import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import { devUser } from 'credentials.js'
import path from 'path'
import { formatAdminURL } from 'payload/shared'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../helpers/sdk/index.js'
import type { Config } from './payload-types.js'

import { ensureCompilationIsDone, getRoutes, initPageConsoleErrorCatch } from '../helpers.js'
import { AdminUrlUtil } from '../helpers/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../helpers/initPayloadE2ENoConfig.js'
import { TEST_TIMEOUT_LONG } from '../playwright.config.js'

test.describe.configure({ mode: 'serial' })

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

let payload: PayloadTestSDK<Config>

const { beforeAll, describe } = test

describe('Server Functions', () => {
  let page: Page
  let url: AdminUrlUtil
  let serverURL: string
  let adminRoute: string

  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    ;({ payload, serverURL } = await initPayloadE2ENoConfig<Config>({ dirname }))
    url = new AdminUrlUtil(serverURL, 'users')

    const {
      routes: { admin: adminRouteFromConfig },
    } = getRoutes({})
    adminRoute = adminRouteFromConfig

    const context = await browser.newContext()
    page = await context.newPage()
    initPageConsoleErrorCatch(page)

    await ensureCompilationIsDone({
      page,
      serverURL,
      noAutoLogin: true,
    })
  })

  describe('Auth functions', () => {
    test('should log user in from login server function', async () => {
      await page.goto(formatAdminURL({ adminRoute, path: '', serverURL }))

      // Expect email and password fields to be visible
      await expect(page.locator('#email')).toBeVisible()
      await expect(page.locator('#password')).toBeVisible()

      await page.fill('#email', devUser.email)
      await page.fill('#password', devUser.password)

      const loginButton = page.locator('text=Custom Login')
      await expect(loginButton).toBeVisible()
      await loginButton.click()
      await page.waitForTimeout(1000)

      await page.reload()
      await page.goto(formatAdminURL({ adminRoute, path: '/account', serverURL }))
      await expect(page.locator('h1[title="dev@payloadcms.com"]')).toBeVisible()
    })

    test('should refresh user from refresh server function', async () => {
      await page.goto(formatAdminURL({ adminRoute, path: '', serverURL }))

      const initialCookie = await page.context().cookies()
      const payloadToken = initialCookie.find((cookie) => cookie.name === 'payload-token')
      expect(payloadToken).toBeDefined()
      const initialExpiry = payloadToken?.expires

      const refreshButton = page.locator('text=Custom Refresh')
      await expect(refreshButton).toBeVisible()
      await refreshButton.click()
      await page.waitForTimeout(1000)

      const updatedCookie = await page.context().cookies()
      const updatedPayloadToken = updatedCookie.find((cookie) => cookie.name === 'payload-token')
      expect(updatedPayloadToken).toBeDefined()
      expect(updatedPayloadToken?.expires).not.toBe(initialExpiry)
    })

    test('should log user out from logout server function', async () => {
      await page.goto(formatAdminURL({ adminRoute, path: '', serverURL }))
      const logoutButton = page.locator('text=Custom Logout')
      await expect(logoutButton).toBeVisible()
      await logoutButton.click()
      await page.waitForTimeout(1000)

      await page.reload()
      await page.goto(formatAdminURL({ adminRoute, path: '', serverURL }))
      await expect(page.locator('#email')).toBeVisible()
      await expect(page.locator('#password')).toBeVisible()
    })
  })
})
