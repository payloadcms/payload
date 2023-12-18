import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'

import { closeNav, initPageConsoleErrorCatch, openNav } from '../helpers'
import { initPayloadE2E } from '../helpers/configHelpers'

const { beforeAll, describe } = test

describe('refresh-permissions', () => {
  let serverURL: string
  let page: Page

  beforeAll(async ({ browser }) => {
    ;({ serverURL } = await initPayloadE2E(__dirname))
    const context = await browser.newContext()
    page = await context.newPage()

    initPageConsoleErrorCatch(page)
  })

  test('should show test global immediately after allowing access', async () => {
    await page.goto(`${serverURL}/admin/globals/settings`)

    await openNav(page)

    // Ensure that we have loaded accesses by checking that settings collection
    // at least is visible in the menu.
    await expect(page.locator('#nav-global-settings')).toBeVisible()

    // Test collection should be hidden at first.
    await expect(page.locator('#nav-global-test')).toBeHidden()

    await closeNav(page)

    // Allow access to test global.
    await page.locator('.checkbox-input:has(#field-test) input').check()
    await page.locator('#action-save').click()

    await openNav(page)

    // Now test collection should appear in the menu.
    await expect(page.locator('#nav-global-test')).toBeVisible()
  })
})
