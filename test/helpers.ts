import type { Locator, Page } from '@playwright/test'

import { expect } from '@playwright/test'
import shelljs from 'shelljs'

import wait from '../packages/payload/src/utilities/wait.js'
import { devUser } from './credentials.js'

type FirstRegisterArgs = {
  page: Page
  serverURL: string
}

type LoginArgs = {
  page: Page
  serverURL: string
}

export async function firstRegister(args: FirstRegisterArgs): Promise<void> {
  const { page, serverURL } = args

  await page.goto(`${serverURL}/admin`)
  await page.fill('#field-email', devUser.email)
  await page.fill('#field-password', devUser.password)
  await page.fill('#field-confirm-password', devUser.password)
  await wait(500)
  await page.click('[type=submit]')
  await page.waitForURL(`${serverURL}/admin`)
}

export async function login(args: LoginArgs): Promise<void> {
  const { page, serverURL } = args

  await page.goto(`${serverURL}/admin`)
  await page.fill('#field-email', devUser.email)
  await page.fill('#field-password', devUser.password)
  await wait(500)
  await page.click('[type=submit]')
  await page.waitForURL(`${serverURL}/admin`)
}

export async function saveDocHotkeyAndAssert(page: Page): Promise<void> {
  const ua = page.evaluate(() => navigator.userAgent)
  const isMac = (await ua).includes('Mac OS X')
  if (isMac) {
    await page.keyboard.down('Meta')
  } else {
    await page.keyboard.down('Control')
  }
  await page.keyboard.down('s')
  await expect(page.locator('.Toastify')).toContainText('successfully')
}

export async function saveDocAndAssert(page: Page, selector = '#action-save'): Promise<void> {
  await page.click(selector, { delay: 100 })
  await expect(page.locator('.Toastify')).toContainText('successfully')
  await wait(500)
  expect(page.url()).not.toContain('create')
}

export async function openNav(page: Page): Promise<void> {
  // check to see if the nav is already open and if not, open it
  // use the `--nav-open` modifier class to check if the nav is open
  // this will prevent clicking nav links that are bleeding off the screen
  if (await page.locator('.template-default.template-default--nav-open').isVisible()) return
  await page.locator('.nav-toggler').click()
  await expect(page.locator('.template-default.template-default--nav-open')).toBeVisible()
}

export async function closeNav(page: Page): Promise<void> {
  if (!(await page.locator('.template-default.template-default--nav-open').isVisible())) return
  await page.locator('#nav-toggler').click()
  await expect(page.locator('.template-default.template-default--nav-open')).toBeHidden()
}

export async function openDocControls(page: Page): Promise<void> {
  await page.locator('.doc-controls__popup >> .popup-button').click()
  await expect(page.locator('.doc-controls__popup >> .popup__content')).toBeVisible()
}

export async function changeLocale(page: Page, newLocale: string) {
  await page.locator('.localizer >> button').first().click()
  await page
    .locator(`.localizer`)
    .locator(`.popup >> button`, {
      hasText: newLocale,
    })
    .first()
    .click()
  await wait(500)
  expect(page.url()).toContain(`locale=${newLocale}`)
}

export function exactText(text: string) {
  return new RegExp(`^${text}$`)
}

export const checkPageTitle = async (page: Page, title: string) =>
  expect(await page.locator('.doc-header__title.render-title')?.first()?.innerText()).toBe(title)

export const checkBreadcrumb = async (page: Page, text: string) =>
  expect(await page.locator('.step-nav.app-header__step-nav .step-nav__last')?.innerText()).toBe(
    text,
  )

export const selectTableRow = async (page: Page, title: string): Promise<void> => {
  const selector = `tbody tr:has-text("${title}") .select-row__checkbox input[type=checkbox]`
  await page.locator(selector).check()
  expect(await page.locator(selector).isChecked()).toBe(true)
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
      !msg.text().includes('Failed to fetch RSC payload for')
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
