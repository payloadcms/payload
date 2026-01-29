import type { BrowserContext, Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import * as path from 'path'
import { adminRoute } from 'shared.js'
import { fileURLToPath } from 'url'

import {
  ensureCompilationIsDone,
  initPageConsoleErrorCatch,
  saveDocAndAssert,
  // throttleTest,
} from '../helpers.js'
import { AdminUrlUtil } from '../helpers/adminUrlUtil.js'
import { login } from '../helpers/e2e/auth/login.js'
import { initPayloadE2ENoConfig } from '../helpers/initPayloadE2ENoConfig.js'
import { TEST_TIMEOUT_LONG } from '../playwright.config.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
let context: BrowserContext

test.describe('Admin Panel (Root)', () => {
  let page: Page
  let url: AdminUrlUtil

  test.beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)

    const { serverURL } = await initPayloadE2ENoConfig({ dirname })
    url = new AdminUrlUtil(serverURL, 'posts', {
      admin: adminRoute,
    })

    context = await browser.newContext()
    page = await context.newPage()
    initPageConsoleErrorCatch(page)

    await ensureCompilationIsDone({
      customRoutes: {
        admin: adminRoute,
      },
      noAutoLogin: true,
      page,
      serverURL,
    })

    await login({ customRoutes: { admin: adminRoute }, page, serverURL })

    await ensureCompilationIsDone({
      customRoutes: {
        admin: adminRoute,
      },
      page,
      serverURL,
    })
  })

  // test.beforeEach(async () => {
  //   await throttleTest({
  //     page,
  //     context,
  //     delay: 'Fast 4G',
  //   })
  // })

  test('should redirect `${adminRoute}/collections` to `${adminRoute}', async () => {
    const collectionsURL = `${url.admin}/collections`
    await page.goto(collectionsURL)
    // Should redirect to dashboard
    await expect.poll(() => page.url()).toBe(`${url.admin}`)
  })

  test('renders admin panel at root', async () => {
    await page.goto(url.admin)
    const pageURL = page.url()
    expect(pageURL).toBe(url.admin)
    expect(pageURL).not.toContain('/admin')
  })

  test('collection — navigates to list view', async () => {
    await page.goto(url.list)
    const pageURL = page.url()
    expect(pageURL).toContain(url.list)
    expect(pageURL).not.toContain('/admin')
  })

  test('collection — renders versions list', async () => {
    await page.goto(url.create)
    const textField = page.locator('#field-text')
    await textField.fill('test')
    await saveDocAndAssert(page)

    const versionsTab = page.locator('a.doc-tab[href$="/versions"]')
    await versionsTab.click()
    const firstRow = page.locator('tbody .row-1')
    await expect(firstRow).toBeVisible()
  })

  test('collection - should hide Copy To Locale button when localization is false', async () => {
    await page.goto(url.create)
    const textField = page.locator('#field-text')
    await textField.fill('test')
    await saveDocAndAssert(page)
    await page.locator('.doc-controls__popup >> .popup-button').click()
    await expect(page.locator('#copy-locale-data__button')).toBeHidden()
  })

  test('global — navigates to edit view', async () => {
    await page.goto(url.global('menu'))
    const pageURL = page.url()
    expect(pageURL).toBe(url.global('menu'))
    expect(pageURL).not.toContain('/admin')
  })

  test('global — renders versions list', async () => {
    await page.goto(url.global('menu'))
    const textField = page.locator('#field-globalText')
    await textField.fill('updated global text')
    await saveDocAndAssert(page)

    await page.goto(`${url.global('menu')}/versions`)
    const firstRow = page.locator('tbody .row-1')
    await expect(firstRow).toBeVisible()
  })

  test('ui - should render default payload favicons', async () => {
    await page.goto(url.admin)
    const favicons = page.locator('link[rel="icon"][type="image/png"]')
    await expect(favicons).toHaveCount(2)
    await expect(favicons.nth(0)).toHaveAttribute('sizes', '32x32')
    await expect(favicons.nth(1)).toHaveAttribute('sizes', '32x32')
    await expect(favicons.nth(1)).toHaveAttribute('media', '(prefers-color-scheme: dark)')
    await expect(favicons.nth(1)).toHaveAttribute('href', /\/payload-favicon-light\.[a-z\d]+\.png/)
  })

  test('config.admin.theme should restrict the theme', async () => {
    await page.goto(url.account)
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    await expect(page.locator('#field-theme')).toBeHidden()
    await expect(page.locator('#field-theme-auto')).toBeHidden()
  })

  test('should mount custom root views', async () => {
    await page.goto(`${url.admin}/custom-view`)
    await expect(page.locator('#custom-view')).toBeVisible()
  })

  test('should close modal on route change', async () => {
    await page.goto(url.create)
    const textField = page.locator('#field-text')
    await textField.fill('updated')
    await page.click('a[aria-label="Account"]')
    const modal = page.locator('div.payload__modal-container')
    await expect(modal).toBeVisible()

    await page.goBack()
    await expect(modal).toBeHidden()
  })
})
