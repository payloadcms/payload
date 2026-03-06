import type { Page } from '@playwright/test'

import { expect } from '@playwright/test'

export async function openNav(page: Page): Promise<{ nav: ReturnType<Page['locator']> }> {
  // wait for the preferences/media queries to either open or close the nav
  await expect(page.locator('.template-default--nav-hydrated')).toBeVisible()

  // close all open modals
  const dialogs = await page.locator('dialog[open]').elementHandles()

  for (let i = 0; i < dialogs.length; i++) {
    await page.keyboard.press('Escape')
  }

  // check to see if the nav is already open and if not, open it
  // use the `--nav-open` modifier class to check if the nav is open
  // this will prevent clicking nav links that are bleeding off the screen
  const nav = page.locator('.template-default.template-default--nav-open')

  if (await nav.isVisible()) {
    return {
      nav,
    }
  }

  // playwright: get first element with .nav-toggler which is VISIBLE (not hidden), could be 2 elements with .nav-toggler on mobile and desktop but only one is visible
  await page.locator('.nav-toggler >> visible=true').click()
  await expect(page.locator('.nav--nav-animate[inert], .nav--nav-hydrated[inert]')).toBeHidden()
  await expect(page.locator('.template-default.template-default--nav-open')).toBeVisible()

  return {
    nav,
  }
}

export async function closeNav(page: Page): Promise<void> {
  // wait for the preferences/media queries to either open or close the nav
  await expect(page.locator('.template-default--nav-hydrated')).toBeVisible()

  // check to see if the nav is already closed and if so, return early
  if (!(await page.locator('.template-default.template-default--nav-open').isVisible())) {
    return
  }

  // playwright: get first element with .nav-toggler which is VISIBLE (not hidden), could be 2 elements with .nav-toggler on mobile and desktop but only one is visible
  await page.locator('.nav-toggler >> visible=true').click()
  await expect(page.locator('.template-default.template-default--nav-open')).toBeHidden()
}
