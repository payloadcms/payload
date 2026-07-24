import { expect, test } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

import type { SessionScenario } from './sessionScenario.js'

import { ensureCompilationIsDone } from '../__helpers/e2e/helpers.js'
import { initPayloadE2ENoConfig } from '../__helpers/shared/initPayloadE2ENoConfig.js'
import { createSessionScenario } from './sessionScenario.js'
import { AUTH_SESSION_REFRESH_BARRIER_PHASES, authSessionTokenLifetimeMs } from './shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

let serverURL: string
let scenario: SessionScenario

async function expectExplicitLogoutToWinDelayedRefresh({
  scenario,
}: {
  scenario: SessionScenario
}): Promise<void> {
  const firstPage = await scenario.login()
  const secondPage = await scenario.openTab()
  const originalCookie = await scenario.readTokenCookie()

  expect(originalCookie).toBeDefined()

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

  const rotatedToken = await scenario.readRefreshTokenFromResponse(settledRefreshResponse)

  await scenario.expectLoggedOut({ page: firstPage, route: 'login' })
  await scenario.expectLoggedOut({ page: secondPage, route: 'login' })
  expect(await scenario.readTokenCookie()).toBeUndefined()
  await scenario.expectProviderSessionRevoked({ token: originalCookie?.value ?? '' })
  await scenario.expectProviderSessionRevoked({ token: rotatedToken })
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

  test('should refresh at the checkpoint after mouse activity before the refresh window', async () => {
    const page = await scenario.login()
    const originalExpiration = await scenario.readExpiration(page)
    const originalCookie = await scenario.readTokenCookie()

    await scenario.advanceBy(120_000)
    await scenario.moveMouse(page)
    await scenario.advanceBy(60_000)
    const refreshResponse = scenario.waitForRefresh(page)

    await scenario.advanceBy(1_001)

    const response = await refreshResponse
    const responseBody = (await response.json()) as Record<string, unknown>

    expect(response.status()).toBe(200)
    expect(responseBody).not.toHaveProperty('token')
    expect(responseBody).not.toHaveProperty('refreshedToken')
    expect((await scenario.readTokenCookie())?.value).not.toBe(originalCookie?.value)
    expect(await scenario.readExpiration(page)).toBeGreaterThan(originalExpiration)
    await scenario.expectProviderSessionRevoked({ token: originalCookie?.value ?? '' })

    await scenario.advanceBy(120_000)
    await scenario.expectLoggedIn(page)
  })

  test('should log out when the provider revokes the opaque cookie before an activity refresh', async () => {
    const page = await scenario.login()
    const originalCookie = await scenario.readTokenCookie()

    expect(originalCookie).toBeDefined()

    await scenario.advanceBy(180_000)
    await scenario.revoke()
    await scenario.moveMouse(page)
    const refreshResponse = scenario.waitForRefresh(page)

    await scenario.advanceBy(1_001)

    const response = await refreshResponse

    expect(response.status()).toBe(403)
    expect((await response.request().allHeaders()).cookie).toContain(
      `payload-token=${originalCookie?.value}`,
    )
    expect((await scenario.readTokenCookie())?.value).toBe(originalCookie?.value)
    await scenario.expectLoggedOut({ page, route: 'inactivity' })
  })

  test('should refresh the second tab from the first tab activity', async () => {
    const firstPage = await scenario.login()
    const firstOriginalExpiration = await scenario.readExpiration(firstPage)
    const originalCookie = await scenario.readTokenCookie()
    const secondPage = await scenario.openTab()
    const secondOriginalExpiration = await scenario.readExpiration(secondPage)

    expect(originalCookie).toBeDefined()
    expect(secondOriginalExpiration).toBe(firstOriginalExpiration)

    await scenario.advanceBy(120_000)
    await scenario.moveMouse(firstPage)
    await scenario.advanceBy(60_000)
    const refreshResponse = scenario.waitForRefresh(firstPage)

    await scenario.advanceBy(1_001)

    const response = await refreshResponse
    const responseBody = (await response.json()) as Record<string, unknown>
    const refreshedCookie = await scenario.readTokenCookie()

    expect(response.status()).toBe(200)
    expect(responseBody).not.toHaveProperty('token')
    expect(responseBody).not.toHaveProperty('refreshedToken')
    expect(refreshedCookie?.value).not.toBe(originalCookie?.value)
    await scenario.expectProviderSessionRevoked({ token: originalCookie?.value ?? '' })

    const firstExpiration = await scenario.readExpiration(firstPage)
    const secondExpiration = await scenario.readExpiration(secondPage)

    expect(firstExpiration).toBeGreaterThan(firstOriginalExpiration)
    expect(secondExpiration).toBe(firstExpiration)

    await scenario.advanceBy(120_000)
    await scenario.expectLoggedIn(firstPage)
    await scenario.expectLoggedIn(secondPage)

    await scenario.armRefreshBarrier(AUTH_SESSION_REFRESH_BARRIER_PHASES.BEFORE_ROTATION)
    const concurrentRefreshes = [
      scenario.refreshProviderSession({ token: refreshedCookie?.value ?? '' }),
      scenario.refreshProviderSession({ token: refreshedCookie?.value ?? '' }),
    ]

    await scenario.waitForRefreshBarrier(2)
    await scenario.releaseRefreshBarrier()

    const concurrentResponses = await Promise.all(concurrentRefreshes)
    const successfulResponse = concurrentResponses.find((response) => response.status() === 200)
    const rejectedResponse = concurrentResponses.find((response) => response.status() === 403)

    expect(successfulResponse).toBeDefined()
    expect(rejectedResponse).toBeDefined()
    expect(concurrentResponses.map((response) => response.status()).sort()).toEqual([200, 403])

    const successfulBody = (await successfulResponse?.json()) as Record<string, unknown>
    const concurrentToken = await scenario.readRefreshTokenFromResponse(successfulResponse!)

    expect(successfulBody).not.toHaveProperty('token')
    expect(successfulBody).not.toHaveProperty('refreshedToken')
    expect(concurrentToken).not.toContain('.')
    await scenario.expectProviderSessionRevoked({ token: refreshedCookie?.value ?? '' })
    await scenario.expectProviderSessionAuthenticated({ token: concurrentToken })
  })

  // eslint-disable-next-line playwright/expect-expect -- assertions are delegated to expectExplicitLogoutToWinDelayedRefresh.
  test('should revoke the provider session and log out both tabs on explicit logout', async ({
    browser,
  }) => {
    await test.step('healthy BroadcastChannel transport', async () => {
      await expectExplicitLogoutToWinDelayedRefresh({ scenario })
    })

    await scenario.close()
    scenario = await createSessionScenario({ browser, serverURL })
    await scenario.disableBroadcastChannel()

    await test.step('Storage fallback transport', async () => {
      await expectExplicitLogoutToWinDelayedRefresh({ scenario })
    })
  })

  // eslint-disable-next-line playwright/expect-expect -- assertions are delegated to expectLoggedOut.
  test('should expire and log out without activity', async () => {
    const page = await scenario.login()

    await scenario.advanceBy(authSessionTokenLifetimeMs + 1)

    await scenario.expectLoggedOut({ page, route: 'inactivity' })
  })
})
