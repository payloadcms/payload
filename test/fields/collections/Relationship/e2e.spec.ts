import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import { checkFocusIndicators } from 'helpers/e2e/checkFocusIndicators.js'
import { openCreateDocDrawer } from 'helpers/e2e/fields/relationship/openCreateDocDrawer.js'
import { addListFilter } from 'helpers/e2e/filters/index.js'
import { navigateToDoc } from 'helpers/e2e/navigateToDoc.js'
import { openDocControls } from 'helpers/e2e/openDocControls.js'
import { runAxeScan } from 'helpers/e2e/runAxeScan.js'
import { openDocDrawer } from 'helpers/e2e/toggleDocDrawer.js'
import path from 'path'
import { wait } from 'payload/shared'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../../../helpers/sdk/index.js'
import type { Config, RelationshipField, TextField } from '../../payload-types.js'

import {
  ensureCompilationIsDone,
  exactText,
  initPageConsoleErrorCatch,
  saveDocAndAssert,
  saveDocHotkeyAndAssert,
} from '../../../helpers.js'
import { AdminUrlUtil } from '../../../helpers/adminUrlUtil.js'
import { assertToastErrors } from '../../../helpers/assertToastErrors.js'
import { initPayloadE2ENoConfig } from '../../../helpers/initPayloadE2ENoConfig.js'
import { reInitializeDB } from '../../../helpers/reInitializeDB.js'
import { POLL_TOPASS_TIMEOUT, TEST_TIMEOUT_LONG } from '../../../playwright.config.js'
import { relationshipFieldsSlug, textFieldsSlug } from '../../slugs.js'

test.describe.configure({ mode: 'serial' })

const filename = fileURLToPath(import.meta.url)
const currentFolder = path.dirname(filename)
const dirname = path.resolve(currentFolder, '../../')

const { beforeAll, beforeEach, describe } = test

let payload: PayloadTestSDK<Config>
let page: Page
let serverURL: string
// If we want to make this run in parallel: test.describe.configure({ mode: 'parallel' })

describe('relationship', () => {
  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    process.env.SEED_IN_CONFIG_ONINIT = 'false' // Makes it so the payload config onInit seed is not run. Otherwise, the seed would be run unnecessarily twice for the initial test run - once for beforeEach and once for onInit
    ;({ payload, serverURL } = await initPayloadE2ENoConfig<Config>({
      dirname,
    }))

    const context = await browser.newContext()
    page = await context.newPage()
    initPageConsoleErrorCatch(page)

    await ensureCompilationIsDone({ page, serverURL })
  })
  beforeEach(async () => {
    await reInitializeDB({
      serverURL,
      snapshotKey: 'fieldsTest',
      uploadsDir: path.resolve(dirname, './collections/Upload/uploads'),
    })

    await ensureCompilationIsDone({ page, serverURL })
  })

  let url: AdminUrlUtil
  const tableRowLocator = 'table > tbody > tr'

  async function loadCreatePage() {
    await page.goto(url.create)
    //ensure page is loaded
    await wait(100)
    await expect(page.locator('.shimmer-effect')).toHaveCount(0)
    await wait(200)
  }

  beforeAll(() => {
    url = new AdminUrlUtil(serverURL, 'relationship-fields')
  })

  test('should create inline relationship within field with many relations', async () => {
    await loadCreatePage()
    await openCreateDocDrawer({ page, fieldSelector: '#field-relationship' })
    await page
      .locator('.popup__content .relationship-add-new__relation-button--text-fields')
      .click()
    const textField = page.locator('.drawer__content #field-text')
    await expect(textField).toBeEnabled()
    const textValue = 'hello'
    await textField.fill(textValue)
    await page.locator('[id^=doc-drawer_text-fields_1_] #action-save').click()
    await expect(page.locator('.payload-toast-container')).toContainText('successfully')
    await page.locator('[id^=close-drawer__doc-drawer_text-fields_1_]').click()
    await expect(
      page.locator('#field-relationship .relationship--single-value__text'),
    ).toContainText(textValue)
    await page.locator('#action-save').click()
    await expect(page.locator('.payload-toast-container')).toContainText('successfully')
  })

  test('should save correct relationTo when creating doc in second collection (bug #14728)', async () => {
    await loadCreatePage()

    await openCreateDocDrawer({ page, fieldSelector: '#field-relationship' })

    // Select the SECOND collection (array-fields) instead of the first (text-fields)
    await page
      .locator('.popup__content .relationship-add-new__relation-button--array-fields')
      .click()

    await page.locator('[id^=doc-drawer_array-fields_1_] #action-save').click()
    await expect(page.locator('.payload-toast-container')).toContainText('successfully')
    await page.locator('[id^=close-drawer__doc-drawer_array-fields_1_]').click()

    const relationshipValue = page.locator('#field-relationship .relationship--single-value__text')
    await expect(relationshipValue).toBeVisible()
    await expect(async () => {
      const valueText = await relationshipValue.textContent()
      expect(valueText).not.toContain('Another text document')
      expect(valueText).not.toContain('Untitled')
    }).toPass()

    await page.locator('#action-save').click()
    await expect(page.locator('.payload-toast-container')).toContainText('successfully')
  })

  test('should create nested inline relationships', async () => {
    await loadCreatePage()

    // Open first modal
    await openCreateDocDrawer({ page, fieldSelector: '#field-relationToSelf' })

    // Fill first modal's required relationship field
    await page.locator('[id^=doc-drawer_relationship-fields_1_] #field-relationship').click()
    await page
      .locator(
        '[id^=doc-drawer_relationship-fields_1_] .rs__option:has-text("Seeded text document")',
      )
      .click()

    const secondModalButton = page.locator(
      '[id^=doc-drawer_relationship-fields_1_] #relationToSelf-add-new button',
    )
    await secondModalButton.click()

    // Fill second modal's required relationship field
    await page.locator('[id^=doc-drawer_relationship-fields_2_] #field-relationship').click()
    await page
      .locator(
        '[id^=doc-drawer_relationship-fields_2_] .rs__option:has-text("Seeded text document")',
      )
      .click()

    // Save then close the second modal
    await page.locator('[id^=doc-drawer_relationship-fields_2_] #action-save').click()
    await expect.poll(() => page.url(), { timeout: POLL_TOPASS_TIMEOUT }).toContain('create')
    await page.locator('[id^=close-drawer__doc-drawer_relationship-fields_2_]').click()

    // Assert that the first modal is still open and the value matches
    await expect(page.locator('[id^=doc-drawer_relationship-fields_1_]')).toBeVisible()
    await expect(
      page.locator(
        '[id^=doc-drawer_relationship-fields_1_] #field-relationToSelf .relationship--single-value__text',
      ),
    ).toBeVisible() // TODO: use '.toContainText('doc_id')' with the doc in the second modal

    // Save then close the first modal
    await page.locator('[id^=doc-drawer_relationship-fields_1_] #action-save').click()
    await expect.poll(() => page.url(), { timeout: POLL_TOPASS_TIMEOUT }).toContain('create')
    await page.locator('[id^=close-drawer__doc-drawer_relationship-fields_1_]').click()

    // Expect the original field to have a value filled
    await expect(
      page.locator('#field-relationToSelf .relationship--single-value__text'),
    ).toBeVisible()

    // Fill the required field
    await page.locator('#field-relationship').click()
    await page.locator('.rs__option:has-text("Seeded text document")').click()
    await expect.poll(() => page.url(), { timeout: POLL_TOPASS_TIMEOUT }).toContain('create')
    await page.locator('#action-save').click()

    await expect(page.locator('.payload-toast-container')).toContainText('successfully')
  })

  test('should hide relationship add new button', async () => {
    await loadCreatePage()

    const locator1 = page.locator(
      '#relationWithAllowEditToFalse-add-new .relationship-add-new__add-button',
    )

    await expect(locator1).toHaveCount(1)

    // expect the button to not exist in the field
    const locator2 = page.locator(
      '#relationWithAllowCreateToFalse-add-new .relationship-add-new__add-button',
    )

    await expect(locator2).toHaveCount(0)
  })

  test('should hide relationship edit button', async () => {
    await loadCreatePage()

    const locator1 = page
      .locator('#field-relationWithAllowEditToFalse')
      .getByLabel('Edit dev@payloadcms.com')

    await expect(locator1).toHaveCount(0)

    const locator2 = page
      .locator('#field-relationWithAllowCreateToFalse')
      .getByLabel('Edit dev@payloadcms.com')

    await expect(locator2).toHaveCount(1)

    // The reason why I check for locator 1 again is that I've noticed that sometimes
    // the default value does not appear after the first locator is tested. IDK why.
    await expect(locator1).toHaveCount(0)
  })

  test('should hide edit button in main doc when relationship deleted', async () => {
    const createdRelatedDoc = await payload.create({
      collection: textFieldsSlug,
      data: {
        text: 'doc to be deleted',
      },
    })
    const doc = await payload.create({
      collection: relationshipFieldsSlug,
      data: {
        relationship: {
          value: createdRelatedDoc.id,
          relationTo: textFieldsSlug,
        },
      },
    })
    await payload.delete({
      collection: textFieldsSlug,
      id: createdRelatedDoc.id,
    })

    await page.goto(url.edit(doc.id))

    const editBtn = page.locator(
      '#field-relationship button.relationship--single-value__drawer-toggler',
    )
    await expect(editBtn).toHaveCount(0)
  })

  // TODO: Flaky test in CI - fix this. https://github.com/payloadcms/payload/actions/runs/8910825395/job/24470963991
  test.skip('should clear relationship values', async () => {
    await loadCreatePage()

    const field = page.locator('#field-relationship')

    // wait for relationship options to load
    const textFieldPromise = page.waitForResponse(/api\/text-fields/)
    const arrayFieldPromise = page.waitForResponse(/api\/array-fields/)
    await field.click()
    await textFieldPromise
    await arrayFieldPromise

    await page.locator('.rs__option:has-text("Seeded text document")').click()
    await field.locator('.clear-indicator').click()
    await expect(field.locator('.rs__placeholder')).toBeVisible()
  })

  // TODO: React-Select not loading things sometimes. Fix later
  test.skip('should display `hasMany` polymorphic relationships', async () => {
    await loadCreatePage()

    const field = page.locator('#field-relationHasManyPolymorphic')
    await field.click()

    await page
      .locator('.rs__option', {
        hasText: exactText('Seeded text document'),
      })
      .click()

    await expect(
      page
        .locator('#field-relationHasManyPolymorphic .relationship--multi-value-label__text', {
          hasText: exactText('Seeded text document'),
        })
        .first(),
    ).toBeVisible()

    // await fill the required fields then save the document and check again
    await page.locator('#field-relationship').click()
    await page.locator('#field-relationship .rs__option:has-text("Seeded text document")').click()
    await saveDocAndAssert(page)

    const valueAfterSave = page.locator('#field-relationHasManyPolymorphic .multi-value').first()

    await expect(
      valueAfterSave
        .locator('.relationship--multi-value-label__text', {
          hasText: exactText('Seeded text document'),
        })
        .first(),
    ).toBeVisible()
  })

  test('should populate relationship dynamic default value', async () => {
    await loadCreatePage()

    await expect(
      page.locator('#field-relationWithDynamicDefault .relationship--single-value__text'),
    ).toContainText('dev@payloadcms.com')
    await expect(
      page.locator('#field-relationHasManyWithDynamicDefault .relationship--single-value__text'),
    ).toContainText('dev@payloadcms.com')
  })

  test('should filter relationship options', async () => {
    await loadCreatePage()

    await page.locator('#field-relationship .rs__control').click()
    await page.keyboard.type('seeded')
    await page.locator('.rs__option:has-text("Seeded text document")').click()
    await saveDocAndAssert(page)
  })

  // Related issue: https://github.com/payloadcms/payload/issues/2815
  test('should edit document in relationship drawer', async () => {
    await loadCreatePage()

    // First fill out the relationship field, as it's required
    await openCreateDocDrawer({ page, fieldSelector: '#field-relationship' })
    await page
      .locator('.popup__content .relationship-add-new__relation-button--text-fields')
      .click()

    await page.locator('.drawer__content #field-text').fill('something')

    await page.locator('[id^=doc-drawer_text-fields_1_] #action-save').click()
    await expect(page.locator('.payload-toast-container')).toContainText('successfully')
    await page.locator('[id^=close-drawer__doc-drawer_text-fields_1_]').click()
    await page.locator('#action-save').click()
    await expect(page.locator('.payload-toast-container')).toContainText('successfully')

    // Create a new doc for the `relationshipHasMany` field
    await expect.poll(() => page.url(), { timeout: POLL_TOPASS_TIMEOUT }).not.toContain('create')
    await openCreateDocDrawer({ page, fieldSelector: '#field-relationshipHasMany' })
    const value = 'Hello, world!'
    await page.locator('.drawer__content #field-text').fill(value)

    // Save and close the drawer
    await page.locator('[id^=doc-drawer_text-fields_1_] #action-save').click()
    await expect(page.locator('.payload-toast-container')).toContainText('successfully')
    await page.locator('[id^=close-drawer__doc-drawer_text-fields_1_]').click()

    // Now open the drawer again to edit the `text` field _using the keyboard_
    // Mimic real user behavior by typing into the field with spaces and backspaces
    // Explicitly use both `down` and `type` to cover edge cases

    await openDocDrawer({
      page,
      selector: '#field-relationshipHasMany button.relationship--multi-value-label__drawer-toggler',
    })

    await page.locator('[id^=doc-drawer_text-fields_1_] #field-text').click()
    await page.keyboard.down('1')
    await page.keyboard.type('23')
    await expect(page.locator('[id^=doc-drawer_text-fields_1_] #field-text')).toHaveValue(
      `${value}123`,
    )
    await page.keyboard.type('4567')
    await page.keyboard.press('Backspace')
    await expect(page.locator('[id^=doc-drawer_text-fields_1_] #field-text')).toHaveValue(
      `${value}123456`,
    )

    // save drawer
    await page.locator('[id^=doc-drawer_text-fields_1_] #action-save').click()
    await expect(page.locator('.payload-toast-container')).toContainText('successfully')
    // close drawer
    await page.locator('[id^=close-drawer__doc-drawer_text-fields_1_]').click()
    // save document and reload
    await page.locator('#action-save').click()
    await expect(page.locator('.payload-toast-container')).toContainText('successfully')
    await page.reload()

    // check if the value is saved
    await expect(
      page.locator('#field-relationshipHasMany .relationship--multi-value-label__text'),
    ).toHaveText(`${value}123456`)
  })

  test('should open related document in a new tab when meta key is applied', async () => {
    await loadCreatePage()

    const [newPage] = await Promise.all([
      page.context().waitForEvent('page'),
      await openDocDrawer({
        page,
        selector:
          '#field-relationWithAllowCreateToFalse .relationship--single-value__drawer-toggler',
        withMetaKey: true,
      }),
    ])

    // Wait for navigation to complete in the new tab and ensure the edit view is open
    await expect(newPage.locator('.collection-edit')).toBeVisible()
  })

  test('multi value relationship should open document in a new tab', async () => {
    await loadCreatePage()

    // Select "Seeded text document" relationship
    await page.locator('#field-relationshipHasMany .rs__control').click()
    await page.locator('.rs__option:has-text("Seeded text document")').click()
    await expect(
      page.locator('#field-relationshipHasMany .relationship--multi-value-label__drawer-toggler'),
    ).toBeVisible()

    const [newPage] = await Promise.all([
      page.context().waitForEvent('page'),
      await openDocDrawer({
        page,
        selector: '#field-relationshipHasMany .relationship--multi-value-label__drawer-toggler',
        withMetaKey: true,
      }),
    ])

    // Wait for navigation to complete in the new tab and ensure the edit view is open
    await expect(newPage.locator('.collection-edit')).toBeVisible()
  })

  // Drawers opened through the edit button are prone to issues due to the use of stopPropagation for certain
  // events - specifically for drawers opened through the edit button. This test is to ensure that drawers
  // opened through the edit button can be saved using the hotkey.
  test('should save using hotkey in document drawer', async () => {
    await loadCreatePage()

    // First fill out the relationship field, as it's required
    await openCreateDocDrawer({ page, fieldSelector: '#field-relationship' })
    await page.locator('#field-relationship .value-container').click()
    await wait(500)
    // Select "Seeded text document" relationship
    await page.getByText('Seeded text document', { exact: true }).click()

    // Need to wait to properly open drawer - without this the drawer state is flakey and closes before
    // the text below can be filled before the save on the drawer
    await wait(1000)

    // Click edit button which opens drawer
    await page.getByRole('button', { name: 'Edit Seeded text document' }).click()

    // Fill 'text' field of 'Seeded text document'
    await page.locator('.drawer__content #field-text').fill('some updated text value')

    // Save drawer (not parent page) with hotkey
    await saveDocHotkeyAndAssert(page)

    const seededTextDocument = await payload.find({
      collection: textFieldsSlug,
      where: {
        text: {
          equals: 'some updated text value',
        },
      },
    })

    const relationshipDocuments = await payload.find({
      collection: relationshipFieldsSlug,
    })

    // The Seeded text document should now have a text field with value 'some updated text value',
    expect(seededTextDocument.docs.length).toEqual(1)

    // but the relationship document should NOT exist, as the hotkey should have saved the drawer and not the parent page
    // NOTE: the value here represents the number of documents _before_ the test was run
    expect(relationshipDocuments.docs.length).toEqual(2)
  })

  describe('should create document within document drawer', () => {
    test('has one', async () => {
      await navigateToDoc(page, url)

      const originalValue = await page
        .locator('#field-relationship .relationship--single-value')
        .textContent()

      await openDocDrawer({
        page,
        selector: '#field-relationship .relationship--single-value__drawer-toggler',
      })
      const drawer1Content = page.locator('[id^=doc-drawer_text-fields_1_] .drawer__content')
      const originalDrawerID = await drawer1Content.locator('.id-label').textContent()
      await openDocControls(drawer1Content, page)
      await page.locator('.popup__content #action-create').click()
      await wait(1000) // wait for /form-state to return
      const title = 'Created from drawer'
      await drawer1Content.locator('#field-text').fill(title)
      await saveDocAndAssert(page, '[id^=doc-drawer_text-fields_1_] .drawer__content #action-save')
      const newDrawerID = drawer1Content.locator('.id-label')
      await expect(newDrawerID).not.toHaveText(originalDrawerID)
      await page.locator('[id^=doc-drawer_text-fields_1_] .drawer__close').click()
      await page.locator('#field-relationship').scrollIntoViewIfNeeded()

      await expect(
        page.locator('#field-relationship .relationship--single-value__text', {
          hasText: exactText(originalValue),
        }),
      ).toBeHidden()

      await expect(
        page.locator('#field-relationship .relationship--single-value__text', {
          hasText: exactText(title),
        }),
      ).toBeVisible()

      await page.locator('#field-relationship .rs__control').click()

      await expect(
        page.locator('.rs__option', {
          hasText: exactText(title),
        }),
      ).toBeVisible()
    })
  })

  describe('should duplicate document within document drawer', () => {
    test('has one', async () => {
      await navigateToDoc(page, url)

      await wait(500)
      const fieldControl = page.locator('#field-relationship .rs__control')
      const originalValue = await page
        .locator('#field-relationship .relationship--single-value__text')
        .textContent()

      await fieldControl.click()

      await expect(
        page.locator('.rs__option', {
          hasText: exactText(originalValue),
        }),
      ).toBeVisible()

      await openDocDrawer({
        page,
        selector: '#field-relationship .relationship--single-value__drawer-toggler',
      })
      const drawer1Content = page.locator('[id^=doc-drawer_text-fields_1_] .drawer__content')
      const originalID = await drawer1Content.locator('.id-label').textContent()
      const originalText = 'Text'
      await drawer1Content.locator('#field-text').fill(originalText)
      await saveDocAndAssert(page, '[id^=doc-drawer_text-fields_1_] .drawer__content #action-save')
      await openDocControls(drawer1Content, page)
      await page.locator('.popup__content #action-duplicate').click()
      const duplicateID = drawer1Content.locator('.id-label')
      await expect(duplicateID).not.toHaveText(originalID)
      await page.locator('[id^=doc-drawer_text-fields_1_] .drawer__close').click()
      await expect(page.locator('.payload-toast-container')).toContainText('successfully')
      await page.locator('#field-relationship').scrollIntoViewIfNeeded()

      const newValue = `${originalText} - duplicate` // this is added via a `beforeDuplicate` hook

      await expect(
        page.locator('#field-relationship .relationship--single-value__text', {
          hasText: exactText(originalValue),
        }),
      ).toBeHidden()

      await expect(
        page.locator('#field-relationship .relationship--single-value__text', {
          hasText: exactText(newValue),
        }),
      ).toBeVisible()

      await page.locator('#field-relationship .rs__control').click()

      await expect(
        page.locator('.rs__option', {
          hasText: exactText(newValue),
        }),
      ).toBeVisible()
    })
  })

  describe('should delete document within document drawer', () => {
    test('has one', async () => {
      await navigateToDoc(page, url)

      await wait(500)

      const originalValue = await page
        .locator('#field-relationship .relationship--single-value__text')
        .textContent()

      await page.locator('#field-relationship .rs__control').click()

      await expect(
        page.locator('#field-relationship .rs__option', {
          hasText: exactText(originalValue),
        }),
      ).toBeVisible()

      await openDocDrawer({
        page,
        selector: '#field-relationship button.relationship--single-value__drawer-toggler',
      })

      const drawer1Content = page.locator('[id^=doc-drawer_text-fields_1_] .drawer__content')
      const originalID = await drawer1Content.locator('.id-label').textContent()
      await openDocControls(drawer1Content, page)
      await page.locator('.popup__content #action-delete').click()

      await page
        .locator('[id^=delete-].payload__modal-item.confirmation-modal[open] button#confirm-action')
        .click()

      await expect(drawer1Content).toBeHidden()

      await expect(
        page.locator('#field-relationship .relationship--single-value__text'),
      ).toBeHidden()

      await expect(page.locator('#field-relationship .rs__placeholder')).toBeVisible()

      await page.locator('#field-relationship .rs__control').click()

      await wait(500)

      await expect(
        page.locator('#field-relationship .rs__option', {
          hasText: exactText(originalValue),
        }),
      ).toBeHidden()

      await expect(
        page.locator('#field-relationship .rs__option', {
          hasText: exactText(`Untitled - ${originalID}`),
        }),
      ).toBeHidden()
    })
  })

  // TODO: Fix this. This test flakes due to react select
  test.skip('should bypass min rows validation when no rows present and field is not required', async () => {
    await loadCreatePage()

    // First fill out the relationship field, as it's required
    await openCreateDocDrawer({ page, fieldSelector: '#field-relationship' })
    await page.locator('#field-relationship .value-container').click()
    await page.getByText('Seeded text document', { exact: true }).click()

    await saveDocAndAssert(page)
    await expect(page.locator('.payload-toast-container')).toContainText('successfully')
  })

  test('should fail min rows validation when rows are present', async () => {
    await loadCreatePage()

    // First fill out the relationship field, as it's required
    await openCreateDocDrawer({ page, fieldSelector: '#field-relationship' })
    await page.locator('#field-relationship .value-container').click()
    await page.getByText('Seeded text document', { exact: true }).click()

    // Need to wait to allow for field to retrieve documents before the save occurs
    await wait(200)

    await page.locator('#field-relationshipWithMinRows .value-container').click()

    await page
      .locator('#field-relationshipWithMinRows .rs__option:has-text("Seeded text document")')
      .click()

    await page.click('#action-save', { delay: 100 })
    await assertToastErrors({
      page,
      errors: ['Relationship With Min Rows'],
    })
  })

  test('should sort relationship options by sortOptions property (ID in ascending order)', async () => {
    await loadCreatePage()

    const field = page.locator('#field-relationship')
    await field.click()
    await wait(400)

    const textDocsGroup = page.locator('.rs__group-heading:has-text("Text Fields")')
    const firstTextDocOption = textDocsGroup.locator('+div .rs__option').first()
    const firstOptionLabel = await firstTextDocOption.textContent()
    expect(firstOptionLabel?.trim()).toBe('Another text document')
  })

  test('should sort relationHasManyPolymorphic options by sortOptions property: text-fields collection (items in descending order)', async () => {
    await loadCreatePage()

    const field = page.locator('#field-relationHasManyPolymorphic')

    // wait for relationship options to load
    const textFieldPromise = page.waitForResponse(/api\/text-fields/)
    const arrayFieldPromise = page.waitForResponse(/api\/array-fields/)
    await field.click()
    await textFieldPromise
    await arrayFieldPromise

    const textDocsGroup = page.locator('.rs__group-heading:has-text("Text Fields")')
    const firstTextDocOption = textDocsGroup.locator('+div .rs__option').first()
    const firstOptionLabel = firstTextDocOption
    await expect(firstOptionLabel).toHaveText('Seeded text document')
  })

  test('should allow filtering by relationship field / equals', async () => {
    const textDoc = await createTextFieldDoc()
    await createRelationshipFieldDoc({ value: textDoc.id, relationTo: 'text-fields' })

    await page.goto(url.list)
    await wait(1000) // wait for page to load

    await addListFilter({
      page,
      fieldLabel: 'Relationship',
      operatorLabel: 'equals',
      value: 'some text',
    })

    await expect(page.locator(tableRowLocator)).toHaveCount(1)
  })

  test('should allow filtering by non-polymorphic hasMany relationship field / equals', async () => {
    const textDoc1 = await createTextFieldDoc({ text: 'Text 1' })
    const textDoc2 = await createTextFieldDoc({ text: 'Text 2' })
    const textDoc3 = await createTextFieldDoc({ text: 'Text 3' })

    await createRelationshipFieldDoc(
      { value: textDoc1.id, relationTo: 'text-fields' },
      {
        relationshipHasMany: [textDoc1.id],
      },
    )

    await createRelationshipFieldDoc(
      { value: textDoc2.id, relationTo: 'text-fields' },
      {
        relationshipHasMany: [textDoc2.id, textDoc3.id],
      },
    )

    await page.goto(url.list)
    await wait(1000)

    await addListFilter({
      page,
      fieldLabel: 'Relationship Has Many',
      operatorLabel: 'equals',
      value: 'Text 1',
      multiSelect: true,
    })

    await expect(page.locator(tableRowLocator)).toHaveCount(1)
  })

  test('should allow filtering by polymorphic hasMany relationship field / equals', async () => {
    const textDoc1 = await createTextFieldDoc({ text: 'Poly Text 1' })
    const textDoc2 = await createTextFieldDoc({ text: 'Poly Text 2' })

    await createRelationshipFieldDoc(
      { value: textDoc1.id, relationTo: 'text-fields' },
      {
        relationHasManyPolymorphic: [{ relationTo: 'text-fields', value: textDoc1.id }],
      },
    )

    await createRelationshipFieldDoc(
      { value: textDoc2.id, relationTo: 'text-fields' },
      {
        relationHasManyPolymorphic: [
          { relationTo: 'text-fields', value: textDoc1.id },
          { relationTo: 'text-fields', value: textDoc2.id },
        ],
      },
    )

    await page.goto(url.list)
    await wait(1000)

    await addListFilter({
      page,
      fieldLabel: 'Relation Has Many Polymorphic',
      operatorLabel: 'equals',
      value: 'Poly Text 1',
      multiSelect: true,
    })

    await expect(page.locator(tableRowLocator)).toHaveCount(1)
  })

  test('should be able to select relationship with drawer appearance', async () => {
    await loadCreatePage()

    const relationshipField = page.locator('#field-relationshipDrawer')
    await relationshipField.click()
    const listDrawerContent = page.locator('.list-drawer').locator('.drawer__content')
    await expect(listDrawerContent).toBeVisible()

    const firstRow = listDrawerContent.locator('table tbody tr').first()
    const button = firstRow.locator('button')
    await button.click()
    await expect(listDrawerContent).toBeHidden()

    const selectedValue = relationshipField.locator('.relationship--single-value__text')
    await expect(selectedValue).toBeVisible()

    // Fill required field
    await page.locator('#field-relationship').click()
    await page.locator('.rs__option:has-text("Seeded text document")').click()

    await saveDocAndAssert(page)
  })

  test('should be able to search within relationship list drawer', async () => {
    await loadCreatePage()

    const relationshipField = page.locator('#field-relationshipDrawer')
    await relationshipField.click()
    const searchField = page.locator('.list-drawer .search-filter')
    await expect(searchField).toBeVisible()

    const searchInput = searchField.locator('input')
    await searchInput.fill('seeded')
    const rows = page.locator('.list-drawer table tbody tr')

    await expect(rows).toHaveCount(1)
    const closeButton = page.locator('.list-drawer__header-close')
    await closeButton.click()

    await expect(page.locator('.list-drawer')).toBeHidden()
  })

  test('should handle read-only relationship field when `appearance: "drawer"`', async () => {
    await loadCreatePage()

    const readOnlyField = page.locator(
      '#field-relationshipDrawerReadOnly .rs__control--is-disabled',
    )
    await expect(readOnlyField).toBeVisible()
  })

  test('should handle polymorphic relationship when `appearance: "drawer"`', async () => {
    await loadCreatePage()

    const relationshipField = page.locator('#field-polymorphicRelationshipDrawer')
    await relationshipField.click()
    const listDrawerContent = page.locator('.list-drawer').locator('.drawer__content')
    await expect(listDrawerContent).toBeVisible()

    const relationToSelector = page.locator('.list-header__select-collection')
    await expect(relationToSelector).toBeVisible()

    await relationToSelector.locator('.rs__control').click()
    const option = relationToSelector.locator('.rs__option').nth(1)
    await option.click()
    const firstRow = listDrawerContent.locator('table tbody tr').first()
    const button = firstRow.locator('button')
    await button.click()
    await expect(listDrawerContent).toBeHidden()

    const selectedValue = relationshipField.locator('.relationship--single-value__text')
    await expect(selectedValue).toBeVisible()

    // Fill required field
    await page.locator('#field-relationship').click()
    await page.locator('.rs__option:has-text("Seeded text document")').click()

    await saveDocAndAssert(page)
  })

  test('should handle `hasMany` relationship when `appearance: "drawer"`', async () => {
    await loadCreatePage()

    const relationshipField = page.locator('#field-relationshipDrawerHasMany')
    await relationshipField.click()
    const listDrawerContent = page.locator('.list-drawer').locator('.drawer__content')
    await expect(listDrawerContent).toBeVisible()

    const firstRow = listDrawerContent.locator('table tbody tr').first()
    const button = firstRow.locator('button')
    await button.click()
    await expect(listDrawerContent).toBeHidden()

    const selectedValue = relationshipField.locator('.relationship--multi-value-label__text')
    await expect(selectedValue).toHaveCount(1)

    await relationshipField.click()
    await expect(listDrawerContent).toBeVisible()
    await button.click()
    await expect(listDrawerContent).toBeHidden()

    const selectedValues = relationshipField.locator('.relationship--multi-value-label__text')
    await expect(selectedValues).toHaveCount(2)
  })

  test('should handle `hasMany` polymorphic relationship when `appearance: "drawer"`', async () => {
    await loadCreatePage()

    const relationshipField = page.locator('#field-relationshipDrawerHasManyPolymorphic')
    await relationshipField.click()
    const listDrawerContent = page.locator('.list-drawer').locator('.drawer__content')
    await expect(listDrawerContent).toBeVisible()

    const firstRow = listDrawerContent.locator('table tbody tr').first()
    const button = firstRow.locator('button')
    await button.click()
    await expect(listDrawerContent).toBeHidden()

    const selectedValue = relationshipField.locator('.relationship--multi-value-label__text')
    await expect(selectedValue).toBeVisible()
  })

  test('should not be allowed to create in relationship list drawer when `allowCreate` is `false`', async () => {
    await loadCreatePage()

    const relationshipField = page.locator('#field-relationshipDrawerWithAllowCreateFalse')
    await relationshipField.click()
    const listDrawerContent = page.locator('.list-drawer').locator('.drawer__content')
    await expect(listDrawerContent).toBeVisible()

    const createNewButton = listDrawerContent.locator('list-drawer__create-new-button')
    await expect(createNewButton).toBeHidden()
  })

  test('should respect `filterOptions` in the relationship list drawer for filtered relationship', async () => {
    // Create test documents
    await createTextFieldDoc({ text: 'list drawer test' })
    await createTextFieldDoc({ text: 'not test' })
    await loadCreatePage()

    const relationshipField = page.locator('#field-relationshipDrawerWithFilterOptions')
    await relationshipField.click()
    const listDrawerContent = page.locator('.list-drawer').locator('.drawer__content')
    await expect(listDrawerContent).toBeVisible()

    const rows = page.locator('.list-drawer table tbody tr')
    await expect(rows).toHaveCount(1)
  })

  test('should filter out existing values from relationship list drawer', async () => {
    await loadCreatePage()

    await page.locator('#field-relationshipDrawer').click()
    const listDrawerContent = page.locator('.list-drawer').locator('.drawer__content')
    await expect(listDrawerContent).toBeVisible()
    const rows = listDrawerContent.locator('table tbody tr')
    await expect(rows).toHaveCount(2)
    await listDrawerContent.getByText('Seeded text document', { exact: true }).click()

    const selectedValue = page.locator(
      '#field-relationshipDrawer .relationship--single-value__text',
    )

    await expect(selectedValue).toHaveText('Seeded text document')
    await page.locator('#field-relationshipDrawer').click()
    const newRows = listDrawerContent.locator('table tbody tr')
    await expect(newRows).toHaveCount(1)
    await expect(listDrawerContent.getByText('Seeded text document')).toHaveCount(0)
  })

  test('should filter out existing values from polymorphic relationship list drawer', async () => {
    await loadCreatePage()

    const relationshipField = page.locator('#field-polymorphicRelationshipDrawer')
    await wait(400)
    await relationshipField.click()
    const listDrawerContent = page.locator('.list-drawer').locator('.drawer__content')
    await expect(listDrawerContent).toBeVisible()

    const relationToSelector = page.locator('.list-header__select-collection')
    await expect(relationToSelector).toBeVisible()

    await wait(400)
    await relationToSelector.locator('.rs__control').click()
    const option = relationToSelector.locator('.rs__option').nth(1)
    await wait(400)
    await option.click()
    const rows = listDrawerContent.locator('table tbody tr')
    await expect(rows).toHaveCount(2)
    const firstRow = rows.first()
    const button = firstRow.locator('button')
    await wait(400)
    await button.click()
    await expect(listDrawerContent).toBeHidden()

    const selectedValue = relationshipField.locator('.relationship--single-value__text')
    await expect(selectedValue).toBeVisible()

    await wait(400)
    await relationshipField.click()
    await expect(listDrawerContent).toBeVisible()
    await expect(relationToSelector).toBeVisible()
    await wait(400)
    await relationToSelector.locator('.rs__control').click()
    await wait(400)
    await option.click()
    const newRows = listDrawerContent.locator('table tbody tr')
    await expect(newRows).toHaveCount(1)
    const newFirstRow = newRows.first()
    const newButton = newFirstRow.locator('button')
    await wait(400)
    await newButton.click()
    await expect(listDrawerContent).toBeHidden()
  })

  test('should update label for *all* relationship fields pointing to the same document, if the useAsTitle is updated from drawer', async () => {
    const textDoc = await createTextFieldDoc()
    const doc = await payload.create({
      collection: 'relationship-fields',
      data: {
        relationship: {
          relationTo: 'text-fields',
          value: textDoc.id,
        },
        relationshipDrawer: textDoc.id,
      },
    })

    await page.goto(url.edit(doc.id))
    //ensure page is loaded
    await wait(100)
    await expect(page.locator('.shimmer-effect')).toHaveCount(0)

    await expect(page.locator('#field-relationship .relationship--single-value__text')).toHaveText(
      textDoc.text,
    )
    await expect(
      page.locator('#field-relationshipDrawer .relationship--single-value__text'),
    ).toHaveText(textDoc.text)

    await openDocDrawer({
      page,
      selector: '#field-relationship button.relationship--single-value__drawer-toggler',
    })

    await page.locator('[id^=doc-drawer_text-fields_1_] #field-text').fill('new text')

    // save drawer
    await page.locator('[id^=doc-drawer_text-fields_1_] #action-save').click()
    await expect(page.locator('.payload-toast-container')).toContainText('successfully')
    // close drawer
    await page.locator('[id^=close-drawer__doc-drawer_text-fields_1_]').click()

    await expect(page.locator('#field-relationship .relationship--single-value__text')).toHaveText(
      'new text',
    )

    // The previous issue was that the label of *other* relationship fields pointing to the same document was not updated
    await expect(
      page.locator('#field-relationshipDrawer .relationship--single-value__text'),
    ).toHaveText('new text')
  })

  describe('A11y', () => {
    test.fixme('Create view should have no accessibility violations', async ({}, testInfo) => {
      await page.goto(url.create)
      await page.locator('#field-select').waitFor()

      const scanResults = await runAxeScan({
        page,
        testInfo,
        include: ['.collection-edit__main'],
        exclude: ['.field-description'], // known issue - reported elsewhere @todo: remove this once fixed - see report https://github.com/payloadcms/payload/discussions/14489
      })

      expect(scanResults.violations.length).toBe(0)
    })

    test.fixme('Edit view should have no accessibility violations', async ({}, testInfo) => {
      await page.goto(url.list)
      const firstItem = page.locator('.cell-id a').nth(0)
      await firstItem.click()

      await page.locator('#field-select').waitFor()

      const scanResults = await runAxeScan({
        page,
        testInfo,
        include: ['.collection-edit__main'],
        exclude: ['.field-description'], // known issue - reported elsewhere @todo: remove this once fixed - see report https://github.com/payloadcms/payload/discussions/14489
      })

      expect(scanResults.violations.length).toBe(0)
    })

    test.fixme('Relationship fields have focus indicators', async ({}, testInfo) => {
      await page.goto(url.create)
      await page.locator('#field-select').waitFor()

      const scanResults = await checkFocusIndicators({
        page,
        testInfo,
        selector: '.collection-edit__main',
      })

      expect(scanResults.totalFocusableElements).toBeGreaterThan(0)
      expect(scanResults.elementsWithoutIndicators).toBe(0)
    })
  })
})

async function createTextFieldDoc(overrides?: Partial<TextField>): Promise<TextField> {
  return payload.create({
    collection: 'text-fields',
    data: {
      text: 'some text',
      localizedText: 'some localized text',
      ...overrides,
    },
  }) as unknown as Promise<TextField>
}

async function createRelationshipFieldDoc(
  relationship: RelationshipField['relationship'],
  overrides?: Partial<RelationshipField>,
): Promise<RelationshipField> {
  return payload.create({
    collection: 'relationship-fields',
    data: {
      relationship,
      ...overrides,
    },
  }) as unknown as Promise<RelationshipField>
}
