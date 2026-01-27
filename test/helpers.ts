import type {
  Browser,
  BrowserContext,
  CDPSession,
  ChromiumBrowserContext,
  Locator,
  Page,
} from '@playwright/test'
import type { Config, SanitizedConfig } from 'payload'

import { expect } from '@playwright/test'
import { defaults } from 'payload'
import { formatAdminURL, wait } from 'payload/shared'
import { setTimeout } from 'timers/promises'

import { POLL_TOPASS_TIMEOUT } from './playwright.config.js'

export type AdminRoutes = NonNullable<NonNullable<Config['admin']>['routes']>

const random = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min

const networkConditions = {
  'Fast 3G': {
    download: ((1.6 * 1000 * 1000) / 8) * 0.9,
    latency: 1000,
    upload: ((750 * 1000) / 8) * 0.9,
  },
  'Slow 3G': {
    download: ((500 * 1000) / 8) * 0.8,
    latency: 2500,
    upload: ((500 * 1000) / 8) * 0.8,
  },
  'Slow 4G': {
    download: ((4 * 1000 * 1000) / 8) * 0.8,
    latency: 1000,
    upload: ((3 * 1000 * 1000) / 8) * 0.8,
  },
  'Fast 4G': {
    download: ((20 * 1000 * 1000) / 8) * 0.8,
    latency: 1000,
    upload: ((10 * 1000 * 1000) / 8) * 0.8,
  },
  None: {
    download: 0,
    latency: -1,
    upload: -1,
  },
}

/**
 * Ensure admin panel is loaded before running tests
 * @param page
 * @param serverURL
 */
export async function ensureCompilationIsDone({
  customAdminRoutes,
  customRoutes,
  page: pageFromArgs,
  serverURL,
  noAutoLogin,
  browser,
  readyURL,
}: {
  /**
   * Provide a browser if you need this utility to create and close a temporary page for you.
   */
  browser?: Browser
  customAdminRoutes?: AdminRoutes
  customRoutes?: Config['routes']
  noAutoLogin?: boolean
  page?: Page
  readyURL?: string
  serverURL: string
}): Promise<void> {
  if (!pageFromArgs && !browser) {
    throw new Error('Either page or browser must be provided')
  }
  if (pageFromArgs && browser) {
    throw new Error('Either page or browser must be provided, not both')
  }

  const page = pageFromArgs ?? (await browser!.newPage())

  const { routes: { admin: adminRoute } = {} } = getRoutes({ customAdminRoutes, customRoutes })

  const adminURL = formatAdminURL({ adminRoute, path: '', serverURL })

  const maxAttempts = 15
  let attempt = 1

  while (attempt <= maxAttempts) {
    try {
      console.log(
        `Checking if compilation is done (attempt ${attempt}/${maxAttempts})...`,
        readyURL ??
          (noAutoLogin ? `${adminURL + (adminURL.endsWith('/') ? '' : '/')}login` : adminURL),
      )

      await page.goto(adminURL)

      if (readyURL) {
        await page.waitForURL(readyURL)
      } else {
        await expect
          .poll(
            () => {
              if (noAutoLogin) {
                const baseAdminURL = adminURL + (adminURL.endsWith('/') ? '' : '/')
                return (
                  page.url() === `${baseAdminURL}create-first-user` ||
                  page.url() === `${baseAdminURL}login`
                )
              } else {
                return page.url() === adminURL
              }
            },
            { timeout: POLL_TOPASS_TIMEOUT },
          )
          .toBe(true)
      }

      console.log('Successfully compiled')
      if (browser) {
        await page.close()
      }
      return
    } catch (error) {
      if (attempt === maxAttempts) {
        console.error(
          'Compilation not done yet. Giving up. The dev server is probably not running or crashed.',
        )
        throw error
      }

      console.log('Compilation not done yet. Retrying in 2 seconds...')
      await wait(2000)
      attempt++
    }
  }

  if (noAutoLogin) {
    if (browser) {
      await page.close()
    }
    return
  }
  await expect(() => expect(page.locator('.template-default')).toBeVisible()).toPass({
    timeout: POLL_TOPASS_TIMEOUT,
  })

  await expect(page.locator('.dashboard__label').first()).toBeVisible()

  if (browser) {
    await page.close()
  }
}

/**
 * CPU throttling & 2 different kinds of network throttling
 */
export async function throttleTest({
  context,
  delay,
  page,
}: {
  context: BrowserContext
  delay: keyof typeof networkConditions
  page: Page
}): Promise<CDPSession> {
  const cdpSession = await context.newCDPSession(page)

  await cdpSession.send('Network.emulateNetworkConditions', {
    downloadThroughput: networkConditions[delay].download,
    latency: networkConditions[delay].latency,
    offline: false,
    uploadThroughput: networkConditions[delay].upload,
  })

  await page.route('**/*', async (route) => {
    await setTimeout(random(500, 1000))
    await route.continue()
  })

  const client = await (page.context() as ChromiumBrowserContext).newCDPSession(page)
  await client.send('Emulation.setCPUThrottlingRate', { rate: 8 }) // 8x slowdown

  return client
}

export async function saveDocHotkeyAndAssert(page: Page): Promise<void> {
  const ua = page.evaluate(() => navigator.userAgent)
  const isMac = (await ua).includes('Mac OS X')
  if (isMac) {
    await page.keyboard.down('Meta')
  } else {
    await page.keyboard.down('Control')
  }
  await page.keyboard.press('s')
  if (isMac) {
    await page.keyboard.up('Meta')
  } else {
    await page.keyboard.up('Control')
  }
  await expect(page.locator('.payload-toast-container')).toContainText('successfully')
  await closeAllToasts(page)
}

export async function saveDocAndAssert(
  page: Page,
  selector:
    | '#action-publish'
    | '#action-save'
    | '#action-save-draft'
    | '#publish-locale'
    | string = '#action-save',
  expectation: 'error' | 'success' = 'success',
  options?: {
    /**
     * If true, the all toasts will not be dismissed after the save operation.
     */
    disableDismissAllToasts?: boolean
  },
): Promise<void> {
  await wait(500) // TODO: Fix this
  if (selector === '#publish-locale') {
    // open dropdown
    const chevronButton = page.locator('.form-submit .popup__trigger-wrap > .popup-button')
    await chevronButton.click()
  }
  await page.click(selector, { delay: 100 })

  if (expectation === 'success') {
    await expect(page.locator('.payload-toast-container')).toContainText('successfully')
    await expect.poll(() => page.url(), { timeout: POLL_TOPASS_TIMEOUT }).not.toContain('/create')
  } else {
    await expect(page.locator('.payload-toast-container .toast-error')).toBeVisible()
  }

  // Close all toasts to prevent them from interfering with subsequent tests. E.g. the following could happen
  // 1. saveDocAndAssert
  // 2. some operation
  // 3. second saveDocAndAssert
  // 4. the first toast is still visible => the second saveDocAndAssert will pass even though the save is not finished yet (or even not successful!)
  if (!options?.disableDismissAllToasts) {
    await closeAllToasts(page)
  }
}

export async function closeAllToasts(page: Locator | Page): Promise<void> {
  const toastCloseSelector = '.payload-toast-container button.payload-toast-close-button'
  let count = await page.locator(toastCloseSelector).count()

  while (count > 0) {
    await page.locator(toastCloseSelector).first().click()
    await expect(page.locator(toastCloseSelector)).toHaveCount(count - 1)
    count--
  }
}

export async function openDocDrawer(page: Page, selector: string): Promise<void> {
  await wait(500) // wait for parent form state to initialize
  await page.locator(selector).click()
  await wait(500) // wait for drawer form state to initialize
}

export async function openCreateDocDrawer(page: Page, fieldSelector: string): Promise<void> {
  await wait(500) // wait for parent form state to initialize
  const relationshipField = page.locator(fieldSelector)
  await expect(relationshipField.locator('input')).toBeEnabled()
  const addNewButton = relationshipField.locator('.relationship-add-new__add-button')
  await expect(addNewButton).toBeVisible()
  await addNewButton.click()
  await wait(500) // wait for drawer form state to initialize
}

export async function openLocaleSelector(page: Page): Promise<void> {
  const button = page.locator('.localizer button.popup-button')
  const popup = page.locator('.popup__content')

  if (!(await popup.isVisible())) {
    await button.click()
    await expect(popup).toBeVisible()
  }
}

export async function closeLocaleSelector(page: Page): Promise<void> {
  const popup = page.locator('.popup__content')

  if (await popup.isVisible()) {
    await page.click('body', { position: { x: 0, y: 0 } })
    await expect(popup).toBeHidden()
  }
}

export async function changeLocale(page: Page, newLocale: string) {
  await openLocaleSelector(page)

  const currentlySelectedLocale = await page
    .locator(`.popup__content .popup-button-list__button--selected .localizer__locale-code`)
    .textContent()

  if (currentlySelectedLocale !== `(${newLocale})`) {
    const localeToSelect = page
      .locator('.popup__content .popup-button-list__button')
      .locator('.localizer__locale-code', {
        hasText: `${newLocale}`,
      })

    await expect(async () => await expect(localeToSelect).toBeEnabled()).toPass({
      timeout: POLL_TOPASS_TIMEOUT,
    })

    await localeToSelect.click()

    const regexPattern = new RegExp(`locale=${newLocale}`)

    await expect(page).toHaveURL(regexPattern)

    // Wait for form to finish re-initializing after locale change.
    // When locale changes, the form fetches new data asynchronously.
    // The Form exposes a data-form-ready attribute that indicates initialization is complete.
    await waitForFormReady(page)
  }

  await closeLocaleSelector(page)
}

export async function waitForFormReady(page: Page) {
  await expect
    .poll(async () => (await page.locator('[data-form-ready="false"]').count()) === 0, {
      timeout: POLL_TOPASS_TIMEOUT,
    })
    .toBe(true)
}

export function exactText(text: string) {
  return new RegExp(`^${text}$`)
}

export const checkPageTitle = async (page: Page, title: string) => {
  await expect
    .poll(async () => await page.locator('.doc-header__title.render-title')?.first()?.innerText(), {
      timeout: POLL_TOPASS_TIMEOUT,
    })
    .toBe(title)
}

export const checkBreadcrumb = async (page: Page, text: string) => {
  await expect
    .poll(
      async () => await page.locator('.step-nav.app-header__step-nav .step-nav__last')?.innerText(),
      {
        timeout: POLL_TOPASS_TIMEOUT,
      },
    )
    .toBe(text)
}

export const selectTableRow = async (scope: Locator | Page, title: string): Promise<void> => {
  const selector = `tbody tr:has-text("${title}") .select-row__checkbox input[type=checkbox]`
  await scope.locator(selector).check()
  await expect(scope.locator(selector)).toBeChecked()
}

export const findTableCell = async (
  page: Page,
  fieldName: string,
  rowTitle?: string,
): Promise<Locator> => {
  const parentEl = rowTitle ? await findTableRow(page, rowTitle) : page.locator('tbody tr')
  const cell = parentEl.locator(`td.cell-${fieldName}`)
  await expect(cell).toBeVisible()
  return cell
}

export const findTableRow = async (page: Page, title: string): Promise<Locator> => {
  const row = page.locator(`tbody tr:has-text("${title}")`)
  await expect(row).toBeVisible()
  return row
}

export async function switchTab(page: Page, selector: string) {
  await page.locator(selector).click()
  await wait(300)
  await expect(page.locator(`${selector}.tabs-field__tab-button--active`)).toBeVisible()
}

export const openColumnControls = async (page: Page) => {
  await page.locator('.list-controls__toggle-columns').click()
  await expect(page.locator('.list-controls__columns.rah-static--height-auto')).toBeVisible()
}

/**
 * Throws an error when browser console error messages (with some exceptions) are thrown, thus resulting
 * in the e2e test failing.
 *
 * Useful to prevent the e2e test from passing when, for example, there are react missing key prop errors
 * @param page
 * @param options
 */
export function initPageConsoleErrorCatch(page: Page, options?: { ignoreCORS?: boolean }) {
  const { ignoreCORS = false } = options || {} // Default to not ignoring CORS errors
  const consoleErrors: string[] = []

  let shouldCollectErrors = false

  page.on('console', (msg) => {
    if (
      msg.type() === 'error' &&
      // Playwright is seemingly loading CJS files from React Select, but Next loads ESM.
      // This leads to classnames not matching. Ignore these God-awful errors
      // https://github.com/JedWatson/react-select/issues/3590
      !msg.text().includes('did not match. Server:') &&
      !msg.text().includes('the server responded with a status of') &&
      !msg.text().includes('Failed to fetch RSC payload for') &&
      !msg.text().includes('Error loading language') &&
      !msg.text().includes('Error: NEXT_NOT_FOUND') &&
      !msg.text().includes('Error: NEXT_REDIRECT') &&
      !msg.text().includes('Error getting document data') &&
      !msg.text().includes('Failed trying to load default language strings') &&
      !msg.text().includes('TypeError: Failed to fetch') && // This happens when server actions are aborted
      !msg.text().includes('der-radius: 2px  Server   Error: Error getting do') && // This is a weird error that happens in the console
      // Conditionally ignore CORS errors based on the `ignoreCORS` option
      !(
        ignoreCORS &&
        msg.text().includes('Access to fetch at') &&
        msg.text().includes("No 'Access-Control-Allow-Origin' header is present")
      ) &&
      // Conditionally ignore network-related errors
      !msg.text().includes('Failed to load resource: net::ERR_FAILED')
    ) {
      // "Failed to fetch RSC payload for" happens seemingly randomly. There are lots of issues in the next.js repository for this. Causes e2e tests to fail and flake. Will ignore for now
      // the the server responded with a status of error happens frequently. Will ignore it for now.
      // Most importantly, this should catch react errors.
      const { url, lineNumber, columnNumber } = msg.location() || {}
      const locationSuffix = url ? `\n at ${url}:${lineNumber ?? 0}:${columnNumber ?? 0}` : ''
      throw new Error(`Browser console error: ${msg.text()}${locationSuffix}`)
    }

    // Log ignored CORS-related errors for visibility
    if (msg.type() === 'error' && msg.text().includes('Access to fetch at') && ignoreCORS) {
      console.log(`Ignoring expected CORS-related error: ${msg.text()}`)
    }

    // Log ignored network-related errors for visibility
    if (msg.type() === 'error' && msg.text().includes('Failed to load resource: net::ERR_FAILED')) {
      console.log(`Ignoring expected network error: ${msg.text()}`)
    }
  })

  // Capture uncaught errors that do not appear in the console
  page.on('pageerror', (error) => {
    if (shouldCollectErrors) {
      const stack = error?.stack
      const message = error?.message ?? String(error)
      consoleErrors.push(`Page error: ${message}${stack ? `\n${stack}` : ''}`)
    } else {
      // Rethrow the original error to preserve stack, name, and other metadata
      throw error
    }
  })

  return {
    consoleErrors,
    collectErrors: () => (shouldCollectErrors = true), // Enable collection of errors for specific tests
    stopCollectingErrors: () => (shouldCollectErrors = false), // Disable collection of errors after the test
  }
}

export function getRoutes({
  customAdminRoutes,
  customRoutes,
}: {
  customAdminRoutes?: AdminRoutes
  customRoutes?: Config['routes']
}): {
  admin: {
    routes: AdminRoutes
  }
  routes: NonNullable<SanitizedConfig['routes']>
} {
  let routes = defaults.routes
  let adminRoutes = defaults.admin?.routes

  if (customAdminRoutes) {
    adminRoutes = {
      ...adminRoutes,
      ...customAdminRoutes,
    }
  }

  if (customRoutes) {
    routes = {
      ...routes,
      ...customRoutes,
    }
  }

  return {
    admin: {
      routes: adminRoutes,
    },
    routes,
  }
}

type RunJobsQueueArgs = {
  queue?: string
  serverURL: string
}

export async function runJobsQueue(args: RunJobsQueueArgs) {
  const { serverURL } = args
  const queue = args?.queue ?? 'default'

  return await fetch(`${serverURL}/api/payload-jobs/run?queue=${queue}`, {
    method: 'get',
    credentials: 'include',
  })
}
