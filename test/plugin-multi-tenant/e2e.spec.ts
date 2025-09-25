import type { Page } from '@playwright/test'
import type { BasePayload } from 'payload'

import { expect, test } from '@playwright/test'
import * as path from 'path'
import { wait } from 'payload/shared'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../helpers/sdk/index.js'
import type { Config } from './payload-types.js'

import { ensureCompilationIsDone, initPageConsoleErrorCatch, saveDocAndAssert } from '../helpers.js'
import { AdminUrlUtil } from '../helpers/adminUrlUtil.js'
import { loginClientSide } from '../helpers/e2e/auth/login.js'
import { goToListDoc } from '../helpers/e2e/goToListDoc.js'
import {
  clearSelectInput,
  getSelectInputOptions,
  getSelectInputValue,
  selectInput,
} from '../helpers/e2e/selectInput.js'
import { closeNav, openNav } from '../helpers/e2e/toggleNav.js'
import { initPayloadE2ENoConfig } from '../helpers/initPayloadE2ENoConfig.js'
import { reInitializeDB } from '../helpers/reInitializeDB.js'
import { TEST_TIMEOUT_LONG } from '../playwright.config.js'
import { credentials } from './credentials.js'
import { seed } from './seed/index.js'
import { autosaveGlobalSlug, menuItemsSlug, menuSlug, tenantsSlug, usersSlug } from './shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

test.describe('Multi Tenant', () => {
  let page: Page
  let serverURL: string
  let globalMenuURL: AdminUrlUtil
  let autosaveGlobalURL: AdminUrlUtil
  let menuItemsURL: AdminUrlUtil
  let usersURL: AdminUrlUtil
  let tenantsURL: AdminUrlUtil
  let payload: PayloadTestSDK<Config>

  test.beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)

    const { serverURL: serverFromInit, payload: payloadFromInit } =
      await initPayloadE2ENoConfig<Config>({ dirname })
    serverURL = serverFromInit
    globalMenuURL = new AdminUrlUtil(serverURL, menuSlug)
    menuItemsURL = new AdminUrlUtil(serverURL, menuItemsSlug)
    usersURL = new AdminUrlUtil(serverURL, usersSlug)
    tenantsURL = new AdminUrlUtil(serverURL, tenantsSlug)
    payload = payloadFromInit
    autosaveGlobalURL = new AdminUrlUtil(serverURL, autosaveGlobalSlug)

    const context = await browser.newContext()
    page = await context.newPage()
    initPageConsoleErrorCatch(page)
    await ensureCompilationIsDone({ page, serverURL, noAutoLogin: true })
    await reInitializeDB({
      serverURL,
      snapshotKey: 'multiTenant',
    })
    if (seed) {
      await seed(payload as unknown as BasePayload)
      await ensureCompilationIsDone({ page, serverURL, noAutoLogin: true })
    }
  })

  test.describe('Filters', () => {
    test.describe('Tenants', () => {
      test('should show all tenants when tenant selector is empty', async () => {
        await loginClientSide({
          page,
          serverURL,
          data: credentials.admin,
        })

        await clearTenantFilter({ page })

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

        await setTenantFilter({
          urlUtil: tenantsURL,
          page,
          tenant: 'Blue Dog',
        })

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

        await page.goto(menuItemsURL.list)
        await clearTenantFilter({ page })

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

        await setTenantFilter({
          urlUtil: menuItemsURL,
          page,
          tenant: 'Blue Dog',
        })

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

        await page.goto(menuItemsURL.list)
        await clearTenantFilter({ page })

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

        await page.goto(menuItemsURL.list)
        await clearTenantFilter({ page })

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

        await page.goto(usersURL.list)
        await clearTenantFilter({ page })

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

        await setTenantFilter({
          urlUtil: usersURL,
          page,
          tenant: 'Blue Dog',
        })

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

      await page.goto(menuItemsURL.list)
      await clearTenantFilter({ page })

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

    test('should allow tenant switching cancellation', async () => {
      await loginClientSide({
        page,
        serverURL,
        data: credentials.admin,
      })

      await page.goto(menuItemsURL.list)
      await clearTenantFilter({ page })

      await goToListDoc({
        page,
        cellClass: '.cell-name',
        textToMatch: 'Spicy Mac',
        urlUtil: menuItemsURL,
      })

      await selectDocumentTenant({
        page,
        tenant: 'Steel Cat',
        action: 'cancel',
        payload,
      })

      await expect(page.locator('#action-save')).toBeDisabled()

      await page.goto(menuItemsURL.list)
      await expect
        .poll(async () => {
          return await getSelectedTenantFilterName({ page, payload })
        })
        .toBe('Blue Dog')
    })

    test('should allow tenant switching confirmation', async () => {
      await loginClientSide({
        page,
        serverURL,
        data: credentials.admin,
      })

      await page.goto(menuItemsURL.list)
      await clearTenantFilter({ page })

      await goToListDoc({
        page,
        cellClass: '.cell-name',
        textToMatch: 'Spicy Mac',
        urlUtil: menuItemsURL,
      })

      await selectDocumentTenant({
        page,
        payload,
        tenant: 'Steel Cat',
      })

      await saveDocAndAssert(page)
    })

    test('should filter internal links in Lexical editor', async () => {
      await loginClientSide({
        page,
        serverURL,
        data: credentials.admin,
      })
      await page.goto(menuItemsURL.create)
      await selectDocumentTenant({
        page,
        payload,
        tenant: 'Blue Dog',
      })
      const editor = page.locator('[data-lexical-editor="true"]')
      await editor.focus()
      await page.keyboard.type('Hello World')
      await page.keyboard.down('Shift')
      for (let i = 0; i < 'World'.length; i++) {
        await page.keyboard.press('ArrowLeft')
      }
      await page.keyboard.up('Shift')
      await page.locator('.toolbar-popup__button-link').click()
      await expect(page.locator('.lexical-link-edit-drawer')).toBeVisible()
      const linkRadio = page.locator('.radio-input__styled-radio').last()
      await expect(linkRadio).toBeVisible()
      await linkRadio.click({
        delay: 100,
      })
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
      await setTenantFilter({
        urlUtil: tenantsURL,
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

      await setTenantFilter({
        urlUtil: tenantsURL,
        page,
        tenant: 'Blue Dog',
      })

      await page.goto(globalMenuURL.create)

      // Attempt to switch tenants with unsaved changes
      await page.fill('#field-title', 'New Global Menu Name')
      await switchGlobalDocTenant({
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

    test('should navigate to globals with autosave enabled', async () => {
      await loginClientSide({
        page,
        serverURL,
        data: credentials.admin,
      })
      await page.goto(tenantsURL.list)
      await clearTenantFilter({ page })
      await page.goto(autosaveGlobalURL.list)
      await expect(page.locator('.doc-header__title')).toBeVisible()
      const docID = (await page.locator('.render-title').getAttribute('data-doc-id')) as string
      await expect.poll(() => docID).not.toBeUndefined()
      const globalTenant = await getSelectedTenantFilterName({ page, payload })
      const autosaveGlobal = await payload.find({
        collection: autosaveGlobalSlug,
        where: {
          id: {
            equals: docID,
          },
          'tenant.name': {
            equals: globalTenant,
          },
        },
      })
      await expect.poll(() => autosaveGlobal?.totalDocs).toBe(1)
      await expect.poll(() => autosaveGlobal?.docs?.[0]?.tenant).toBeDefined()
    })
  })

  test.describe('Tenant Selector', () => {
    test('should populate tenant selector on login', async () => {
      await loginClientSide({
        page,
        serverURL,
        data: credentials.admin,
      })

      await page.goto(tenantsURL.list)

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

      await page.goto(tenantsURL.list)

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

      await page.goto(tenantsURL.list)

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

      await page.goto(tenantsURL.list)

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

      await page.goto(tenantsURL.list)
      await clearTenantFilter({ page })

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

      await page.goto(tenantsURL.list)

      // Check the tenant selector
      await expect
        .poll(async () => {
          return (await getTenantOptions({ page })).sort()
        })
        .toEqual(['Red Dog', 'Steel Cat', 'Public Tenant', 'Anchor Bar'].sort())

      await goToListDoc({
        cellClass: '.cell-name',
        page,
        textToMatch: 'Red Dog',
        urlUtil: tenantsURL,
      })

      // Change the tenant back to the original name
      await page.locator('#field-name').fill('Blue Dog')
      await saveDocAndAssert(page)

      await page.goto(tenantsURL.list)

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

      await page.goto(tenantsURL.list)

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

async function openAssignTenantModal({
  page,
  payload,
}: {
  page: Page
  payload: PayloadTestSDK<Config>
}): Promise<void> {
  const assignTenantModal = page.locator('#assign-tenant-field-modal')

  const globalTenant = await getSelectedTenantFilterName({ page, payload })
  if (!globalTenant) {
    await expect(assignTenantModal).toBeVisible()
    return
  }

  // Open the assign tenant modal
  const docControlsPopup = page.locator('.doc-controls__popup')
  const docControlsButton = docControlsPopup.locator('.popup-button')
  await expect(docControlsButton).toBeVisible()
  await docControlsButton.click()

  const assignTenantButtonLocator = docControlsPopup.locator('button', { hasText: 'Assign Site' })
  await expect(assignTenantButtonLocator).toBeVisible()
  await assignTenantButtonLocator.click()

  await expect(assignTenantModal).toBeVisible()
}

async function selectDocumentTenant({
  page,
  tenant,
  action = 'confirm',
  payload,
}: {
  action?: 'cancel' | 'confirm'
  page: Page
  payload: PayloadTestSDK<Config>
  tenant: string
}): Promise<void> {
  await closeNav(page)
  await openAssignTenantModal({ page, payload })
  await selectInput({
    selectLocator: page.locator('.tenantField'),
    option: tenant,
    multiSelect: false,
  })

  const assignTenantModal = page.locator('#assign-tenant-field-modal')
  if (action === 'confirm') {
    await assignTenantModal.locator('button', { hasText: 'Confirm' }).click()
    await expect(assignTenantModal).toBeHidden()
  } else {
    await assignTenantModal.locator('button', { hasText: 'Cancel' }).click()
    await expect(assignTenantModal).toBeHidden()
  }
}

async function getSelectedTenantFilterName({
  page,
  payload,
}: {
  page: Page
  payload: PayloadTestSDK<Config>
}): Promise<string | undefined> {
  const cookies = await page.context().cookies()
  const tenantIDFromCookie = cookies.find((c) => c.name === 'payload-tenant')?.value
  if (tenantIDFromCookie) {
    const tenant = await payload.find({
      collection: 'tenants',
      where: {
        id: {
          equals: tenantIDFromCookie,
        },
      },
    })
    return tenant?.docs?.[0]?.name || undefined
  }

  return undefined
}

async function setTenantFilter({
  page,
  tenant,
  urlUtil,
}: {
  page: Page
  tenant: string
  urlUtil: AdminUrlUtil
}): Promise<void> {
  await page.goto(urlUtil.list)
  await openNav(page)
  await selectInput({
    selectLocator: page.locator('.tenant-selector'),
    option: tenant,
    multiSelect: false,
  })
}

async function switchGlobalDocTenant({
  page,
  tenant,
}: {
  page: Page
  tenant: string
}): Promise<void> {
  await openNav(page)
  await selectInput({
    selectLocator: page.locator('.tenant-selector'),
    option: tenant,
    multiSelect: false,
  })
}

async function clearTenantFilter({ page }: { page: Page }): Promise<void> {
  await openNav(page)
  await clearSelectInput({
    selectLocator: page.locator('.tenant-selector'),
  })
  await closeNav(page)
}
