import type { BrowserContext, Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import path from 'path'
import { formatAdminURL } from 'payload/shared'
import { fileURLToPath } from 'url'

import { expectScreenshot } from '../../__helpers/e2e/expectScreenshot.js'
import { getRoutes } from '../../__helpers/e2e/helpers.js'
import { visual } from '../../__helpers/e2e/visual.js'
import { reInitializeDB } from '../../__helpers/shared/clearAndSeed/reInitializeDB.js'
import { initPayloadE2ENoConfig } from '../../__helpers/shared/initPayloadE2ENoConfig.js'
import { initPage } from '../../__setup/e2e/initPage.js'
import { TEST_TIMEOUT_LONG } from '../../playwright.config.js'

const filename = fileURLToPath(import.meta.url)
const currentFolder = path.dirname(filename)
const dirname = path.resolve(currentFolder, '../')

test.describe('Auth visual regression', () => {
  let context: BrowserContext
  let page: Page
  let serverURL: string

  const {
    admin: {
      routes: { createFirstUser, forgot, login, reset, unauthorized },
    },
    routes: { admin: adminRoute },
  } = getRoutes({})

  test.beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    ;({ serverURL } = await initPayloadE2ENoConfig({ dirname }))

    context = await browser.newContext()
    ;({ page } = await initPage({ context, noAutoLogin: true, serverURL }))
  })

  test.beforeEach(async () => {
    await reInitializeDB({ deleteOnly: false, serverURL })
    await context.clearCookies()
  })

  test.afterAll(async () => {
    await context.close()
  })

  visual('should render the login view', async () => {
    await page.goto(formatAdminURL({ adminRoute, path: login, serverURL }))

    await expect(page.locator('.login')).toBeVisible()
    await expect(page.locator('#field-email')).toBeVisible()
    await expect(page.locator('#field-password')).toBeVisible()

    await expectScreenshot({ name: 'login-view.png', page })
  })

  visual('should render the forgot password view', async () => {
    await page.goto(formatAdminURL({ adminRoute, path: forgot, serverURL }))

    await expect(page.locator('.forgot-password')).toBeVisible()
    await expect(page.locator('#field-email')).toBeVisible()

    await expectScreenshot({ name: 'forgot-password-view.png', page })
  })

  visual('should render the reset password view', async () => {
    await page.goto(formatAdminURL({ adminRoute, path: `${reset}/test-token`, serverURL }))

    await expect(page.locator('.reset-password__wrap')).toBeVisible()
    await expect(page.locator('#field-password')).toBeVisible()
    await expect(page.locator('#field-confirm-password')).toBeVisible()

    await expectScreenshot({ name: 'reset-password-view.png', page })
  })

  visual('should render the unauthorized view', async () => {
    await page.goto(formatAdminURL({ adminRoute, path: unauthorized, serverURL }))

    const unauthorizedView = page.locator('.unauthorized')
    await expect(unauthorizedView).toBeVisible()
    await expect(unauthorizedView).toContainText('You are not allowed to access this page.')

    await expectScreenshot({ name: 'unauthorized-view.png', page })
  })

  visual('should render the create first user view', async () => {
    await reInitializeDB({ deleteOnly: true, serverURL })
    await page.goto(formatAdminURL({ adminRoute, path: createFirstUser, serverURL }))

    await expect(page.locator('.create-first-user')).toBeVisible()
    await expect(page.locator('#custom-view-override')).toHaveText(
      'Custom CreateFirstUser View Override',
    )
    await expect(page.locator('#field-email')).toBeVisible()
    await expect(page.locator('#field-password')).toBeVisible()
    await expect(page.locator('#field-confirm-password')).toBeVisible()

    await expectScreenshot({ name: 'create-first-user-view.png', page })
  })
})
