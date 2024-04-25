import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import { v4 as uuid } from 'uuid'

import payload from '../../packages/payload/src'
import { initPageConsoleErrorCatch, login, saveDocAndAssert } from '../helpers'
import { AdminUrlUtil } from '../helpers/adminUrlUtil'
import { initPayloadE2E } from '../helpers/configHelpers'
import { apiKeysSlug, slug } from './shared'

/**
 * TODO: Auth
 *   create first user
 *   unlock
 *   log out
 */

const { beforeAll, describe } = test

const headers = {
  'Content-Type': 'application/json',
}

describe('auth', () => {
  let page: Page
  let url: AdminUrlUtil
  let serverURL: string
  let apiURL: string

  beforeAll(async ({ browser }) => {
    serverURL = (await initPayloadE2E(__dirname)).serverURL
    apiURL = `${serverURL}/api`

    const context = await browser.newContext()
    page = await context.newPage()
    initPageConsoleErrorCatch(page)

    await login({
      page,
      serverURL,
    })
  })

  describe('authenticated users', () => {
    beforeAll(async ({ browser }) => {
      url = new AdminUrlUtil(serverURL, slug)
    })

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

  describe('api-keys', () => {
    let user

    beforeAll(async () => {
      url = new AdminUrlUtil(serverURL, apiKeysSlug)

      user = await payload.create({
        collection: apiKeysSlug,
        data: {
          apiKey: uuid(),
          enableAPIKey: true,
        },
      })
    })

    test('should enable api key', async () => {
      await page.goto(url.create)

      // click enable api key checkbox
      await page.locator('#field-enableAPIKey').click()

      // assert that the value is set
      const apiKey = await page.locator('#apiKey').inputValue()
      expect(apiKey).toBeDefined()

      await saveDocAndAssert(page)

      expect(await page.locator('#apiKey').inputValue()).toStrictEqual(apiKey)
    })

    test('should disable api key', async () => {
      await page.goto(url.edit(user.id))

      // click enable api key checkbox
      await page.locator('#field-enableAPIKey').click()

      // assert that the apiKey field is hidden
      await expect(page.locator('#apiKey')).toBeHidden()

      await saveDocAndAssert(page)

      // use the api key in a fetch to assert that it is disabled
      const response = await fetch(`${apiURL}/${apiKeysSlug}/me`, {
        headers: {
          ...headers,
          Authorization: `${apiKeysSlug} API-Key ${user.apiKey}`,
        },
      }).then((res) => res.json())

      expect(response.user).toBeNull()
    })
  })
})
