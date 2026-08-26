import type { BrowserContext, Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import path from 'path'
import { formatAdminURL } from 'payload/shared'
import { fileURLToPath } from 'url'
import { v4 as uuid } from 'uuid'

import type { PayloadTestSDK } from '../__helpers/shared/sdk/index.js'
import type { Config } from './payload-types.js'

import { login } from '../__helpers/e2e/auth/login.js'
import { logout } from '../__helpers/e2e/auth/logout.js'
import { getRoutes, saveDocAndAssert } from '../__helpers/e2e/helpers.js'
import { AdminUrlUtil } from '../__helpers/shared/adminUrlUtil.js'
import { reInitializeDB } from '../__helpers/shared/clearAndSeed/reInitializeDB.js'
import { initPayloadE2ENoConfig } from '../__helpers/shared/initPayloadE2ENoConfig.js'
import { ensureCompilationIsDone } from '../__setup/e2e/ensureCompilationIsDone.js'
import { initPage } from '../__setup/e2e/initPage.js'
import { devUser } from '../credentials.js'
import { POLL_TOPASS_TIMEOUT, TEST_TIMEOUT_LONG } from '../playwright.config.js'
import {
  apiKeysSlug,
  apiKeysWithHiddenKeysSlug,
  apiKeysWithReadableKeysSlug,
  BASE_PATH,
  slug,
} from './shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
process.env.NEXT_BASE_PATH = BASE_PATH

let payload: PayloadTestSDK<Config>

type APIKeyTestCollectionSlug =
  | typeof apiKeysWithHiddenKeysSlug
  | typeof apiKeysWithReadableKeysSlug

type APIKeyTestDocument = {
  apiKey?: null | string
  id: number | string
  name?: null | string
}

type APIKeyTestPayload = {
  create: (args: {
    collection: APIKeyTestCollectionSlug
    data: {
      apiKey?: string
      enableAPIKey?: boolean
      name?: string
    }
  }) => Promise<APIKeyTestDocument>
  delete: (args: {
    collection: APIKeyTestCollectionSlug
    where: { id: { equals: number | string } }
  }) => Promise<unknown>
  find: (args: {
    collection: APIKeyTestCollectionSlug
    where: { id: { equals: number | string } }
  }) => Promise<{ docs: APIKeyTestDocument[] }>
}

const getAPIKeyTestPayload = (): APIKeyTestPayload => payload as unknown as APIKeyTestPayload

const { afterAll, afterEach, beforeAll, beforeEach, describe } = test

const headers = {
  'Content-Type': 'application/json',
}

describe('Auth', () => {
  let page: Page
  let context: BrowserContext
  let url: AdminUrlUtil
  let serverURL: string
  let apiURL: string
  let adminRoute: string

  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    ;({ payload, serverURL } = await initPayloadE2ENoConfig<Config>({ dirname }))
    apiURL = formatAdminURL({ apiRoute: '/api', path: '', serverURL })
    url = new AdminUrlUtil(serverURL, slug)

    const {
      routes: { admin: adminRouteFromConfig },
    } = getRoutes({})
    adminRoute = adminRouteFromConfig

    context = await browser.newContext()
    ;({ page } = await initPage({ context, noAutoLogin: true, serverURL }))
  })

  describe('create first user', () => {
    beforeEach(async () => {
      await reInitializeDB({
        deleteOnly: true,
        serverURL,
        snapshotKey: 'create-first-user',
      })

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
      await page.goto(formatAdminURL({ adminRoute, path: createFirstUserRoute, serverURL }))

      await expect(page.locator('.create-first-user')).toBeVisible()

      // Check that custom view override is visible
      await expect(page.locator('#custom-view-override')).toHaveText(
        'Custom CreateFirstUser View Override',
      )

      await waitForVisibleAuthFields()

      // forget to fill out confirm password
      await page.locator('#field-email').fill(devUser.email)
      await page.locator('#field-password').fill(devUser.password)

      await page.locator('.form-submit > button').click()
      await expect(page.locator('#field-error-confirm-password')).toHaveText(
        'This field is required.',
      )

      // make them match, but does not pass password validation
      await page.locator('#field-email').fill(devUser.email)
      await page.locator('#field-password').fill('12')
      await page.locator('#field-confirm-password').fill('12')

      await page.locator('.form-submit > button').click()
      await expect(page.locator('#field-error-password')).toHaveText(
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

    test('richText field should should not be readOnly in create first user view', async () => {
      const {
        admin: {
          routes: { createFirstUser: createFirstUserRoute },
        },
        routes: { admin: adminRoute },
      } = getRoutes({})

      // wait for create first user route
      await page.goto(formatAdminURL({ adminRoute, path: createFirstUserRoute, serverURL }))

      await expect(page.locator('.create-first-user')).toBeVisible()

      await waitForVisibleAuthFields()

      const richTextRoot = page
        .locator('.rich-text-lexical .ContentEditable__root[data-lexical-editor="true"]')
        .first()

      // ensure editor is present
      await expect(richTextRoot).toBeVisible()

      // core read-only checks
      await expect(richTextRoot).toHaveAttribute('contenteditable', 'true')
      await expect(richTextRoot).not.toHaveAttribute('aria-readonly', 'true')
    })
  })

  describe('non create first user', () => {
    beforeAll(async () => {
      await reInitializeDB({
        deleteOnly: false,
        serverURL,
        snapshotKey: 'auth',
      })

      await login({ page, serverURL })
    })

    describe('passwords', () => {
      beforeAll(() => {
        url = new AdminUrlUtil(serverURL, slug)
      })

      afterAll(async () => {
        // Reset the password through the API rather than the admin UI. This is cleanup, not
        // a test, and driving the UI made it depend on the shared page still being alive at
        // teardown — which fails with "Target page, context or browser has been closed".
        const { docs } = await payload.find({
          collection: slug,
          limit: 1,
          where: { email: { equals: devUser.email } },
        })

        await payload.update({
          id: docs[0]!.id,
          collection: slug,
          data: { password: devUser.password },
        })
      })

      // TODO: This test is unreliable. During development, the bundle sent to the client will include debug information.
      // For example, arguments passed from one RSC to another RSC may be sent to the client by Next.js for debug reasons.
      // In production however, this would never happen.
      // In this case, simply using console.log on the permissions object
      // may cause `shouldNotShowInClientConfigUnlessAuthenticated` to be included in the bundle,
      // even though we're never actually sending it to the client.
      // We'll need to run this test in production to ensure it passes.
      test.skip('should protect field schemas behind authentication', async () => {
        await logout(page, serverURL)

        // Inspect the page source (before authentication)
        const loginPageRes = await page.goto(
          formatAdminURL({ adminRoute, path: '/login', serverURL }),
        )
        const loginPageSource = await loginPageRes?.text()
        expect(loginPageSource).not.toContain('shouldNotShowInClientConfigUnlessAuthenticated')

        // Inspect the client config (before authentication)
        await expect(page.locator('#unauthenticated-client-config')).toBeAttached()

        await expect(
          page.locator('#unauthenticated-client-config', {
            hasText: 'shouldNotShowInClientConfigUnlessAuthenticated',
          }),
        ).toHaveCount(0)

        await login({ page, serverURL })

        await page.goto(formatAdminURL({ adminRoute, path: '', serverURL }))

        // Inspect the client config (after authentication)
        await expect(page.locator('#authenticated-client-config')).toBeAttached()

        await expect(
          page.locator('#authenticated-client-config', {
            hasText: 'shouldNotShowInClientConfigUnlessAuthenticated',
          }),
        ).toHaveCount(1)

        // Inspect the page source (after authentication)
        const dashboardPageRes = await page.goto(
          formatAdminURL({ adminRoute, path: '', serverURL }),
        )
        const dashboardPageSource = await dashboardPageRes?.text()
        expect(dashboardPageSource).toContain('shouldNotShowInClientConfigUnlessAuthenticated')
      })

      test('should allow change password', async () => {
        await page.goto(url.account)
        const emailBeforeSave = await page.locator('#field-email').inputValue()
        await expect(page.locator('#force-unlock')).toBeVisible()

        await page.locator('#change-password').click()
        await page.locator('#field-password').fill('password')

        await expect(page.locator('#change-password')).toBeHidden()

        await expect(page.locator('#cancel-change-password')).toBeVisible()
        // should fail to save without confirm password
        await page.locator('#action-save').click()
        await expect(page.locator('#field-error-confirm-password')).toHaveText(
          'This field is required.',
        )

        // should fail to save with incorrect confirm password
        await page.locator('#field-confirm-password').fill('wrong password')
        await page.locator('#action-save').click()
        await expect(page.locator('#field-error-confirm-password')).toHaveText(
          'Passwords do not match.',
        )

        // should succeed with matching confirm password
        await page.locator('#field-confirm-password').fill('password')
        await saveDocAndAssert(page, '#action-save')

        // should still have the same email
        await expect(page.locator('#field-email')).toHaveValue(emailBeforeSave)
      })

      test('should prevent new user creation without confirm password', async () => {
        await page.goto(url.list)
        await page.goto(url.create)

        await page.locator('#field-email').click()

        await page.locator('#field-email').fill('dev2@payloadcms.com')
        await page.locator('#field-password').fill('password')
        // should fail to save without confirm password
        await page.locator('#action-save').click({ delay: 100 })
        await expect(page.locator('#field-error-confirm-password')).toHaveText(
          'This field is required.',
        )

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

      test('should keep token populated in `useAuth` after refreshing the cookie', async () => {
        await page.goto(url.account)
        const token = page.locator('#use-auth-token')
        const refreshCount = page.locator('#refresh-count')

        await expect(token).toHaveText(/.+/)
        await expect(refreshCount).toHaveText('0')

        await page.locator('#refresh-auth-cookie').click()

        await expect(refreshCount).toHaveText('1')

        await expect(token).toHaveText(/.+/)
      })

      // Need to test unlocking documents on logout here as this test suite does not auto login users
      test('should unlock document on logout after editing without saving', async () => {
        await page.goto(url.list)

        await page.locator('.table .row-1 .cell-custom a').click()
        await page.waitForURL(/\/admin\/collections\/users\/[a-zA-Z0-9]+/)

        const textInput = page.locator('#field-namedSaveToJWT')
        await expect(textInput).toBeVisible()

        const countLockedDocs = async () => {
          const lockedDocs = await payload.find({
            collection: 'payload-locked-documents',
            limit: 1,
            pagination: false,
          })

          return lockedDocs.docs.length
        }

        await textInput.fill('some text')

        await expect.poll(countLockedDocs, { timeout: POLL_TOPASS_TIMEOUT }).toBe(1)

        await page.locator('.user-menu__trigger').click()
        await page.locator('a[href$="/logout"]').click()

        // Locate the modal container
        const modalContainer = page.locator('.payload__modal-container')
        await expect(modalContainer).toBeVisible()

        // Click the "Leave anyway" button
        await page.locator('#leave-without-saving .dialog__footer .btn--style-primary').click()

        await expect(page.locator('.login')).toBeVisible()

        await expect.poll(countLockedDocs, { timeout: POLL_TOPASS_TIMEOUT }).toBe(0)

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

        await page.locator('#field-enableAPIKey').click()

        // assert that the value is set
        const apiKeyLocator = page.locator('#apiKey')
        await expect
          .poll(async () => await apiKeyLocator.inputValue(), { timeout: POLL_TOPASS_TIMEOUT })
          .toBeDefined()
        await expect(apiKeyLocator).toHaveAttribute('type', 'text')

        const apiKey = await apiKeyLocator.inputValue()

        await saveDocAndAssert(page)
        await expect(apiKeyLocator).toBeDisabled()
        await expect(apiKeyLocator).toHaveValue('')
        await expect(
          page.getByText("You don't have permission to view this API key."),
        ).toBeVisible()

        const response = await fetch(`${apiURL}/${apiKeysSlug}/me`, {
          headers: {
            ...headers,
            Authorization: `${apiKeysSlug} API-Key ${apiKey}`,
          },
        }).then((res) => res.json())

        expect(response.user?.apiKey).toBe(apiKey)
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

    describe('api-key-rotation', () => {
      const createdIDs: Array<number | string> = []

      afterEach(async () => {
        for (const id of createdIDs) {
          await getAPIKeyTestPayload().delete({
            collection: apiKeysWithReadableKeysSlug,
            where: {
              id: {
                equals: id,
              },
            },
          })
        }
        createdIDs.length = 0
      })

      test('should rotate a readable API key', async () => {
        const originalAPIKey = uuid()
        const user = await getAPIKeyTestPayload().create({
          collection: apiKeysWithReadableKeysSlug,
          data: {
            apiKey: originalAPIKey,
            enableAPIKey: true,
          },
        })
        createdIDs.push(user.id)
        const userURL = new AdminUrlUtil(serverURL, apiKeysWithReadableKeysSlug)

        await page.goto(userURL.edit(user.id))
        const apiKeyInput = page.locator('#apiKey')
        await expect(apiKeyInput).toHaveValue(originalAPIKey)
        await expect(apiKeyInput).toHaveAttribute('type', 'password')

        await page.getByRole('button', { name: 'Generate new API key' }).click()
        await page
          .locator(`#generate-confirmation-${user.id} [data-dialog-action="confirm"]`)
          .click()
        await expect(apiKeyInput).not.toHaveValue(originalAPIKey)
        await expect(apiKeyInput).toHaveAttribute('type', 'text')
        const rotatedAPIKey = await apiKeyInput.inputValue()
        await saveDocAndAssert(page)
        await expect(apiKeyInput).toHaveValue(rotatedAPIKey)
        await expect(apiKeyInput).toHaveAttribute('type', 'password')
        await page.getByRole('button', { name: 'Show API key' }).click()
        await expect(apiKeyInput).toHaveAttribute('type', 'text')
      })

      test('should reveal a readable API key when first enabled', async () => {
        const user = await getAPIKeyTestPayload().create({
          collection: apiKeysWithReadableKeysSlug,
          data: {},
        })
        createdIDs.push(user.id)
        const userURL = new AdminUrlUtil(serverURL, apiKeysWithReadableKeysSlug)

        await page.goto(userURL.edit(user.id))
        await expect(page.locator('#apiKey')).toBeHidden()
        await page.locator('#field-enableAPIKey').click()

        const apiKeyInput = page.locator('#apiKey')
        await expect(apiKeyInput).toHaveAttribute('type', 'text')
        const apiKey = await apiKeyInput.inputValue()

        await page.getByRole('button', { name: 'Hide API key' }).click()
        await expect(apiKeyInput).toHaveAttribute('type', 'password')
        await page.getByRole('button', { name: 'Show API key' }).click()
        await expect(apiKeyInput).toHaveAttribute('type', 'text')

        await saveDocAndAssert(page)
        await expect(apiKeyInput).toHaveValue(apiKey)
        await expect(apiKeyInput).toHaveAttribute('type', 'password')
      })

      test('should hide an existing readable API key when re-enabled', async () => {
        const existingAPIKey = uuid()
        const user = await getAPIKeyTestPayload().create({
          collection: apiKeysWithReadableKeysSlug,
          data: {
            apiKey: existingAPIKey,
            enableAPIKey: false,
          },
        })
        createdIDs.push(user.id)
        const userURL = new AdminUrlUtil(serverURL, apiKeysWithReadableKeysSlug)

        await page.goto(userURL.edit(user.id))
        await expect(page.locator('#apiKey')).toBeHidden()
        await page.locator('#field-enableAPIKey').click()

        const apiKeyInput = page.locator('#apiKey')
        await expect(apiKeyInput).toHaveValue(existingAPIKey)
        await expect(apiKeyInput).toHaveAttribute('type', 'password')
        await page.getByRole('button', { name: 'Show API key' }).click()
        await expect(apiKeyInput).toHaveAttribute('type', 'text')
      })
    })

    describe('api-keys-with-hidden-keys', () => {
      const createdIDs: Array<number | string> = []

      afterEach(async () => {
        for (const id of createdIDs) {
          await getAPIKeyTestPayload().delete({
            collection: apiKeysWithHiddenKeysSlug,
            where: {
              id: {
                equals: id,
              },
            },
          })
        }
        createdIDs.length = 0
      })

      test('should not replace an unreadable API key during an unrelated edit', async () => {
        const originalAPIKey = uuid()
        const user = await getAPIKeyTestPayload().create({
          collection: apiKeysWithHiddenKeysSlug,
          data: {
            name: 'Before',
            apiKey: originalAPIKey,
            enableAPIKey: true,
          },
        })
        createdIDs.push(user.id)
        const hiddenKeyURL = new AdminUrlUtil(serverURL, apiKeysWithHiddenKeysSlug)

        await page.goto(hiddenKeyURL.edit(user.id))
        await expect(page.locator('#field-enableAPIKey')).toBeChecked()
        await expect(page.locator('#apiKey')).toBeDisabled()
        await expect(page.locator('#apiKey')).toHaveValue('')
        await expect(page.getByRole('button', { name: 'Show API key' })).toBeHidden()
        await expect(page.locator('.copy-to-clipboard')).toBeHidden()
        await expect(
          page.getByText("You don't have permission to view this API key."),
        ).toBeVisible()
        await page.locator('#field-name').fill('After')
        await saveDocAndAssert(page)

        const result = await getAPIKeyTestPayload().find({
          collection: apiKeysWithHiddenKeysSlug,
          where: {
            id: {
              equals: user.id,
            },
          },
        })

        expect(result.docs[0]?.apiKey).toBe(originalAPIKey)
        expect(result.docs[0]?.name).toBe('After')
      })

      test('should rotate an unreadable API key without revealing it', async () => {
        const originalAPIKey = uuid()
        const user = await getAPIKeyTestPayload().create({
          collection: apiKeysWithHiddenKeysSlug,
          data: {
            apiKey: originalAPIKey,
            enableAPIKey: true,
          },
        })
        createdIDs.push(user.id)
        const hiddenKeyURL = new AdminUrlUtil(serverURL, apiKeysWithHiddenKeysSlug)

        await page.goto(hiddenKeyURL.edit(user.id))
        await page.getByRole('button', { name: 'Generate new API key' }).click()
        await page
          .locator(`#generate-confirmation-${user.id} [data-dialog-action="confirm"]`)
          .click()

        const apiKeyInput = page.locator('#apiKey')
        await expect(apiKeyInput).toBeDisabled()
        await expect(apiKeyInput).toHaveValue('')
        await expect(page.getByRole('button', { name: 'Show API key' })).toBeHidden()
        await expect(page.locator('.copy-to-clipboard')).toBeHidden()

        await saveDocAndAssert(page)
        await expect(apiKeyInput).toBeDisabled()
        await expect(
          page.getByText("You don't have permission to view this API key."),
        ).toBeVisible()

        const result = await getAPIKeyTestPayload().find({
          collection: apiKeysWithHiddenKeysSlug,
          where: {
            id: {
              equals: user.id,
            },
          },
        })

        expect(result.docs[0]?.apiKey).not.toBe(originalAPIKey)
      })

      test('should generate an unreadable API key without revealing it when first enabled', async () => {
        const user = await getAPIKeyTestPayload().create({
          collection: apiKeysWithHiddenKeysSlug,
          data: {
            enableAPIKey: false,
          },
        })
        createdIDs.push(user.id)
        const hiddenKeyURL = new AdminUrlUtil(serverURL, apiKeysWithHiddenKeysSlug)

        await page.goto(hiddenKeyURL.edit(user.id))
        await expect(page.locator('#apiKey')).toBeHidden()
        await page.locator('#field-enableAPIKey').click()

        const apiKeyInput = page.locator('#apiKey')
        await expect(apiKeyInput).toBeDisabled()
        await expect(apiKeyInput).toHaveValue('')
        await expect(page.getByRole('button', { name: 'Show API key' })).toBeHidden()
        await expect(page.locator('.copy-to-clipboard')).toBeHidden()

        await saveDocAndAssert(page)
        await expect(apiKeyInput).toBeDisabled()

        const result = await getAPIKeyTestPayload().find({
          collection: apiKeysWithHiddenKeysSlug,
          where: {
            id: {
              equals: user.id,
            },
          },
        })

        expect(result.docs[0]?.apiKey).toEqual(expect.any(String))
      })
    })

    describe('api-keys-with-field-read-access', () => {
      const collectionSlug = 'api-keys-with-field-read-access'

      beforeAll(() => {
        url = new AdminUrlUtil(serverURL, collectionSlug)
      })

      test('should hide API key status without read access', async () => {
        await page.goto(url.create)

        await expect(page.locator('.auth-fields')).toBeVisible()
        await expect(page.locator('#field-enableAPIKey')).toBeHidden()
        await expect(page.locator('#apiKey')).toBeDisabled()
        await expect(
          page.getByText("You don't have permission to view this API key."),
        ).toBeVisible()
        await expect(page.getByRole('button', { name: 'Generate new API key' })).toBeVisible()
      })

      test('ensure `?redirect=` param is injected into the URL and handled properly after login', async () => {
        const users = await payload.find({
          collection: slug,
          limit: 1,
        })

        const userDocumentRoute = formatAdminURL({
          adminRoute,
          path: `/collections/users/${users?.docs?.[0]?.id}`,
          serverURL,
        })

        await logout(page, serverURL)

        // This will send the user back to the login page with a `?redirect=` param
        await page.goto(userDocumentRoute)

        await expect
          .poll(() => page.url(), { timeout: POLL_TOPASS_TIMEOUT })
          .toContain('/admin/login?redirect=')

        // Important: do not use the login helper here, as this may clear the redirect param
        await expect(page.locator('#field-email')).toBeVisible()
        await expect(page.locator('#field-password')).toBeVisible()

        await page.locator('.form-submit > button').click()

        // Expect to be redirected to the correct page
        await expect
          .poll(() => page.url(), { timeout: POLL_TOPASS_TIMEOUT })
          .toBe(userDocumentRoute)

        // Previously, this would crash the page with a "Cannot read properties of undefined (reading 'match')" error
        await expect(page.locator('#field-roles')).toBeVisible()

        // Now do this again, only with a page that is not in the user's collection
        const notInUserCollection = await payload.create({
          collection: 'relationsCollection',
          data: {},
        })

        await logout(page, serverURL)

        const notInUserCollectionURL = formatAdminURL({
          adminRoute,
          path: `/collections/relationsCollection/${notInUserCollection.id}`,
          serverURL,
        })
        await page.goto(notInUserCollectionURL)

        await expect
          .poll(() => page.url(), { timeout: POLL_TOPASS_TIMEOUT })
          .toContain('/admin/login?redirect=')

        // Important: do not use the login helper here, as this may clear the redirect param
        await expect(page.locator('#field-email')).toBeVisible()
        await expect(page.locator('#field-password')).toBeVisible()

        await page.locator('.form-submit > button').click()

        // Expect to be redirected to the correct page
        await expect
          .poll(() => page.url(), { timeout: POLL_TOPASS_TIMEOUT })
          .toBe(notInUserCollectionURL)

        // Previously, this would crash the page with a "Cannot read properties of null (reading 'fields')" error
        await expect(page.locator('#field-rel')).toBeVisible()
      })
    })
  })

  describe('server functions', () => {
    const serverFunctionsPath = '/server-functions'

    beforeEach(async () => {
      await reInitializeDB({
        deleteOnly: false,
        serverURL,
        snapshotKey: 'auth',
      })

      await page.context().clearCookies()
    })

    test('should log user in from login server function', async () => {
      await page.goto(formatAdminURL({ adminRoute, path: serverFunctionsPath, serverURL }))

      await expect(page.getByRole('heading', { name: 'Auth server functions' })).toBeVisible()
      await expect(page.locator('#field-serverFunctionEmail')).toBeVisible()
      await expect(page.locator('#field-serverFunctionPassword')).toBeVisible()
      await expect(page.getByText('Custom Refresh', { exact: true })).toBeHidden()
      await expect(page.getByText('Custom Logout', { exact: true })).toBeHidden()

      await page.fill('#field-serverFunctionEmail', devUser.email)
      await page.fill('#field-serverFunctionPassword', devUser.password)
      await page.getByText('Custom Login', { exact: true }).click()

      await expect.poll(() => page.url()).toBe(formatAdminURL({ adminRoute, path: '', serverURL }))
      await expect
        .poll(async () => {
          return (await page.context().cookies()).some((cookie) => cookie.name === 'payload-token')
        })
        .toBe(true)

      await page.goto(formatAdminURL({ adminRoute, path: '/account', serverURL }))

      await expect(page.locator('#field-email')).toHaveValue(devUser.email)
    })

    test('should display errors from login server function', async () => {
      await page.goto(formatAdminURL({ adminRoute, path: serverFunctionsPath, serverURL }))

      await page.fill('#field-serverFunctionEmail', devUser.email)
      await page.fill('#field-serverFunctionPassword', 'invalid-password')
      await page.getByText('Custom Login', { exact: true }).click()

      await expect(page.getByRole('alert')).toBeVisible()
      await expect(page).toHaveURL(
        formatAdminURL({ adminRoute, path: serverFunctionsPath, serverURL }),
      )
      await expect
        .poll(async () => {
          return (await page.context().cookies()).some((cookie) => cookie.name === 'payload-token')
        })
        .toBe(false)
    })

    test('should refresh user from refresh server function', async () => {
      await login({ page, serverURL })
      await page.goto(formatAdminURL({ adminRoute, path: serverFunctionsPath, serverURL }))

      await expect(page.getByRole('heading', { name: 'Auth server functions' })).toBeVisible()
      await expect(page.locator('#field-serverFunctionEmail')).toBeHidden()
      await expect(page.getByText('Custom Refresh', { exact: true })).toBeVisible()
      await expect(page.getByText('Custom Logout', { exact: true })).toBeVisible()
      const initialCookie = (await page.context().cookies()).find(
        (cookie) => cookie.name === 'payload-token',
      )

      expect(initialCookie).toBeDefined()
      await page.getByText('Custom Refresh', { exact: true }).click()

      await expect(page.getByRole('status').filter({ hasText: 'Token refreshed' })).toBeVisible()
      await expect
        .poll(async () => {
          const refreshedCookie = (await page.context().cookies()).find(
            (cookie) => cookie.name === 'payload-token',
          )

          return refreshedCookie?.expires
        })
        .not.toBe(initialCookie?.expires)
    })

    test('should log user out from logout server function', async () => {
      await login({ page, serverURL })
      await page.goto(formatAdminURL({ adminRoute, path: serverFunctionsPath, serverURL }))

      await expect(page.getByRole('heading', { name: 'Auth server functions' })).toBeVisible()
      await page.getByText('Custom Logout', { exact: true }).click()

      await expect
        .poll(() => page.url())
        .toBe(formatAdminURL({ adminRoute, path: '/login', serverURL }))
      await expect(page.locator('#field-email')).toBeVisible()
      await expect(page.locator('#field-password')).toBeVisible()
    })
  })

  describe('autoRefresh', () => {
    beforeAll(async () => {
      await reInitializeDB({
        deleteOnly: false,
        serverURL,
        snapshotKey: 'auth',
      })

      await ensureCompilationIsDone({ noAutoLogin: true, page, serverURL })

      url = new AdminUrlUtil(serverURL, slug)

      // Install clock before login so token expiration and clock are in sync
      await page.clock.install({ time: Date.now() })

      await login({ page, serverURL })
    })

    test('should automatically refresh token without showing modal', async () => {
      await expect(page.locator('.nav')).toBeVisible()

      // Fast forward time to just past the reminder timeout
      await page.clock.fastForward(7141000) // 1 hour 59 minutes + 1 second

      // Resume clock so timers can execute
      await page.clock.resume()

      await expect(page.locator('.alert-modal')).toBeHidden()

      await expect(page.locator('.nav')).toBeVisible()
    })
  })
})
