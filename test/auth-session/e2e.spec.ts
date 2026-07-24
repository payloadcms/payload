import { expect, test } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

import type { SessionScenario } from './sessionScenario.js'

import { ensureCompilationIsDone } from '../__helpers/e2e/helpers.js'
import { initPayloadE2ENoConfig } from '../__helpers/shared/initPayloadE2ENoConfig.js'
import { createSessionScenario } from './sessionScenario.js'
import { authSessionTokenLifetimeMs } from './shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

let serverURL: string
let scenario: SessionScenario

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

    expect((await refreshResponse).status()).toBe(200)
    expect((await scenario.readTokenCookie())?.value).not.toBe(originalCookie?.value)
    expect(await scenario.readExpiration(page)).toBeGreaterThan(originalExpiration)

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

    expect((await refreshResponse).status()).toBe(200)
    expect((await scenario.readTokenCookie())?.value).not.toBe(originalCookie?.value)

    const firstExpiration = await scenario.readExpiration(firstPage)
    const secondExpiration = await scenario.readExpiration(secondPage)

    expect(firstExpiration).toBeGreaterThan(firstOriginalExpiration)
    expect(secondExpiration).toBe(firstExpiration)

    await scenario.advanceBy(120_000)
    await scenario.expectLoggedIn(firstPage)
    await scenario.expectLoggedIn(secondPage)
  })

  // eslint-disable-next-line playwright/expect-expect -- assertions are delegated to expectLoggedOut.
  test('should expire and log out without activity', async () => {
    const page = await scenario.login()

    await scenario.advanceBy(authSessionTokenLifetimeMs + 1)

    await scenario.expectLoggedOut({ page, route: 'inactivity' })
  })
})
