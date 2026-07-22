import type { BrowserContext, Page, Request, Response } from '@playwright/test'

import { expect, test } from '@playwright/test'
import path from 'path'
import { formatAdminURL, wait } from 'payload/shared'
import { fileURLToPath } from 'url'
import { v4 as uuid } from 'uuid'

import type { PayloadTestSDK } from '../__helpers/shared/sdk/index.js'
import type { Config } from './payload-types.js'

import { login } from '../__helpers/e2e/auth/login.js'
import { logout } from '../__helpers/e2e/auth/logout.js'
import {
  ensureCompilationIsDone,
  exactText,
  getRoutes,
  initPageConsoleErrorCatch,
  saveDocAndAssert,
} from '../__helpers/e2e/helpers.js'
import { AdminUrlUtil } from '../__helpers/shared/adminUrlUtil.js'
import { reInitializeDB } from '../__helpers/shared/clearAndSeed/reInitializeDB.js'
import { initPayloadE2ENoConfig } from '../__helpers/shared/initPayloadE2ENoConfig.js'
import { devUser } from '../credentials.js'
import { POLL_TOPASS_TIMEOUT, TEST_TIMEOUT_LONG } from '../playwright.config.js'
import { apiKeysSlug, BASE_PATH, slug } from './shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
process.env.NEXT_BASE_PATH = BASE_PATH

let payload: PayloadTestSDK<Config>

const { beforeAll, beforeEach, afterAll, describe } = test

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
    page = await context.newPage()
    initPageConsoleErrorCatch(page)

    await ensureCompilationIsDone({ page, serverURL, noAutoLogin: true })
  })

  describe('create first user', () => {
    beforeEach(async () => {
      await reInitializeDB({
        serverURL,
        snapshotKey: 'create-first-user',
        deleteOnly: true,
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
        serverURL,
        snapshotKey: 'auth',
        deleteOnly: false,
      })

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
        await page.goto(url.list)
        await page.goto(url.create)
        await page.locator('#field-email').fill('dev2@payloadcms.com')
        await page.locator('#field-password').fill('password')
        // should fail to save without confirm password
        await page.locator('#action-save').click({ delay: 100 })
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

        // Wait for hydration
        await wait(1000)
        await page.locator('.table .row-1 .cell-custom a').click()
        await page.waitForURL(/\/admin\/collections\/users\/[a-zA-Z0-9]+/)

        const textInput = page.locator('#field-namedSaveToJWT')
        await expect(textInput).toBeVisible()
        const docID = (await page.locator('.render-title').getAttribute('data-doc-id')) as string

        const isTanStack = process.env.PAYLOAD_FRAMEWORK === 'tanstack-start'
        const lockDocRequest = page.waitForResponse((response) => {
          const method = response.request().method()
          const reqUrl = response.request().url()
          if (method !== 'POST') {
            return false
          }
          // Next.js server actions POST to the admin page URL;
          // TanStack Start server functions POST through `createServerFn`'s
          // `/_serverFn/<base64-fn-id>` RPC (legacy `/api/server-function`
          // accepted for backward compatibility with older snapshots).
          return isTanStack
            ? reqUrl.includes('/_serverFn/') || reqUrl.includes('/api/server-function')
            : reqUrl === url.edit(docID)
        })
        await textInput.fill('some text')
        await lockDocRequest

        const lockedDocs = await payload.find({
          collection: 'payload-locked-documents',
          limit: 1,
          pagination: false,
        })

        await expect.poll(() => lockedDocs.docs.length).toBe(1)

        await page.locator('.user-menu__trigger').click()
        await page.locator('a[href$="/logout"]').click()

        // Locate the modal container
        const modalContainer = page.locator('.payload__modal-container')
        await expect(modalContainer).toBeVisible()

        // Click the "Leave anyway" button
        await page.locator('#leave-without-saving .dialog__footer .btn--style-primary').click()

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

  describe('autoRefresh', () => {
    beforeAll(async () => {
      await reInitializeDB({
        serverURL,
        snapshotKey: 'auth',
        deleteOnly: false,
      })

      await ensureCompilationIsDone({ page, serverURL, noAutoLogin: true })

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

  describe('session activity', () => {
    let sessionContext: BrowserContext
    let sessionPage: Page
    let usersURL: AdminUrlUtil

    beforeEach(async ({ browser }) => {
      sessionContext = await browser.newContext()
      sessionPage = await sessionContext.newPage()
      initPageConsoleErrorCatch(sessionPage)
      usersURL = new AdminUrlUtil(serverURL, slug)

      await sessionPage.clock.install({ time: Date.now() })
      await login({ page: sessionPage, serverURL })
      await sessionPage.goto(usersURL.account)
      await expect(sessionPage.locator('#token-expiration-ms')).toHaveText(/^\d+$/)
    })

    test.afterEach(async () => {
      await sessionPage.close()
      const hasTokenCookie = (await sessionContext.cookies()).some(
        (cookie) => cookie.name === 'payload-token',
      )

      if (hasTokenCookie) {
        await sessionContext.request.post(`${apiURL}/${slug}/logout`)
      }

      await sessionContext.close()
    })

    test('should refresh a session after pointerdown near the refresh window', async () => {
      const tokenExpirationMs = await readTokenExpirationMs(sessionPage)

      await advanceToRemainingSessionTime({
        page: sessionPage,
        remainingMs: 90_000,
        tokenExpirationMs,
      })

      const refreshResponse = await expectActivityRefresh({
        activity: () => sessionPage.dispatchEvent('body', 'pointerdown'),
        page: sessionPage,
      })

      expect(refreshResponse.status()).toBe(200)
    })

    test('should refresh a session after selecting collection checkboxes without saving', async () => {
      const tokenExpirationMs = await readTokenExpirationMs(sessionPage)

      await sessionPage.goto(usersURL.list)
      const selectAll = sessionPage.locator('input#select-all')
      await expect(selectAll).toBeVisible()
      await advanceToRemainingSessionTime({
        page: sessionPage,
        remainingMs: 90_000,
        tokenExpirationMs,
      })

      await expectActivityRefresh({
        activity: async () => {
          const observedEvents = await selectAll.evaluate((element: HTMLInputElement) => {
            const eventTypes = ['input', 'pointerdown'] as const
            const observed: string[] = []
            const recordEvent = (event: Event) => observed.push(event.type)

            eventTypes.forEach((eventType) => window.addEventListener(eventType, recordEvent, true))
            element.click()
            eventTypes.forEach((eventType) =>
              window.removeEventListener(eventType, recordEvent, true),
            )

            return observed
          })

          expect(observedEvents).toContain('input')
          expect(observedEvents).not.toContain('pointerdown')
          await expect(selectAll).toBeChecked()
        },
        page: sessionPage,
      })
    })

    test('should refresh a session after repeatedly opening and closing document drawers', async () => {
      const tokenExpirationMs = await readTokenExpirationMs(sessionPage)
      const relationshipsURL = new AdminUrlUtil(serverURL, 'relationsCollection')

      await sessionPage.goto(relationshipsURL.create)
      const addUserButton = sessionPage.locator(
        '#rel-add-new button.relationship-add-new__add-button.doc-drawer__toggler',
      )
      const documentDrawer = sessionPage.locator('[id^="doc-drawer_users_1_"]').last()
      await expect(addUserButton).toBeVisible()
      await advanceToRemainingSessionTime({
        page: sessionPage,
        remainingMs: 90_000,
        tokenExpirationMs,
      })

      await expectActivityRefresh({
        activity: async () => {
          for (let index = 0; index < 3; index++) {
            await addUserButton.click()
            await expect(documentDrawer).toBeVisible()
            await documentDrawer.locator('button.doc-drawer__header-close').click()
            await expect(documentDrawer).toBeHidden()
          }
        },
        page: sessionPage,
      })
    })

    test('should refresh a session after client-side route activity near expiration', async () => {
      const tokenExpirationMs = await readTokenExpirationMs(sessionPage)
      const usersNavLink = sessionPage.locator('a[href$="/admin/collections/users"]').first()

      await expect(usersNavLink).toBeVisible()
      await advanceToRemainingSessionTime({
        page: sessionPage,
        remainingMs: 90_000,
        tokenExpirationMs,
      })

      await expectActivityRefresh({
        activity: async () => {
          await usersNavLink.evaluate((element: HTMLAnchorElement) => element.click())
          await sessionPage.waitForURL(usersURL.list)
          await expect(sessionPage.locator('input#select-all')).toBeVisible()
        },
        page: sessionPage,
      })
    })

    test('should deduplicate many activity events dispatched inside five seconds', async () => {
      const tokenExpirationMs = await readTokenExpirationMs(sessionPage)
      const refreshRequests: Request[] = []
      const recordRefreshRequest = (request: Request) => {
        if (isActivityRefreshRequest(request)) {
          refreshRequests.push(request)
        }
      }

      sessionPage.on('request', recordRefreshRequest)
      await advanceToRemainingSessionTime({
        page: sessionPage,
        remainingMs: 90_000,
        tokenExpirationMs,
      })

      await expectActivityRefresh({
        activity: () => dispatchManySessionActivityEvents(sessionPage),
        page: sessionPage,
      })
      await dispatchManySessionActivityEvents(sessionPage)
      await sessionPage.clock.fastForward(3_998)

      expect(refreshRequests).toHaveLength(1)
      sessionPage.off('request', recordRefreshRequest)
    })
  })

  describe('session synchronization', () => {
    let activePage: Page
    let sessionContext: BrowserContext
    let usersURL: AdminUrlUtil

    beforeEach(async ({ browser }) => {
      sessionContext = await browser.newContext()
      activePage = await sessionContext.newPage()
      initPageConsoleErrorCatch(activePage)
      usersURL = new AdminUrlUtil(serverURL, slug)

      await activePage.clock.install({ time: Date.now() })
      await login({ page: activePage, serverURL })
      await activePage.goto(usersURL.account)
      await expect(activePage.locator('#token-expiration-ms')).toHaveText(/^\d+$/)
    })

    test.afterEach(async () => {
      await Promise.all(sessionContext.pages().map((contextPage) => contextPage.close()))
      const hasTokenCookie = (await sessionContext.cookies()).some(
        (cookie) => cookie.name === 'payload-token',
      )

      if (hasTokenCookie) {
        await sessionContext.request.post(`${apiURL}/${slug}/logout`)
      }

      await sessionContext.close()
    })

    test('should propagate a refreshed session expiration to a second page', async () => {
      const secondPage = await openAuthenticatedPage({
        context: sessionContext,
        url: usersURL.account,
      })
      const previousExpirationMs = await readTokenExpirationMs(secondPage)

      await waitForServerClockAfterTokenIssue(previousExpirationMs)
      await refreshSessionFromDebugButton(activePage)

      await expect
        .poll(() => readTokenExpirationMs(secondPage))
        .toBeGreaterThan(previousExpirationMs)
      await expect(secondPage.locator('.nav')).toBeVisible()
    })

    test('should propagate session expiration to a second page', async () => {
      const tokenExpirationMs = await readTokenExpirationMs(activePage)
      const activeRefreshRequests = observeActivityRefreshRequests(activePage)

      await advanceToRemainingSessionTime({
        page: activePage,
        remainingMs: 61_000,
        tokenExpirationMs,
      })

      const secondPage = await sessionContext.newPage()
      const secondPageRefreshRequests = observeActivityRefreshRequests(secondPage)

      initPageConsoleErrorCatch(secondPage)
      await secondPage.goto(usersURL.account)
      await expect(secondPage.locator('#token-expiration-ms')).toHaveText(/^\d+$/)

      const expiredRefreshResponse = activePage.waitForResponse((response) =>
        isActivityRefreshRequest(response.request()),
      )

      expect((await sessionContext.request.post(`${apiURL}/${slug}/logout`)).status()).toBe(200)
      await activePage.clock.fastForward(2_001)
      expect((await expiredRefreshResponse).status()).toBe(403)
      expect(activeRefreshRequests).toHaveLength(1)
      expect(secondPageRefreshRequests).toHaveLength(0)

      await expect(activePage).toHaveURL(/\/admin\/logout-inactivity/)
      await expect(secondPage).toHaveURL(/\/admin\/logout-inactivity/)
      await expect(activePage.locator('.nav')).toBeHidden()
      await expect(secondPage.locator('.nav')).toBeHidden()
    })

    test('should propagate explicit logout to a second page', async () => {
      const secondPage = await openAuthenticatedPage({
        context: sessionContext,
        url: usersURL.account,
      })

      await activePage.locator('.user-menu__trigger').click()
      await activePage.locator('a[href$="/logout"]').click()

      await expect(activePage).toHaveURL(/\/admin\/login/)
      await expect(secondPage).toHaveURL(/\/admin\/login/)
      await expect(activePage.locator('.login')).toBeVisible()
      await expect(secondPage.locator('.login')).toBeVisible()
    })

    test('should ignore stale expiration after a newer cross-tab refresh', async () => {
      const secondPage = await openAuthenticatedPage({
        context: sessionContext,
        url: usersURL.account,
      })
      const previousExpirationMs = await readTokenExpirationMs(secondPage)

      await waitForServerClockAfterTokenIssue(previousExpirationMs)
      await refreshSessionFromDebugButton(activePage)
      await expect
        .poll(() => readTokenExpirationMs(secondPage))
        .toBeGreaterThan(previousExpirationMs)
      const refreshedExpirationMs = await readTokenExpirationMs(secondPage)

      await dispatchStaleExpirationMessage({
        expiredTokenAt: previousExpirationMs,
        page: secondPage,
      })

      await expect(secondPage.locator('#token-expiration-ms')).toHaveText(
        String(refreshedExpirationMs),
      )
      await expect(secondPage).toHaveURL(usersURL.account)
      await expect(secondPage.locator('.nav')).toBeVisible()
    })
  })
})

const sessionTokenLifetimeMs = 7_200_000

async function advanceToRemainingSessionTime({
  page,
  remainingMs,
  tokenExpirationMs,
}: {
  page: Page
  remainingMs: number
  tokenExpirationMs: number
}): Promise<void> {
  const now = await page.evaluate(() => Date.now())
  const durationMs = tokenExpirationMs - now - remainingMs

  expect(durationMs).toBeGreaterThanOrEqual(0)
  await page.clock.fastForward(durationMs)
}

async function dispatchManySessionActivityEvents(page: Page): Promise<void> {
  await page.evaluate(() => {
    for (let index = 0; index < 10; index++) {
      window.dispatchEvent(new PointerEvent('pointerdown'))
      window.dispatchEvent(new KeyboardEvent('keydown'))
      window.dispatchEvent(new InputEvent('input'))
      window.dispatchEvent(new WheelEvent('wheel'))
    }
  })
}

async function dispatchStaleExpirationMessage({
  expiredTokenAt,
  page,
}: {
  expiredTokenAt: number
  page: Page
}): Promise<void> {
  await page.evaluate(async (expiredTokenAtFromTest) => {
    const markerSourceID = `e2e-marker-${crypto.randomUUID()}`
    const observer = new BroadcastChannel('payload-auth-session')
    const sender = new BroadcastChannel('payload-auth-session')

    await new Promise<void>((resolve) => {
      observer.addEventListener('message', function onMessage(event) {
        if (event.data?.sourceID === markerSourceID) {
          observer.removeEventListener('message', onMessage)
          observer.close()
          sender.close()
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
        }
      })

      sender.postMessage({
        type: 'session-expired',
        expiredTokenAt: expiredTokenAtFromTest,
        sentAt: Date.now() + 100_000,
        sourceID: `e2e-stale-${crypto.randomUUID()}`,
      })
      sender.postMessage({
        type: 'e2e-delivery-marker',
        sentAt: Date.now() + 100_001,
        sourceID: markerSourceID,
      })
    })
  }, expiredTokenAt)
}

async function expectActivityRefresh({
  activity,
  page,
}: {
  activity: () => Promise<unknown>
  page: Page
}): Promise<Response> {
  const refreshResponse = page.waitForResponse((response) =>
    isActivityRefreshRequest(response.request()),
  )

  await activity()
  await page.clock.fastForward(1_001)
  const response = await refreshResponse

  expect(response.status()).toBe(200)

  return response
}

function isActivityRefreshRequest(request: Request): boolean {
  const requestURL = new URL(request.url())

  return (
    request.method() === 'POST' &&
    requestURL.pathname.endsWith(`/api/${slug}/refresh-token`) &&
    requestURL.searchParams.has('refresh')
  )
}

function observeActivityRefreshRequests(page: Page): Request[] {
  const requests: Request[] = []

  page.on('request', (request) => {
    if (isActivityRefreshRequest(request)) {
      requests.push(request)
    }
  })

  return requests
}

async function openAuthenticatedPage({
  context,
  url,
}: {
  context: BrowserContext
  url: string
}): Promise<Page> {
  const authenticatedPage = await context.newPage()

  initPageConsoleErrorCatch(authenticatedPage)
  await authenticatedPage.goto(url)
  await expect(authenticatedPage.locator('#token-expiration-ms')).toHaveText(/^\d+$/)

  return authenticatedPage
}

async function readTokenExpirationMs(page: Page): Promise<number> {
  const expirationText = await page.locator('#token-expiration-ms').textContent()
  const expirationMs = Number(expirationText)

  expect(expirationMs).toBeGreaterThan(0)

  return expirationMs
}

async function refreshSessionFromDebugButton(page: Page): Promise<void> {
  const refreshResponse = page.waitForResponse((response) => {
    const requestURL = new URL(response.url())

    return (
      response.request().method() === 'POST' &&
      requestURL.pathname.endsWith(`/api/${slug}/refresh-token`) &&
      !requestURL.searchParams.has('refresh')
    )
  })

  await page.locator('#refresh-auth-cookie').click()
  expect((await refreshResponse).status()).toBe(200)
}

async function waitForServerClockAfterTokenIssue(tokenExpirationMs: number): Promise<void> {
  const tokenIssuedAtMs = tokenExpirationMs - sessionTokenLifetimeMs

  await expect.poll(() => Date.now()).toBeGreaterThan(tokenIssuedAtMs + 1_000)
}
