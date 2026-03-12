import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import * as path from 'path'
import { wait } from 'payload/shared'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../__helpers/shared/sdk/index.js'
import type { Config } from './payload-types.js'

import { loginClientSide } from '../__helpers/e2e/auth/login.js'
import { openRelationshipFieldDrawer } from '../__helpers/e2e/fields/relationship/openRelationshipFieldDrawer.js'
import { goToListDoc } from '../__helpers/e2e/goToListDoc.js'
import {
  changeLocale,
  ensureCompilationIsDone,
  initPageConsoleErrorCatch,
  saveDocAndAssert,
  waitForFormReady,
} from '../__helpers/e2e/helpers.js'
import {
  clearSelectInput,
  getSelectInputOptions,
  getSelectInputValue,
  selectInput,
} from '../__helpers/e2e/selectInput.js'
import { closeNav, openNav } from '../__helpers/e2e/toggleNav.js'
import { AdminUrlUtil } from '../__helpers/shared/adminUrlUtil.js'
import { reInitializeDB } from '../__helpers/shared/clearAndSeed/reInitializeDB.js'
import { initPayloadE2ENoConfig } from '../__helpers/shared/initPayloadE2ENoConfig.js'
import { TEST_TIMEOUT_LONG } from '../playwright.config.js'
import { credentials } from './credentials.js'
import {
  autosaveGlobalSlug,
  foldersSlug,
  menuItemsSlug,
  menuSlug,
  tenantsSlug,
  usersSlug,
} from './shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

test.describe('Multi Tenant', () => {
  let page: Page
  let serverURL: string
  let globalMenuURL: AdminUrlUtil
  let autosaveGlobalURL: AdminUrlUtil
  let foldersURL: AdminUrlUtil
  let menuItemsURL: AdminUrlUtil
  let usersURL: AdminUrlUtil
  let tenantsURL: AdminUrlUtil
  let payload: PayloadTestSDK<Config>

  test.beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    process.env.SEED_IN_CONFIG_ONINIT = 'false' // Makes it so the payload config onInit seed is not run. Otherwise, the seed would be run unnecessarily twice for the initial test run - once for beforeEach and once for onInit

    const { payload: payloadFromInit, serverURL: serverFromInit } =
      await initPayloadE2ENoConfig<Config>({ dirname })
    serverURL = serverFromInit
    globalMenuURL = new AdminUrlUtil(serverURL, menuSlug)
    foldersURL = new AdminUrlUtil(serverURL, foldersSlug)
    menuItemsURL = new AdminUrlUtil(serverURL, menuItemsSlug)
    usersURL = new AdminUrlUtil(serverURL, usersSlug)
    tenantsURL = new AdminUrlUtil(serverURL, tenantsSlug)
    payload = payloadFromInit
    autosaveGlobalURL = new AdminUrlUtil(serverURL, autosaveGlobalSlug)

    const context = await browser.newContext()
    page = await context.newPage()
    initPageConsoleErrorCatch(page)

    await ensureCompilationIsDone({ page, serverURL })
  })

  test.beforeEach(async () => {
    await reInitializeDB({
      serverURL,
      snapshotKey: 'multiTenant',
    })
    await page.goto(usersURL.admin)
  })

  test.describe('Filters', () => {
    test.describe('Tenants', () => {
      test('should show all tenants when tenant selector is empty', async () => {
        await loginClientSide({
          data: credentials.admin,
          page,
          serverURL,
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
          data: credentials.admin,
          page,
          serverURL,
        })

        await setTenantFilter({
          page,
          tenant: 'Blue Dog',
          urlUtil: tenantsURL,
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
          data: credentials.admin,
          page,
          serverURL,
        })

        await page.goto(`${menuItemsURL.list}?limit=100`)
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
          data: credentials.admin,
          page,
          serverURL,
        })

        await setTenantFilter({
          page,
          tenant: 'Blue Dog',
          urlUtil: menuItemsURL,
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
          data: credentials.admin,
          page,
          serverURL,
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
          data: credentials.owner,
          page,
          serverURL,
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
          data: credentials.admin,
          page,
          serverURL,
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
          data: credentials.admin,
          page,
          serverURL,
        })

        await setTenantFilter({
          page,
          tenant: 'Blue Dog',
          urlUtil: usersURL,
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

    test('should show correct filtered localized data', async () => {
      await loginClientSide({
        data: credentials.admin,
        page,
        serverURL,
      })

      await setTenantFilter({
        page,
        tenant: 'Blue Dog',
      })

      await changeLocale(page, 'es')

      await setTenantFilter({
        page,
        tenant: 'Anchor Bar',
      })

      await page.goto(menuItemsURL.list)

      await expect(
        page.locator('.collection-list .table .cell-localizedName', {
          hasText: 'Popcorn EN',
        }),
      ).toBeVisible()
    })
  })

  test.describe('Documents', () => {
    test('should set tenant upon entering document', async () => {
      await loginClientSide({
        data: credentials.admin,
        page,
        serverURL,
      })

      await page.goto(menuItemsURL.list)
      await clearTenantFilter({ page })

      await goToListDoc({
        cellClass: '.cell-name',
        page,
        search: 'Spicy Mac',
        textToMatch: 'Spicy Mac',
        urlUtil: menuItemsURL,
      })

      await openNav(page)
      await expect
        .poll(async () => {
          return await getSelectInputValue<false>({
            multiSelect: false,
            selectLocator: page.locator('.tenant-selector'),
          })
        })
        .toBe('Blue Dog')
    })

    test('should allow tenant switching cancellation', async () => {
      await loginClientSide({
        data: credentials.admin,
        page,
        serverURL,
      })

      await page.goto(menuItemsURL.list)
      await clearTenantFilter({ page })

      await goToListDoc({
        cellClass: '.cell-name',
        page,
        search: 'Spicy Mac',
        textToMatch: 'Spicy Mac',
        urlUtil: menuItemsURL,
      })

      await selectDocumentTenant({
        action: 'cancel',
        page,
        payload,
        tenant: 'Steel Cat',
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
        data: credentials.admin,
        page,
        serverURL,
      })

      await page.goto(menuItemsURL.list)
      await clearTenantFilter({ page })

      await goToListDoc({
        cellClass: '.cell-name',
        page,
        search: 'Veggie Wrap',
        textToMatch: 'Veggie Wrap',
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
        data: credentials.admin,
        page,
        serverURL,
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
      await wait(1000)
      const linkRadio = page.locator('.radio-input__styled-radio').last()
      await expect(linkRadio).toBeVisible()
      await linkRadio.click({
        delay: 100,
      })
      await wait(300)

      await page.locator('.drawer__content').locator('.rs__input').click()
      await expect(page.getByText('Chorizo Con Queso')).toBeVisible()
      await expect(page.getByText('Pretzel Bites')).toBeHidden()
    })

    test('should filter relationship fields in Lexical BlocksFeature', async () => {
      await loginClientSide({
        data: credentials.admin,
        page,
        serverURL,
      })
      await page.goto(menuItemsURL.create)
      await selectDocumentTenant({
        page,
        payload,
        tenant: 'Blue Dog',
      })

      // Fill in the required name field
      await page.fill('#field-name', 'Test Menu Item')

      // Find the bug-repro richtext field and insert a block
      const rte = page.locator('.rich-text-lexical [data-lexical-editor="true"]')
      await rte.click()
      await rte.focus()

      // Open slash menu and insert block
      await page.keyboard.type('/')
      await expect(page.locator('.slash-menu-popup')).toBeVisible()
      await page.getByText('Block With Relationship').click()

      // Wait for block to be inserted
      await expect(page.locator('.LexicalEditorTheme__block')).toBeVisible()

      // Open the relationship field in the block
      await page.locator('.LexicalEditorTheme__block .rs__input').click()

      // Should only show Blue Dog Menu, not Steel Cat Menu or others
      await expect(page.getByText('Blue Dog Menu')).toBeVisible()
      await expect(page.getByText('Steel Cat Menu')).toBeHidden()
      await expect(page.getByText('Anchor Bar Menu')).toBeHidden()
      await expect(page.locator('.rs__menu')).toHaveCount(1)
    })
  })

  test.describe('Globals', () => {
    test('should redirect list view to edit view', async () => {
      await loginClientSide({
        data: credentials.admin,
        page,
        serverURL,
      })
      await page.goto(globalMenuURL.list)
      await expect(page.locator('.collection-edit')).toBeVisible()
    })

    test('should redirect from create to edit view when tenant already has content', async () => {
      await loginClientSide({
        data: credentials.admin,
        page,
        serverURL,
      })
      await setTenantFilter({
        page,
        tenant: 'Blue Dog',
        urlUtil: tenantsURL,
      })
      await page.goto(globalMenuURL.list)
      await expect(page.locator('.collection-edit')).toBeVisible()
      await expect(page.locator('#field-title')).toHaveValue('Blue Dog Menu')
    })

    test('should prompt leave without saving changes modal when switching tenants', async () => {
      await loginClientSide({
        data: credentials.admin,
        page,
        serverURL,
      })

      await setTenantFilter({
        page,
        tenant: 'Blue Dog',
        urlUtil: tenantsURL,
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
            multiSelect: false,
            selectLocator: page.locator('.tenant-selector'),
          })
        })
        .toBe('Steel Cat')
    })

    test('should navigate to globals with autosave enabled', async () => {
      await loginClientSide({
        data: credentials.admin,
        page,
        serverURL,
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

  test.describe('Polymorphic Relationships', () => {
    test('should not duplicate tenant constraints in polymorphic relationship queries', async () => {
      await loginClientSide({
        data: credentials.admin,
        page,
        serverURL,
      })

      // Capture render-list server action requests
      const renderListRequests: Array<{
        payload: any[]
        url: string
      }> = []

      page.on('request', (request) => {
        // Check for server action POST requests
        if (
          request.method() === 'POST' &&
          request.url().includes(`/admin/collections/${menuItemsSlug}`)
        ) {
          const postData = request.postData()
          if (postData) {
            try {
              const parsedPayload = JSON.parse(postData)
              // Check if this is a render-list action
              if (Array.isArray(parsedPayload) && parsedPayload[0]?.name === 'render-list') {
                renderListRequests.push({
                  url: request.url(),
                  payload: parsedPayload,
                })
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      })

      // Navigate to existing menu item
      await page.goto(menuItemsURL.list)
      await clearTenantFilter({ page })

      await goToListDoc({
        cellClass: '.cell-name',
        page,
        search: 'Spicy Mac',
        textToMatch: 'Spicy Mac',
        urlUtil: menuItemsURL,
      })

      await openRelationshipFieldDrawer({
        page,
        fieldName: 'polymorphicRelationship',
        selectRelation: 'Relationship', // select a tenant-enabled collection
      })

      await expect.poll(() => renderListRequests.length).toBeGreaterThan(0)

      // Check the query.where clause for tenant constraint duplication
      for (const request of renderListRequests) {
        const renderListAction = request.payload[0]
        await expect.poll(() => renderListAction.name).toBe('render-list')
        await expect.poll(() => renderListAction.args).toBeDefined()
        await expect.poll(() => renderListAction.args.query).toBeDefined()

        const whereString = JSON.stringify(renderListAction.args.query.where)
        const tenantMatches = whereString.match(/"tenant":/g)?.length

        await expect.poll(() => tenantMatches).toEqual(1)
      }
    })
  })

  test.describe('Tenant Selector', () => {
    test('should populate tenant selector on login', async () => {
      await loginClientSide({
        data: credentials.admin,
        page,
        serverURL,
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
        data: credentials.blueDog,
        page,
        serverURL,
      })

      await loginClientSide({
        data: credentials.admin,
        page,
        serverURL,
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
        data: credentials.admin,
        page,
        serverURL,
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
        data: credentials.owner,
        page,
        serverURL,
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
        data: credentials.owner,
        page,
        serverURL,
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
        data: credentials.admin,
        page,
        serverURL,
      })
      await wait(500)

      await goToListDoc({
        cellClass: '.cell-name',
        page,
        textToMatch: 'Blue Dog',
        urlUtil: tenantsURL,
      })
      await wait(500)

      await expect(page.locator('#field-name')).toBeVisible()
      await page.locator('#field-name').fill('Red Dog')
      await wait(500)

      await saveDocAndAssert(page)
      await wait(500)

      await page.goto(tenantsURL.list)
      // Wait for backend tenant cache to update after save operation
      await wait(500)

      // Check the tenant selector
      await expect
        .poll(async () => {
          return (await getTenantOptions({ page })).sort()
        })
        .toEqual(['Red Dog', 'Steel Cat', 'Public Tenant', 'Anchor Bar'].sort())
      await wait(500)

      await goToListDoc({
        cellClass: '.cell-name',
        page,
        textToMatch: 'Red Dog',
        urlUtil: tenantsURL,
      })
      await wait(500)

      // Change the tenant back to the original name
      await page.locator('#field-name').fill('Blue Dog')
      await wait(500)

      await saveDocAndAssert(page)
      await wait(500)

      await page.goto(tenantsURL.list)
      // Wait for backend tenant cache to update after save operation
      await wait(500)

      await openNav(page)
      await expect
        .poll(async () => {
          return (await getTenantOptions({ page })).sort()
        })
        .toEqual(['Blue Dog', 'Steel Cat', 'Public Tenant', 'Anchor Bar'].sort())
    })

    test('should add tenant to the selector when creating a new tenant', async () => {
      await loginClientSide({
        data: credentials.admin,
        page,
        serverURL,
      })

      await page.goto(tenantsURL.create)
      await waitForFormReady(page)
      await wait(500)

      await page.locator('#field-name').fill('House Rules')
      await wait(500)

      await page.locator('#field-domain').fill('house-rules.com')
      await wait(500)

      await saveDocAndAssert(page)

      await page.goto(tenantsURL.list)
      await wait(500)

      // Check the tenant selector
      await expect
        .poll(async () => {
          return (await getTenantOptions({ page })).sort()
        })
        .toEqual(['Blue Dog', 'Steel Cat', 'Anchor Bar', 'Public Tenant', 'House Rules'].sort())
    })

    test('should allow clearing tenant filter from dashboard view', async () => {
      await loginClientSide({
        data: credentials.admin,
        page,
        serverURL,
      })

      // First set a tenant filter
      await setTenantFilter({
        page,
        tenant: 'Blue Dog',
        urlUtil: tenantsURL,
      })

      // Navigate to dashboard view
      await page.goto(`${serverURL}/admin`)

      // Clear the tenant filter from the dashboard
      await clearTenantFilter({ page })

      // Verify the tenant selector is cleared
      await openNav(page)
      await expect
        .poll(async () => {
          return await getSelectInputValue<false>({
            multiSelect: false,
            selectLocator: page.locator('.tenant-selector'),
          })
        })
        .toBeFalsy()
    })

    test('should allow clearing tenant filter from list view', async () => {
      await loginClientSide({
        data: credentials.admin,
        page,
        serverURL,
      })

      // First set a tenant filter
      await setTenantFilter({
        page,
        tenant: 'Steel Cat',
        urlUtil: menuItemsURL,
      })

      // Verify tenant is set
      await openNav(page)

      await expect
        .poll(async () => {
          return await getSelectInputValue<false>({
            multiSelect: false,
            selectLocator: page.locator('.tenant-selector'),
          })
        })
        .toBe('Steel Cat')

      // Clear the tenant filter from the list view
      await clearTenantFilter({ page })

      // Verify the tenant selector is cleared
      await openNav(page)

      await expect
        .poll(async () => {
          return await getSelectInputValue<false>({
            multiSelect: false,
            selectLocator: page.locator('.tenant-selector'),
          })
        })
        .toBeFalsy()
    })

    test('should populate tenant selector after standard form login with tree-restructuring provider', async () => {
      // This test verifies the fix for a bug where TenantSelectionProviderClient
      // loses state on remount. The ConditionalWrapperProvider (registered in the
      // test config) changes its tree structure when the user authenticates
      // (DummyContext.Provider → Fragment), causing React to remount the subtree.
      // Without the fix, useState(initialTenantOptions) re-initializes with stale
      // RSC props and useRef(userID) re-initializes to the current userID, so
      // userChanged is false and syncTenants never fires.

      // Use the "owner" user who has access to multiple tenants (Blue Dog + Anchor Bar).
      // The tenant selector only renders when options.length > 1.
      await loginClientSide({
        data: credentials.owner,
        page,
        serverURL,
      })

      // After login, the tenant selector should be populated with the owner's tenants
      await expect
        .poll(async () => {
          return (await getTenantOptions({ page })).sort()
        })
        .toEqual(['Anchor Bar', 'Blue Dog'].sort())
    })
  })

  test.describe('Hierarchy Tenant Filtering', () => {
    test('should filter hierarchy sidebar tree by selected tenant', async () => {
      await loginClientSide({
        data: credentials.admin,
        page,
        serverURL,
      })

      // Set tenant filter to Blue Dog
      await setTenantFilter({
        page,
        tenant: 'Blue Dog',
        urlUtil: foldersURL,
      })

      // Navigate to folders list to ensure sidebar is visible
      await page.goto(foldersURL.list)

      // Open the nav and click the Folders tab to show the hierarchy tree
      await openNav(page)
      await page.locator('.sidebar-tabs__tab', { hasText: 'Folders' }).click()

      // The sidebar tree should only show Blue Dog folders
      const sidebarTree = page.locator('.hierarchy-sidebar-tab')
      await expect(sidebarTree.getByText('Blue Dog Documents')).toBeVisible()
      await expect(sidebarTree.getByText('Steel Cat Documents')).toBeHidden()
      await expect(sidebarTree.getByText('Anchor Bar Files')).toBeHidden()
    })

    test('should filter hierarchy list table by selected tenant', async () => {
      await loginClientSide({
        data: credentials.admin,
        page,
        serverURL,
      })

      // Set tenant filter to Steel Cat
      await setTenantFilter({
        page,
        tenant: 'Steel Cat',
        urlUtil: foldersURL,
      })

      // The list table should only show Steel Cat folders
      await expect(
        page.locator('.hierarchy-list .slot-table .hierarchy-tables__col-name', {
          hasText: 'Steel Cat Documents',
        }),
      ).toBeVisible()
      await expect(
        page.locator('.hierarchy-list .slot-table .hierarchy-tables__col-name', {
          hasText: 'Blue Dog Documents',
        }),
      ).toBeHidden()
      await expect(
        page.locator('.hierarchy-list .slot-table .hierarchy-tables__col-name', {
          hasText: 'Anchor Bar Files',
        }),
      ).toBeHidden()
    })

    test('should filter move drawer miller columns by selected tenant', async () => {
      await loginClientSide({
        data: credentials.admin,
        page,
        serverURL,
      })

      // Set tenant filter to Blue Dog
      await setTenantFilter({
        page,
        tenant: 'Blue Dog',
        urlUtil: foldersURL,
      })

      // Navigate into a Blue Dog folder by clicking the navigation link
      await page
        .locator('.hierarchy-list .slot-table .hierarchy-tables__col-name a', {
          hasText: 'Blue Dog Documents',
        })
        .first()
        .click()

      // Wait for the child folder to appear
      await expect(
        page.locator('.hierarchy-list .slot-table .hierarchy-tables__col-name', {
          hasText: 'Blue Dog Recipes',
        }),
      ).toBeVisible()

      // Select the child folder for moving
      const checkbox = page
        .locator('.hierarchy-list .slot-table tr', {
          hasText: 'Blue Dog Recipes',
        })
        .locator('input[type="checkbox"]')
      await checkbox.click()

      // Open the move drawer
      const moveButton = page.locator('button', { hasText: 'Move' })
      await expect(moveButton).toBeVisible()
      await moveButton.click()

      // The move drawer should be visible
      const moveDrawer = page.locator('.drawer__content')
      await expect(moveDrawer).toBeVisible()

      // The miller columns should only show Blue Dog folders
      await expect(moveDrawer.getByText('Blue Dog Documents')).toBeVisible()
      await expect(moveDrawer.getByText('Steel Cat Documents')).toBeHidden()
      await expect(moveDrawer.getByText('Anchor Bar Files')).toBeHidden()
    })

    test('should show all tenant folders when tenant selector is cleared', async () => {
      await loginClientSide({
        data: credentials.admin,
        page,
        serverURL,
      })

      await page.goto(foldersURL.list)
      await clearTenantFilter({ page })

      // The list table should show folders from all tenants
      await expect(
        page.locator('.hierarchy-list .slot-table .hierarchy-tables__col-name', {
          hasText: 'Blue Dog Documents',
        }),
      ).toBeVisible()
      await expect(
        page.locator('.hierarchy-list .slot-table .hierarchy-tables__col-name', {
          hasText: 'Steel Cat Documents',
        }),
      ).toBeVisible()
      await expect(
        page.locator('.hierarchy-list .slot-table .hierarchy-tables__col-name', {
          hasText: 'Anchor Bar Files',
        }),
      ).toBeVisible()
    })

    test('should update hierarchy views after tenant selector change', async () => {
      await loginClientSide({
        data: credentials.admin,
        page,
        serverURL,
      })

      // Start with Blue Dog
      await setTenantFilter({
        page,
        tenant: 'Blue Dog',
        urlUtil: foldersURL,
      })

      await expect(
        page.locator('.hierarchy-list .slot-table .hierarchy-tables__col-name', {
          hasText: 'Blue Dog Documents',
        }),
      ).toBeVisible()
      await expect(
        page.locator('.hierarchy-list .slot-table .hierarchy-tables__col-name', {
          hasText: 'Steel Cat Documents',
        }),
      ).toBeHidden()

      // Switch to Steel Cat
      // Note: We navigate after changing tenant because Next.js's router.refresh()
      // may serve cached RSC payloads that don't reflect cookie changes.
      await setTenantFilter({
        page,
        tenant: 'Steel Cat',
        urlUtil: foldersURL,
      })

      // Should now show Steel Cat folders instead
      await expect(
        page.locator('.hierarchy-list .slot-table .hierarchy-tables__col-name', {
          hasText: 'Steel Cat Documents',
        }),
      ).toBeVisible()
      await expect(
        page.locator('.hierarchy-list .slot-table .hierarchy-tables__col-name', {
          hasText: 'Blue Dog Documents',
        }),
      ).toBeHidden()
    })

    test('should filter sidebar tree when switching tenants without page navigation', async () => {
      // This test reproduces the user flow:
      // 1. Log in and go to folders
      // 2. Select Folders tab in sidebar
      // 3. Select Blue Dog tenant (without navigating)
      // 4. Sidebar tree should show only Blue Dog folders
      // 5. Refresh the page
      // 6. Select Steel Cat tenant (without navigating)
      // 7. Sidebar tree should show only Steel Cat folders (not both)

      await loginClientSide({
        data: credentials.admin,
        page,
        serverURL,
      })

      // Navigate to folders page
      await page.goto(foldersURL.list)
      await page.waitForURL(foldersURL.list)

      // Click on Folders tab in sidebar to see the tree
      await openNav(page)
      const foldersTab = page.locator('button[role="tab"]', { hasText: 'Folders' })
      await foldersTab.click()

      // Verify sidebar tree shows all folders initially
      const sidebarTree = page.locator('.tree')
      await expect(
        sidebarTree.locator('[role="treeitem"]', { hasText: 'Blue Dog Documents' }),
      ).toBeVisible()
      await expect(
        sidebarTree.locator('[role="treeitem"]', { hasText: 'Steel Cat Documents' }),
      ).toBeVisible()

      // Select Blue Dog tenant WITHOUT navigating (no urlUtil parameter)
      await setTenantFilter({
        page,
        tenant: 'Blue Dog',
        // Intentionally NOT passing urlUtil to avoid page navigation
      })

      // Wait for tree to update
      await page.waitForTimeout(500)

      // Sidebar tree should show only Blue Dog folders
      await expect(
        sidebarTree.locator('[role="treeitem"]', { hasText: 'Blue Dog Documents' }),
      ).toBeVisible()
      await expect(
        sidebarTree.locator('[role="treeitem"]', { hasText: 'Steel Cat Documents' }),
      ).toBeHidden()

      // Refresh the page
      await page.reload()
      await openNav(page)
      await foldersTab.click()

      // After refresh, should still show only Blue Dog folders
      await expect(
        sidebarTree.locator('[role="treeitem"]', { hasText: 'Blue Dog Documents' }),
      ).toBeVisible()
      await expect(
        sidebarTree.locator('[role="treeitem"]', { hasText: 'Steel Cat Documents' }),
      ).toBeHidden()

      // Now switch to Steel Cat WITHOUT navigating
      await setTenantFilter({
        page,
        tenant: 'Steel Cat',
        // Intentionally NOT passing urlUtil to avoid page navigation
      })

      // Wait for tree to update
      await page.waitForTimeout(500)

      // Sidebar tree should show ONLY Steel Cat folders (not both tenants)
      await expect(
        sidebarTree.locator('[role="treeitem"]', { hasText: 'Steel Cat Documents' }),
      ).toBeVisible()
      await expect(
        sidebarTree.locator('[role="treeitem"]', { hasText: 'Blue Dog Documents' }),
      ).toBeHidden()
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
  const docControlsPopup = page.locator('.popup__content')
  const docControlsButton = page.locator('.doc-controls__popup .popup-button')
  await expect(docControlsButton).toBeVisible()
  await docControlsButton.click()

  const assignTenantButtonLocator = docControlsPopup.locator('button', { hasText: 'Assign Site' })
  await expect(assignTenantButtonLocator).toBeVisible()
  await assignTenantButtonLocator.click()

  await expect(assignTenantModal).toBeVisible()
}

async function selectDocumentTenant({
  action = 'confirm',
  page,
  payload,
  tenant,
}: {
  action?: 'cancel' | 'confirm'
  page: Page
  payload: PayloadTestSDK<Config>
  tenant: string
}): Promise<void> {
  await closeNav(page)
  await openAssignTenantModal({ page, payload })
  await selectInput({
    multiSelect: false,
    option: tenant,
    selectLocator: page.locator('.tenantField'),
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
  urlUtil?: AdminUrlUtil
}): Promise<void> {
  await openNav(page)
  await selectInput({
    multiSelect: false,
    option: tenant,
    selectLocator: page.locator('.tenant-selector'),
  })

  // Navigate AFTER changing tenant to bypass Next.js RSC caching
  // router.refresh() may serve cached payloads that don't reflect cookie changes
  if (urlUtil) {
    await page.goto(urlUtil.list)
  }
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
    multiSelect: false,
    option: tenant,
    selectLocator: page.locator('.tenant-selector'),
  })
}

async function clearTenantFilter({ page }: { page: Page }): Promise<void> {
  await openNav(page)
  await clearSelectInput({
    selectLocator: page.locator('.tenant-selector'),
  })
  await closeNav(page)
}
