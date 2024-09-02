import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import path from 'path'
import { wait } from 'payload/shared'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../../../helpers/sdk/index.js'
import type { Config, RelationshipField, TextField } from '../../payload-types.js'

import {
  ensureCompilationIsDone,
  exactText,
  initPageConsoleErrorCatch,
  openCreateDocDrawer,
  saveDocAndAssert,
  saveDocHotkeyAndAssert,
} from '../../../helpers.js'
import { AdminUrlUtil } from '../../../helpers/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../../../helpers/initPayloadE2ENoConfig.js'
import { reInitializeDB } from '../../../helpers/reInitializeDB.js'
import { RESTClient } from '../../../helpers/rest.js'
import { POLL_TOPASS_TIMEOUT, TEST_TIMEOUT_LONG } from '../../../playwright.config.js'
import { relationshipFieldsSlug, textFieldsSlug } from '../../slugs.js'
const filename = fileURLToPath(import.meta.url)
const currentFolder = path.dirname(filename)
const dirname = path.resolve(currentFolder, '../../')

const { beforeAll, beforeEach, describe } = test

let payload: PayloadTestSDK<Config>
let client: RESTClient
let page: Page
let serverURL: string
// If we want to make this run in parallel: test.describe.configure({ mode: 'parallel' })

describe('relationship', () => {
  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    process.env.SEED_IN_CONFIG_ONINIT = 'false' // Makes it so the payload config onInit seed is not run. Otherwise, the seed would be run unnecessarily twice for the initial test run - once for beforeEach and once for onInit
    ;({ payload, serverURL } = await initPayloadE2ENoConfig({
      dirname,
    }))

    const context = await browser.newContext()
    page = await context.newPage()
    initPageConsoleErrorCatch(page)
    await reInitializeDB({
      serverURL,
      snapshotKey: 'fieldsRelationshipTest',
      uploadsDir: path.resolve(dirname, './collections/Upload/uploads'),
    })
    await ensureCompilationIsDone({ page, serverURL })
  })
  beforeEach(async () => {
    await reInitializeDB({
      serverURL,
      snapshotKey: 'fieldsRelationshipTest',
      uploadsDir: path.resolve(dirname, './collections/Upload/uploads'),
    })

    if (client) {
      await client.logout()
    }
    client = new RESTClient(null, { defaultSlug: 'users', serverURL })
    await client.login()

    await ensureCompilationIsDone({ page, serverURL })
  })

  let url: AdminUrlUtil
  const tableRowLocator = 'table > tbody > tr'

  beforeAll(() => {
    url = new AdminUrlUtil(serverURL, 'relationship-fields')
  })

  test('should create inline relationship within field with many relations', async () => {
    await page.goto(url.create)
    await openCreateDocDrawer(page, '#field-relationship')
    await page
      .locator('#field-relationship .relationship-add-new__relation-button--text-fields')
      .click()
    const textField = page.locator('.drawer__content #field-text')
    await expect(textField).toBeEnabled()
    const textValue = 'hello'
    await textField.fill(textValue)
    await page.locator('[id^=drawer_1_doc-drawer__text-fields] #action-save').click()
    await expect(page.locator('.payload-toast-container')).toContainText('successfully')
    await page.locator('[id^=close-drawer__drawer_1_doc-drawer__text-fields]').click()
    await expect(
      page.locator('#field-relationship .relationship--single-value__text'),
    ).toContainText(textValue)
    await page.locator('#action-save').click()
    await expect(page.locator('.payload-toast-container')).toContainText('successfully')
  })

  test('should create nested inline relationships', async () => {
    await page.goto(url.create)
    await page.waitForURL(`**/${url.create}`)
    // Open first modal
    await openCreateDocDrawer(page, '#field-relationToSelf')

    // Fill first modal's required relationship field
    await page.locator('[id^=drawer_1_doc-drawer__relationship-fields] #field-relationship').click()
    await page
      .locator(
        '[id^=drawer_1_doc-drawer__relationship-fields] .rs__option:has-text("Seeded text document")',
      )
      .click()

    const secondModalButton = page.locator(
      '[id^=drawer_1_doc-drawer__relationship-fields] #relationToSelf-add-new button',
    )
    await secondModalButton.click()

    // Fill second modal's required relationship field
    await page.locator('[id^=drawer_2_doc-drawer__relationship-fields] #field-relationship').click()
    await page
      .locator(
        '[id^=drawer_2_doc-drawer__relationship-fields] .rs__option:has-text("Seeded text document")',
      )
      .click()

    // Save then close the second modal
    await page.locator('[id^=drawer_2_doc-drawer__relationship-fields] #action-save').click()
    await expect.poll(() => page.url(), { timeout: POLL_TOPASS_TIMEOUT }).toContain('create')
    await page.locator('[id^=close-drawer__drawer_2_doc-drawer__relationship-fields]').click()

    // Assert that the first modal is still open and the value matches
    await expect(page.locator('[id^=drawer_1_doc-drawer__relationship-fields]')).toBeVisible()
    await expect(
      page.locator(
        '[id^=drawer_1_doc-drawer__relationship-fields] #field-relationToSelf .relationship--single-value__text',
      ),
    ).toBeVisible() // TODO: use '.toContainText('doc_id')' with the doc in the second modal

    // Save then close the first modal
    await page.locator('[id^=drawer_1_doc-drawer__relationship-fields] #action-save').click()
    await expect.poll(() => page.url(), { timeout: POLL_TOPASS_TIMEOUT }).toContain('create')
    await page.locator('[id^=close-drawer__drawer_1_doc-drawer__relationship-fields]').click()

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
    await page.goto(url.create)
    // expect the button to not exist in the field
    const count = await page
      .locator('#relationToSelfSelectOnly-add-new .relationship-add-new__add-button')
      .count()
    expect(count).toEqual(0)
  })

  // TODO: Flaky test in CI - fix this. https://github.com/payloadcms/payload/actions/runs/8910825395/job/24470963991
  test.skip('should clear relationship values', async () => {
    await page.goto(url.create)

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
    await page.goto(url.create)
    await page.waitForURL(url.create)
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
    await page.goto(url.create)
    await page.waitForURL(url.create)
    await expect(
      page.locator('#field-relationWithDynamicDefault .relationship--single-value__text'),
    ).toContainText('dev@payloadcms.com')
    await expect(
      page.locator('#field-relationHasManyWithDynamicDefault .relationship--single-value__text'),
    ).toContainText('dev@payloadcms.com')
  })

  test('should filter relationship options', async () => {
    await page.goto(url.create)
    await page.locator('#field-relationship .rs__control').click()
    await page.keyboard.type('seeded')
    await page.locator('.rs__option:has-text("Seeded text document")').click()
    await saveDocAndAssert(page)
  })

  // Related issue: https://github.com/payloadcms/payload/issues/2815
  test('should modify fields in relationship drawer', async () => {
    await page.goto(url.create)
    await page.waitForURL(`**/${url.create}`)
    // First fill out the relationship field, as it's required
    await openCreateDocDrawer(page, '#field-relationship')
    await page
      .locator('#field-relationship .relationship-add-new__relation-button--text-fields')
      .click()

    await page.locator('.drawer__content #field-text').fill('something')

    await page.locator('[id^=drawer_1_doc-drawer__text-fields] #action-save').click()
    await expect(page.locator('.payload-toast-container')).toContainText('successfully')
    await page.locator('[id^=close-drawer__drawer_1_doc-drawer__text-fields]').click()
    await page.locator('#action-save').click()
    await expect(page.locator('.payload-toast-container')).toContainText('successfully')

    // Create a new doc for the `relationshipHasMany` field
    await expect.poll(() => page.url(), { timeout: POLL_TOPASS_TIMEOUT }).not.toContain('create')
    await openCreateDocDrawer(page, '#field-relationshipHasMany')
    const value = 'Hello, world!'
    await page.locator('.drawer__content #field-text').fill(value)

    // Save and close the drawer
    await page.locator('[id^=drawer_1_doc-drawer__text-fields] #action-save').click()
    await expect(page.locator('.payload-toast-container')).toContainText('successfully')
    await page.locator('[id^=close-drawer__drawer_1_doc-drawer__text-fields]').click()

    // Now open the drawer again to edit the `text` field _using the keyboard_
    // Mimic real user behavior by typing into the field with spaces and backspaces
    // Explicitly use both `down` and `type` to cover edge cases
    await page
      .locator('#field-relationshipHasMany button.relationship--multi-value-label__drawer-toggler')
      .click()
    await page.locator('[id^=drawer_1_doc-drawer__text-fields] #field-text').click()
    await page.keyboard.down('1')
    await page.keyboard.type('23')
    await expect(page.locator('[id^=drawer_1_doc-drawer__text-fields] #field-text')).toHaveValue(
      `${value}123`,
    )
    await page.keyboard.type('4567')
    await page.keyboard.press('Backspace')
    await expect(page.locator('[id^=drawer_1_doc-drawer__text-fields] #field-text')).toHaveValue(
      `${value}123456`,
    )

    // save drawer
    await page.locator('[id^=drawer_1_doc-drawer__text-fields] #action-save').click()
    await expect(page.locator('.payload-toast-container')).toContainText('successfully')
    // close drawer
    await page.locator('[id^=close-drawer__drawer_1_doc-drawer__text-fields]').click()
    // save document and reload
    await page.locator('#action-save').click()
    await expect(page.locator('.payload-toast-container')).toContainText('successfully')
    await page.reload()

    // check if the value is saved
    await expect(
      page.locator('#field-relationshipHasMany .relationship--multi-value-label__text'),
    ).toHaveText(`${value}123456`)
  })

  // Drawers opened through the edit button are prone to issues due to the use of stopPropagation for certain
  // events - specifically for drawers opened through the edit button. This test is to ensure that drawers
  // opened through the edit button can be saved using the hotkey.
  test('should save using hotkey in edit document drawer', async () => {
    await page.goto(url.create)
    // First fill out the relationship field, as it's required
    await openCreateDocDrawer(page, '#field-relationship')
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
    expect(relationshipDocuments.docs.length).toEqual(0)
  })

  // TODO: Fix this. This test flakes due to react select
  test.skip('should bypass min rows validation when no rows present and field is not required', async () => {
    await page.goto(url.create)
    // First fill out the relationship field, as it's required
    await openCreateDocDrawer(page, '#field-relationship')
    await page.locator('#field-relationship .value-container').click()
    await page.getByText('Seeded text document', { exact: true }).click()

    await saveDocAndAssert(page)
    await expect(page.locator('.payload-toast-container')).toContainText('successfully')
  })

  test('should fail min rows validation when rows are present', async () => {
    await page.goto(url.create)
    await page.waitForURL(url.create)
    // First fill out the relationship field, as it's required
    await openCreateDocDrawer(page, '#field-relationship')
    await page.locator('#field-relationship .value-container').click()
    await page.getByText('Seeded text document', { exact: true }).click()

    // Need to wait to allow for field to retrieve documents before the save occurs
    await wait(200)

    await page.locator('#field-relationshipWithMinRows .value-container').click()

    await page
      .locator('#field-relationshipWithMinRows .rs__option:has-text("Seeded text document")')
      .click()

    await page.click('#action-save', { delay: 100 })
    await expect(page.locator('.payload-toast-container')).toContainText(
      'The following field is invalid: relationshipWithMinRows',
    )
  })

  test('should sort relationship options by sortOptions property (ID in ascending order)', async () => {
    await page.goto(url.create)
    await page.waitForURL(url.create)
    await wait(400)

    const field = page.locator('#field-relationship')
    await wait(400)
    await field.click()
    await wait(400)

    const textDocsGroup = page.locator('.rs__group-heading:has-text("Text Fields")')
    const firstTextDocOption = textDocsGroup.locator('+div .rs__option').first()
    const firstOptionLabel = await firstTextDocOption.textContent()
    expect(firstOptionLabel.trim()).toBe('Another text document')
  })

  test('should sort relationHasManyPolymorphic options by sortOptions property: text-fields collection (items in descending order)', async () => {
    await page.goto(url.create)
    await page.waitForURL(url.create)

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
    await page.waitForURL(new RegExp(url.list))
    await wait(400)

    await page.locator('.list-controls__toggle-columns').click()
    await wait(400)

    await page.locator('.list-controls__toggle-where').click()
    await expect(page.locator('.list-controls__where.rah-static--height-auto')).toBeVisible()
    await wait(400)

    await page.locator('.where-builder__add-first-filter').click()

    await wait(400)
    const conditionField = page.locator('.condition__field')
    await expect(conditionField.locator('input')).toBeEnabled()
    await conditionField.click()
    await wait(400)

    const dropdownFieldOptions = conditionField.locator('.rs__option')
    await dropdownFieldOptions.locator('text=Relationship').nth(0).click()
    await wait(400)

    const operatorField = page.locator('.condition__operator')
    await expect(operatorField.locator('input')).toBeEnabled()
    await operatorField.click()
    await wait(400)

    const dropdownOperatorOptions = operatorField.locator('.rs__option')
    await dropdownOperatorOptions.locator('text=equals').click()
    await wait(400)

    const valueField = page.locator('.condition__value')
    await expect(valueField.locator('input')).toBeEnabled()
    await valueField.click()
    await wait(400)

    const dropdownValueOptions = valueField.locator('.rs__option')
    await dropdownValueOptions.locator('text=some text').click()
    await wait(400)

    await expect(page.locator(tableRowLocator)).toHaveCount(1)
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
