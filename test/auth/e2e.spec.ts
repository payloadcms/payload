import type { BrowserContext, Page } from '@playwright/test'
import type { SanitizedConfig } from 'payload'

import { expect, test } from '@playwright/test'
import { devUser } from 'credentials.js'
import path from 'path'
import { wait } from 'payload/shared'
import { fileURLToPath } from 'url'
import { v4 as uuid } from 'uuid'

import type { PayloadTestSDK } from '../helpers/sdk/index.js'
import type { Config } from './payload-types.js'

import {
  ensureCompilationIsDone,
  exactText,
  getRoutes,
  initPageConsoleErrorCatch,
  saveDocAndAssert,
} from '../helpers.js'
import { AdminUrlUtil } from '../helpers/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../helpers/initPayloadE2ENoConfig.js'
import { reInitializeDB } from '../helpers/reInitializeDB.js'
import { POLL_TOPASS_TIMEOUT, TEST_TIMEOUT_LONG } from '../playwright.config.js'
import { apiKeysSlug, publicUsersSlug, slug } from './shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

let payload: PayloadTestSDK<Config>

const { beforeAll, describe } = test

const headers = {
  'Content-Type': 'application/json',
}

const createFirstUser = async ({
  page,
  serverURL,
}: {
  customAdminRoutes?: SanitizedConfig['admin']['routes']
  customRoutes?: SanitizedConfig['routes']
  page: Page
  serverURL: string
}) => {
  const {
    admin: {
      routes: { createFirstUser: createFirstUserRoute },
    },
    routes: { admin: adminRoute },
  } = getRoutes({})

  // wait for create first user route
  await page.goto(serverURL + `${adminRoute}${createFirstUserRoute}`)

  // forget to fill out confirm password
  await page.locator('#field-email').fill(devUser.email)
  await page.locator('#field-password').fill(devUser.password)
  await page.locator('.form-submit > button').click()
  await expect(page.locator('.field-type.confirm-password .field-error')).toHaveText(
    'This field is required.',
  )

  // make them match, but does not pass password validation
  await page.locator('#field-email').fill(devUser.email)
  await page.locator('#field-password').fill('12')
  await page.locator('#field-confirm-password').fill('12')
  await page.locator('.form-submit > button').click()
  await expect(page.locator('.field-type.password .field-error')).toHaveText(
    'This value must be longer than the minimum length of 3 characters.',
  )

  await page.locator('#field-email').fill(devUser.email)
  await page.locator('#field-password').fill(devUser.password)
  await page.locator('#field-confirm-password').fill(devUser.password)
  await page.locator('#field-custom').fill('Hello, world!')
  await page.locator('.form-submit > button').click()

  await expect
    .poll(() => page.url(), { timeout: POLL_TOPASS_TIMEOUT })
    .not.toContain('create-first-user')
}

describe('auth', () => {
  let page: Page
  let context: BrowserContext
  let url: AdminUrlUtil
  let serverURL: string
  let apiURL: string

  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    ;({ payload, serverURL } = await initPayloadE2ENoConfig<Config>({ dirname }))
    apiURL = `${serverURL}/api`
    url = new AdminUrlUtil(serverURL, slug)

    context = await browser.newContext()
    page = await context.newPage()
    initPageConsoleErrorCatch(page)

    await ensureCompilationIsDone({ page, serverURL, noAutoLogin: true })

    // Undo onInit seeding, as we need to test this without having a user created, or testing create-first-user
    await reInitializeDB({
      serverURL,
      snapshotKey: 'auth',
      deleteOnly: true,
    })

    await payload.create({
      collection: apiKeysSlug,
      data: {
        apiKey: uuid(),
        enableAPIKey: true,
      },
    })

    await payload.create({
      collection: apiKeysSlug,
      data: {
        apiKey: uuid(),
        enableAPIKey: true,
      },
    })

    await payload.create({
      collection: publicUsersSlug,
      data: {
        email: 'public-user@payloadcms.com',
        password: devUser.password,
        _verified: true,
      },
    })

    await createFirstUser({ page, serverURL })

    await ensureCompilationIsDone({ page, serverURL })
  })

  describe('passwords', () => {
    beforeAll(() => {
      url = new AdminUrlUtil(serverURL, slug)
    })

    test('should allow change password', async () => {
      await page.goto(url.account)
      const emailBeforeSave = await page.locator('#field-email').inputValue()
      await page.locator('#change-password').click()
      await page.locator('#field-password').fill('password')
      // should fail to save without confirm password
      await page.locator('#action-save').click()
      await expect(
        page.locator('.field-type.confirm-password .tooltip--show', {
          hasText: exactText('This field is required.'),
        }),
      ).toBeVisible()

      // should fail to save with incorrect confirm password
      await page.locator('#field-confirm-password').fill('wrong password')
      await page.locator('#action-save').click()
      await expect(
        page.locator('.field-type.confirm-password .tooltip--show', {
          hasText: exactText('Passwords do not match.'),
        }),
      ).toBeVisible()

      // should succeed with matching confirm password
      await page.locator('#field-confirm-password').fill('password')
      await saveDocAndAssert(page, '#action-save')

      // should still have the same email
      await expect(page.locator('#field-email')).toHaveValue(emailBeforeSave)
    })

    test('should prevent new user creation without confirm password', async () => {
      await page.goto(url.create)
      await page.locator('#field-email').fill('dev2@payloadcms.com')
      await page.locator('#field-password').fill('password')
      // should fail to save without confirm password
      await page.locator('#action-save').click()
      await expect(
        page.locator('.field-type.confirm-password .tooltip--show', {
          hasText: exactText('This field is required.'),
        }),
      ).toBeVisible()

      // should succeed with matching confirm password
      await page.locator('#field-confirm-password').fill('password')
      await saveDocAndAssert(page, '#action-save')
    })
  })

  describe('authenticated users', () => {
    beforeAll(() => {
      url = new AdminUrlUtil(serverURL, slug)
    })

    test('should have up-to-date user in `useAuth` hook', async () => {
      await page.goto(url.account)
      await page.waitForURL(url.account)
      await expect(page.locator('#users-api-result')).toHaveText('Hello, world!')
      await expect(page.locator('#use-auth-result')).toHaveText('Hello, world!')
      const field = page.locator('#field-custom')
      await field.fill('Goodbye, world!')
      await saveDocAndAssert(page)
      await expect(page.locator('#users-api-result')).toHaveText('Goodbye, world!')
      await expect(page.locator('#use-auth-result')).toHaveText('Goodbye, world!')
    })
  })

  describe('unauthorized users', () => {
    test('unauthenticated users should not have access to the admin panel', async () => {
      await page.goto(url.logout)
      await page.goto(url.admin)

      await expect(page.locator('.unauthorized .form-header h1')).toHaveText(
        'Unauthorized, you must be logged in to make this request.',
      )
    })

    test('public users should not have access to access admin', async () => {
      await page.goto(url.logout)

      const user = await payload.login({
        collection: publicUsersSlug,
        data: {
          email: 'public-user@payloadcms.com',
          password: devUser.password,
        },
      })

      await context.addCookies([
        {
          name: 'payload-token',
          value: user.token,
          domain: 'localhost',
          path: '/',
          httpOnly: true,
          secure: true,
        },
      ])

      await page.reload()

      await page.goto(url.admin)

      await expect(page.locator('.unauthorized .form-header h1')).toHaveText(
        'Unauthorized, this user does not have access to the admin panel.',
      )
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
      const apiKeyLocator = page.locator('#apiKey')
      await expect
        .poll(async () => await apiKeyLocator.inputValue(), { timeout: POLL_TOPASS_TIMEOUT })
        .toBeDefined()

      const apiKey = await apiKeyLocator.inputValue()

      await saveDocAndAssert(page)

      await expect(async () => {
        const apiKeyAfterSave = await apiKeyLocator.inputValue()
        expect(apiKey).toStrictEqual(apiKeyAfterSave)
      }).toPass({
        timeout: POLL_TOPASS_TIMEOUT,
      })
    })

    test('should disable api key', async () => {
      await page.goto(url.edit(user.id))

      // click enable api key checkbox
      await page.locator('#field-enableAPIKey').click()

      // assert that the apiKey field is hidden
      await expect(page.locator('#apiKey')).toBeHidden()

      await saveDocAndAssert(page)

      // use the api key in a fetch to assert that it is disabled
      await expect(async () => {
        const response = await fetch(`${apiURL}/${apiKeysSlug}/me`, {
          headers: {
            ...headers,
            Authorization: `${apiKeysSlug} API-Key ${user.apiKey}`,
          },
        }).then((res) => res.json())

        expect(response.user).toBeNull()
      }).toPass({
        timeout: POLL_TOPASS_TIMEOUT,
      })
    })
  })
})
