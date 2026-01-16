import type { BrowserContext, Page } from '@playwright/test'
import type { TypeWithID } from 'payload'

import { expect, test } from '@playwright/test'
import path from 'path'
import { formatAdminURL, wait } from 'payload/shared'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../helpers/sdk/index.js'
import type { Config, ReadOnlyCollection, RestrictedVersion } from './payload-types.js'

import { devUser } from '../credentials.js'
import {
  ensureCompilationIsDone,
  exactText,
  initPageConsoleErrorCatch,
  saveDocAndAssert,
} from '../helpers.js'
import { AdminUrlUtil } from '../helpers/adminUrlUtil.js'
import { assertNetworkRequests } from '../helpers/e2e/assertNetworkRequests.js'
import { login } from '../helpers/e2e/auth/login.js'
import { openListFilters } from '../helpers/e2e/filters/index.js'
import { openGroupBy } from '../helpers/e2e/groupBy/index.js'
import { openDocControls } from '../helpers/e2e/openDocControls.js'
import { closeNav, openNav } from '../helpers/e2e/toggleNav.js'
import { initPayloadE2ENoConfig } from '../helpers/initPayloadE2ENoConfig.js'
import { POLL_TOPASS_TIMEOUT, TEST_TIMEOUT_LONG } from '../playwright.config.js'
import { readRestrictedSlug } from './collections/ReadRestricted/index.js'
import {
  authSlug,
  blocksFieldAccessSlug,
  createNotUpdateCollectionSlug,
  differentiatedTrashSlug,
  disabledSlug,
  docLevelAccessSlug,
  fullyRestrictedSlug,
  nonAdminEmail,
  publicUserEmail,
  publicUsersSlug,
  readNotUpdateGlobalSlug,
  readOnlyGlobalSlug,
  readOnlySlug,
  regularUserEmail,
  restrictedTrashSlug,
  restrictedVersionsAdminPanelSlug,
  restrictedVersionsSlug,
  slug,
  unrestrictedSlug,
  userRestrictedCollectionSlug,
  userRestrictedGlobalSlug,
} from './shared.js'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

/**
 * TODO: Access Control
 *
 * FSK: 'should properly prevent / allow public users from reading a restricted field'
 *
 * Repeat all above for globals
 */

const { beforeAll, beforeEach, describe, afterEach, afterAll } = test

let payload: PayloadTestSDK<Config>
describe('Access Control', () => {
  let page: Page
  let url: AdminUrlUtil
  let usersUrl: AdminUrlUtil
  let restrictedUrl: AdminUrlUtil
  let unrestrictedURL: AdminUrlUtil
  let readOnlyCollectionUrl: AdminUrlUtil
  let richTextUrl: AdminUrlUtil
  let readOnlyGlobalUrl: AdminUrlUtil
  let restrictedVersionsUrl: AdminUrlUtil
  let restrictedVersionsAdminPanelUrl: AdminUrlUtil
  let userRestrictedCollectionURL: AdminUrlUtil
  let userRestrictedGlobalURL: AdminUrlUtil
  let disabledFields: AdminUrlUtil
  let serverURL: string
  let context: BrowserContext
  let authFields: AdminUrlUtil
  let blocksFieldAccessUrl: AdminUrlUtil
  let differentiatedTrashUrl: AdminUrlUtil
  let restrictedTrashUrl: AdminUrlUtil

  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    ;({ payload, serverURL } = await initPayloadE2ENoConfig<Config>({ dirname }))

    url = new AdminUrlUtil(serverURL, slug)
    usersUrl = new AdminUrlUtil(serverURL, 'users')
    restrictedUrl = new AdminUrlUtil(serverURL, fullyRestrictedSlug)
    richTextUrl = new AdminUrlUtil(serverURL, 'rich-text')
    unrestrictedURL = new AdminUrlUtil(serverURL, unrestrictedSlug)
    readOnlyCollectionUrl = new AdminUrlUtil(serverURL, readOnlySlug)
    readOnlyGlobalUrl = new AdminUrlUtil(serverURL, readOnlySlug)
    restrictedVersionsUrl = new AdminUrlUtil(serverURL, restrictedVersionsSlug)
    restrictedVersionsAdminPanelUrl = new AdminUrlUtil(serverURL, restrictedVersionsAdminPanelSlug)
    userRestrictedCollectionURL = new AdminUrlUtil(serverURL, userRestrictedCollectionSlug)
    userRestrictedGlobalURL = new AdminUrlUtil(serverURL, userRestrictedGlobalSlug)
    disabledFields = new AdminUrlUtil(serverURL, disabledSlug)
    authFields = new AdminUrlUtil(serverURL, authSlug)
    blocksFieldAccessUrl = new AdminUrlUtil(serverURL, blocksFieldAccessSlug)
    differentiatedTrashUrl = new AdminUrlUtil(serverURL, differentiatedTrashSlug)
    restrictedTrashUrl = new AdminUrlUtil(serverURL, restrictedTrashSlug)

    context = await browser.newContext()
    page = await context.newPage()
    initPageConsoleErrorCatch(page)

    await ensureCompilationIsDone({ page, serverURL, noAutoLogin: true })

    await login({ page, serverURL })
  })

  describe('fields', () => {
    test('field without read access should not show', async () => {
      const { id } = await createDoc({ restrictedField: 'restricted' })

      await page.goto(url.edit(id))

      await expect(page.locator('#field-restrictedField')).toHaveCount(0)
    })

    test('field without read access inside a group should not show', async () => {
      const { id } = await createDoc({ restrictedField: 'restricted' })

      await page.goto(url.edit(id))

      await expect(page.locator('#field-group__restrictedGroupText')).toHaveCount(0)
    })

    test('field without read access inside a collapsible should not show', async () => {
      const { id } = await createDoc({ restrictedField: 'restricted' })

      await page.goto(url.edit(id))

      await expect(page.locator('#field-restrictedRowText')).toHaveCount(0)
    })

    test('field without read access inside a row should not show', async () => {
      const { id } = await createDoc({ restrictedField: 'restricted' })

      await page.goto(url.edit(id))

      await expect(page.locator('#field-restrictedCollapsibleText')).toHaveCount(0)
    })

    test('should not show field without permission', async () => {
      await page.goto(url.account)
      await expect(page.locator('#field-roles')).toBeHidden()
    })

    test('ensure field with update access control is readOnly during both initial load and after saving', async () => {
      async function waitForFormState(action: 'reload' | 'save') {
        await assertNetworkRequests(
          page,
          '/admin/collections/field-restricted-update-based-on-data',
          async () => {
            if (action === 'save') {
              await saveDocAndAssert(page)
            } else {
              await page.reload()
            }
          },
          {
            minimumNumberOfRequests: action === 'save' ? 2 : 1,
            allowedNumberOfRequests: action === 'save' ? 2 : 1,
          },
        )
      }
      // Reproduces a bug where the shape of the `data` object passed to the field update access control function is incorrect
      // after saving the document, and correct on initial load.

      await payload.delete({
        collection: 'field-restricted-update-based-on-data',
        where: {
          id: {
            exists: true,
          },
        },
      })

      const collectionURL = new AdminUrlUtil(serverURL, 'field-restricted-update-based-on-data')

      // Create document via UI, to test if the field's readOnly state is correct throughout the entire lifecycle of the document.

      await page.goto(collectionURL.create)

      const restrictedField = page.locator('#field-restricted')
      const isRestrictedCheckbox = page.locator('#field-isRestricted')

      await expect(restrictedField).toBeEnabled()

      await isRestrictedCheckbox.check()
      await expect(isRestrictedCheckbox).toBeChecked()

      await waitForFormState('save')
      await expect(restrictedField).toBeDisabled()

      await waitForFormState('reload')
      await expect(restrictedField).toBeDisabled()

      await isRestrictedCheckbox.uncheck()
      await expect(isRestrictedCheckbox).not.toBeChecked()

      await waitForFormState('save')
      await expect(restrictedField).toBeEnabled()

      await isRestrictedCheckbox.check()
      await expect(isRestrictedCheckbox).toBeChecked()

      await waitForFormState('save')

      // Important: keep all the wait's, so that tests don't accidentally pass due to flashing of the field's readOnly state.
      // While the new results are still coming in.
      // The issue starts here, where saving a document without reload does not update the field's state from enabled to disabled,
      // because the data object passed to the update access control function is incorrect.
      await expect(restrictedField).toBeDisabled()

      await waitForFormState('reload')

      await expect(restrictedField).toBeDisabled()

      await payload.delete({
        collection: 'field-restricted-update-based-on-data',
        where: {
          id: {
            exists: true,
          },
        },
      })
    })
  })

  describe('rich text', () => {
    test('rich text within block should render as editable', async () => {
      await page.goto(richTextUrl.create)

      await page.locator('.blocks-field__drawer-toggler').click()
      await page.locator('.thumbnail-card').click()
      const richTextField = page.locator('.rich-text-lexical')
      const contentEditable = richTextField.locator('.ContentEditable__root').first()
      await expect(contentEditable).toBeVisible()
      await contentEditable.click()

      const typedText = 'Hello, this field is editable!'
      await page.keyboard.type(typedText)

      await expect(
        page.locator('[data-lexical-text="true"]', {
          hasText: exactText(typedText),
        }),
      ).toHaveCount(1)
    })

    const ensureRegression1FieldsHaveCorrectAccess = async () => {
      await expect(
        page.locator('#field-group1 .rich-text-lexical .ContentEditable__root'),
      ).toBeVisible()
      // Wait until the contenteditable is editable
      await expect(
        page.locator('#field-group1 .rich-text-lexical .ContentEditable__root'),
      ).toBeEditable()

      await expect(async () => {
        const isAttached = page.locator('#field-group1 .rich-text-lexical--read-only')
        await expect(isAttached).toBeHidden()
      }).toPass({ timeout: 10000, intervals: [100] })
      await expect(page.locator('#field-group1 #field-group1__text')).toBeEnabled()

      // Click on button with text Tab1
      await page.locator('.tabs-field__tab-button').getByText('Tab1').click()

      await expect(
        page.locator('.tabs-field__tab .rich-text-lexical .ContentEditable__root').first(),
      ).toBeVisible()
      await expect(
        page.locator('.tabs-field__tab .rich-text-lexical--read-only').first(),
      ).not.toBeAttached()

      await expect(
        page.locator(
          '.tabs-field__tab #field-tab1__blocks2 .rich-text-lexical .ContentEditable__root',
        ),
      ).toBeVisible()
      await expect(
        page.locator('.tabs-field__tab #field-tab1__blocks2 .rich-text-lexical--read-only'),
      ).not.toBeAttached()

      await expect(
        page.locator('#field-array #array-row-0 .rich-text-lexical .ContentEditable__root'),
      ).toBeVisible()
      await expect(
        page.locator('#field-array #array-row-0 .rich-text-lexical--read-only'),
      ).not.toBeAttached()

      await expect(
        page.locator(
          '#field-arrayWithAccessFalse #arrayWithAccessFalse-row-0 .rich-text-lexical .ContentEditable__root',
        ),
      ).toBeVisible()
      await expect(
        page.locator(
          '#field-arrayWithAccessFalse #arrayWithAccessFalse-row-0 .rich-text-lexical--read-only',
        ),
      ).toBeVisible()

      await expect(
        page.locator('#field-blocks .rich-text-lexical .ContentEditable__root'),
      ).toBeVisible()
      await expect(page.locator('#field-blocks.rich-text-lexical--read-only')).not.toBeAttached()
    }
    /**
     * This reproduces a bug where certain fields were incorrectly marked as read-only
     */

    test('ensure complex collection config fields show up in correct read-only state', async () => {
      const regression1URL = new AdminUrlUtil(serverURL, 'regression1')
      await page.goto(regression1URL.list)

      await page.locator('.cell-id a').first().click()
      await page.waitForURL(`**/collections/regression1/**`)

      await ensureRegression1FieldsHaveCorrectAccess()

      // Edit any field
      await page.locator('#field-group1__text').fill('test!')
      await saveDocAndAssert(page)
      await wait(1000)
      // Ensure fields still have the correct readOnly state. When saving the document, permissions are re-evaluated
      await ensureRegression1FieldsHaveCorrectAccess()
    })

    const ensureRegression2FieldsHaveCorrectAccess = async () => {
      await expect(
        page.locator('#field-group .rich-text-lexical .ContentEditable__root'),
      ).toBeVisible()
      // Wait until the contenteditable is editable
      await expect(
        page.locator('#field-group .rich-text-lexical .ContentEditable__root'),
      ).toBeEditable()

      await expect(async () => {
        const isAttached = page.locator('#field-group .rich-text-lexical--read-only')
        await expect(isAttached).toBeHidden()
      }).toPass({ timeout: 10000, intervals: [100] })
      await expect(page.locator('#field-group #field-group__text')).toBeEnabled()

      await expect(
        page.locator('#field-array #array-row-0 .rich-text-lexical .ContentEditable__root'),
      ).toBeVisible()
      await expect(
        page.locator('#field-array #array-row-0 .rich-text-lexical--read-only'),
      ).toBeVisible() // => is read-only
    }

    /**
     * This reproduces a bug where certain fields were incorrectly marked as read-only
     */

    test('ensure complex collection config fields show up in correct read-only state 2', async () => {
      const regression2URL = new AdminUrlUtil(serverURL, 'regression2')
      await page.goto(regression2URL.list)

      await page.locator('.cell-id a').first().click()
      await page.waitForURL(`**/collections/regression2/**`)

      await ensureRegression2FieldsHaveCorrectAccess()

      // Edit any field
      await page.locator('#field-group__text').fill('test!')
      await saveDocAndAssert(page)
      await wait(1000)

      // Ensure fields still have the correct readOnly state. When saving the document, permissions are re-evaluated
      await ensureRegression2FieldsHaveCorrectAccess()
    })
  })

  describe('collection — fully restricted', () => {
    let existingDoc: ReadOnlyCollection

    beforeAll(async () => {
      existingDoc = await payload.create({
        collection: fullyRestrictedSlug,
        data: {
          name: 'name',
        },
      })
    })

    test('should not show in card list', async () => {
      await page.goto(url.admin)
      await expect(page.locator(`#card-${fullyRestrictedSlug}`)).toHaveCount(0)
    })

    test('should not show in nav', async () => {
      await page.goto(url.admin)
      await openNav(page)

      await expect(
        page.locator('.nav a', {
          hasText: exactText('Restricteds'),
        }),
      ).toHaveCount(0)
    })

    test('should not have list url', async () => {
      const errors = []

      page.on('console', (exception) => {
        errors.push(exception)
      })

      await page.goto(restrictedUrl.list)

      // eslint-disable-next-line payload/no-flaky-assertions
      expect(errors).not.toHaveLength(0)
    })

    test('should not have create url', async () => {
      await page.goto(restrictedUrl.create)
      await expect(page.locator('.not-found')).toBeVisible()
    })

    test('should not have access to existing doc', async () => {
      await page.goto(restrictedUrl.edit(existingDoc.id))
      await expect(page.locator('.not-found')).toBeVisible()
    })
  })

  describe('collection — read-only', () => {
    let existingDoc: ReadOnlyCollection

    beforeAll(async () => {
      existingDoc = await payload.create({
        collection: readOnlySlug,
        data: {
          name: 'name',
        },
      })
    })

    test('should show in card list', async () => {
      await page.goto(url.admin)
      await expect(page.locator(`#card-${readOnlySlug}`)).toHaveCount(1)
    })

    test('should show in nav', async () => {
      await page.goto(url.admin)
      await expect(page.locator(`.nav a[href="/admin/collections/${readOnlySlug}"]`)).toHaveCount(1)
    })

    test('should have collection url', async () => {
      await page.goto(readOnlyCollectionUrl.list)
      await expect(page).toHaveURL(new RegExp(`${readOnlyCollectionUrl.list}.*`)) // will redirect to ?limit=10 at the end, so we have to use a wildcard at the end
    })

    test('should not have "Create New" button', async () => {
      await page.goto(readOnlyCollectionUrl.create)
      await expect(page.locator('.collection-list__header a')).toHaveCount(0)
    })

    test('should not have quick create button', async () => {
      await page.goto(url.admin)
      await expect(page.locator(`#card-${readOnlySlug}`)).not.toHaveClass('card__actions')
    })

    test('should not display actions on edit view', async () => {
      await page.goto(readOnlyCollectionUrl.edit(existingDoc.id))
      await expect(page.locator('.collection-edit__collection-actions li')).toHaveCount(0)
    })

    test('fields should be read-only', async () => {
      await page.goto(readOnlyCollectionUrl.edit(existingDoc.id))
      await expect(page.locator('#field-name')).toBeDisabled()

      await page.goto(readOnlyGlobalUrl.global(readOnlyGlobalSlug))
      await expect(page.locator('#field-name')).toBeDisabled()
    })

    test('should not render dot menu popup when `create` and `delete` access control is set to false', async () => {
      await page.goto(readOnlyCollectionUrl.edit(existingDoc.id))
      await expect(page.locator('.collection-edit .doc-controls .doc-controls__popup')).toBeHidden()
    })
  })

  describe('collection — create but not edit', () => {
    test('should not show edit button', async () => {
      const createNotUpdateURL = new AdminUrlUtil(serverURL, createNotUpdateCollectionSlug)
      await page.goto(createNotUpdateURL.create)
      await expect(page.locator('#field-name')).toBeVisible()
      await page.locator('#field-name').fill('name')
      await expect(page.locator('#field-name')).toHaveValue('name')
      await expect(page.locator('#action-save')).toBeVisible()
      await page.locator('#action-save').click()
      await expect(page.locator('.payload-toast-container')).toContainText('successfully')
      await expect(page.locator('#action-save')).toBeHidden()
      await expect(page.locator('#field-name')).toBeDisabled()
    })

    test('should maintain access control in document drawer', async () => {
      const unrestrictedDoc = await payload.create({
        collection: unrestrictedSlug,
        data: {
          name: 'unrestricted-123',
        },
      })

      await page.goto(unrestrictedURL.edit(unrestrictedDoc.id.toString()))

      const addDocButton = page.locator(
        '#createNotUpdateDocs-add-new button.relationship-add-new__add-button.doc-drawer__toggler',
      )

      await expect(addDocButton).toBeVisible()
      await addDocButton.click()
      const documentDrawer = page.locator(`[id^=doc-drawer_${createNotUpdateCollectionSlug}_1_]`)
      await expect(documentDrawer).toBeVisible()
      await expect(documentDrawer.locator('#action-save')).toBeVisible()

      await documentDrawer.locator('#field-name').fill('name')
      await expect(documentDrawer.locator('#field-name')).toHaveValue('name')

      await saveDocAndAssert(
        page,
        `[id^=doc-drawer_${createNotUpdateCollectionSlug}_1_] #action-save`,
      )

      await expect(documentDrawer.locator('#action-save')).toBeHidden()
      await expect(documentDrawer.locator('#field-name')).toBeDisabled()
    })
  })

  describe('global — read but not update', () => {
    test('should not show edit button', async () => {
      const createNotUpdateURL = new AdminUrlUtil(serverURL, readNotUpdateGlobalSlug)
      await page.goto(createNotUpdateURL.global(readNotUpdateGlobalSlug))
      await expect(page.locator('#field-name')).toBeVisible()
      await expect(page.locator('#field-name')).toBeDisabled()
      await expect(page.locator('#action-save')).toBeHidden()
    })
  })

  describe('dynamic update access', () => {
    describe('collection', () => {
      test('should restrict update access based on document field', async () => {
        await page.goto(userRestrictedCollectionURL.create)
        await expect(page.locator('#field-name')).toBeVisible()
        await page.locator('#field-name').fill('anonymous@email.com')
        await page.locator('#action-save').click()
        await expect(page.locator('.payload-toast-container')).toContainText('successfully')
        await expect(page.locator('#field-name')).toBeDisabled()
        await expect(page.locator('#action-save')).toBeHidden()

        await page.goto(userRestrictedCollectionURL.create)
        await expect(page.locator('#field-name')).toBeVisible()
        await page.locator('#field-name').fill(devUser.email)
        await page.locator('#action-save').click()
        await expect(page.locator('.payload-toast-container')).toContainText('successfully')
        await expect(page.locator('#field-name')).toBeEnabled()
        await expect(page.locator('#action-save')).toBeVisible()
      })

      test('maintain access control in document drawer', async () => {
        const unrestrictedDoc = await payload.create({
          collection: unrestrictedSlug,
          data: {
            name: 'unrestricted-123',
          },
        })
        await page.goto(unrestrictedURL.edit(unrestrictedDoc.id.toString()))
        const field = page.locator('#field-userRestrictedDocs')
        await expect(field.locator('input')).toBeEnabled()
        const addDocButton = page.locator(
          '#userRestrictedDocs-add-new button.relationship-add-new__add-button.doc-drawer__toggler',
        )
        await addDocButton.click()
        const documentDrawer = page.locator('[id^=doc-drawer_user-restricted-collection_1_]')
        await expect(documentDrawer).toBeVisible()
        await documentDrawer.locator('#field-name').fill('anonymous@email.com')
        await wait(500)
        await documentDrawer.locator('#action-save').click()
        await expect(page.locator('.payload-toast-container')).toContainText('successfully')
        await expect(documentDrawer.locator('#field-name')).toBeDisabled()
        await documentDrawer.locator('button.doc-drawer__header-close').click()
        await expect(documentDrawer).toBeHidden()
        await addDocButton.click()
        const documentDrawer2 = page.locator('[id^=doc-drawer_user-restricted-collection_1_]')
        await expect(documentDrawer2).toBeVisible()
        await documentDrawer2.locator('#field-name').fill('dev@payloadcms.com')
        await documentDrawer2.locator('#action-save').click()
        await expect(page.locator('.payload-toast-container')).toContainText('successfully')
        await expect(documentDrawer2.locator('#field-name')).toBeEnabled()
      })
    })

    describe('global', () => {
      test('should restrict update access based on document field', async () => {
        await payload.updateGlobal({
          slug: userRestrictedGlobalSlug,
          data: {
            name: 'dev@payloadcms.com',
          },
        })

        await page.goto(userRestrictedGlobalURL.global(userRestrictedGlobalSlug))
        await expect(page.locator('#field-name')).toBeVisible()
        await expect(page.locator('#field-name')).toHaveValue(devUser.email)
        await expect(page.locator('#field-name')).toBeEnabled()
        await page.locator('#field-name').fill('anonymous@email.com')
        await page.locator('#action-save').click()
        await expect(page.locator('.payload-toast-container')).toContainText(
          'You are not allowed to perform this action',
        )

        await payload.updateGlobal({
          slug: userRestrictedGlobalSlug,
          data: {
            name: 'anonymous@payloadcms.com',
          },
        })

        await page.goto(userRestrictedGlobalURL.global(userRestrictedGlobalSlug))
        await expect(page.locator('#field-name')).toBeDisabled()
        await expect(page.locator('#action-save')).toBeHidden()
      })

      test('should restrict access based on user settings', async () => {
        const url = formatAdminURL({ adminRoute: '/admin', path: '/globals/settings', serverURL })
        await page.goto(url)
        await openNav(page)
        await expect(page.locator('#nav-global-settings')).toBeVisible()
        await expect(page.locator('#nav-global-test')).toBeHidden()
        await closeNav(page)
        await page.locator('.checkbox-input:has(#field-test) input').check()
        await saveDocAndAssert(page)
        await openNav(page)
        const globalTest = page.locator('#nav-global-test')
        await expect(async () => await globalTest.isVisible()).toPass({
          timeout: POLL_TOPASS_TIMEOUT,
        })
      })
    })
  })

  describe('collection — restricted versions', () => {
    let existingDoc: RestrictedVersion

    beforeAll(async () => {
      existingDoc = await payload.create({
        collection: restrictedVersionsAdminPanelSlug,
        data: {
          name: 'name',
        },
      })

      await payload.update({
        collection: restrictedVersionsAdminPanelSlug,
        id: existingDoc.id,
        data: {
          hidden: true,
        },
      })
    })

    test('versions tab should not show', async () => {
      await page.goto(restrictedVersionsAdminPanelUrl.edit(existingDoc.id))
      await page.locator('.doc-tabs__tabs').getByLabel('Versions').click()
      const rows = page.locator('.versions table tbody tr')
      await expect(rows).toHaveCount(1)
    })
  })

  describe('doc level access', () => {
    let existingDoc: ReadOnlyCollection
    let docLevelAccessURL: AdminUrlUtil

    beforeAll(async () => {
      docLevelAccessURL = new AdminUrlUtil(serverURL, docLevelAccessSlug)

      existingDoc = await payload.create({
        collection: docLevelAccessSlug,
        data: {
          approvedForRemoval: false,
          approvedTitle: 'Title',
          lockTitle: true,
        },
      })
    })

    test('should disable field based on document data', async () => {
      await page.goto(docLevelAccessURL.edit(existingDoc.id))
      const isDisabled = page.locator('#field-approvedTitle')
      await expect(isDisabled).toBeDisabled()
    })

    test('should disable operation based on document data', async () => {
      await page.goto(docLevelAccessURL.edit(existingDoc.id))
      await openDocControls(page)
      await expect(page.locator('#action-delete')).toBeHidden()
      await page.locator('#field-approvedForRemoval').check()
      await saveDocAndAssert(page)
      await openDocControls(page)
      await expect(page.locator('#action-delete')).toBeVisible()
    })

    test('can only unlock self when admin', async () => {
      await page.goto(usersUrl.list)

      const adminUserRow = page.locator('.table tr').filter({ hasText: devUser.email })
      const nonAdminUserRow = page.locator('.table tr').filter({ hasText: nonAdminEmail })

      // Ensure admin user cannot unlock other users
      await adminUserRow.locator('.cell-id a').click()
      await page.waitForURL(`**/collections/users/**`)

      const unlockButton = page.locator('#force-unlock')
      await expect(unlockButton).toBeVisible()
      await unlockButton.click()
      await expect(page.locator('.payload-toast-container')).toContainText('Successfully unlocked')

      await page.goto(usersUrl.list)

      // Ensure non-admin user cannot see unlock button
      await nonAdminUserRow.locator('.cell-id a').click()
      await page.waitForURL(`**/collections/users/**`)
      await expect(page.locator('#force-unlock')).toBeHidden()
    })
  })

  describe('admin access', () => {
    test('unauthenticated users should not have access to the admin panel', async () => {
      await page.goto(url.logout)

      await expect(page.locator('.payload-toast-container')).toContainText(
        'You have been logged out successfully.',
      )

      await expect(page.locator('form.login__form')).toBeVisible()

      await page.goto(url.admin)

      // wait for redirect to login
      await page.waitForURL(url.login)

      expect(page.url()).toEqual(url.login)
    })

    test('non-admin users should not have access to the admin panel', async () => {
      await page.goto(url.logout)

      await login({
        data: {
          email: nonAdminEmail,
          password: 'test',
        },
        page,
        serverURL,
      })

      await expect(page.locator('.unauthorized .form-header h1')).toHaveText(
        'Unauthorized, this user does not have access to the admin panel.',
      )

      await page.goto(url.logout)

      await expect(page.locator('.payload-toast-container')).toContainText(
        'You have been logged out successfully.',
      )

      await expect(page.locator('form.login__form')).toBeVisible()
    })

    test('public users should not have access to access admin', async () => {
      await page.goto(url.logout)

      const user = await payload.login({
        collection: publicUsersSlug,
        data: {
          email: publicUserEmail,
          password: devUser.password,
        },
      })

      await context.addCookies([
        {
          name: 'payload-token',
          value: user.token,
          domain: 'localhost',
          path: '/',
          httpOnly: true,
          secure: true,
        },
      ])

      await page.reload()

      await page.goto(url.admin)

      // await for redirect to unauthorized
      await page.waitForURL(/unauthorized$/)

      await expect(page.locator('.unauthorized .form-header h1')).toHaveText(
        'Unauthorized, this user does not have access to the admin panel.',
      )

      await page.goto(url.logout)

      await expect(page.locator('.payload-toast-container')).toContainText(
        'You have been logged out successfully.',
      )

      await expect(page.locator('form.login__form')).toBeVisible()
    })
  })

  describe('read-only from access control', () => {
    beforeAll(async () => {
      await login({
        data: {
          email: devUser.email,
          password: devUser.password,
        },
        page,
        serverURL,
      })
    })

    test('should be read-only when update returns false', async () => {
      await page.goto(disabledFields.create)

      // group field
      await page.locator('#field-group__text').fill('group')

      // named tab
      await page.locator('#field-namedTab__text').fill('named tab')

      // unnamed tab
      await page.locator('.tabs-field__tab-button').nth(1).click()
      await page.locator('#field-unnamedTab').fill('unnamed tab')

      // array field
      await page.locator('#field-array > button').click()
      await page.locator('#field-array__0__text').fill('array row 0')

      await saveDocAndAssert(page)

      await expect(page.locator('#field-group__text')).toBeDisabled()
      await expect(page.locator('#field-namedTab__text')).toBeDisabled()
      await page.locator('.tabs-field__tab-button').nth(1).click()
      await expect(page.locator('#field-unnamedTab')).toBeDisabled()
      await expect(page.locator('#field-array__0__text')).toBeDisabled()
    })
  })

  describe('restricting update access to auth fields', () => {
    let existingDoc: ReadOnlyCollection
    beforeAll(async () => {
      existingDoc = await payload.create({
        collection: authSlug,
        data: {
          email: 'test@payloadcms.com',
          password: 'test',
        },
      })
    })
    test('should show email as readonly when user does not have update permission', async () => {
      await page.goto(authFields.edit(existingDoc.id))
      const emailField = page.locator('#field-email')
      await expect(emailField).toBeVisible()
      await expect(emailField).toBeDisabled()
    })

    test('should hide Change Password button when user does not have update permission', async () => {
      await page.goto(authFields.edit(existingDoc.id))
      const passwordField = page.locator('#field-password')
      await expect(passwordField).toBeHidden()
      const changePasswordButton = page.locator('#change-password')
      await expect(changePasswordButton).toBeHidden()
    })
  })

  describe('field read access restrictions in list view', () => {
    let readRestrictedUrl: AdminUrlUtil

    beforeAll(() => {
      readRestrictedUrl = new AdminUrlUtil(serverURL, readRestrictedSlug)
    })

    describe('column selector', () => {
      test('should hide top-level field with read: false in column selector', async () => {
        await page.goto(readRestrictedUrl.list)
        await page.locator('.list-controls__toggle-columns').click()

        await expect(page.locator('.pill-selector')).toBeVisible()

        // Should hide restrictedTopLevel field
        await expect(
          page.locator(`.pill-selector .pill-selector__pill`, {
            hasText: exactText('Restricted Top Level'),
          }),
        ).toBeHidden()

        // Should show visibleTopLevel field
        await expect(
          page.locator(`.pill-selector .pill-selector__pill`, {
            hasText: exactText('Visible Top Level'),
          }),
        ).toBeVisible()
      })

      test('should hide nested field with read: false inside group in column selector', async () => {
        await page.goto(readRestrictedUrl.list)
        await page.locator('.list-controls__toggle-columns').click()

        await expect(page.locator('.pill-selector')).toBeVisible()

        // Should hide secretPhone field inside contactInfo group
        await expect(
          page.locator(`.pill-selector .pill-selector__pill`, {
            hasText: exactText('Contact Info > Secret Phone'),
          }),
        ).toBeHidden()

        // Should show publicPhone field
        await expect(
          page.locator(`.pill-selector .pill-selector__pill`, {
            hasText: exactText('Contact Info > Public Phone'),
          }),
        ).toBeVisible()
      })

      test('should hide field with read: false inside row in column selector', async () => {
        await page.goto(readRestrictedUrl.list)
        await page.locator('.list-controls__toggle-columns').click()

        await expect(page.locator('.pill-selector')).toBeVisible()

        // Should hide restrictedInRow field
        await expect(
          page.locator(`.pill-selector .pill-selector__pill`, {
            hasText: exactText('Restricted In Row'),
          }),
        ).toBeHidden()

        // Should show visibleInRow field
        await expect(
          page.locator(`.pill-selector .pill-selector__pill`, {
            hasText: exactText('Visible In Row'),
          }),
        ).toBeVisible()
      })

      test('should hide field with read: false inside collapsible in column selector', async () => {
        await page.goto(readRestrictedUrl.list)
        await page.locator('.list-controls__toggle-columns').click()

        await expect(page.locator('.pill-selector')).toBeVisible()

        // Should hide restrictedInCollapsible field
        await expect(
          page.locator(`.pill-selector .pill-selector__pill`, {
            hasText: exactText('Restricted In Collapsible'),
          }),
        ).toBeHidden()

        // Should show visibleInCollapsible field
        await expect(
          page.locator(`.pill-selector .pill-selector__pill`, {
            hasText: exactText('Visible In Collapsible'),
          }),
        ).toBeVisible()
      })

      test('should hide deeply nested field with read: false in column selector', async () => {
        await page.goto(readRestrictedUrl.list)
        await page.locator('.list-controls__toggle-columns').click()

        await expect(page.locator('.pill-selector')).toBeVisible()

        // Should hide metadata.analytics.restrictedMetric field
        await expect(
          page.locator(`.pill-selector .pill-selector__pill`, {
            hasText: exactText('Metadata > Analytics > Restricted Metric'),
          }),
        ).toBeHidden()

        // Should show metadata.analytics.visibleMetric field
        await expect(
          page.locator(`.pill-selector .pill-selector__pill`, {
            hasText: exactText('Metadata > Analytics > Visible Metric'),
          }),
        ).toBeVisible()
      })

      test('should hide field with read: false inside unnamed tab in column selector', async () => {
        await page.goto(readRestrictedUrl.list)
        await page.locator('.list-controls__toggle-columns').click()

        await expect(page.locator('.pill-selector')).toBeVisible()

        // Should hide secretInPublicTab field
        await expect(
          page.locator(`.pill-selector .pill-selector__pill`, {
            hasText: exactText('Secret In Public Tab'),
          }),
        ).toBeHidden()

        // Should show publicData field
        await expect(
          page.locator(`.pill-selector .pill-selector__pill`, {
            hasText: exactText('Public Data'),
          }),
        ).toBeVisible()
      })

      test('should hide field with read: false inside named tab in column selector', async () => {
        await page.goto(readRestrictedUrl.list)
        await page.locator('.list-controls__toggle-columns').click()

        await expect(page.locator('.pill-selector')).toBeVisible()

        // Should hide restrictedSetting field
        await expect(
          page.locator(`.pill-selector .pill-selector__pill`, {
            hasText: exactText('Settings > Restricted Setting'),
          }),
        ).toBeHidden()

        // Should show visibleSetting field
        await expect(
          page.locator(`.pill-selector .pill-selector__pill`, {
            hasText: exactText('Settings > Visible Setting'),
          }),
        ).toBeVisible()
      })

      test('should hide field with read: false inside row within group in column selector', async () => {
        await page.goto(readRestrictedUrl.list)
        await page.locator('.list-controls__toggle-columns').click()

        await expect(page.locator('.pill-selector')).toBeVisible()

        // Should hide secretPostalCode field
        await expect(
          page.locator(`.pill-selector .pill-selector__pill`, {
            hasText: exactText('Address > Secret Postal Code'),
          }),
        ).toBeHidden()

        // Should show city field
        await expect(
          page.locator(`.pill-selector .pill-selector__pill`, {
            hasText: exactText('Address > City'),
          }),
        ).toBeVisible()
      })

      test('should hide field with read: false inside group within collapsible in column selector', async () => {
        await page.goto(readRestrictedUrl.list)
        await page.locator('.list-controls__toggle-columns').click()

        await expect(page.locator('.pill-selector')).toBeVisible()

        // Should hide restrictedAdvanced field
        await expect(
          page.locator(`.pill-selector .pill-selector__pill`, {
            hasText: exactText('Advanced > Restricted Advanced'),
          }),
        ).toBeHidden()

        // Should show visibleAdvanced field
        await expect(
          page.locator(`.pill-selector .pill-selector__pill`, {
            hasText: exactText('Advanced > Visible Advanced'),
          }),
        ).toBeVisible()
      })
    })

    describe('filter dropdown', () => {
      test('should hide top-level field with read: false in filter dropdown', async () => {
        await page.goto(readRestrictedUrl.list)
        await openListFilters(page, {})
        await page.locator('.where-builder__add-first-filter').click()

        const initialField = page.locator('.condition__field')
        await initialField.click()

        // Wait for dropdown options to load by waiting for the visible field
        const visibleOption = initialField.locator('.rs__option', {
          hasText: 'Visible Top Level',
        })
        await expect(visibleOption).toBeVisible()

        // Should hide restrictedTopLevel field
        await expect(
          initialField.locator('.rs__option', { hasText: 'Restricted Top Level' }),
        ).toBeHidden()
      })

      test('should hide nested field with read: false inside group in filter dropdown', async () => {
        await page.goto(readRestrictedUrl.list)
        await openListFilters(page, {})
        await page.locator('.where-builder__add-first-filter').click()

        const initialField = page.locator('.condition__field')
        await initialField.click()

        // Wait for dropdown options to load by waiting for the visible field
        const visibleOption = initialField.locator('.rs__option', {
          hasText: 'Public Phone',
        })
        await expect(visibleOption).toBeVisible()

        // Should hide secretPhone field
        await expect(initialField.locator('.rs__option', { hasText: 'Secret Phone' })).toBeHidden()
      })

      test('should hide field with read: false inside row in filter dropdown', async () => {
        await page.goto(readRestrictedUrl.list)
        await openListFilters(page, {})
        await page.locator('.where-builder__add-first-filter').click()

        const initialField = page.locator('.condition__field')
        await initialField.click()

        // Wait for dropdown options to load by waiting for the visible field
        const visibleOption = initialField.locator('.rs__option', {
          hasText: 'Visible In Row',
        })
        await expect(visibleOption).toBeVisible()

        // Should hide restrictedInRow field
        await expect(
          initialField.locator('.rs__option', { hasText: 'Restricted In Row' }),
        ).toBeHidden()
      })

      test('should hide field with read: false inside collapsible in filter dropdown', async () => {
        await page.goto(readRestrictedUrl.list)
        await openListFilters(page, {})
        await page.locator('.where-builder__add-first-filter').click()

        const initialField = page.locator('.condition__field')
        await initialField.click()

        // Wait for dropdown options to load by waiting for the visible field
        const visibleOption = initialField.locator('.rs__option', {
          hasText: 'Visible In Collapsible',
        })
        await expect(visibleOption).toBeVisible()

        // Should hide restrictedInCollapsible field
        await expect(
          initialField.locator('.rs__option', { hasText: 'Restricted In Collapsible' }),
        ).toBeHidden()
      })

      test('should hide deeply nested field with read: false in filter dropdown', async () => {
        await page.goto(readRestrictedUrl.list)
        await openListFilters(page, {})
        await page.locator('.where-builder__add-first-filter').click()

        const initialField = page.locator('.condition__field')
        await initialField.click()

        // Wait for dropdown options to load by waiting for the visible field
        const visibleOption = initialField.locator('.rs__option', {
          hasText: 'Visible Metric',
        })
        await expect(visibleOption).toBeVisible()

        // Should hide metadata.analytics.restrictedMetric field
        await expect(
          initialField.locator('.rs__option', { hasText: 'Restricted Metric' }),
        ).toBeHidden()
      })

      test('should hide field with read: false inside unnamed tab in filter dropdown', async () => {
        await page.goto(readRestrictedUrl.list)
        await openListFilters(page, {})
        await page.locator('.where-builder__add-first-filter').click()

        const initialField = page.locator('.condition__field')
        await initialField.click()

        // Wait for dropdown options to load by waiting for the visible field
        const visibleOption = initialField.locator('.rs__option', {
          hasText: 'Public Tab > Public Data',
        })
        await expect(visibleOption).toBeVisible()

        // Should hide secretInPublicTab field
        await expect(
          initialField.locator('.rs__option', { hasText: 'Public Tab > Secret In Public Tab' }),
        ).toBeHidden()
      })

      test('should hide field with read: false inside named tab in filter dropdown', async () => {
        await page.goto(readRestrictedUrl.list)
        await openListFilters(page, {})
        await page.locator('.where-builder__add-first-filter').click()

        const initialField = page.locator('.condition__field')
        await initialField.click()

        // Wait for dropdown options to load by waiting for the visible field
        const visibleOption = initialField.locator('.rs__option', {
          hasText: 'Settings > Visible Setting',
        })
        await expect(visibleOption).toBeVisible()

        // Should hide restrictedSetting field
        await expect(
          initialField.locator('.rs__option', { hasText: 'Settings > Restricted Setting' }),
        ).toBeHidden()
      })

      test('should hide field with read: false inside row within group in filter dropdown', async () => {
        await page.goto(readRestrictedUrl.list)
        await openListFilters(page, {})
        await page.locator('.where-builder__add-first-filter').click()

        const initialField = page.locator('.condition__field')
        await initialField.click()

        // Wait for dropdown options to load by waiting for the visible field
        const visibleOption = initialField.locator('.rs__option', {
          hasText: 'Address > City',
        })
        await expect(visibleOption).toBeVisible()

        // Should hide secretPostalCode field
        await expect(
          initialField.locator('.rs__option', { hasText: 'Address > Secret Postal Code' }),
        ).toBeHidden()
      })

      test('should hide field with read: false inside group within collapsible in filter dropdown', async () => {
        await page.goto(readRestrictedUrl.list)
        await openListFilters(page, {})
        await page.locator('.where-builder__add-first-filter').click()

        const initialField = page.locator('.condition__field')
        await initialField.click()

        // Wait for dropdown options to load by waiting for the visible field
        const visibleOption = initialField.locator('.rs__option', {
          hasText: 'Advanced Settings > Advanced > Visible Advanced',
        })
        await expect(visibleOption).toBeVisible()

        // Should hide restrictedAdvanced field
        await expect(
          initialField.locator('.rs__option', {
            hasText: 'Advanced Settings > Advanced > Restricted Advanced',
          }),
        ).toBeHidden()
      })
    })

    describe('groupBy dropdown', () => {
      test('should hide top-level field with read: false in groupBy dropdown', async () => {
        await page.goto(readRestrictedUrl.list)
        const { groupByContainer } = await openGroupBy(page)

        const field = groupByContainer.locator('#group-by--field-select')
        await field.click()

        // Wait for dropdown options to load by waiting for the visible field
        const visibleOption = field.locator('.rs__option', {
          hasText: 'Visible Top Level',
        })
        await expect(visibleOption).toBeVisible()

        // Should hide restrictedTopLevel field
        await expect(field.locator('.rs__option', { hasText: 'Restricted Top Level' })).toBeHidden()
      })

      test('should hide nested field with read: false inside group in groupBy dropdown', async () => {
        await page.goto(readRestrictedUrl.list)
        const { groupByContainer } = await openGroupBy(page)

        const field = groupByContainer.locator('#group-by--field-select')
        await field.click()

        // Wait for dropdown options to load by waiting for the visible field
        const visibleOption = field.locator('.rs__option', {
          hasText: 'Public Phone',
        })
        await expect(visibleOption).toBeVisible()

        // Should hide secretPhone field
        await expect(field.locator('.rs__option', { hasText: 'Secret Phone' })).toBeHidden()
      })

      test('should hide field with read: false inside row in groupBy dropdown', async () => {
        await page.goto(readRestrictedUrl.list)
        const { groupByContainer } = await openGroupBy(page)

        const field = groupByContainer.locator('#group-by--field-select')
        await field.click()

        // Wait for dropdown options to load by waiting for the visible field
        const visibleOption = field.locator('.rs__option', {
          hasText: 'Visible In Row',
        })
        await expect(visibleOption).toBeVisible()

        // Should hide restrictedInRow field
        await expect(field.locator('.rs__option', { hasText: 'Restricted In Row' })).toBeHidden()
      })

      test('should hide field with read: false inside collapsible in groupBy dropdown', async () => {
        await page.goto(readRestrictedUrl.list)
        const { groupByContainer } = await openGroupBy(page)

        const field = groupByContainer.locator('#group-by--field-select')
        await field.click()

        // Wait for dropdown options to load by waiting for the visible field
        const visibleOption = field.locator('.rs__option', {
          hasText: 'Visible In Collapsible',
        })
        await expect(visibleOption).toBeVisible()

        // Should hide restrictedInCollapsible field
        await expect(
          field.locator('.rs__option', { hasText: 'Restricted In Collapsible' }),
        ).toBeHidden()
      })

      test('should hide deeply nested field with read: false in groupBy dropdown', async () => {
        await page.goto(readRestrictedUrl.list)
        const { groupByContainer } = await openGroupBy(page)

        const field = groupByContainer.locator('#group-by--field-select')
        await field.click()

        // Wait for dropdown options to load by waiting for the visible field
        const visibleOption = field.locator('.rs__option', {
          hasText: 'Visible Metric',
        })
        await expect(visibleOption).toBeVisible()

        // Should hide metadata.analytics.restrictedMetric field
        await expect(field.locator('.rs__option', { hasText: 'Restricted Metric' })).toBeHidden()
      })

      test('should hide field with read: false inside unnamed tab in groupBy dropdown', async () => {
        await page.goto(readRestrictedUrl.list)
        const { groupByContainer } = await openGroupBy(page)

        const field = groupByContainer.locator('#group-by--field-select')
        await field.click()

        // Wait for dropdown options to load by waiting for the visible field
        const visibleOption = field.locator('.rs__option', {
          hasText: 'Public Tab > Public Data',
        })
        await expect(visibleOption).toBeVisible()

        // Should hide secretInPublicTab field
        await expect(
          field.locator('.rs__option', { hasText: 'Public Tab > Secret In Public Tab' }),
        ).toBeHidden()
      })

      test('should hide field with read: false inside named tab in groupBy dropdown', async () => {
        await page.goto(readRestrictedUrl.list)
        const { groupByContainer } = await openGroupBy(page)

        const field = groupByContainer.locator('#group-by--field-select')
        await field.click()

        // Wait for dropdown options to load by waiting for the visible field
        const visibleOption = field.locator('.rs__option', {
          hasText: 'Settings > Visible Setting',
        })
        await expect(visibleOption).toBeVisible()

        // Should hide restrictedSetting field
        await expect(
          field.locator('.rs__option', { hasText: 'Settings > Restricted Setting' }),
        ).toBeHidden()
      })

      test('should hide field with read: false inside row within group in groupBy dropdown', async () => {
        await page.goto(readRestrictedUrl.list)
        const { groupByContainer } = await openGroupBy(page)

        const field = groupByContainer.locator('#group-by--field-select')
        await field.click()

        // Wait for dropdown options to load by waiting for the visible field
        const visibleOption = field.locator('.rs__option', {
          hasText: 'Address > City',
        })
        await expect(visibleOption).toBeVisible()

        // Should hide secretPostalCode field
        await expect(
          field.locator('.rs__option', { hasText: 'Address > Secret Postal Code' }),
        ).toBeHidden()
      })

      test('should hide field with read: false inside group within collapsible in groupBy dropdown', async () => {
        await page.goto(readRestrictedUrl.list)
        const { groupByContainer } = await openGroupBy(page)

        const field = groupByContainer.locator('#group-by--field-select')
        await field.click()

        // Wait for dropdown options to load by waiting for the visible field
        const visibleOption = field.locator('.rs__option', {
          hasText: 'Advanced Settings > Advanced > Visible Advanced',
        })
        await expect(visibleOption).toBeVisible()

        // Should hide restrictedAdvanced field
        await expect(
          field.locator('.rs__option', {
            hasText: 'Advanced Settings > Advanced > Restricted Advanced',
          }),
        ).toBeHidden()
      })
    })

    describe('virtual fields', () => {
      test('should show virtual field in filter dropdown when collection has field with access control', async () => {
        await page.goto(readRestrictedUrl.list)
        await openListFilters(page, {})
        await page.locator('.where-builder__add-first-filter').click()

        const initialField = page.locator('.condition__field')
        await initialField.click()

        // Wait for dropdown options to load
        const visibleOption = initialField.locator('.rs__option', {
          hasText: 'Visible Top Level',
        })
        await expect(visibleOption).toBeVisible()

        // Virtual field should be visible in the filter dropdown
        const virtualFieldOption = initialField.locator('.rs__option', {
          hasText: 'Unrestricted Virtual Field Name',
        })
        await expect(virtualFieldOption).toBeVisible()
      })

      test('should show virtual field in groupBy dropdown when collection has field with access control', async () => {
        await page.goto(readRestrictedUrl.list)
        const { groupByContainer } = await openGroupBy(page)

        const field = groupByContainer.locator('#group-by--field-select')
        await field.click()

        // Wait for dropdown options to load
        const visibleOption = field.locator('.rs__option', {
          hasText: 'Visible Top Level',
        })
        await expect(visibleOption).toBeVisible()

        // Virtual field should be visible in the groupBy dropdown
        const virtualFieldOption = field.locator('.rs__option', {
          hasText: 'Unrestricted Virtual Field Name',
        })
        await expect(virtualFieldOption).toBeVisible()
      })

      test('should show nested fields within virtual group field in filter dropdown', async () => {
        await page.goto(readRestrictedUrl.list)
        await openListFilters(page, {})
        await page.locator('.where-builder__add-first-filter').click()

        const initialField = page.locator('.condition__field')
        await initialField.click()

        // Wait for dropdown options to load
        const visibleOption = initialField.locator('.rs__option', {
          hasText: 'Visible Top Level',
        })
        await expect(visibleOption).toBeVisible()

        // Nested fields within the virtual group should be visible
        const virtualGroupTitleOption = initialField.locator('.rs__option', {
          hasText: 'Unrestricted Virtual Group Info > Title',
        })
        await expect(virtualGroupTitleOption).toBeVisible()

        const virtualGroupDescriptionOption = initialField.locator('.rs__option', {
          hasText: 'Unrestricted Virtual Group Info > Description',
        })
        await expect(virtualGroupDescriptionOption).toBeVisible()
      })

      test('should show nested fields within virtual group field in groupBy dropdown', async () => {
        await page.goto(readRestrictedUrl.list)
        const { groupByContainer } = await openGroupBy(page)

        const field = groupByContainer.locator('#group-by--field-select')
        await field.click()

        // Wait for dropdown options to load
        const visibleOption = field.locator('.rs__option', {
          hasText: 'Visible Top Level',
        })
        await expect(visibleOption).toBeVisible()

        // Nested fields within the virtual group should be visible
        const virtualGroupTitleOption = field.locator('.rs__option', {
          hasText: 'Unrestricted Virtual Group Info > Title',
        })
        await expect(virtualGroupTitleOption).toBeVisible()

        const virtualGroupDescriptionOption = field.locator('.rs__option', {
          hasText: 'Unrestricted Virtual Group Info > Description',
        })
        await expect(virtualGroupDescriptionOption).toBeVisible()
      })

      test('should show virtual field nested inside group in filter dropdown', async () => {
        await page.goto(readRestrictedUrl.list)
        await openListFilters(page, {})
        await page.locator('.where-builder__add-first-filter').click()

        const initialField = page.locator('.condition__field')
        await initialField.click()

        // Wait for dropdown options to load
        const visibleOption = initialField.locator('.rs__option', {
          hasText: 'Visible Top Level',
        })
        await expect(visibleOption).toBeVisible()

        // Virtual field nested inside contactInfo group should be visible
        const nestedVirtualFieldOption = initialField.locator('.rs__option', {
          hasText: 'Contact Info > Virtual Contact Name',
        })
        await expect(nestedVirtualFieldOption).toBeVisible()
      })

      test('should show virtual field nested inside group in groupBy dropdown', async () => {
        await page.goto(readRestrictedUrl.list)
        const { groupByContainer } = await openGroupBy(page)

        const field = groupByContainer.locator('#group-by--field-select')
        await field.click()

        // Wait for dropdown options to load
        const visibleOption = field.locator('.rs__option', {
          hasText: 'Visible Top Level',
        })
        await expect(visibleOption).toBeVisible()

        // Virtual field nested inside contactInfo group should be visible
        const nestedVirtualFieldOption = field.locator('.rs__option', {
          hasText: 'Contact Info > Virtual Contact Name',
        })
        await expect(nestedVirtualFieldOption).toBeVisible()
      })

      test('should hide top-level virtual field with read: false in filter dropdown', async () => {
        await page.goto(readRestrictedUrl.list)
        await openListFilters(page, {})
        await page.locator('.where-builder__add-first-filter').click()

        const initialField = page.locator('.condition__field')
        await initialField.click()

        // Wait for dropdown options to load
        const visibleOption = initialField.locator('.rs__option', {
          hasText: 'Visible Top Level',
        })
        await expect(visibleOption).toBeVisible()

        // Restricted virtual field should be hidden (use exactText to avoid matching "Unrestricted...")
        await expect(
          initialField.locator('.rs__option', { hasText: exactText('Restricted Virtual Field') }),
        ).toBeHidden()
      })

      test('should hide top-level virtual field with read: false in groupBy dropdown', async () => {
        await page.goto(readRestrictedUrl.list)
        const { groupByContainer } = await openGroupBy(page)

        const field = groupByContainer.locator('#group-by--field-select')
        await field.click()

        // Wait for dropdown options to load
        const visibleOption = field.locator('.rs__option', {
          hasText: 'Visible Top Level',
        })
        await expect(visibleOption).toBeVisible()

        // Restricted virtual field should be hidden (use exactText to avoid matching "Unrestricted...")
        await expect(
          field.locator('.rs__option', { hasText: exactText('Restricted Virtual Field') }),
        ).toBeHidden()
      })

      test('should hide nested virtual field with read: false in filter dropdown', async () => {
        await page.goto(readRestrictedUrl.list)
        await openListFilters(page, {})
        await page.locator('.where-builder__add-first-filter').click()

        const initialField = page.locator('.condition__field')
        await initialField.click()

        // Wait for dropdown options to load
        const visibleOption = initialField.locator('.rs__option', {
          hasText: 'Visible Top Level',
        })
        await expect(visibleOption).toBeVisible()

        // Restricted virtual field nested in contactInfo should be hidden
        await expect(
          initialField.locator('.rs__option', {
            hasText: 'Contact Info > Restricted Virtual Contact Info',
          }),
        ).toBeHidden()
      })

      test('should hide nested virtual field with read: false in groupBy dropdown', async () => {
        await page.goto(readRestrictedUrl.list)
        const { groupByContainer } = await openGroupBy(page)

        const field = groupByContainer.locator('#group-by--field-select')
        await field.click()

        // Wait for dropdown options to load
        const visibleOption = field.locator('.rs__option', {
          hasText: 'Visible Top Level',
        })
        await expect(visibleOption).toBeVisible()

        // Restricted virtual field nested in contactInfo should be hidden
        await expect(
          field.locator('.rs__option', {
            hasText: 'Contact Info > Restricted Virtual Contact Info',
          }),
        ).toBeHidden()
      })
    })

    describe('default list view columns', () => {
      test('should not render column for top-level field with read: false by default', async () => {
        await page.goto(readRestrictedUrl.list)

        const table = page.locator('.table')
        await expect(table).toBeVisible()

        const thead = table.locator('thead')

        // Should not show restrictedTopLevel column header
        await expect(thead.locator('th', { hasText: 'Restricted Top Level' })).toBeHidden()

        // Should show visibleTopLevel column header
        await expect(thead.locator('th', { hasText: 'Visible Top Level' })).toBeVisible()
      })

      test('should not render column for nested field with read: false inside group by default', async () => {
        await page.goto(readRestrictedUrl.list)

        const table = page.locator('.table')
        await expect(table).toBeVisible()

        const thead = table.locator('thead')

        // Should not show secretPhone column header (nested in contactInfo group)
        await expect(thead.locator('th', { hasText: 'Contact Info > Secret Phone' })).toBeHidden()

        // Should show publicPhone column header (nested in contactInfo group)
        await expect(thead.locator('th', { hasText: 'Contact Info > Public Phone' })).toBeVisible()
      })

      test('should not render column for field with read: false inside named tab by default', async () => {
        await page.goto(readRestrictedUrl.list)

        const table = page.locator('.table')
        await expect(table).toBeVisible()

        const thead = table.locator('thead')

        // Should not show restrictedSetting column header (inside settings tab)
        await expect(thead.locator('th', { hasText: 'Settings > Restricted Setting' })).toBeHidden()
      })
    })
  })

  describe('blocks field access control', () => {
    test('should respect field-level access control for blocks fields', async () => {
      await page.goto(blocksFieldAccessUrl.create)
      await expect(page.locator('.doc-header__title')).toContainText('[Untitled]')

      // Editable blocks field should allow adding blocks
      const editableBlocksField = page.locator('#field-editableBlocks')
      await expect(editableBlocksField.locator('.blocks-field__drawer-toggler')).toBeEnabled()

      // Read-only blocks field should not allow adding blocks
      const readOnlyBlocksField = page.locator('#field-readOnlyBlocks')
      await expect(readOnlyBlocksField.locator('.blocks-field__drawer-toggler')).toBeDisabled()

      // Editable block references field should allow adding blocks
      const editableBlockRefsField = page.locator('#field-editableBlockRefs')
      await expect(editableBlockRefsField.locator('.blocks-field__drawer-toggler')).toBeEnabled()

      // Read-only block references field should not allow adding blocks
      const readOnlyBlockRefsField = page.locator('#field-readOnlyBlockRefs')
      await expect(readOnlyBlockRefsField.locator('.blocks-field__drawer-toggler')).toBeDisabled()

      // Tab read-only blocks field should not allow adding blocks
      const tabReadOnlyBlocksField = page.locator(
        '.field-type.tabs-field #field-tabReadOnlyTest__tabReadOnlyBlocks',
      )
      await expect(tabReadOnlyBlocksField.locator('.blocks-field__drawer-toggler')).toBeDisabled()

      // Tab read-only block references field should not allow adding blocks
      const tabReadOnlyBlockRefsField = page.locator(
        '.field-type.tabs-field #field-tabReadOnlyTest__tabReadOnlyBlockRefs',
      )
      await expect(
        tabReadOnlyBlockRefsField.locator('.blocks-field__drawer-toggler'),
      ).toBeDisabled()
    })

    test('should respect field-level access control for individual fields within blocks', async () => {
      // First create a document with blocks so we can test field editability
      const doc = await payload.create({
        collection: blocksFieldAccessSlug,
        data: {
          title: 'Test Document',
          editableBlocks: [
            {
              blockType: 'testBlock',
              title: 'Editable Block Title',
              content: 'Editable block content',
            },
          ],
          readOnlyBlocks: [
            {
              blockType: 'testBlock2',
              title: 'Read-Only Block Title',
              content: 'Read-only block content',
            },
          ],
          editableBlockRefs: [
            {
              blockType: 'titleblock',
              title: 'Editable Block Reference Title',
            },
          ],
          readOnlyBlockRefs: [
            {
              blockType: 'titleblock',
              title: 'Read-Only Block Reference Title',
            },
          ],
          tabReadOnlyTest: {
            tabReadOnlyBlocks: [
              {
                blockType: 'testBlock3',
                title: 'Tab Read-Only Block Title',
                content: 'Tab read-only block content',
              },
            ],
            tabReadOnlyBlockRefs: [
              {
                blockType: 'titleblock',
                title: 'Tab Read-Only Block Reference Title',
              },
            ],
          },
        },
      })

      await page.goto(blocksFieldAccessUrl.edit(doc.id))
      await expect(page.locator('.doc-header__title')).toContainText('ID: ')

      // Editable blocks - fields should be editable
      await expect(page.locator('#field-editableBlocks__0__title')).toBeEnabled()
      await expect(page.locator('#field-editableBlocks__0__content')).toBeEnabled()

      // Read-only blocks - fields should not be editable
      await expect(page.locator('#field-readOnlyBlocks__0__title')).toBeDisabled()
      await expect(page.locator('#field-readOnlyBlocks__0__content')).toBeDisabled()

      // Editable block references - fields should be editable
      await expect(page.locator('#field-editableBlockRefs__0__title')).toBeEnabled()

      // Read-only block references - fields should not be editable
      await expect(page.locator('#field-readOnlyBlockRefs__0__title')).toBeDisabled()

      // Tab read-only blocks - fields should not be editable
      await expect(
        page.locator('#field-tabReadOnlyTest__tabReadOnlyBlocks__0__title'),
      ).toBeDisabled()
      await expect(
        page.locator('#field-tabReadOnlyTest__tabReadOnlyBlocks__0__content'),
      ).toBeDisabled()

      // Tab read-only block references - fields should not be editable
      await expect(
        page.locator('#field-tabReadOnlyTest__tabReadOnlyBlockRefs__0__title'),
      ).toBeDisabled()
    })
  })

  describe('trash access control', () => {
    describe('differentiated trash collection - regular users can trash but not permanently delete', () => {
      const createdDocIds: (number | string)[] = []

      afterEach(async () => {
        for (const id of createdDocIds) {
          await payload.delete({
            collection: differentiatedTrashSlug,
            id,
            trash: true,
          })
        }
        createdDocIds.length = 0
      })

      describe('as admin user', () => {
        beforeAll(async () => {
          await login({
            data: {
              email: devUser.email,
              password: devUser.password,
            },
            page,
            serverURL,
          })
        })

        test('should show delete button in doc controls dropdown', async () => {
          const doc = await payload.create({
            collection: differentiatedTrashSlug,
            data: { title: 'Test Doc', _status: 'published' },
          })
          createdDocIds.push(doc.id)

          await page.goto(differentiatedTrashUrl.edit(doc.id))

          const threeDotMenu = page.locator('.doc-controls__popup')
          await expect(threeDotMenu).toBeVisible()
          await threeDotMenu.click()

          await expect(page.locator('.popup__content #action-delete')).toBeVisible()
        })

        test('should show delete forever checkbox in delete modal', async () => {
          const doc = await payload.create({
            collection: differentiatedTrashSlug,
            data: { title: 'Test Doc', _status: 'published' },
          })
          createdDocIds.push(doc.id)

          await page.goto(differentiatedTrashUrl.edit(doc.id))

          const threeDotMenu = page.locator('.doc-controls__popup')
          await expect(threeDotMenu).toBeVisible()
          await threeDotMenu.click()

          await page.locator('.popup__content #action-delete').click()
          await expect(page.locator('#delete-forever')).toBeVisible()
        })

        test('should allow permanently deleting a doc', async () => {
          const doc = await payload.create({
            collection: differentiatedTrashSlug,
            data: { title: 'Test Doc For Perma Delete', _status: 'published' },
          })
          // Don't add to createdDocIds since we're permanently deleting it

          await page.goto(differentiatedTrashUrl.edit(doc.id))

          const threeDotMenu = page.locator('.doc-controls__popup')
          await expect(threeDotMenu).toBeVisible()
          await threeDotMenu.click()

          await page.locator('.popup__content #action-delete').click()
          await page.locator('#delete-forever').check()
          await page.locator('.delete-document #confirm-action').click()

          await expect(page.locator('.payload-toast-container .toast-success')).toHaveText(
            `Differentiated Trash "Test Doc For Perma Delete" successfully deleted.`,
          )
        })

        test('should show permanently delete button and allow permanently deleting when viewing trashed doc', async () => {
          // Create a trashed document
          const doc = await payload.create({
            collection: differentiatedTrashSlug,
            data: {
              title: 'Admin Trashed Doc View Test',
              _status: 'published',
              deletedAt: new Date().toISOString(),
            },
          })
          // Don't add to createdDocIds since we're permanently deleting it

          // Navigate to the trashed document edit view
          await page.goto(differentiatedTrashUrl.trashEdit(doc.id))

          // Admin should see the permanently delete button
          const permanentlyDeleteButton = page.locator('#action-permanently-delete')
          await expect(permanentlyDeleteButton).toBeVisible()

          // Restore button should also be visible
          const restoreButton = page.locator('#action-restore')
          await expect(restoreButton).toBeVisible()

          // Click permanently delete and confirm
          await permanentlyDeleteButton.click()
          await expect(page.locator(`#perma-delete-${doc.id}`)).toBeVisible()
          await page.locator(`#perma-delete-${doc.id} #confirm-action`).click()

          // Verify success toast
          await expect(page.locator('.payload-toast-container .toast-success')).toHaveText(
            `Differentiated Trash "Admin Trashed Doc View Test" successfully deleted.`,
          )

          // Verify URL changed to trash list view
          await expect(page).toHaveURL(new RegExp(`${differentiatedTrashUrl.trash}(\\?|$)`))
        })
      })

      describe('as regular user', () => {
        beforeAll(async () => {
          await login({
            page,
            serverURL,
            data: {
              email: regularUserEmail,
              password: 'test',
            },
          })
        })

        afterAll(async () => {
          // Log back in as admin for other tests
          await login({ page, serverURL })
        })

        test('should show delete button in doc controls dropdown', async () => {
          const doc = await payload.create({
            collection: differentiatedTrashSlug,
            data: { title: 'Test Doc', _status: 'published' },
          })
          createdDocIds.push(doc.id)

          await page.goto(differentiatedTrashUrl.edit(doc.id))

          const threeDotMenu = page.locator('.doc-controls__popup')
          await expect(threeDotMenu).toBeVisible()
          await threeDotMenu.click()

          await expect(page.locator('.popup__content #action-delete')).toBeVisible()
        })

        test('should hide delete forever checkbox in delete modal since user cannot permanently delete', async () => {
          const doc = await payload.create({
            collection: differentiatedTrashSlug,
            data: { title: 'Test Doc', _status: 'published' },
          })
          createdDocIds.push(doc.id)

          await page.goto(differentiatedTrashUrl.edit(doc.id))

          const threeDotMenu = page.locator('.doc-controls__popup')
          await expect(threeDotMenu).toBeVisible()
          await threeDotMenu.click()

          await page.locator('.popup__content #action-delete').click()
          // The checkbox should be hidden for regular users
          // because they can trash but not permanently delete
          await expect(page.locator('#delete-forever')).toBeHidden()
        })

        test('should allow trashing a doc', async () => {
          const doc = await payload.create({
            collection: differentiatedTrashSlug,
            data: { title: 'Test Doc For Trash', _status: 'published' },
          })
          createdDocIds.push(doc.id)

          await page.goto(differentiatedTrashUrl.edit(doc.id))

          const threeDotMenu = page.locator('.doc-controls__popup')
          await expect(threeDotMenu).toBeVisible()
          await threeDotMenu.click()

          await page.locator('.popup__content #action-delete').click()
          await page.locator('.delete-document #confirm-action').click()

          await expect(page.locator('.payload-toast-container .toast-success')).toHaveText(
            `Differentiated Trash "Test Doc For Trash" moved to trash.`,
          )
        })

        test('should hide permanently delete button but show restore button when viewing trashed doc', async () => {
          // Create a trashed document
          const doc = await payload.create({
            collection: differentiatedTrashSlug,
            data: {
              title: 'Trashed Doc View Test',
              _status: 'published',
              deletedAt: new Date().toISOString(),
            },
          })
          createdDocIds.push(doc.id)

          // Navigate to the trashed document edit view
          await page.goto(differentiatedTrashUrl.trashEdit(doc.id))

          // Permanently delete button should NOT be visible (user can only trash, not permanently delete)
          const permanentlyDeleteButton = page.locator('#action-permanently-delete')
          await expect(permanentlyDeleteButton).toBeHidden()

          // Restore button SHOULD be visible (user has save/update permission)
          const restoreButton = page.locator('#action-restore')
          await expect(restoreButton).toBeVisible()

          // Click restore and confirm
          await restoreButton.click()
          await expect(page.locator(`#restore-${doc.id}`)).toBeVisible()
          await page.locator(`#restore-${doc.id} #confirm-action`).click()

          // Verify success toast
          await expect(page.locator('.payload-toast-container .toast-success')).toHaveText(
            `Differentiated Trash "Trashed Doc View Test" successfully restored.`,
          )

          // Verify URL changed to regular edit view (not trash view)
          await expect(page).toHaveURL(differentiatedTrashUrl.edit(doc.id))
        })
      })
    })

    describe('restricted trash collection - only admins can delete', () => {
      const createdDocIds: (number | string)[] = []

      afterEach(async () => {
        for (const id of createdDocIds) {
          await payload.delete({
            collection: restrictedTrashSlug,
            id,
            trash: true,
          })
        }
        createdDocIds.length = 0
      })

      describe('as admin user', () => {
        beforeAll(async () => {
          await login({ page, serverURL })
        })

        test('should show delete button in doc controls dropdown', async () => {
          const doc = await payload.create({
            collection: restrictedTrashSlug,
            data: { title: 'Test Doc', _status: 'published' },
          })
          createdDocIds.push(doc.id)

          await page.goto(restrictedTrashUrl.edit(doc.id))

          const threeDotMenu = page.locator('.doc-controls__popup')
          await expect(threeDotMenu).toBeVisible()
          await threeDotMenu.click()

          await expect(page.locator('.popup__content #action-delete')).toBeVisible()
        })

        test('should show delete forever checkbox in delete modal', async () => {
          const doc = await payload.create({
            collection: restrictedTrashSlug,
            data: { title: 'Test Doc', _status: 'published' },
          })
          createdDocIds.push(doc.id)

          await page.goto(restrictedTrashUrl.edit(doc.id))

          const threeDotMenu = page.locator('.doc-controls__popup')
          await expect(threeDotMenu).toBeVisible()
          await threeDotMenu.click()

          await page.locator('.popup__content #action-delete').click()
          await expect(page.locator('#delete-forever')).toBeVisible()
        })

        test('should allow trashing a doc', async () => {
          const doc = await payload.create({
            collection: restrictedTrashSlug,
            data: { title: 'Test Doc For Trash', _status: 'published' },
          })
          createdDocIds.push(doc.id)

          await page.goto(restrictedTrashUrl.edit(doc.id))

          const threeDotMenu = page.locator('.doc-controls__popup')
          await expect(threeDotMenu).toBeVisible()
          await threeDotMenu.click()

          await page.locator('.popup__content #action-delete').click()
          await page.locator('.delete-document #confirm-action').click()

          await expect(page.locator('.payload-toast-container .toast-success')).toHaveText(
            `Restricted Trash "Test Doc For Trash" moved to trash.`,
          )
        })

        test('should allow permanently deleting a doc', async () => {
          const doc = await payload.create({
            collection: restrictedTrashSlug,
            data: { title: 'Test Doc For Perma Delete', _status: 'published' },
          })
          // Don't add to createdDocIds since we're permanently deleting it

          await page.goto(restrictedTrashUrl.edit(doc.id))

          const threeDotMenu = page.locator('.doc-controls__popup')
          await expect(threeDotMenu).toBeVisible()
          await threeDotMenu.click()

          await page.locator('.popup__content #action-delete').click()
          await page.locator('#delete-forever').check()
          await page.locator('.delete-document #confirm-action').click()

          await expect(page.locator('.payload-toast-container .toast-success')).toHaveText(
            `Restricted Trash "Test Doc For Perma Delete" successfully deleted.`,
          )
        })
      })

      describe('as regular user', () => {
        beforeAll(async () => {
          await login({
            page,
            serverURL,
            data: {
              email: regularUserEmail,
              password: 'test',
            },
          })
        })

        afterAll(async () => {
          // Log back in as admin for other tests
          await login({ page, serverURL })
        })

        test('should not show doc controls popup when user has no delete access', async () => {
          const doc = await payload.create({
            collection: restrictedTrashSlug,
            data: { title: 'Test Doc', _status: 'published' },
          })
          createdDocIds.push(doc.id)

          await page.goto(restrictedTrashUrl.edit(doc.id))

          const threeDotMenu = page.locator('.doc-controls__popup')
          await expect(threeDotMenu).toBeVisible()
          await threeDotMenu.click()

          const deleteButton = page.locator('.popup__content #action-delete')
          await expect(deleteButton).toBeHidden()
        })
      })
    })

    describe('list view bulk delete', () => {
      describe('differentiated trash collection', () => {
        const createdDocIds: (number | string)[] = []

        afterEach(async () => {
          for (const id of createdDocIds) {
            await payload.delete({
              collection: differentiatedTrashSlug,
              id,
              trash: true,
            })
          }
          createdDocIds.length = 0
        })

        describe('as admin user', () => {
          beforeAll(async () => {
            await login({ page, serverURL })
          })

          test('should show delete button when selecting docs in list view', async () => {
            const doc = await payload.create({
              collection: differentiatedTrashSlug,
              data: { title: 'Bulk Test Doc 1', _status: 'published' },
            })
            createdDocIds.push(doc.id)

            await page.goto(differentiatedTrashUrl.list)

            // Select a row
            const checkbox = page.locator('.table tbody tr .select-row__checkbox').first()
            await checkbox.click()

            // Delete button should be visible in bulk actions
            const deleteButton = page.locator('.list-selection button', { hasText: 'Delete' })
            await expect(deleteButton).toBeVisible()
          })
        })

        describe('as regular user', () => {
          beforeAll(async () => {
            await login({
              page,
              serverURL,
              data: {
                email: regularUserEmail,
                password: 'test',
              },
            })
          })

          afterAll(async () => {
            await login({ page, serverURL })
          })

          test('should show delete button when selecting docs in list view (user can trash)', async () => {
            const doc = await payload.create({
              collection: differentiatedTrashSlug,
              data: { title: 'Bulk Test Doc Regular User', _status: 'published' },
            })
            createdDocIds.push(doc.id)

            await page.goto(differentiatedTrashUrl.list)

            // Select a row
            const checkbox = page.locator('.table tbody tr .select-row__checkbox').first()
            await checkbox.click()

            // Delete button should be visible because user can trash (even if they can't permanently delete)
            const deleteButton = page.locator('.list-selection button', { hasText: 'Delete' })
            await expect(deleteButton).toBeVisible()
          })

          test('should hide delete permanently checkbox in bulk delete modal', async () => {
            const doc = await payload.create({
              collection: differentiatedTrashSlug,
              data: { title: 'Bulk Test Doc Regular User 2', _status: 'published' },
            })
            createdDocIds.push(doc.id)

            await page.goto(differentiatedTrashUrl.list)

            // Select a row
            const checkbox = page.locator('.table tbody tr .select-row__checkbox').first()
            await checkbox.click()

            // Click delete button
            const deleteButton = page.locator('.list-selection button', { hasText: 'Delete' })
            await deleteButton.click()

            // The delete permanently checkbox should be hidden for regular users
            await expect(page.locator('#delete-forever')).toBeHidden()
          })
        })
      })

      describe('restricted trash collection', () => {
        const createdDocIds: (number | string)[] = []

        afterEach(async () => {
          for (const id of createdDocIds) {
            await payload.delete({
              collection: restrictedTrashSlug,
              id,
              trash: true,
            })
          }
          createdDocIds.length = 0
        })

        describe('as admin user', () => {
          beforeAll(async () => {
            await login({ page, serverURL })
          })

          test('should show delete button when selecting docs in list view', async () => {
            const doc = await payload.create({
              collection: restrictedTrashSlug,
              data: { title: 'Restricted Bulk Test Doc', _status: 'published' },
            })
            createdDocIds.push(doc.id)

            await page.goto(restrictedTrashUrl.list)

            // Select a row
            const checkbox = page.locator('.table tbody tr .select-row__checkbox').first()
            await checkbox.click()

            // Delete button should be visible for admin
            const deleteButton = page.locator('.list-selection button', { hasText: 'Delete' })
            await expect(deleteButton).toBeVisible()
          })
        })

        describe('as regular user', () => {
          beforeAll(async () => {
            await login({
              page,
              serverURL,
              data: {
                email: regularUserEmail,
                password: 'test',
              },
            })
          })

          afterAll(async () => {
            await login({ page, serverURL })
          })

          test('should not show delete button when selecting docs in list view (user cannot trash or delete)', async () => {
            const doc = await payload.create({
              collection: restrictedTrashSlug,
              data: { title: 'Restricted Bulk Test Doc Regular User', _status: 'published' },
            })
            createdDocIds.push(doc.id)

            await page.goto(restrictedTrashUrl.list)

            // Select a row
            const checkbox = page.locator('.table tbody tr .select-row__checkbox').first()
            await checkbox.click()

            // Delete button should NOT be visible because user cannot trash or permanently delete
            const deleteButton = page.locator('.list-selection button', { hasText: 'Delete' })
            await expect(deleteButton).toBeHidden()
          })
        })
      })
    })

    describe('trash view bulk delete (permanent delete only)', () => {
      describe('differentiated trash collection', () => {
        const createdDocIds: (number | string)[] = []

        afterEach(async () => {
          for (const id of createdDocIds) {
            try {
              await payload.delete({
                collection: differentiatedTrashSlug,
                id,
                trash: true,
              })
            } catch (_e) {
              // Document may already be deleted
            }
          }
          createdDocIds.length = 0
        })

        describe('as admin user', () => {
          beforeAll(async () => {
            await login({ page, serverURL })
          })

          test('should show delete button when selecting docs in trash view', async () => {
            // Create a trashed document
            const doc = await payload.create({
              collection: differentiatedTrashSlug,
              data: {
                title: 'Trash View Bulk Test Admin',
                _status: 'published',
                deletedAt: new Date().toISOString(),
              },
            })
            createdDocIds.push(doc.id)

            await page.goto(`${differentiatedTrashUrl.list}/trash`)

            // Wait for table to load
            await expect(page.locator('.table tbody tr').first()).toBeVisible()

            // Select a row
            const checkbox = page.locator('.table tbody tr .select-row__checkbox').first()
            await checkbox.click()

            // Delete button should be visible for admin (they can permanently delete)
            const deleteButton = page.locator('.list-selection button', { hasText: 'Delete' })
            await expect(deleteButton).toBeVisible()
          })
        })

        describe('as regular user', () => {
          beforeAll(async () => {
            await login({
              page,
              serverURL,
              data: {
                email: regularUserEmail,
                password: 'test',
              },
            })
          })

          afterAll(async () => {
            await login({ page, serverURL })
          })

          test('should NOT show delete button when selecting docs in trash view (user can only trash, not permanently delete)', async () => {
            // Create a trashed document
            const doc = await payload.create({
              collection: differentiatedTrashSlug,
              data: {
                title: 'Trash View Bulk Test Regular',
                _status: 'published',
                deletedAt: new Date().toISOString(),
              },
            })
            createdDocIds.push(doc.id)

            await page.goto(`${differentiatedTrashUrl.list}/trash`)

            // Wait for table to load
            await expect(page.locator('.table tbody tr').first()).toBeVisible()

            // Select a row
            const checkbox = page.locator('.table tbody tr .select-row__checkbox').first()
            await checkbox.click()

            // Delete button should NOT be visible in trash view because
            // regular users can only trash (soft delete), not permanently delete
            const deleteButton = page.locator('.list-selection button', { hasText: 'Delete' })
            await expect(deleteButton).toBeHidden()
          })
        })
      })
    })
  })
})

async function createDoc(data: any): Promise<Record<string, unknown> & TypeWithID> {
  return payload.create({
    collection: slug,
    data,
  }) as any as Promise<Record<string, unknown> & TypeWithID>
}
