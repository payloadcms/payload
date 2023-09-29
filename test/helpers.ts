import type { Page } from '@playwright/test'

import { expect } from '@playwright/test'

import wait from '../packages/payload/src/utilities/wait'
import { devUser } from './credentials'

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
  expect(page.url()).not.toContain('create')
}

export async function openMainMenu(page: Page): Promise<void> {
  // check to see if the main menu is already open and if not, open it
  // use the `--nav-open` modifier class to check if the nav is open
  // this will prevent clicking nav links that are bleeding off the screen
  if (await page.locator('.template-default.template-default--nav-open').isVisible()) return
  // find .nav-toggler, not mobile-nav-toggler
  await page.locator('#nav-toggler').click()
  await expect(await page.locator('.template-default.template-default--nav-open')).toBeVisible()
}

export async function closeMainMenu(page: Page): Promise<void> {
  await page.locator('.payload__modal-toggler--slug-main-menu--is-open').click()
  const mainMenuModal = page.locator('#main-menu')
  await expect(mainMenuModal).toBeHidden()
}

export async function openDocControls(page: Page): Promise<void> {
  await page.locator('.doc-controls__popup .popup-button').click()
  await expect(page.locator('.doc-controls__popup .popup__content')).toBeVisible()
}

export async function changeLocale(page: Page, newLocale: string) {
  await page.locator('.localizer >> button').first().click()
  await page.locator(`.localizer >> a:has-text("${newLocale}")`).click()
  expect(page.url()).toContain(`locale=${newLocale}`)
}

export function exactText(text: string) {
  return new RegExp(`^${text}$`)
}
