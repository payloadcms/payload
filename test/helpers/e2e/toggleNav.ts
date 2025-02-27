import type { Page } from '@playwright/test'

import { expect } from '@playwright/test'

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
