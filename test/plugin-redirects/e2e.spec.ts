import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../__helpers/shared/sdk/index.js'
import type { Config } from './payload-types.js'

import {
  ensureCompilationIsDone,
  initPageConsoleErrorCatch,
  saveDocAndAssert,
} from '../__helpers/e2e/helpers.js'
import { AdminUrlUtil } from '../__helpers/shared/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../__helpers/shared/initPayloadE2ENoConfig.js'
import { TEST_TIMEOUT_LONG } from '../playwright.config.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

test.describe('Redirects Plugin', () => {
  let page: Page
  let redirectsUrl: AdminUrlUtil
  let payload: PayloadTestSDK<Config>
  let serverURL: string

  test.beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    const { payload: payloadFromInit, serverURL: serverFromInit } =
      await initPayloadE2ENoConfig<Config>({
        dirname,
      })
    redirectsUrl = new AdminUrlUtil(serverFromInit, 'redirects')
    serverURL = serverFromInit
    payload = payloadFromInit

    const context = await browser.newContext()
    page = await context.newPage()
    initPageConsoleErrorCatch(page)

    await ensureCompilationIsDone({ page, serverURL })
  })

  test.describe('Redirects collection', () => {
    test('should display translated field labels in English (with custom override)', async () => {
      await page.goto(redirectsUrl.create)

      // Wait for page to load
      await page.waitForSelector('#field-from', { timeout: 10000 })

      // Check custom override for "from" field
      const fromLabel = page.locator('label[for="field-from"]')
      await expect(fromLabel).toContainText('Source URL (Custom)')

      // Check radio button labels (these are auto-injected by plugin)
      const internalLinkOption = page.locator('label[for="field-to.type-reference"]')
      await expect(internalLinkOption).toContainText('Internal link')

      const customUrlOption = page.locator('label[for="field-to.type-custom"]')
      await expect(customUrlOption).toContainText('Custom URL')

      // Check the override field still works
      const redirectTypeLabel = page.locator('label[for="field-type"]')
      await expect(redirectTypeLabel).toContainText('Redirect Type (Overridden)')
    })

    test('should display translated field labels in Spanish', async () => {
      // Change user language to Spanish
      await page.goto(serverURL + '/admin/account')
      await page.waitForSelector('.payload-settings__language .react-select')
      await page.locator('.payload-settings__language .react-select').click()
      await page.locator('.rs__option', { hasText: 'Español' }).click()

      // Wait for settings to save
      await page.waitForTimeout(500)

      await page.goto(redirectsUrl.create)
      await page.waitForSelector('#field-from', { timeout: 10000 })

      // Check Spanish translations (auto-injected by plugin)
      const fromLabel = page.locator('label[for="field-from"]')
      await expect(fromLabel).toContainText('URL de origen')

      const internalLinkOption = page.locator('label[for="field-to.type-reference"]')
      await expect(internalLinkOption).toContainText('Enlace interno')

      const customUrlOption = page.locator('label[for="field-to.type-custom"]')
      await expect(customUrlOption).toContainText('URL personalizada')
    })

    test('should display translated field labels in German (custom translation)', async () => {
      // Change user language to German
      await page.goto(serverURL + '/admin/account')
      await page.waitForSelector('.payload-settings__language .react-select')
      await page.locator('.payload-settings__language .react-select').click()
      await page.locator('.rs__option', { hasText: 'Deutsch' }).click()

      // Wait for settings to save
      await page.waitForTimeout(500)

      await page.goto(redirectsUrl.create)
      await page.waitForSelector('#field-from', { timeout: 10000 })

      // Check German translations (from config override)
      const fromLabel = page.locator('label[for="field-from"]')
      await expect(fromLabel).toContainText('Quell-URL')

      const internalLinkOption = page.locator('label[for="field-to.type-reference"]')
      await expect(internalLinkOption).toContainText('Interner Link')

      const customUrlOption = page.locator('label[for="field-to.type-custom"]')
      await expect(customUrlOption).toContainText('Benutzerdefinierte URL')
    })
  })
})
