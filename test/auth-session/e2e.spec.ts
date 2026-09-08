import { expect, test } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

import type { SessionScenario } from './sessionScenario.js'

import { ensureCompilationIsDone } from '../__helpers/e2e/helpers.js'
import { initPayloadE2ENoConfig } from '../__helpers/shared/initPayloadE2ENoConfig.js'
import { createSessionScenario } from './sessionScenario.js'
import {
  AUTH_SESSION_REFRESH_BARRIER_PHASES,
  authSessionAccessTokenCookieName,
  authSessionAccessTokenLifetimeMs,
  authSessionActivitySelector,
  authSessionRefreshWindowSelector,
} from './shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

let serverURL: string
let scenario: SessionScenario

async function expectTerminalLogoutToRevokeOAuthCredentials({
  scenario,
}: {
  scenario: SessionScenario
}): Promise<void> {
  const firstPage = await scenario.login()
  const secondPage = await scenario.openTab()
  const originalCredentials = await scenario.readOAuthCredentials()

  await scenario.armRefreshBarrier(AUTH_SESSION_REFRESH_BARRIER_PHASES.AFTER_ROTATION)
  await scenario.advanceBy(120_000)
  await scenario.moveMouse(firstPage)
  await scenario.advanceBy(60_000)
  const refreshResponse = scenario.waitForRefresh(firstPage)

  await scenario.advanceBy(1_001)
  await scenario.waitForRefreshBarrier(1)
  await scenario.logout(secondPage)
  await scenario.expectLoggedOut({ page: secondPage, route: 'login' })
  await scenario.releaseRefreshBarrier()

  const settledRefreshResponse = await refreshResponse

  expect(settledRefreshResponse.status()).toBe(200)

  const rotatedCredentials =
    await scenario.readRotatedOAuthCredentialsFromResponse(settledRefreshResponse)

  await scenario.expectLoggedOut({ page: firstPage, route: 'login' })
  await scenario.expectLoggedOut({ page: secondPage, route: 'login' })
  expect(await scenario.readAccessTokenCookie()).toBeUndefined()
  expect(await scenario.readRefreshTokenCookie()).toBeUndefined()
  await scenario.expectOAuthAccessTokenRevoked({
    accessToken: originalCredentials.accessToken,
  })
  await scenario.expectOAuthAccessTokenRevoked({
    accessToken: rotatedCredentials.accessToken,
  })
  await scenario.expectOAuthCredentialsRevoked({ credentials: originalCredentials })
  await scenario.expectOAuthCredentialsRevoked({ credentials: rotatedCredentials })
}

test.describe('Auth session', () => {
  test.beforeAll(async ({ browser }) => {
    ;({ serverURL } = await initPayloadE2ENoConfig({ dirname }))

    const context = await browser.newContext()
    const page = await context.newPage()

    await ensureCompilationIsDone({ noAutoLogin: true, page, serverURL })
    await context.close()
  })

  test.beforeEach(async ({ browser }) => {
    scenario = await createSessionScenario({ browser, serverURL })
  })

  test.afterEach(async () => {
    await scenario.close()
  })

  test('should refresh at the checkpoint after route activity before the refresh window', async () => {
    const page = await scenario.login()
    const originalExpiration = await scenario.readExpiration(page)
    const originalCredentials = await scenario.readOAuthCredentials()

    await expect(page.locator(authSessionActivitySelector)).toHaveText(/^Opens in 00:\d{2}$/)
    await scenario.advanceBy(120_000)
    await expect(page.locator(authSessionActivitySelector)).toHaveText(
      /^Open · closes in (?:01:\d{2}|02:00)$/,
    )
    await page.evaluate(() => {
      window.history.pushState({}, '', `${window.location.pathname}?activity=true`)
    })
    await expect(page.locator(authSessionActivitySelector)).toHaveText(
      /^Recorded · refresh in 00:\d{2}$/,
    )
    await scenario.advanceBy(60_000)
    await expect(page.locator(authSessionRefreshWindowSelector)).toHaveText('Open')
    const refreshResponse = scenario.waitForRefresh(page)

    await scenario.advanceBy(1_001)

    const response = await refreshResponse
    const responseBody = (await response.json()) as Record<string, unknown>
    const refreshedCredentials = await scenario.readOAuthCredentials()

    expect(response.status()).toBe(200)
    expect(responseBody).not.toHaveProperty('token')
    expect(responseBody).not.toHaveProperty('refreshedToken')
    expect(refreshedCredentials.accessToken).not.toBe(originalCredentials.accessToken)
    expect(refreshedCredentials.refreshToken).not.toBe(originalCredentials.refreshToken)
    expect(await scenario.readExpiration(page)).toBeGreaterThan(originalExpiration)
    await expect(page.locator(authSessionActivitySelector)).toHaveText(
      /^Opens in (?:00:\d{2}|01:00)$/,
    )
    await scenario.expectOAuthAccessTokenRevoked({
      accessToken: originalCredentials.accessToken,
    })

    await scenario.advanceBy(120_000)
    await scenario.expectLoggedIn(page)
  })

  test('should log out when the OAuth provider revokes the session before an activity refresh', async () => {
    const page = await scenario.login()
    const originalCredentials = await scenario.readOAuthCredentials()

    await scenario.advanceBy(180_000)
    await scenario.revokeOAuthSession()
    await scenario.moveMouse(page)
    const refreshResponse = scenario.waitForRefresh(page)

    await scenario.advanceBy(1_001)

    const response = await refreshResponse

    expect(response.status()).toBe(403)
    expect((await response.request().allHeaders()).cookie).toContain(
      `${authSessionAccessTokenCookieName}=${originalCredentials.accessToken}`,
    )
    expect((await scenario.readAccessTokenCookie())?.value).toBe(originalCredentials.accessToken)
    expect((await scenario.readRefreshTokenCookie())?.value).toBe(originalCredentials.refreshToken)
    await scenario.expectLoggedOut({ page, route: 'inactivity' })
  })

  test('should refresh the second tab from the first tab activity', async () => {
    const firstPage = await scenario.login()
    const firstOriginalExpiration = await scenario.readExpiration(firstPage)
    const secondPage = await scenario.openTab()
    const secondOriginalExpiration = await scenario.readExpiration(secondPage)

    expect(secondOriginalExpiration).toBe(firstOriginalExpiration)

    await scenario.advanceBy(120_000)
    await scenario.moveMouse(firstPage)
    await scenario.advanceBy(60_000)
    const refreshResponse = scenario.waitForRefresh(firstPage)

    await scenario.advanceBy(1_001)

    const response = await refreshResponse

    expect(response.status()).toBe(200)

    const firstExpiration = await scenario.readExpiration(firstPage)
    const secondExpiration = await scenario.readExpiration(secondPage)

    expect(firstExpiration).toBeGreaterThan(firstOriginalExpiration)
    expect(secondExpiration).toBe(firstExpiration)
    await expect(firstPage.locator(authSessionActivitySelector)).toHaveText(
      /^Opens in (?:00:\d{2}|01:00)$/,
    )
    await expect(secondPage.locator(authSessionActivitySelector)).toHaveText(
      /^Opens in (?:00:\d{2}|01:00)$/,
    )

    await scenario.advanceBy(120_000)
    await scenario.expectLoggedIn(firstPage)
    await scenario.expectLoggedIn(secondPage)
  })

  // eslint-disable-next-line playwright/expect-expect -- assertions are delegated to expectTerminalLogoutToRevokeOAuthCredentials.
  test('should revoke the provider session and log out both tabs on explicit logout', async ({
    browser,
  }) => {
    await test.step('healthy BroadcastChannel transport', async () => {
      await expectTerminalLogoutToRevokeOAuthCredentials({ scenario })
    })

    await scenario.close()
    scenario = await createSessionScenario({ browser, serverURL })
    await scenario.disableBroadcastChannel()

    await test.step('Storage fallback transport', async () => {
      await expectTerminalLogoutToRevokeOAuthCredentials({ scenario })
    })
  })

  test('should refresh or settle the session when the access token expires', async ({
    browser,
  }) => {
    await test.step('valid refresh credentials rotate an expired access token', async () => {
      const page = await scenario.login()
      const originalCredentials = await scenario.readOAuthCredentials()

      await page.close()
      await scenario.advanceBy(authSessionAccessTokenLifetimeMs + 1)

      const response = await scenario.refreshOAuthSession({ credentials: originalCredentials })
      const responseBody = (await response.json()) as Record<string, unknown>
      const refreshedCredentials = await scenario.readOAuthCredentials()

      expect(response.status()).toBe(200)
      expect(responseBody).not.toHaveProperty('token')
      expect(responseBody).not.toHaveProperty('refreshedToken')
      expect(refreshedCredentials.accessToken).not.toBe(originalCredentials.accessToken)
      expect(refreshedCredentials.refreshToken).not.toBe(originalCredentials.refreshToken)
      await scenario.expectOAuthAccessTokenAuthenticated({
        accessToken: refreshedCredentials.accessToken,
      })
    })

    await scenario.close()
    scenario = await createSessionScenario({ browser, serverURL })

    await test.step('idle expiration without an active refresh', async () => {
      const page = await scenario.login()
      const expirationMs = await scenario.readExpiration(page)
      const originalCredentials = await scenario.readOAuthCredentials()

      await scenario.advanceBy(240_000)
      await expect(page.locator(authSessionActivitySelector)).toHaveText('Closed · no refresh')
      await expect(page.locator(authSessionRefreshWindowSelector)).toHaveText('Closed')
      await scenario.delayLogoutRequest({ durationMs: 250 })
      await scenario.advanceBy(expirationMs - (await page.evaluate(() => Date.now())))

      await scenario.expectLoggedOut({ page, route: 'inactivity' })
      await expect(page.getByRole('link', { name: 'Log back in' })).toBeVisible()
      await expect.poll(async () => scenario.readAccessTokenCookie()).toBeUndefined()
      await expect.poll(async () => scenario.readRefreshTokenCookie()).toBeUndefined()
      await scenario.expectOAuthCredentialsRevoked({ credentials: originalCredentials })
    })

    await scenario.close()
    scenario = await createSessionScenario({ browser, serverURL })

    await test.step('expiration after provider rotation revokes the rotated credential', async () => {
      const page = await scenario.login()
      const originalCredentials = await scenario.readOAuthCredentials()

      await scenario.armRefreshBarrier(AUTH_SESSION_REFRESH_BARRIER_PHASES.AFTER_ROTATION)
      await scenario.advanceBy(120_000)
      await scenario.moveMouse(page)
      await scenario.advanceBy(60_000)
      const refreshResponse = scenario.waitForRefresh(page)

      await scenario.advanceBy(1_001)
      await scenario.waitForRefreshBarrier(1)
      await scenario.advanceBy(authSessionAccessTokenLifetimeMs - 181_001 + 1)
      await scenario.releaseRefreshBarrier()

      const settledRefreshResponse = await refreshResponse
      const rotatedCredentials =
        await scenario.readRotatedOAuthCredentialsFromResponse(settledRefreshResponse)

      expect(settledRefreshResponse.status()).toBe(200)
      await scenario.expectLoggedOut({ page, route: 'inactivity' })
      await expect.poll(async () => scenario.readAccessTokenCookie()).toBeUndefined()
      await expect.poll(async () => scenario.readRefreshTokenCookie()).toBeUndefined()
      await scenario.expectOAuthAccessTokenRevoked({
        accessToken: originalCredentials.accessToken,
      })
      await scenario.expectOAuthAccessTokenRevoked({
        accessToken: rotatedCredentials.accessToken,
      })
      await scenario.expectOAuthCredentialsRevoked({ credentials: originalCredentials })
      await scenario.expectOAuthCredentialsRevoked({ credentials: rotatedCredentials })
    })
  })
})
