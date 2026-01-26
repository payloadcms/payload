import type { Page } from '@playwright/test'
import type { Payload } from 'payload'

import { expect, test } from '@playwright/test'
import { AdminUrlUtil } from 'helpers/adminUrlUtil.js'
import { addArrayRow, removeArrayRow } from 'helpers/e2e/fields/array/index.js'
import path from 'path'
import { formatAdminURL, wait } from 'payload/shared'
import { fileURLToPath } from 'url'

import {
  ensureCompilationIsDone,
  getRoutes,
  initPageConsoleErrorCatch,
  saveDocAndAssert,
} from '../helpers.js'
import { initPayloadE2ENoConfig } from '../helpers/initPayloadE2ENoConfig.js'
import { TEST_TIMEOUT_LONG } from '../playwright.config.js'
import { collectionSlugs } from './shared.js'

const { afterAll, beforeAll, describe } = test
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

describe('Field Error States', () => {
  let serverURL: string
  let page: Page
  let usersURL: AdminUrlUtil
  let validateDraftsOff: AdminUrlUtil
  let validateDraftsOn: AdminUrlUtil
  let validateDraftsOnAutosave: AdminUrlUtil
  let prevValue: AdminUrlUtil
  let prevValueRelation: AdminUrlUtil
  let errorFieldsURL: AdminUrlUtil
  let adminRoute: string
  let payload: Payload

  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    ;({ serverURL, payload } = await initPayloadE2ENoConfig({ dirname }))
    usersURL = new AdminUrlUtil(serverURL, collectionSlugs.users!)
    validateDraftsOff = new AdminUrlUtil(serverURL, collectionSlugs.validateDraftsOff!)
    validateDraftsOn = new AdminUrlUtil(serverURL, collectionSlugs.validateDraftsOn!)
    validateDraftsOnAutosave = new AdminUrlUtil(
      serverURL,
      collectionSlugs.validateDraftsOnAutosave!,
    )
    prevValue = new AdminUrlUtil(serverURL, collectionSlugs.prevValue!)
    prevValueRelation = new AdminUrlUtil(serverURL, collectionSlugs.prevValueRelation!)
    errorFieldsURL = new AdminUrlUtil(serverURL, collectionSlugs.errorFields!)

    const {
      routes: { admin: adminRouteFromConfig },
    } = getRoutes({})
    adminRoute = adminRouteFromConfig
    const context = await browser.newContext()
    page = await context.newPage()
    initPageConsoleErrorCatch(page)

    await ensureCompilationIsDone({ page, serverURL })
  })

  test('Remove row should remove error states from parent fields', async () => {
    await page.goto(
      formatAdminURL({ adminRoute, path: '/collections/error-fields/create', serverURL }),
    )

    // add parent array
    await addArrayRow(page, { fieldName: 'parentArray' })

    // add first child array
    await page.locator('#parentArray-row-0 .collapsible__content .array-field__add-row').click()
    await page.locator('#field-parentArray__0__childArray__0__childArrayText').focus()
    await page.keyboard.type('T1')

    // add second child array
    await page.locator('#parentArray-row-0 .collapsible__content .array-field__add-row').click()
    await page.locator('#field-parentArray__0__childArray__1__childArrayText').focus()
    await page.keyboard.type('T2')

    // add third child array
    await page.locator('#parentArray-row-0 .collapsible__content .array-field__add-row').click()

    await removeArrayRow(page, {
      fieldName: 'parentArray__0__childArray',
      rowIndex: 2,
    })

    await page.locator('#action-save').click()

    const errorPill = await page.waitForSelector(
      '#parentArray-row-0 > .collapsible > .collapsible__toggle-wrap .array-field__row-error-pill',
      { state: 'hidden', timeout: 500 },
    )

    expect(errorPill).toBeNull()
  })

  describe('draft validations', () => {
    test('should not validate drafts by default', async () => {
      await page.goto(validateDraftsOff.create)
      await saveDocAndAssert(page, '#action-save-draft')
    })

    test('should validate drafts when enabled', async () => {
      await page.goto(validateDraftsOn.create)
      await saveDocAndAssert(page, '#action-save-draft', 'error')
    })

    test('should show validation errors when validate and autosave are enabled', async () => {
      await page.goto(validateDraftsOnAutosave.create)
      await page.locator('#field-title').fill('valid')
      await saveDocAndAssert(page)
      await page.locator('#field-title').fill('')
      await saveDocAndAssert(page, '#action-save', 'error')
    })

    test('should keep save draft button enabled after validation failure on update', async () => {
      await page.goto(validateDraftsOn.create)
      await page.locator('#field-title').fill('Test Document')
      await page.click('#action-save-draft')
      await expect(page.locator('.payload-toast-container .toast-success')).toBeVisible()

      await page.waitForURL(/\/admin\/collections\/validate-drafts-on\/[a-zA-Z0-9]+/)

      await page.locator('#field-title').fill('Modified Document')
      await page.locator('#field-failValidation').check()
      await page.locator('#field-validatedField').fill('This will fail')

      await saveDocAndAssert(page, '#action-save-draft', 'error')

      const saveDraftButton = page.locator('#action-save-draft')
      await expect(saveDraftButton).toBeEnabled()

      await saveDocAndAssert(page, '#action-save-draft', 'error')
    })

    test('should keep save draft button enabled after successful save when form is modified again', async () => {
      await page.goto(validateDraftsOn.create)
      await page.locator('#field-title').fill('Test Document')
      await page.click('#action-save-draft')
      await expect(page.locator('.payload-toast-container .toast-success')).toBeVisible()

      await page.locator('#field-title').fill('Modified Document')

      const saveDraftButton = page.locator('#action-save-draft')
      await expect(saveDraftButton).toBeEnabled()
    })
  })

  describe('previous values', () => {
    test('should pass previous value into validate function', async () => {
      // save original
      await page.goto(prevValue.create)
      await page.locator('#field-title').fill('original value')
      await saveDocAndAssert(page)
      await page.locator('#field-title').fill('original value 2')
      await saveDocAndAssert(page)
      await wait(500)

      // create relation to doc
      await page.goto(prevValueRelation.create)
      await page.locator('#field-previousValueRelation .react-select').click()
      await page.locator('#field-previousValueRelation .rs__option').first().click()
      await saveDocAndAssert(page)

      // go back to doc
      await page.goto(prevValue.list)
      await page.locator('.row-1 a').click()
      await page.locator('#field-description').fill('some description')
      await saveDocAndAssert(page)
      await page.locator('#field-title').fill('changed')
      await saveDocAndAssert(page, '#action-save', 'error')

      // ensure value is the value before relationship association
      await page.reload()
      await expect(page.locator('#field-title')).toHaveValue('original value 2')
    })
  })

  describe('error field types', () => {
    async function prefillBaseRequiredFields() {
      const homeTabLocator = page.locator('.tabs-field__tab-button', {
        hasText: 'Home',
      })
      const heroTabLocator = page.locator('.tabs-field__tab-button', {
        hasText: 'Hero',
      })

      await homeTabLocator.click()
      // fill out all required fields in the home tab
      await page.locator('#field-home__text').fill('Home Collapsible Text')
      await page.locator('#field-home__tabText').fill('Home Tab Text')

      await page.locator('#field-group__text').fill('Home Group Text')
      await heroTabLocator.click()
      // fill out all required fields in the hero tab
      await page.locator('#field-tabText').fill('Hero Tab Text')
      await page.locator('#field-text').fill('Hero Tab Collapsible Text')
    }
    test('group errors', async () => {
      await page.goto(errorFieldsURL.create)
      await prefillBaseRequiredFields()

      // clear group and save
      await page.locator('#field-group__text').fill('')
      await saveDocAndAssert(page, '#action-save', 'error')

      // should show the error pill and count
      const groupFieldErrorPill = page.locator('#field-group .group-field__header .error-pill', {
        hasText: '1 error',
      })
      await expect(groupFieldErrorPill).toBeVisible()

      // finish filling out the group
      await page.locator('#field-group__text').fill('filled out')

      await expect(page.locator('#field-group .group-field__header .error-pill')).toBeHidden()
      await saveDocAndAssert(page, '#action-save')
    })
  })

  describe('password change validation', () => {
    const testUserEmail = 'test@example.com'
    let testUserId: string

    beforeAll(async () => {
      // Clean up any existing test user from previous runs
      const existingUsers = await payload.find({
        collection: 'users',
        where: {
          email: {
            equals: testUserEmail,
          },
        },
      })

      if (existingUsers.docs.length > 0 && existingUsers.docs[0]?.id) {
        await payload.delete({
          collection: 'users',
          id: existingUsers.docs[0].id,
        })
      }

      // Create test user
      const { id } = await payload.create({
        collection: 'users',
        data: {
          email: testUserEmail,
          password: 'test',
        },
      })

      testUserId = id
    })

    afterAll(async () => {
      // Clean up test user
      if (testUserId) {
        await payload.delete({
          collection: 'users',
          id: testUserId,
        })
      }
    })

    test('should keep password fields visible when validation fails', async () => {
      await page.goto(usersURL.edit(testUserId))

      const emailField = page.locator('#field-email')
      await expect(emailField).toBeVisible()
      await expect(emailField).toBeEnabled()

      const changePasswordButton = page.locator('#change-password')
      await expect(changePasswordButton).toBeVisible()
      await expect(changePasswordButton).toBeEnabled()
      await changePasswordButton.click()

      const passwordField = page.locator('#field-password')
      const confirmPasswordField = page.locator('#field-confirm-password')

      await expect(passwordField).toBeVisible()
      await expect(passwordField).toBeEnabled()
      await expect(confirmPasswordField).toBeVisible()
      await expect(confirmPasswordField).toBeEnabled()

      // Password fields not registered in form state soon enough without this wait even if visible
      await wait(500)

      await passwordField.fill('hello')
      await confirmPasswordField.fill('hello')

      await saveDocAndAssert(page, '#action-save', 'error')

      const passwordError = page.locator('.field-type.password .field-error')
      await expect(passwordError).toBeVisible()
      await expect(passwordError).toContainText('Password must be at least 8 characters long')

      // Wait for the debounced onChange to run (250ms debounce + some buffer)
      // Without the fix, onChange would clear the error during this time
      await wait(500)

      // Verify error tooltip is still visible after onChange would have run
      await expect(passwordError).toBeVisible()
      await expect(passwordError).toContainText('Password must be at least 8 characters long')

      await expect(passwordField).toBeVisible()
      await expect(confirmPasswordField).toBeVisible()
      await expect(page.locator('#cancel-change-password')).toBeVisible()
    })
  })
})
