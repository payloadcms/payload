import type { BrowserContext, ChromiumBrowserContext, Locator, Page } from '@playwright/test'
import type { Config } from 'payload'

import { formatAdminURL } from '@payloadcms/ui/shared'
import { expect } from '@playwright/test'
import { defaults } from 'payload'
import { wait } from 'payload/shared'
import shelljs from 'shelljs'
import { setTimeout } from 'timers/promises'

import { devUser } from './credentials.js'
import { POLL_TOPASS_TIMEOUT } from './playwright.config.js'

type FirstRegisterArgs = {
  customAdminRoutes?: Config['admin']['routes']
  customRoutes?: Config['routes']
  page: Page
  serverURL: string
}

type LoginArgs = {
  customAdminRoutes?: Config['admin']['routes']
  customRoutes?: Config['routes']
  data?: {
    email: string
    password: string
  }
  page: Page
  serverURL: string
}
const random = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min

const networkConditions = {
  'Fast 3G': {
    download: ((1.6 * 1000 * 1000) / 8) * 0.9,
    latency: 1000,
    upload: ((750 * 1000) / 8) * 0.9,
  },
  'Slow 3G': {
    download: ((500 * 1000) / 8) * 0.8,
    latency: 400 * 5,
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
}

/**
 * Ensure admin panel is loaded before running tests
 * @param page
 * @param serverURL
 */
export async function ensureCompilationIsDone({
  customAdminRoutes,
  customRoutes,
  page,
  serverURL,
  noAutoLogin,
}: {
  customAdminRoutes?: Config['admin']['routes']
  customRoutes?: Config['routes']
  noAutoLogin?: boolean
  page: Page
  serverURL: string
}): Promise<void> {
  const {
    routes: { admin: adminRoute },
  } = getRoutes({ customAdminRoutes, customRoutes })

  const adminURL = `${serverURL}${adminRoute}`

  const maxAttempts = 50
  let attempt = 1

  while (attempt <= maxAttempts) {
    try {
      console.log(`Checking if compilation is done (attempt ${attempt}/${maxAttempts})...`)

      await page.goto(adminURL)
      await page.waitForURL(
        noAutoLogin ? `${adminURL + (adminURL.endsWith('/') ? '' : '/')}login` : adminURL,
      )

      console.log('Successfully compiled')
      return
    } catch (error) {
      console.error(`Compilation not done yet`)

      if (attempt === maxAttempts) {
        console.error('Max retry attempts reached. Giving up.')
        throw error
      }

      console.log('Retrying in 3 seconds...')
      await wait(3000)
      attempt++
    }
  }

  if (noAutoLogin) {
    return
  }
  await expect(() => expect(page.locator('.template-default')).toBeVisible()).toPass({
    timeout: POLL_TOPASS_TIMEOUT,
  })

  await expect(page.locator('.dashboard__label').first()).toBeVisible()
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
}) {
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
}

export async function firstRegister(args: FirstRegisterArgs): Promise<void> {
  const { customAdminRoutes, customRoutes, page, serverURL } = args

  const {
    routes: { admin: adminRoute },
  } = getRoutes({ customAdminRoutes, customRoutes })

  await page.goto(`${serverURL}${adminRoute}`)
  await page.fill('#field-email', devUser.email)
  await page.fill('#field-password', devUser.password)
  await page.fill('#field-confirm-password', devUser.password)
  await wait(500)
  await page.click('[type=submit]')
  await page.waitForURL(`${serverURL}${adminRoute}`)
}

export async function login(args: LoginArgs): Promise<void> {
  const { customAdminRoutes, customRoutes, data = devUser, page, serverURL } = args

  const {
    admin: {
      routes: { createFirstUser, login: incomingLoginRoute },
    },
    routes: { admin: incomingAdminRoute },
  } = getRoutes({ customAdminRoutes, customRoutes })

  const adminRoute = formatAdminURL({ serverURL, adminRoute: incomingAdminRoute, path: '' })
  const loginRoute = formatAdminURL({
    serverURL,
    adminRoute: incomingAdminRoute,
    path: incomingLoginRoute,
  })
  const createFirstUserRoute = formatAdminURL({
    serverURL,
    adminRoute: incomingAdminRoute,
    path: createFirstUser,
  })

  await page.goto(loginRoute)
  await page.waitForURL(loginRoute)
  await wait(500)
  await page.fill('#field-email', data.email)
  await page.fill('#field-password', data.password)
  await wait(500)
  await page.click('[type=submit]')
  await page.waitForURL(adminRoute)

  await expect(() => expect(page.url()).not.toContain(loginRoute)).toPass({
    timeout: POLL_TOPASS_TIMEOUT,
  })

  await expect(() => expect(page.url()).not.toContain(createFirstUserRoute)).toPass({
    timeout: POLL_TOPASS_TIMEOUT,
  })
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
}

export async function saveDocAndAssert(
  page: Page,
  selector = '#action-save',
  expectation: 'error' | 'success' = 'success',
): Promise<void> {
  await wait(500) // TODO: Fix this
  await page.click(selector, { delay: 100 })

  if (expectation === 'success') {
    await expect(page.locator('.payload-toast-container')).toContainText('successfully')
    await expect.poll(() => page.url(), { timeout: POLL_TOPASS_TIMEOUT }).not.toContain('create')
  } else {
    await expect(page.locator('.payload-toast-container .toast-error')).toBeVisible()
  }
}

export async function openNav(page: Page): Promise<void> {
  // check to see if the nav is already open and if not, open it
  // use the `--nav-open` modifier class to check if the nav is open
  // this will prevent clicking nav links that are bleeding off the screen
  if (await page.locator('.template-default.template-default--nav-open').isVisible()) {
    return
  }
  // playwright: get first element with .nav-toggler which is VISIBLE (not hidden), could be 2 elements with .nav-toggler on mobile and desktop but only one is visible
  await page.locator('.nav-toggler >> visible=true').click()
  await expect(page.locator('.template-default.template-default--nav-open')).toBeVisible()
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

export async function closeNav(page: Page): Promise<void> {
  if (!(await page.locator('.template-default.template-default--nav-open').isVisible())) {
    return
  }
  await page.locator('.nav-toggler >> visible=true').click()
  await expect(page.locator('.template-default.template-default--nav-open')).toBeHidden()
}

export async function changeLocale(page: Page, newLocale: string) {
  await page.locator('.localizer >> button').first().click()
  await page
    .locator(`.localizer .popup.popup--active .popup-button-list__button`, {
      hasText: newLocale,
    })
    .first()
    .click()

  const regexPattern = new RegExp(`locale=${newLocale}`)

  await expect(page).toHaveURL(regexPattern)
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

export const selectTableRow = async (page: Page, title: string): Promise<void> => {
  const selector = `tbody tr:has-text("${title}") .select-row__checkbox input[type=checkbox]`
  await page.locator(selector).check()
  await expect(page.locator(selector)).toBeChecked()
}

export const findTableCell = (page: Page, fieldName: string, rowTitle?: string): Locator => {
  const parentEl = rowTitle ? findTableRow(page, rowTitle) : page.locator('tbody tr')
  const cell = parentEl.locator(`td.cell-${fieldName}`)
  expect(cell).toBeTruthy()
  return cell
}

export const findTableRow = (page: Page, title: string): Locator => {
  const row = page.locator(`tbody tr:has-text("${title}")`)
  expect(row).toBeTruthy()
  return row
}

export async function switchTab(page: Page, selector: string) {
  await page.locator(selector).click()
  await wait(300)
  await expect(page.locator(`${selector}.tabs-field__tab-button--active`)).toBeVisible()
}

/**
 * Throws an error when browser console error messages (with some exceptions) are thrown, thus resulting
 * in the e2e test failing.
 *
 * Useful to prevent the e2e test from passing when, for example, there are react missing key prop errors
 * @param page
 */
export function initPageConsoleErrorCatch(page: Page) {
  page.on('console', (msg) => {
    if (
      msg.type() === 'error' &&
      // Playwright is seemingly loading CJS files from React Select, but Next loads ESM.
      // This leads to classnames not matching. Ignore these God-awful errors
      // https://github.com/JedWatson/react-select/issues/3590
      !msg.text().includes('did not match. Server:') &&
      !msg.text().includes('the server responded with a status of') &&
      !msg.text().includes('Failed to fetch RSC payload for') &&
      !msg.text().includes('Error: NEXT_NOT_FOUND') &&
      !msg.text().includes('Error: NEXT_REDIRECT') &&
      !msg.text().includes('Error getting document data') &&
      !msg.text().includes('Failed trying to load default language strings') &&
      !msg.text().includes('TypeError: Failed to fetch') && // This happens when server actions are aborted
      !msg.text().includes('der-radius: 2px  Server   Error: Error getting do') // This is a weird error that happens in the console
    ) {
      // "Failed to fetch RSC payload for" happens seemingly randomly. There are lots of issues in the next.js repository for this. Causes e2e tests to fail and flake. Will ignore for now
      // the the server responded with a status of error happens frequently. Will ignore it for now.
      // Most importantly, this should catch react errors.
      throw new Error(`Browser console error: ${msg.text()}`)
    }
  })
}

export function describeIfInCIOrHasLocalstack(): jest.Describe {
  if (process.env.CI) {
    return describe
  }

  // Check that localstack is running
  const { code } = shelljs.exec(`docker ps | grep localstack`)

  if (code !== 0) {
    console.warn('Localstack is not running. Skipping test suite.')
    return describe.skip
  }

  console.log('Localstack is running. Running test suite.')

  return describe
}

type AdminRoutes = Config['admin']['routes']

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
  routes: Config['routes']
} {
  let routes = defaults.routes
  let adminRoutes = defaults.admin.routes

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
