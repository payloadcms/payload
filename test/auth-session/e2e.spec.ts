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

  // eslint-disable-next-line playwright/expect-expect -- assertions are delegated to expectLoggedOut.
  test('should expire and log out without activity', async () => {
    const page = await scenario.login()

    await scenario.advanceBy(authSessionTokenLifetimeMs + 1)

    await scenario.expectLoggedOut({ page, route: 'inactivity' })
  })
})
