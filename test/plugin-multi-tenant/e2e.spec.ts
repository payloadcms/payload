import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import * as path from 'path'
import { wait } from 'payload/shared'
import { fileURLToPath } from 'url'

import type { Config } from './payload-types.js'

import {
  ensureCompilationIsDone,
  initPageConsoleErrorCatch,
  login,
  saveDocAndAssert,
} from '../helpers.js'
import { AdminUrlUtil } from '../helpers/adminUrlUtil.js'
import { goToListDoc } from '../helpers/e2e/goToListDoc.js'
import {
  clearSelectInput,
  getSelectInputOptions,
  getSelectInputValue,
  selectInput,
} from '../helpers/e2e/selectInput.js'
import { openNav } from '../helpers/e2e/toggleNav.js'
import { initPayloadE2ENoConfig } from '../helpers/initPayloadE2ENoConfig.js'
import { reInitializeDB } from '../helpers/reInitializeDB.js'
import { TEST_TIMEOUT_LONG } from '../playwright.config.js'
import { credentials } from './credentials.js'
import { menuItemsSlug, menuSlug, tenantsSlug } from './shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

test.describe('Multi Tenant', () => {
  let page: Page
  let serverURL: string
  let globalMenuURL: AdminUrlUtil
  let menuItemsURL: AdminUrlUtil
  let tenantsURL: AdminUrlUtil

  test.beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)

    const { serverURL: serverFromInit } = await initPayloadE2ENoConfig<Config>({ dirname })
    serverURL = serverFromInit
    globalMenuURL = new AdminUrlUtil(serverURL, menuSlug)
    menuItemsURL = new AdminUrlUtil(serverURL, menuItemsSlug)
    tenantsURL = new AdminUrlUtil(serverURL, tenantsSlug)

    const context = await browser.newContext()
    page = await context.newPage()
    initPageConsoleErrorCatch(page)
    await ensureCompilationIsDone({ page, serverURL, noAutoLogin: true })
  })

  test.beforeEach(async () => {
    await reInitializeDB({
      serverURL,
      snapshotKey: 'multiTenant',
    })
  })

  test.describe('tenant selector', () => {
    test('should populate tenant selector on login', async () => {
      await login({
        page,
        serverURL,
        data: credentials.admin,
      })

      await expect
        .poll(async () => {
          return (await getTenantOptions({ page })).sort()
        })
        .toEqual(['Blue Dog', 'Steel Cat', 'Anchor Bar'].sort())
    })

    test('should show all tenants for userHasAccessToAllTenants users', async () => {
      await login({
        page,
        serverURL,
        data: credentials.admin,
      })

      await expect
        .poll(async () => {
          return (await getTenantOptions({ page })).sort()
        })
        .toEqual(['Blue Dog', 'Steel Cat', 'Anchor Bar'].sort())
    })

    test('should only show users assigned tenants', async () => {
      await login({
        page,
        serverURL,
        data: credentials.owner,
      })

      await expect
        .poll(async () => {
          return (await getTenantOptions({ page })).sort()
        })
        .toEqual(['Blue Dog', 'Anchor Bar'].sort())
    })
  })

  test.describe('Base List Filter', () => {
    test('should show all tenant items when tenant selector is empty', async () => {
      await login({
        page,
        serverURL,
        data: credentials.admin,
      })

      await clearTenant({ page })

      await page.goto(menuItemsURL.list)
      await expect(
        page.locator('.collection-list .table .cell-name', {
          hasText: 'Spicy Mac',
        }),
      ).toBeVisible()
      await expect(
        page.locator('.collection-list .table .cell-name', {
          hasText: 'Pretzel Bites',
        }),
      ).toBeVisible()
    })
    test('should show filtered tenant items when tenant selector is set', async () => {
      await login({
        page,
        serverURL,
        data: credentials.admin,
      })

      await selectTenant({
        page,
        tenant: 'Blue Dog',
      })

      await page.goto(menuItemsURL.list)
      await expect(
        page.locator('.collection-list .table .cell-name', {
          hasText: 'Spicy Mac',
        }),
      ).toBeVisible()
      await expect(
        page.locator('.collection-list .table .cell-name', {
          hasText: 'Pretzel Bites',
        }),
      ).toBeHidden()
    })
  })

  test.describe('globals', () => {
    test('should redirect list view to edit view', async () => {
      await login({
        page,
        serverURL,
        data: credentials.admin,
      })
      await page.goto(globalMenuURL.list)
      await page.waitForURL(globalMenuURL.create)
      await expect(page.locator('.collection-edit')).toBeVisible()
    })

    test('should redirect from create to edit view when tenant already has content', async () => {
      await login({
        page,
        serverURL,
        data: credentials.admin,
      })
      await selectTenant({
        page,
        tenant: 'Blue Dog',
      })
      await page.goto(globalMenuURL.list)
      await expect(page.locator('.collection-edit')).toBeVisible()
      await expect(page.locator('#field-title')).toHaveValue('Blue Dog Menu')
    })

    test('should prompt leave without saving changes modal when switching tenants', async () => {
      await login({
        page,
        serverURL,
        data: credentials.admin,
      })

      await selectTenant({
        page,
        tenant: 'Blue Dog',
      })

      await page.goto(globalMenuURL.create)

      // Attempt to switch tenants with unsaved changes
      await page.fill('#field-title', 'New Global Menu Name')
      await selectTenant({
        page,
        tenant: 'Steel Cat',
      })

      const confirmationModal = page.locator('#confirm-leave-without-saving')
      await expect(confirmationModal).toBeVisible()
      await expect(
        confirmationModal.getByText(
          'Your changes have not been saved. If you leave now, you will lose your changes.',
        ),
      ).toBeVisible()
    })
  })

  test.describe('documents', () => {
    test('should set tenant upon entering', async () => {
      await login({
        page,
        serverURL,
        data: credentials.admin,
      })

      await clearTenant({ page })

      await goToListDoc({
        page,
        cellClass: '.cell-name',
        textToMatch: 'Spicy Mac',
        urlUtil: menuItemsURL,
      })

      await openNav(page)
      await expect
        .poll(async () => {
          return await getSelectInputValue<false>({
            selectLocator: page.locator('.tenant-selector'),
            multiSelect: false,
          })
        })
        .toBe('Blue Dog')
    })

    test('should prompt for confirmation upon tenant switching', async () => {
      await login({
        page,
        serverURL,
        data: credentials.admin,
      })

      await clearTenant({ page })

      await goToListDoc({
        page,
        cellClass: '.cell-name',
        textToMatch: 'Spicy Mac',
        urlUtil: menuItemsURL,
      })

      await selectTenant({
        page,
        tenant: 'Steel Cat',
      })

      const confirmationModal = page.locator('#confirm-switch-tenant')
      await expect(confirmationModal).toBeVisible()
      await expect(
        confirmationModal.getByText('You are about to change ownership from Blue Dog to Steel Cat'),
      ).toBeVisible()
    })
  })

  test.describe('tenants', () => {
    test('should update the tenant name in the selector when editing a tenant', async () => {
      await login({
        page,
        serverURL,
        data: credentials.admin,
      })

      await goToListDoc({
        cellClass: '.cell-name',
        page,
        textToMatch: 'Blue Dog',
        urlUtil: tenantsURL,
      })

      await page.locator('#field-name').fill('Red Dog')
      await saveDocAndAssert(page)

      // Check the tenant selector
      await expect
        .poll(async () => {
          return (await getTenantOptions({ page })).sort()
        })
        .toEqual(['Red Dog', 'Steel Cat', 'Anchor Bar'].sort())

      // Change the tenant back to the original name
      await page.locator('#field-name').fill('Blue Dog')
      await saveDocAndAssert(page)
      await expect
        .poll(async () => {
          return (await getTenantOptions({ page })).sort()
        })
        .toEqual(['Blue Dog', 'Steel Cat', 'Anchor Bar'].sort())
    })

    test('should add tenant to the selector when creating a new tenant', async () => {
      await login({
        page,
        serverURL,
        data: credentials.admin,
      })

      await page.goto(tenantsURL.create)
      await wait(300)
      await expect(page.locator('#field-name')).toBeVisible()
      await expect(page.locator('#field-domain')).toBeVisible()

      await page.locator('#field-name').fill('House Rules')
      await page.locator('#field-domain').fill('house-rules.com')
      await saveDocAndAssert(page)

      // Check the tenant selector
      await expect
        .poll(async () => {
          return (await getTenantOptions({ page })).sort()
        })
        .toEqual(['Blue Dog', 'Steel Cat', 'Anchor Bar', 'House Rules'].sort())
    })
  })
})

/**
 * Helper Functions
 */
async function getTenantOptions({ page }: { page: Page }): Promise<string[]> {
  await openNav(page)
  return await getSelectInputOptions({
    selectLocator: page.locator('.tenant-selector'),
  })
}

async function selectTenant({ page, tenant }: { page: Page; tenant: string }): Promise<void> {
  await openNav(page)
  return selectInput({
    selectLocator: page.locator('.tenant-selector'),
    option: tenant,
    multiSelect: false,
  })
}

async function clearTenant({ page }: { page: Page }): Promise<void> {
  await openNav(page)
  return clearSelectInput({
    selectLocator: page.locator('.tenant-selector'),
  })
}
