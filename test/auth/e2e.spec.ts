import type { BrowserContext, Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import { devUser } from 'credentials.js'
import { openNav } from 'helpers/e2e/toggleNav.js'
import path from 'path'
import { fileURLToPath } from 'url'
import { v4 as uuid } from 'uuid'

import type { PayloadTestSDK } from '../helpers/sdk/index.js'
import type { Config } from './payload-types.js'

import {
  ensureCompilationIsDone,
  exactText,
  getRoutes,
  initPageConsoleErrorCatch,
  login,
  saveDocAndAssert,
} from '../helpers.js'
import { AdminUrlUtil } from '../helpers/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../helpers/initPayloadE2ENoConfig.js'
import { reInitializeDB } from '../helpers/reInitializeDB.js'
import { POLL_TOPASS_TIMEOUT, TEST_TIMEOUT_LONG } from '../playwright.config.js'
import { apiKeysSlug, slug } from './shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

let payload: PayloadTestSDK<Config>

const { beforeAll, afterAll, describe } = test

const headers = {
  'Content-Type': 'application/json',
}

describe('Auth', () => {
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
  })
  describe('create first user', () => {
    beforeAll(async () => {
      await reInitializeDB({
        serverURL,
        snapshotKey: 'create-first-user',
        deleteOnly: true,
      })

      await ensureCompilationIsDone({ page, serverURL, noAutoLogin: true })

      await payload.delete({
        collection: slug,
        where: {
          email: {
            exists: true,
          },
        },
      })
    })

    async function waitForVisibleAuthFields() {
      await expect(page.locator('#field-email')).toBeVisible()
      await expect(page.locator('#field-password')).toBeVisible()
      await expect(page.locator('#field-confirm-password')).toBeVisible()
    }

    test('should create first user and redirect to admin', async () => {
      const {
        admin: {
          routes: { createFirstUser: createFirstUserRoute },
        },
        routes: { admin: adminRoute },
      } = getRoutes({})

      // wait for create first user route
      await page.goto(serverURL + `${adminRoute}${createFirstUserRoute}`)

      await expect(page.locator('.create-first-user')).toBeVisible()

      await waitForVisibleAuthFields()

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

      // should fill out all fields correctly
      await page.locator('#field-email').fill(devUser.email)
      await page.locator('#field-password').fill(devUser.password)
      await page.locator('#field-confirm-password').fill(devUser.password)
      await page.locator('#field-custom').fill('Hello, world!')

      await page.locator('.form-submit > button').click()

      await expect
        .poll(() => page.url(), { timeout: POLL_TOPASS_TIMEOUT })
        .not.toContain('create-first-user')
    })
  })

  describe('non create first user', () => {
    beforeAll(async () => {
      await reInitializeDB({
        serverURL,
        snapshotKey: 'auth',
        deleteOnly: false,
      })

      await ensureCompilationIsDone({ page, serverURL, noAutoLogin: true })

      await login({ page, serverURL })
    })

    describe('passwords', () => {
      beforeAll(() => {
        url = new AdminUrlUtil(serverURL, slug)
      })

      afterAll(async () => {
        // reset password to original password
        await page.goto(url.account)
        await page.locator('#change-password').click()
        await page.locator('#field-password').fill(devUser.password)
        await page.locator('#field-confirm-password').fill(devUser.password)
        await saveDocAndAssert(page, '#action-save')
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
        await expect(page.locator('#users-api-result')).toHaveText('Hello, world!')
        await expect(page.locator('#use-auth-result')).toHaveText('Hello, world!')
        const field = page.locator('#field-custom')
        await field.fill('Goodbye, world!')
        await saveDocAndAssert(page)
        await expect(page.locator('#users-api-result')).toHaveText('Goodbye, world!')
        await expect(page.locator('#use-auth-result')).toHaveText('Goodbye, world!')
      })

      // Need to test unlocking documents on logout here as this test suite does not auto login users
      test('should unlock document on logout after editing without saving', async () => {
        await page.goto(url.list)

        await page.locator('.table .row-1 .cell-custom a').click()

        const textInput = page.locator('#field-namedSaveToJWT')
        await expect(textInput).toBeVisible()
        const docID = (await page.locator('.render-title').getAttribute('data-doc-id')) as string

        const lockDocRequest = page.waitForResponse(
          (response) =>
            response.request().method() === 'POST' && response.request().url() === url.edit(docID),
        )
        await textInput.fill('some text')
        await lockDocRequest

        const lockedDocs = await payload.find({
          collection: 'payload-locked-documents',
          limit: 1,
          pagination: false,
        })

        await expect.poll(() => lockedDocs.docs.length).toBe(1)

        await openNav(page)

        await page.locator('.nav .nav__controls a[href="/admin/logout"]').click()

        // Locate the modal container
        const modalContainer = page.locator('.payload__modal-container')
        await expect(modalContainer).toBeVisible()

        // Click the "Leave anyway" button
        await page
          .locator('#leave-without-saving .confirmation-modal__controls .btn--style-primary')
          .click()

        await expect(page.locator('.login')).toBeVisible()

        const unlockedDocs = await payload.find({
          collection: 'payload-locked-documents',
          limit: 1,
          pagination: false,
        })

        await expect.poll(() => unlockedDocs.docs.length).toBe(0)

        // added so tests after this do not need to re-login
        await login({ page, serverURL })
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
})
