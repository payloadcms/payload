import type { BrowserContext, Page } from '@playwright/test'
import type { TypeWithID } from 'payload'

import { expect, test } from '@playwright/test'
import { devUser } from 'credentials.js'
import path from 'path'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../helpers/sdk/index.js'
import type {
  Config,
  NonAdminUser,
  ReadOnlyCollection,
  RestrictedVersion,
} from './payload-types.js'

import {
  closeNav,
  ensureCompilationIsDone,
  exactText,
  getRoutes,
  initPageConsoleErrorCatch,
  login,
  openDocControls,
  openNav,
  saveDocAndAssert,
} from '../helpers.js'
import { AdminUrlUtil } from '../helpers/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../helpers/initPayloadE2ENoConfig.js'
import { POLL_TOPASS_TIMEOUT, TEST_TIMEOUT_LONG } from '../playwright.config.js'
import {
  createNotUpdateCollectionSlug,
  disabledSlug,
  docLevelAccessSlug,
  fullyRestrictedSlug,
  noAdminAccessEmail,
  nonAdminUserEmail,
  nonAdminUserSlug,
  readNotUpdateGlobalSlug,
  readOnlyGlobalSlug,
  readOnlySlug,
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

const { beforeAll, describe } = test
let payload: PayloadTestSDK<Config>
describe('access control', () => {
  let page: Page
  let url: AdminUrlUtil
  let restrictedUrl: AdminUrlUtil
  let unrestrictedURL: AdminUrlUtil
  let readOnlyCollectionUrl: AdminUrlUtil
  let readOnlyGlobalUrl: AdminUrlUtil
  let restrictedVersionsUrl: AdminUrlUtil
  let userRestrictedCollectionURL: AdminUrlUtil
  let userRestrictedGlobalURL: AdminUrlUtil
  let disabledFields: AdminUrlUtil
  let serverURL: string
  let context: BrowserContext
  let logoutURL: string

  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    ;({ payload, serverURL } = await initPayloadE2ENoConfig<Config>({ dirname }))

    url = new AdminUrlUtil(serverURL, slug)
    restrictedUrl = new AdminUrlUtil(serverURL, fullyRestrictedSlug)
    unrestrictedURL = new AdminUrlUtil(serverURL, unrestrictedSlug)
    readOnlyCollectionUrl = new AdminUrlUtil(serverURL, readOnlySlug)
    readOnlyGlobalUrl = new AdminUrlUtil(serverURL, readOnlySlug)
    restrictedVersionsUrl = new AdminUrlUtil(serverURL, restrictedVersionsSlug)
    userRestrictedCollectionURL = new AdminUrlUtil(serverURL, userRestrictedCollectionSlug)
    userRestrictedGlobalURL = new AdminUrlUtil(serverURL, userRestrictedGlobalSlug)
    disabledFields = new AdminUrlUtil(serverURL, disabledSlug)

    context = await browser.newContext()
    page = await context.newPage()
    initPageConsoleErrorCatch(page)

    await login({ page, serverURL })
    await ensureCompilationIsDone({ page, serverURL })

    const {
      admin: {
        routes: { logout: logoutRoute },
      },
      routes: { admin: adminRoute },
    } = getRoutes({})

    logoutURL = `${serverURL}${adminRoute}${logoutRoute}`
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
      // await expect(page.locator('.nav >> a:has-text("Restricteds")')).toHaveCount(0)
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
      await page.waitForURL(createNotUpdateURL.create)
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
      const documentDrawer = page.locator(
        `[id^=drawer_1_doc-drawer__${createNotUpdateCollectionSlug}]`,
      )
      await expect(documentDrawer).toBeVisible()
      await expect(documentDrawer.locator('#action-save')).toBeVisible()
      await documentDrawer.locator('#field-name').fill('name')
      await expect(documentDrawer.locator('#field-name')).toHaveValue('name')
      await documentDrawer.locator('#action-save').click()
      await expect(page.locator('.payload-toast-container')).toContainText('successfully')
      await expect(documentDrawer.locator('#action-save')).toBeHidden()
      await expect(documentDrawer.locator('#field-name')).toBeDisabled()
    })
  })

  describe('global — read but not update', () => {
    test('should not show edit button', async () => {
      const createNotUpdateURL = new AdminUrlUtil(serverURL, readNotUpdateGlobalSlug)
      await page.goto(createNotUpdateURL.global(readNotUpdateGlobalSlug))
      await page.waitForURL(createNotUpdateURL.global(readNotUpdateGlobalSlug))
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
        const documentDrawer = page.locator('[id^=drawer_1_doc-drawer__user-restricted-collection]')
        await expect(documentDrawer).toBeVisible()
        await documentDrawer.locator('#field-name').fill('anonymous@email.com')
        await documentDrawer.locator('#action-save').click()
        await expect(page.locator('.payload-toast-container')).toContainText('successfully')
        await expect(documentDrawer.locator('#field-name')).toBeDisabled()
        await documentDrawer.locator('button.doc-drawer__header-close').click()
        await expect(documentDrawer).toBeHidden()
        await addDocButton.click()
        const documentDrawer2 = page.locator(
          '[id^=drawer_1_doc-drawer__user-restricted-collection]',
        )
        await expect(documentDrawer2).toBeVisible()
        await documentDrawer2.locator('#field-name').fill('dev@payloadcms.com')
        await documentDrawer2.locator('#action-save').click()
        await expect(page.locator('.payload-toast-container')).toContainText('successfully')
        await expect(documentDrawer2.locator('#field-name')).toBeEnabled()
      })
    })

    describe('global', () => {
      test('should restrict update access based on document field', async () => {
        await page.goto(userRestrictedGlobalURL.global(userRestrictedGlobalSlug))
        await page.waitForURL(userRestrictedGlobalURL.global(userRestrictedGlobalSlug))
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
        await page.waitForURL(userRestrictedGlobalURL.global(userRestrictedGlobalSlug))
        await expect(page.locator('#field-name')).toBeDisabled()
        await expect(page.locator('#action-save')).toBeHidden()
      })

      test('should restrict access based on user settings', async () => {
        const url = `${serverURL}/admin/globals/settings`
        await page.goto(url)
        await expect.poll(() => page.url(), { timeout: POLL_TOPASS_TIMEOUT }).toContain(url)
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
        collection: restrictedVersionsSlug,
        data: {
          name: 'name',
        },
      })
    })

    test('versions sidebar should not show', async () => {
      await page.goto(restrictedVersionsUrl.edit(existingDoc.id))
      await expect(page.locator('.versions-count')).toBeHidden()
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

      // validate that the text input is disabled because the field is "locked"
      const isDisabled = page.locator('#field-approvedTitle')
      await expect(isDisabled).toBeDisabled()
    })

    test('should disable operation based on document data', async () => {
      await page.goto(docLevelAccessURL.edit(existingDoc.id))

      // validate that the delete action is not displayed
      await openDocControls(page)
      const deleteAction = page.locator('#action-delete')
      await expect(deleteAction).toBeHidden()

      await page.locator('#field-approvedForRemoval').check()
      await saveDocAndAssert(page)

      await openDocControls(page)
      const deleteAction2 = page.locator('#action-delete')
      await expect(deleteAction2).toBeVisible()
    })
  })

  describe('admin access', () => {
    test('should block admin access to admin user', async () => {
      const adminURL = `${serverURL}/admin`
      await page.goto(adminURL)
      await page.waitForURL(adminURL)

      await expect(page.locator('.dashboard')).toBeVisible()

      await page.goto(logoutURL)
      await page.waitForURL(logoutURL)

      await login({
        data: {
          email: noAdminAccessEmail,
          password: 'test',
        },
        page,
        serverURL,
      })

      await expect(page.locator('.next-error-h1')).toBeVisible()

      await page.goto(logoutURL)
      await page.waitForURL(logoutURL)

      // Log back in for the next test
      await login({
        data: {
          email: devUser.email,
          password: devUser.password,
        },
        page,
        serverURL,
      })
    })

    test('should block admin access to non-admin user', async () => {
      const adminURL = `${serverURL}/admin`
      await page.goto(adminURL)
      await page.waitForURL(adminURL)

      await expect(page.locator('.dashboard')).toBeVisible()

      await page.goto(logoutURL)
      await page.waitForURL(logoutURL)

      const nonAdminUser: {
        token?: string
      } & NonAdminUser = await payload.login({
        collection: nonAdminUserSlug,
        data: {
          email: nonAdminUserEmail,
          password: devUser.password,
        },
      })

      await context.addCookies([
        {
          name: 'payload-token',
          url: serverURL,
          value: nonAdminUser.token,
        },
      ])

      await page.goto(adminURL)
      await page.waitForURL(adminURL)

      await expect(page.locator('.next-error-h1')).toBeVisible()
    })
  })

  describe('read-only from access control', () => {
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
      await page.locator('#field-array button').click()
      await page.locator('#field-array__0__text').fill('array row 0')

      await saveDocAndAssert(page)

      await expect(page.locator('#field-group__text')).toBeDisabled()
      await expect(page.locator('#field-namedTab__text')).toBeDisabled()
      await page.locator('.tabs-field__tab-button').nth(1).click()
      await expect(page.locator('#field-unnamedTab')).toBeDisabled()
      await expect(page.locator('#field-array__0__text')).toBeDisabled()
    })
  })
})

async function createDoc(data: any): Promise<Record<string, unknown> & TypeWithID> {
  return payload.create({
    collection: slug,
    data,
  }) as any as Promise<Record<string, unknown> & TypeWithID>
}
