import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import * as path from 'path'
import { wait } from 'payload/shared'
import { fileURLToPath } from 'url'

import type { Config } from './payload-types.js'

import {
  ensureCompilationIsDone,
  initPageConsoleErrorCatch,
  loginClientSide,
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
import { menuItemsSlug, menuSlug, tenantsSlug, usersSlug } from './shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

test.describe('Multi Tenant', () => {
  let page: Page
  let serverURL: string
  let globalMenuURL: AdminUrlUtil
  let menuItemsURL: AdminUrlUtil
  let usersURL: AdminUrlUtil
  let tenantsURL: AdminUrlUtil

  test.beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)

    const { serverURL: serverFromInit } = await initPayloadE2ENoConfig<Config>({ dirname })
    serverURL = serverFromInit
    globalMenuURL = new AdminUrlUtil(serverURL, menuSlug)
    menuItemsURL = new AdminUrlUtil(serverURL, menuItemsSlug)
    usersURL = new AdminUrlUtil(serverURL, usersSlug)
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

  test.describe('Filters', () => {
    test.describe('Tenants', () => {
      test('should show all tenants when tenant selector is empty', async () => {
        await loginClientSide({
          page,
          serverURL,
          data: credentials.admin,
        })

        await clearTenant({ page })

        await page.goto(tenantsURL.list)
        await expect(
          page.locator('.collection-list .table .cell-name', {
            hasText: 'Blue Dog',
          }),
        ).toBeVisible()
        await expect(
          page.locator('.collection-list .table .cell-name', {
            hasText: 'Steel Cat',
          }),
        ).toBeVisible()
        await expect(
          page.locator('.collection-list .table .cell-name', {
            hasText: 'Public Tenant',
          }),
        ).toBeVisible()
      })
      test('should show filtered tenants when tenant selector is set', async () => {
        await loginClientSide({
          page,
          serverURL,
          data: credentials.admin,
        })

        await selectTenant({
          page,
          tenant: 'Blue Dog',
        })

        await page.goto(tenantsURL.list)
        await expect(
          page.locator('.collection-list .table .cell-name', {
            hasText: 'Blue Dog',
          }),
        ).toBeVisible()
        await expect(
          page.locator('.collection-list .table .cell-name', {
            hasText: 'Steel Cat',
          }),
        ).toBeHidden()
      })
    })

    test.describe('Tenant Assigned Documents', () => {
      test('should show all tenant items when tenant selector is empty', async () => {
        await loginClientSide({
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
        await loginClientSide({
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
      test('should show public tenant items to super admins', async () => {
        await loginClientSide({
          page,
          serverURL,
          data: credentials.admin,
        })

        await clearTenant({ page })

        await page.goto(menuItemsURL.list)
        await expect(
          page.locator('.collection-list .table .cell-name', {
            hasText: 'Free Pizza',
          }),
        ).toBeVisible()
      })
      test('should not show public tenant items to users with assigned tenants', async () => {
        await loginClientSide({
          page,
          serverURL,
          data: credentials.owner,
        })

        await clearTenant({ page })

        await page.goto(menuItemsURL.list)
        await expect(
          page.locator('.collection-list .table .cell-name', {
            hasText: 'Free Pizza',
          }),
        ).toBeHidden()
      })
    })

    test.describe('Users', () => {
      test('should show all users when tenant selector is empty', async () => {
        await loginClientSide({
          page,
          serverURL,
          data: credentials.admin,
        })

        await clearTenant({ page })

        await page.goto(usersURL.list)
        await expect(
          page.locator('.collection-list .table .cell-email', {
            hasText: 'jane@blue-dog.com',
          }),
        ).toBeVisible()
        await expect(
          page.locator('.collection-list .table .cell-email', {
            hasText: 'huel@steel-cat.com',
          }),
        ).toBeVisible()
        await expect(
          page.locator('.collection-list .table .cell-email', {
            hasText: 'dev@payloadcms.com',
          }),
        ).toBeVisible()
      })

      test('should show only tenant users when tenant selector is empty', async () => {
        await loginClientSide({
          page,
          serverURL,
          data: credentials.admin,
        })

        await selectTenant({
          page,
          tenant: 'Blue Dog',
        })

        await page.goto(usersURL.list)
        await expect(
          page.locator('.collection-list .table .cell-email', {
            hasText: 'jane@blue-dog.com',
          }),
        ).toBeVisible()
        await expect(
          page.locator('.collection-list .table .cell-email', {
            hasText: 'huel@steel-cat.com',
          }),
        ).toBeHidden()
        await expect(
          page.locator('.collection-list .table .cell-email', {
            hasText: 'dev@payloadcms.com',
          }),
        ).toBeHidden()
      })
    })
  })

  test.describe('Documents', () => {
    test('should set tenant upon entering document', async () => {
      await loginClientSide({
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
      await loginClientSide({
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
    test('should filter internal links in Lexical editor', async () => {
      await loginClientSide({
        page,
        serverURL,
        data: credentials.admin,
      })
      await selectTenant({
        page,
        tenant: 'Blue Dog',
      })
      await page.goto(menuItemsURL.create)
      const editor = page.locator('[data-lexical-editor="true"]')
      await editor.focus()
      await page.keyboard.type('Hello World')
      await page.keyboard.down('Shift')
      for (let i = 0; i < 'World'.length; i++) {
        await page.keyboard.press('ArrowLeft')
      }
      await page.keyboard.up('Shift')
      await page.locator('.toolbar-popup__button-link').click()
      await page.locator('.radio-input__styled-radio').last().click()
      await page.locator('.drawer__content').locator('.rs__input').click()
      await expect(page.getByText('Chorizo Con Queso')).toBeVisible()
      await expect(page.getByText('Pretzel Bites')).toBeHidden()
    })
  })

  test.describe('Globals', () => {
    test('should redirect list view to edit view', async () => {
      await loginClientSide({
        page,
        serverURL,
        data: credentials.admin,
      })
      await page.goto(globalMenuURL.list)
      await expect(page.locator('.collection-edit')).toBeVisible()
    })

    test('should redirect from create to edit view when tenant already has content', async () => {
      await loginClientSide({
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
      await loginClientSide({
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

      await confirmationModal.locator('#confirm-action').click()
      await expect(page.locator('#confirm-leave-without-saving')).toBeHidden()
      await page.goto(menuItemsURL.list)
      await expect
        .poll(async () => {
          return await getSelectInputValue({
            selectLocator: page.locator('.tenant-selector'),
            multiSelect: false,
          })
        })
        .toBe('Steel Cat')
    })
  })

  test.describe('Tenant Selector', () => {
    test('should populate tenant selector on login', async () => {
      await loginClientSide({
        page,
        serverURL,
        data: credentials.admin,
      })

      await expect
        .poll(async () => {
          return (await getTenantOptions({ page })).sort()
        })
        .toEqual(['Blue Dog', 'Steel Cat', 'Public Tenant', 'Anchor Bar'].sort())
    })

    test('should populate the tenant selector after logout with 1 tenant user', async () => {
      await loginClientSide({
        page,
        serverURL,
        data: credentials.blueDog,
      })

      await loginClientSide({
        page,
        serverURL,
        data: credentials.admin,
      })

      await expect
        .poll(async () => {
          return (await getTenantOptions({ page })).sort()
        })
        .toEqual(['Blue Dog', 'Steel Cat', 'Public Tenant', 'Anchor Bar'].sort())
    })

    test('should show all tenants for userHasAccessToAllTenants users', async () => {
      await loginClientSide({
        page,
        serverURL,
        data: credentials.admin,
      })

      await expect
        .poll(async () => {
          return (await getTenantOptions({ page })).sort()
        })
        .toEqual(['Blue Dog', 'Steel Cat', 'Public Tenant', 'Anchor Bar'].sort())
    })

    test('should only show users assigned tenants', async () => {
      await loginClientSide({
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

    test('should not show public tenants to users with assigned tenants', async () => {
      await loginClientSide({
        page,
        serverURL,
        data: credentials.owner,
      })

      await clearTenant({ page })

      await page.goto(tenantsURL.list)
      await expect(
        page.locator('.collection-list .table .cell-name', {
          hasText: 'Public Tenant',
        }),
      ).toBeHidden()
    })

    test('should update the tenant name in the selector when editing a tenant', async () => {
      await loginClientSide({
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

      await expect(page.locator('#field-name')).toBeVisible()
      await page.locator('#field-name').fill('Red Dog')
      await saveDocAndAssert(page)

      // Check the tenant selector
      await expect
        .poll(async () => {
          return (await getTenantOptions({ page })).sort()
        })
        .toEqual(['Red Dog', 'Steel Cat', 'Public Tenant', 'Anchor Bar'].sort())

      // Change the tenant back to the original name
      await page.locator('#field-name').fill('Blue Dog')
      await saveDocAndAssert(page)
      await expect
        .poll(async () => {
          return (await getTenantOptions({ page })).sort()
        })
        .toEqual(['Blue Dog', 'Steel Cat', 'Public Tenant', 'Anchor Bar'].sort())
    })

    test('should add tenant to the selector when creating a new tenant', async () => {
      await loginClientSide({
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
        .toEqual(['Blue Dog', 'Steel Cat', 'Anchor Bar', 'Public Tenant', 'House Rules'].sort())
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
