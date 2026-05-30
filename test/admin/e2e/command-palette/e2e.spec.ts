import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

import type { Config } from '../../payload-types.js'

import {
  ensureCompilationIsDone,
  getRoutes,
  initPageConsoleErrorCatch,
} from '../../../__helpers/e2e/helpers.js'
import { initPayloadE2ENoConfig } from '../../../__helpers/shared/initPayloadE2ENoConfig.js'
import { TEST_TIMEOUT_LONG } from '../../../playwright.config.js'
import { BASE_PATH, customAdminRoutes } from '../../shared.js'
import { globalSlug, postsCollectionSlug } from '../../slugs.js'

process.env.NEXT_BASE_PATH = BASE_PATH

const filename = fileURLToPath(import.meta.url)
const currentFolder = path.dirname(filename)
const dirname = path.resolve(currentFolder, '../../')

/**
 * Press Cmd/Ctrl+K to open the palette.
 *
 * The `useHotkey` implementation detects the platform via `navigator.userAgent`. Playwright's
 * Desktop Chrome device profile uses a Windows UA string, so `hasCmd` is always false in the
 * test browser — meaning the shortcut listens for Ctrl+k regardless of the host OS.
 */
async function openPalette(page: Page): Promise<void> {
  // Use Control because Playwright's Desktop Chrome UA is Windows, so useHotkey picks Ctrl.
  await page.keyboard.down('Control')
  await page.keyboard.press('k')
  await page.keyboard.up('Control')
}

test.describe('Command Palette', () => {
  let page: Page
  let serverURL: string
  let adminRoute: string

  test.beforeAll(async ({ browser }, testInfo) => {
    const prebuild = false

    testInfo.setTimeout(TEST_TIMEOUT_LONG)

    process.env.SEED_IN_CONFIG_ONINIT = 'false'
    ;({ serverURL } = await initPayloadE2ENoConfig<Config>({
      dirname,
      prebuild,
    }))

    const context = await browser.newContext()
    page = await context.newPage()
    initPageConsoleErrorCatch(page)

    await ensureCompilationIsDone({ customAdminRoutes, page, serverURL })

    const adminRoutes = getRoutes({ customAdminRoutes })
    adminRoute = adminRoutes.routes.admin
  })

  test.beforeEach(async () => {
    await page.goto(`${serverURL}${adminRoute}`)
    await ensureCompilationIsDone({ customAdminRoutes, page, serverURL })
    // Wait for the sidebar nav and the account link to be visible. The account link is rendered
    // only after the client-side auth fetch resolves, which is after full React hydration and
    // useEffect execution — ensuring the useHotkey listener is registered.
    await expect(page.locator('nav.nav__wrap')).toBeVisible()
    await expect(page.locator('a[href*="/account"]')).toBeVisible()
    // Ensure the page body has focus so keyboard events reach document listeners.
    await page.locator('body').click()
  })

  test('should open with Cmd/Ctrl+K and close with Escape', async () => {
    await expect(page.locator('.cmd-palette__inner')).toBeHidden()

    await openPalette(page)
    await expect(page.locator('.cmd-palette__inner')).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(page.locator('.cmd-palette__inner')).toBeHidden()
  })

  test('should show empty state for non-matching query', async () => {
    await openPalette(page)
    await expect(page.locator('.cmd-palette__inner')).toBeVisible()

    await page.locator('.cmd-palette__input').fill('zzzznomatch')
    await expect(page.locator('.cmd-palette__empty')).toBeVisible()

    await page.keyboard.press('Escape')
  })

  test('should navigate to collection list on click', async () => {
    await openPalette(page)
    await expect(page.locator('.cmd-palette__inner')).toBeVisible()

    await page.locator('.cmd-palette__input').fill(postsCollectionSlug)

    const option = page
      .locator('[role="option"]')
      .filter({ has: page.locator('.cmd-palette__option-label', { hasText: /^Posts$/i }) })
      .first()
    await expect(option).toBeVisible()
    await option.click()

    await expect(page).toHaveURL(
      new RegExp(`${adminRoute}/collections/${postsCollectionSlug}(\\?|$)`),
    )
  })

  test('should navigate to collection create on Ctrl+Enter', async () => {
    await openPalette(page)
    await expect(page.locator('.cmd-palette__inner')).toBeVisible()

    await page.locator('.cmd-palette__input').fill(postsCollectionSlug)

    // Wait for the Posts option to appear and be active (highlighted as first result).
    const option = page
      .locator('[role="option"]')
      .filter({ has: page.locator('.cmd-palette__option-label', { hasText: /^Posts$/i }) })
      .first()
    await expect(option).toBeVisible()

    // Ctrl+Enter triggers create navigation — input stays focused, event bubbles to inner div.
    // Control because Desktop Chrome UA is Windows (same logic as openPalette).
    await page.locator('.cmd-palette__input').press('Control+Enter')

    await expect(page).toHaveURL(
      new RegExp(`${adminRoute}/collections/${postsCollectionSlug}/create`),
    )
  })

  test('should navigate to global on click', async () => {
    await openPalette(page)
    await expect(page.locator('.cmd-palette__inner')).toBeVisible()

    await page.locator('.cmd-palette__input').fill(globalSlug)

    const option = page
      .locator('[role="option"]')
      .filter({ hasText: /global/i })
      .first()
    await expect(option).toBeVisible()
    await option.click()

    await expect(page).toHaveURL(new RegExp(`${adminRoute}/globals/`))
  })

  test('should navigate to collection list when the footer open hint is clicked', async () => {
    await openPalette(page)
    await expect(page.locator('.cmd-palette__inner')).toBeVisible()

    await page.locator('.cmd-palette__input').fill(postsCollectionSlug)

    const option = page
      .locator('[role="option"]')
      .filter({ has: page.locator('.cmd-palette__option-label', { hasText: /^Posts$/i }) })
      .first()
    await expect(option).toBeVisible()

    const openHint = page.locator('.cmd-palette__footer button').filter({ hasText: 'open' })
    await expect(openHint).toBeVisible()
    await openHint.click()

    await expect(page).toHaveURL(
      new RegExp(`${adminRoute}/collections/${postsCollectionSlug}(\\?|$)`),
    )
  })

  test('should navigate to collection create when the footer create hint is clicked', async () => {
    await openPalette(page)
    await expect(page.locator('.cmd-palette__inner')).toBeVisible()

    await page.locator('.cmd-palette__input').fill(postsCollectionSlug)

    const option = page
      .locator('[role="option"]')
      .filter({ has: page.locator('.cmd-palette__option-label', { hasText: /^Posts$/i }) })
      .first()
    await expect(option).toBeVisible()

    const createHint = page.locator('.cmd-palette__footer button').filter({ hasText: 'create new' })
    await expect(createHint).toBeVisible()
    await createHint.click()

    await expect(page).toHaveURL(
      new RegExp(`${adminRoute}/collections/${postsCollectionSlug}/create`),
    )
  })

  test('should hide the footer create hint when a global is the active row', async () => {
    await openPalette(page)
    await expect(page.locator('.cmd-palette__inner')).toBeVisible()

    await page.locator('.cmd-palette__input').fill(globalSlug)

    const option = page
      .locator('[role="option"]')
      .filter({ hasText: /global/i })
      .first()
    await expect(option).toBeVisible()
    // Hover to force the global row active so the footer reflects it (not whichever row ranked first).
    await option.hover()

    // Globals are singletons with no create action, so the footer create hint must not render.
    const createHint = page.locator('.cmd-palette__footer button').filter({ hasText: 'create new' })
    await expect(createHint).toBeHidden()

    await page.keyboard.press('Escape')
  })
})
