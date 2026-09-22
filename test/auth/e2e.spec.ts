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
import { apiKeyOnlySlug, apiKeyProofSlug, apiKeysSlug, BASE_PATH, slug } from './shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
process.env.NEXT_BASE_PATH = BASE_PATH

let payload: PayloadTestSDK<Config>

const { afterAll, beforeAll, beforeEach, describe } = test

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
      /**
       * apiKeyProofSlug can only be read by an api-key authenticated user of apiKeyOnlySlug,
       * so a 200 from it cannot come from the browser session, auto-login, or a broad read
       * rule. Requests are made with `fetch` from the test process, which carries no browser
       * cookies unless a test passes them deliberately.
       */
      const readProofCollection = async ({
        apiKey,
        extraHeaders = {},
      }: {
        apiKey?: string
        extraHeaders?: Record<string, string>
      } = {}) =>
        fetch(`${apiURL}/${apiKeyProofSlug}`, {
          headers: {
            ...headers,
            ...(apiKey ? { Authorization: `${apiKeyOnlySlug} API-Key ${apiKey}` } : {}),
            ...extraHeaders,
          },
        })

      /** Which user a key belongs to, or null if it does not authenticate at all. */
      const meWithAPIKey = async (apiKey: string) =>
        fetch(`${apiURL}/${apiKeyOnlySlug}/me`, {
          headers: { ...headers, Authorization: `${apiKeyOnlySlug} API-Key ${apiKey}` },
        })
          .then((res) => res.json())
          .then((json) => json.user)

      const expectAPIKeyWorks = async ({
        id,
        apiKey,
      }: {
        apiKey: string
        id: number | string
      }) => {
        await expect(async () => {
          expect((await readProofCollection({ apiKey })).status).toBe(200)
          expect(String((await meWithAPIKey(apiKey))?.id)).toStrictEqual(String(id))
        }).toPass({ timeout: POLL_TOPASS_TIMEOUT })
      }

      const expectAPIKeyRejected = async ({ apiKey }: { apiKey: string }) => {
        await expect(async () => {
          expect((await readProofCollection({ apiKey })).status).not.toBe(200)
          expect(await meWithAPIKey(apiKey)).toBeNull()
        }).toPass({ timeout: POLL_TOPASS_TIMEOUT })
      }

      /** The value is only rendered while it is being revealed, never as a placeholder. */
      const readRevealedAPIKey = async (): Promise<string> => {
        const input = page.locator('#apiKey')

        await expect(input).toBeVisible()
        await expect(page.locator('#apiKey-reveal-note')).toBeVisible()

        await expect
          .poll(async () => (await input.inputValue()).length, { timeout: POLL_TOPASS_TIMEOUT })
          .toBeGreaterThan(0)

        return input.inputValue()
      }

      const generateAPIKeyInAdmin = async (): Promise<string> => {
        await page.locator('#generate-api-key').click()
        await page.locator('[id^="generate-confirmation-"][data-dialog-action="confirm"]').click()

        return readRevealedAPIKey()
      }

      const documentIDFromURL = (): string => {
        const segments = new URL(page.url()).pathname.split('/')

        return segments[segments.length - 1]!
      }

      beforeAll(() => {
        url = new AdminUrlUtil(serverURL, apiKeyOnlySlug)
      })

      test('should reveal a working key for a user created with api keys enabled', async () => {
        await page.goto(url.create)

        await page.locator('#field-enableAPIKey').click()

        // Nothing is shown before the first save - the key does not exist yet.
        await expect(page.locator('#apiKey')).toBeHidden()
        await expect(page.locator('#apiKey-hidden-note')).toBeVisible()

        await saveDocAndAssert(page)

        const apiKey = await readRevealedAPIKey()

        await expectAPIKeyWorks({ id: documentIDFromURL(), apiKey })
      })

      test('should reveal a working key when enabling on an existing user', async () => {
        const user = await payload.create({
          collection: apiKeyOnlySlug,
          data: { enableAPIKey: false },
        })

        await page.goto(url.edit(user.id))

        await expect(page.locator('#apiKey')).toBeHidden()

        await page.locator('#field-enableAPIKey').click()
        await saveDocAndAssert(page)

        const apiKey = await readRevealedAPIKey()

        await expectAPIKeyWorks({ id: user.id, apiKey })
      })

      test('should replace the key when generating a new one', async () => {
        const originalKey = 'the-original-key-before-regenerating'
        const user = await payload.create({
          collection: apiKeyOnlySlug,
          data: { apiKey: originalKey, enableAPIKey: true },
        })

        await page.goto(url.edit(user.id))

        // An existing key is never displayed.
        await expect(page.locator('#apiKey')).toBeHidden()
        await expect(page.locator('#apiKey-hidden-note')).toBeVisible()

        const newKey = await generateAPIKeyInAdmin()

        expect(newKey).not.toStrictEqual(originalKey)

        await expectAPIKeyWorks({ id: user.id, apiKey: newKey })
        await expectAPIKeyRejected({ apiKey: originalKey })

        // Generating is already persisted, so it must not leave unsaved changes behind -
        // the save button stays disabled while the form is unmodified.
        await expect(page.locator('#action-save')).toBeDisabled()
      })

      test('should revoke the key when api keys are disabled', async () => {
        const apiKey = 'the-key-that-gets-revoked-by-unchecking'
        const user = await payload.create({
          collection: apiKeyOnlySlug,
          data: { apiKey, enableAPIKey: true },
        })

        await page.goto(url.edit(user.id))

        await page.locator('#field-enableAPIKey').click()

        await expect(page.locator('#apiKey')).toBeHidden()
        await expect(page.locator('#apiKey-hidden-note')).toBeHidden()

        await saveDocAndAssert(page)

        await expectAPIKeyRejected({ apiKey })
      })

      test('should issue a different key when re-enabling after a revoke', async () => {
        const revokedKey = 'the-key-that-was-revoked-before-re-enabling'
        const user = await payload.create({
          collection: apiKeyOnlySlug,
          data: { apiKey: revokedKey, enableAPIKey: true },
        })

        await page.goto(url.edit(user.id))
        await page.locator('#field-enableAPIKey').click()
        await saveDocAndAssert(page)

        await page.locator('#field-enableAPIKey').click()
        await saveDocAndAssert(page)

        const newKey = await readRevealedAPIKey()

        expect(newKey).not.toStrictEqual(revokedKey)

        await expectAPIKeyWorks({ id: user.id, apiKey: newKey })
        await expectAPIKeyRejected({ apiKey: revokedKey })
      })

      test('should keep the key when unchecking and rechecking without saving', async () => {
        const apiKey = 'the-key-that-survives-a-round-trip'
        const user = await payload.create({
          collection: apiKeyOnlySlug,
          data: { apiKey, enableAPIKey: true },
        })

        await page.goto(url.edit(user.id))

        await page.locator('#field-enableAPIKey').click()
        await page.locator('#field-enableAPIKey').click()
        await saveDocAndAssert(page)

        // Nothing was submitted for the key, so it was neither rotated nor revoked.
        await expect(page.locator('#apiKey')).toBeHidden()
        await expectAPIKeyWorks({ id: user.id, apiKey })
      })

      test('should keep the key when saving an unrelated field', async () => {
        const apiKey = 'the-key-that-survives-an-unrelated-save'
        const user = await payload.create({
          collection: apiKeyOnlySlug,
          data: { apiKey, enableAPIKey: true },
        })

        await page.goto(url.edit(user.id))

        await page.locator('#field-label').fill('renamed in the admin panel')
        await saveDocAndAssert(page)

        await expectAPIKeyWorks({ id: user.id, apiKey })
      })

      test('should not reveal the key again after a reload', async () => {
        const user = await payload.create({
          collection: apiKeyOnlySlug,
          data: { enableAPIKey: false },
        })

        await page.goto(url.edit(user.id))
        await page.locator('#field-enableAPIKey').click()
        await saveDocAndAssert(page)

        const apiKey = await readRevealedAPIKey()

        await page.reload()

        await expect(page.locator('#apiKey')).toBeHidden()
        await expect(page.locator('#apiKey-hidden-note')).toBeVisible()

        // The key itself is unaffected by no longer being displayed.
        await expectAPIKeyWorks({ id: user.id, apiKey })
      })

      test('should not grant access without an api key', async () => {
        const apiKey = 'the-key-used-for-the-negative-controls'
        const user = await payload.create({
          collection: apiKeyOnlySlug,
          data: { apiKey, enableAPIKey: true },
        })

        // No credentials at all.
        expect((await readProofCollection()).status).not.toBe(200)

        // A key that was never issued.
        await expectAPIKeyRejected({ apiKey: 'a-key-that-was-never-issued' })

        // The key itself does work, so the assertions above are not passing for some
        // unrelated reason.
        await expectAPIKeyWorks({ id: user.id, apiKey })

        // The Admin Panel's own session, which must buy nothing here: this proves the
        // passing assertions above come from the API key and nothing else.
        const cookies = await context.cookies(serverURL)
        const cookieHeader = cookies.map(({ name, value }) => `${name}=${value}`).join('; ')

        expect(cookieHeader).toContain('payload-token')

        const withSession = await readProofCollection({
          extraHeaders: { Cookie: cookieHeader },
        })

        expect(withSession.status).not.toBe(200)
      })
    })

    describe('api-keys-with-field-read-access', () => {
      let user

      beforeAll(async () => {
        url = new AdminUrlUtil(serverURL, 'api-keys-with-field-read-access')

        user = await payload.create({
          collection: apiKeysSlug,
          data: {
            apiKey: uuid(),
            enableAPIKey: true,
          },
        })
      })

      test('should hide auth parent container if api keys enabled but no read access', async () => {
        await page.goto(url.create)

        // assert that the auth parent container is hidden
        await expect(page.locator('.auth-fields')).toBeHidden()

        await saveDocAndAssert(page)
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
