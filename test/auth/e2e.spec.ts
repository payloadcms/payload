import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'

import { initPageConsoleErrorCatch, login, saveDocAndAssert } from '../helpers'
import { AdminUrlUtil } from '../helpers/adminUrlUtil'
import { initPayloadE2E } from '../helpers/configHelpers'
import { slug } from './shared'

/**
 * TODO: Auth
 *   create first user
 *   unlock
 *   generate api key
 *   log out
 */

const { beforeAll, describe } = test

describe('auth', () => {
  let page: Page
  let url: AdminUrlUtil

  beforeAll(async ({ browser }) => {
    const { serverURL } = await initPayloadE2E(__dirname)
    url = new AdminUrlUtil(serverURL, slug)

    const context = await browser.newContext()
    page = await context.newPage()
    initPageConsoleErrorCatch(page)

    await login({
      page,
      serverURL,
    })
  })

  describe('authenticated users', () => {
    test('should allow change password', async () => {
      await page.goto(url.account)
      const emailBeforeSave = await page.locator('#field-email').inputValue()
      await page.locator('#change-password').click()
      await page.locator('#field-password').fill('password')
      await page.locator('#field-confirm-password').fill('password')

      await saveDocAndAssert(page)

      await expect(page.locator('#field-email')).toHaveValue(emailBeforeSave)
    })

    test('should have up-to-date user in `useAuth` hook', async () => {
      await page.goto(url.account)

      await expect(page.locator('#users-api-result')).toHaveText('Hello, world!')
      await expect(page.locator('#use-auth-result')).toHaveText('Hello, world!')

      const field = page.locator('#field-custom')
      await field.fill('Goodbye, world!')
      await saveDocAndAssert(page)

      await expect(page.locator('#users-api-result')).toHaveText('Goodbye, world!')
      await expect(page.locator('#use-auth-result')).toHaveText('Goodbye, world!')
    })
  })
})
