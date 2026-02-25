/* eslint-disable playwright/no-wait-for-selector */
import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import { assertToastErrors } from '../../../__helpers/shared/assertToastErrors.js'
import { copyPasteField } from '__helpers/e2e/copyPasteField.js'
import { addArrayRow, duplicateArrayRow, removeArrayRow } from '__helpers/e2e/fields/array/index.js'
import { scrollEntirePage } from '__helpers/e2e/scrollEntirePage.js'
import { toggleBlockOrArrayRow } from '__helpers/e2e/toggleCollapsible.js'
import path from 'path'
import { wait } from 'payload/shared'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../../../__helpers/shared/sdk/index.js'
import type { Config } from '../../payload-types.js'

import {
  ensureCompilationIsDone,
  initPageConsoleErrorCatch,
  saveDocAndAssert,
} from '../../../__helpers/e2e/helpers.js'
import { AdminUrlUtil } from '../../../__helpers/shared/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../../../__helpers/shared/initPayloadE2ENoConfig.js'
import { reInitializeDB } from '../../../__helpers/shared/clearAndSeed/reInitializeDB.js'
import { RESTClient } from '../../../__helpers/shared/rest.js'
import { TEST_TIMEOUT_LONG } from '../../../playwright.config.js'

const filename = fileURLToPath(import.meta.url)
const currentFolder = path.dirname(filename)
const dirname = path.resolve(currentFolder, '../../')

const { beforeAll, beforeEach, describe } = test

let payload: PayloadTestSDK<Config>
let client: RESTClient
let page: Page
let serverURL: string
// If we want to make this run in parallel: test.describe.configure({ mode: 'parallel' })

describe('Array', () => {
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

    if (client) {
      await client.logout()
    }
    client = new RESTClient({ defaultSlug: 'users', serverURL })
    await client.login()

    await ensureCompilationIsDone({ page, serverURL })
  })

  let url: AdminUrlUtil
  beforeAll(() => {
    url = new AdminUrlUtil(serverURL, 'array-fields')
  })

  async function loadCreatePage() {
    await page.goto(url.create)
    //ensure page is loaded
    await expect(page.locator('#field-title')).toBeVisible()
    await expect(page.locator('#field-title')).toBeEnabled()
    await expect(page.locator('.shimmer-effect')).toHaveCount(0)
  }

  test('should be readOnly', async () => {
    await loadCreatePage()
    const field = page.locator('#field-readOnly__0__text')
    await expect(field).toBeDisabled()
    await expect(page.locator('#field-readOnly .array-field__add-row')).toBeHidden()
  })

  test('should render RowLabel using a component', async () => {
    const label = 'custom row label as component'
    await loadCreatePage()
    await addArrayRow(page, { fieldName: 'rowLabelAsComponent' })
    await expect(page.locator('#field-rowLabelAsComponent__0__title')).toBeVisible()
    await expect(page.locator('.shimmer-effect')).toHaveCount(0)

    // ensure the default label does not blink in before form state returns
    const defaultRowLabelWasAttached = await page
      .waitForSelector('#field-rowLabelAsComponent .array-field__row-header .row-label', {
        state: 'attached',
        timeout: 100, // A small timeout to catch any transient rendering
      })
      .catch(() => false) // If it doesn't appear, this resolves to `false`

    await expect.poll(() => defaultRowLabelWasAttached).toBeFalsy()

    await expect(page.locator('#field-rowLabelAsComponent #custom-array-row-label')).toBeVisible()

    await page.locator('#field-rowLabelAsComponent__0__title').fill(label)

    const customRowLabel = page.locator(
      '#rowLabelAsComponent-row-0 >> .array-field__row-header > :text("custom row label")',
    )
    await expect(customRowLabel).toBeVisible()

    await expect(customRowLabel).toHaveCSS('text-transform', 'uppercase')
  })

  test('should render custom RowLabel after duplicating array item', async () => {
    const label = 'test custom row label'
    const updatedLabel = 'updated custom row label'
    await loadCreatePage()
    await addArrayRow(page, { fieldName: 'rowLabelAsComponent' })

    await page.locator('#field-rowLabelAsComponent__0__title').fill(label)

    const customRowLabel = page.locator(
      '#rowLabelAsComponent-row-0 >> .array-field__row-header > :text("test custom row label")',
    )

    await expect(customRowLabel).toBeVisible()
    await expect(customRowLabel).toHaveCSS('text-transform', 'uppercase')

    await duplicateArrayRow(page, { fieldName: 'rowLabelAsComponent' })

    await expect(page.locator('#rowLabelAsComponent-row-1')).toBeVisible()
    await expect(
      page.locator(
        '#rowLabelAsComponent-row-1 >> .array-field__row-header > :text("test custom row label")',
      ),
    ).toBeVisible()

    await page.locator('#field-rowLabelAsComponent__1__title').fill(updatedLabel)
    const duplicatedRowLabel = page.locator(
      '#rowLabelAsComponent-row-1 >> .array-field__row-header > :text("updated custom row label")',
    )

    await expect(duplicatedRowLabel).toBeVisible()
    await expect(duplicatedRowLabel).toHaveCSS('text-transform', 'uppercase')
  })

  test('should render default array field within custom component', async () => {
    await loadCreatePage()
    await addArrayRow(page, { fieldName: 'customArrayField' })
    await expect(page.locator('#field-customArrayField__0__text')).toBeVisible()
  })

  test('should bypass min rows validation when no rows present and field is not required', async () => {
    await loadCreatePage()
    await saveDocAndAssert(page)
  })

  test('should fail min rows validation when rows are present', async () => {
    await loadCreatePage()
    await addArrayRow(page, { fieldName: 'arrayWithMinRows' })

    // Ensure new array row is visible and fields are rendered
    await expect(page.locator('#arrayWithMinRows-row-0')).toBeVisible()
    await expect(
      page.locator('#arrayWithMinRows-row-0 #field-arrayWithMinRows__0__text'),
    ).toBeVisible()
    await expect(page.locator('.shimmer-effect')).toHaveCount(0)

    await page.click('#action-save', { delay: 100 })
    await assertToastErrors({
      page,
      errors: ['Array With Min Rows'],
    })
  })

  test('should show singular label for array rows', async () => {
    await loadCreatePage()
    await expect(page.locator('#field-items #items-row-0 .row-label')).toContainText('Item 01')
  })

  test('ensure functions passed to array field labels property are respected', async () => {
    await loadCreatePage()

    const arrayWithLabelsField = page.locator('#field-arrayWithLabels')
    await expect(arrayWithLabelsField.locator('.array-field__add-row')).toHaveText('Add Account')
  })

  describe('row manipulation', () => {
    test('should add rows', async () => {
      const row1Text = 'Array row 1'
      const row2Text = 'Array row 2'
      const row3Text = 'Array row 3'

      const row1GroupText = 'text in group in row 1'

      await loadCreatePage()
      await scrollEntirePage(page)

      await addArrayRow(page, { fieldName: 'potentiallyEmptyArray' })
      await addArrayRow(page, { fieldName: 'potentiallyEmptyArray' })
      await addArrayRow(page, { fieldName: 'potentiallyEmptyArray' })

      await page.locator('#field-potentiallyEmptyArray__0__text').fill(row1Text)
      await page.locator('#field-potentiallyEmptyArray__1__text').fill(row2Text)
      await page.locator('#field-potentiallyEmptyArray__2__text').fill(row3Text)

      await page.locator('#field-potentiallyEmptyArray__0__group__text').fill(row1GroupText)

      await saveDocAndAssert(page)
      await scrollEntirePage(page)

      await expect(page.locator('#field-potentiallyEmptyArray__0__text')).toHaveValue(row1Text)
      await expect(page.locator('#field-potentiallyEmptyArray__1__text')).toHaveValue(row2Text)
      await expect(page.locator('#field-potentiallyEmptyArray__2__text')).toHaveValue(row3Text)

      const input = page.locator('#field-potentiallyEmptyArray__0__group__text')

      await expect(input).toHaveValue(row1GroupText)
    })

    test('should duplicate rows', async () => {
      const row1Text = 'Array row 1'
      const row2Text = 'Array row 2'
      const row3Text = 'Array row 3'

      await loadCreatePage()
      await scrollEntirePage(page)

      await addArrayRow(page, { fieldName: 'potentiallyEmptyArray' })
      await addArrayRow(page, { fieldName: 'potentiallyEmptyArray' })
      await addArrayRow(page, { fieldName: 'potentiallyEmptyArray' })

      await page.locator('#field-potentiallyEmptyArray__0__text').fill(row1Text)
      await page.locator('#field-potentiallyEmptyArray__1__text').fill(row2Text)
      await page.locator('#field-potentiallyEmptyArray__2__text').fill(row3Text)

      await page.locator('#field-potentiallyEmptyArray__0__text').fill(row1Text)

      // Mark the first row with some unique values to assert against later
      await page
        .locator('#field-potentiallyEmptyArray__0__group__text')
        .fill(`${row1Text} duplicate`)

      await duplicateArrayRow(page, { fieldName: 'potentiallyEmptyArray' })

      await saveDocAndAssert(page)
      await scrollEntirePage(page)

      await page.locator('#field-potentiallyEmptyArray__0__text').fill(row1Text)
      await page.locator('#field-potentiallyEmptyArray__1__text').fill(row1Text)
      await page.locator('#field-potentiallyEmptyArray__2__text').fill(row2Text)
      await page.locator('#field-potentiallyEmptyArray__3__text').fill(row3Text)

      await expect(page.locator('#field-potentiallyEmptyArray__1__group__text')).toHaveValue(
        `${row1Text} duplicate`,
      )
    })

    test('should duplicate rows with nested arrays', async () => {
      await loadCreatePage()
      await scrollEntirePage(page)

      await addArrayRow(page, { fieldName: 'potentiallyEmptyArray' })
      await addArrayRow(page, { fieldName: 'potentiallyEmptyArray__0__array' })

      await page.locator('#field-potentiallyEmptyArray__0__array__0__text').fill('Row 1')

      // There should be 2 fields in the nested array row: the text field and the row id
      const fieldsInRow = page
        .locator('#field-potentiallyEmptyArray__0__array')
        .locator('.render-fields')
        .first()

      await expect(fieldsInRow.locator('> *')).toHaveCount(2)

      await duplicateArrayRow(page, { fieldName: 'potentiallyEmptyArray' })

      // There should still only be 2 fields in the duplicated row
      const fieldsInDuplicatedRow = page
        .locator('#field-potentiallyEmptyArray__1__array')
        .locator('.render-fields')
        .first()

      await expect(fieldsInDuplicatedRow.locator('> *')).toHaveCount(2)
    })

    test('should remove rows', async () => {
      const row1Text = 'Array row 1'
      const row2Text = 'Array row 2'
      const row3Text = 'Array row 3'

      const assertGroupText3 = 'text in group in row 3'

      await loadCreatePage()
      await scrollEntirePage(page)

      await addArrayRow(page, { fieldName: 'potentiallyEmptyArray' })
      await addArrayRow(page, { fieldName: 'potentiallyEmptyArray' })
      await addArrayRow(page, { fieldName: 'potentiallyEmptyArray' })

      await page.locator('#field-potentiallyEmptyArray__0__text').fill(row1Text)
      await page.locator('#field-potentiallyEmptyArray__1__text').fill(row2Text)
      await page.locator('#field-potentiallyEmptyArray__2__text').fill(row3Text)

      // Mark the third row with some unique values to assert against later
      await page.locator('#field-potentiallyEmptyArray__2__group__text').fill(assertGroupText3)

      // Remove all rows one by one, except the last one
      await removeArrayRow(page, { fieldName: 'potentiallyEmptyArray', rowIndex: 1 })
      await removeArrayRow(page, { fieldName: 'potentiallyEmptyArray', rowIndex: 0 })

      await saveDocAndAssert(page)
      await scrollEntirePage(page)

      // Expect the remaining row to be the third row, now first
      await expect(page.locator('#field-potentiallyEmptyArray__0__group__text')).toHaveValue(
        assertGroupText3,
      )
    })
  })

  // TODO: re-enable this test
  test.skip('should bulk update', async () => {
    await payload.create({
      collection: 'array-fields',
      data: {
        title: 'for test 1',
        items: [
          {
            text: 'test 1',
          },
          {
            text: 'test 2',
          },
        ],
      },
    })

    await payload.create({
      collection: 'array-fields',
      data: {
        title: 'for test 2',
        items: [
          {
            text: 'test 3',
          },
        ],
      },
    })

    await payload.create({
      collection: 'array-fields',
      data: {
        title: 'for test 3',
        items: [
          {
            text: 'test 4',
          },
          {
            text: 'test 5',
          },
          {
            text: 'test 6',
          },
        ],
      },
    })

    const bulkText = 'Bulk update text'
    await page.goto(url.list)
    await page.waitForSelector('.table > table > tbody > tr td.cell-title')
    const rows = page.locator('.table > table > tbody > tr', {
      has: page.locator('td.cell-title a', {
        hasText: 'for test',
      }),
    })
    const count = await rows.count()

    for (let i = 0; i < count; i++) {
      await rows
        .nth(i)
        .locator('td.cell-_select .checkbox-input__input > input[type="checkbox"]')
        .click()
    }
    await page.locator('.edit-many__toggle').click()
    await page.locator('.field-select .rs__control').click()

    const arrayOption = page.locator('.rs__option', {
      hasText: 'Items',
    })

    await expect(arrayOption).toBeVisible()

    await arrayOption.click()
    await wait(200)

    await addArrayRow(page, { fieldName: 'items' })

    await wait(200)

    const targetInput = page.locator('#field-items__0__text')

    await expect(targetInput).toBeVisible()

    await targetInput.fill(bulkText)

    await page.locator('#edit-array-fields .form-submit .edit-many__save').click()
    await expect(page.locator('.payload-toast-container .toast-success')).toContainText(
      'Updated 3 Array Fields successfully.',
    )
  })

  test('should externally update array rows and render custom fields', async () => {
    await loadCreatePage()
    await page.locator('#updateArrayExternally').click()
    await expect(page.locator('#custom-text-field')).toBeVisible()
  })

  test('should initialize array rows with collapsed state', async () => {
    await page.goto(url.create)

    await addArrayRow(page, { fieldName: 'collapsedArray' })

    const row = page.locator(`#collapsedArray-row-0`)
    const toggler = row.locator('button.collapsible__toggle')

    await expect(toggler).toHaveClass(/collapsible__toggle--collapsed/)
    await expect(page.locator(`#field-collapsedArray__0__text`)).toBeHidden()
  })

  test('should not collapse array rows on input change', async () => {
    await page.goto(url.create)

    await addArrayRow(page, { fieldName: 'collapsedArray' })

    const row = page.locator(`#collapsedArray-row-0`)
    const toggler = row.locator('button.collapsible__toggle')

    await expect(toggler).toHaveClass(/collapsible__toggle--collapsed/)
    await expect(page.locator(`#field-collapsedArray__0__text`)).toBeHidden()

    await toggleBlockOrArrayRow({
      page,
      rowIndex: 0,
      fieldName: 'collapsedArray',
      targetState: 'open',
    })

    await page.locator('input#field-collapsedArray__0__text').fill('Hello, world!')

    // wait for form state to return, in the future can wire this into watch network requests (if needed)
    await wait(1000)

    await expect(toggler).toHaveClass(/collapsible__toggle--open/)
    await expect(page.locator(`#field-collapsedArray__0__text`)).toBeVisible()
  })

  describe('sortable arrays', () => {
    test('should have disabled admin sorting', async () => {
      await loadCreatePage()
      const field = page.locator('#field-disableSort > div > div > .array-actions__action-chevron')
      expect(await field.count()).toEqual(0)
    })

    test('the drag handle should be hidden', async () => {
      await loadCreatePage()
      const field = page.locator(
        '#field-disableSort > .blocks-field__rows > div > div > .collapsible__drag',
      )
      expect(await field.count()).toEqual(0)
    })
  })

  describe('copy paste', () => {
    test('should prevent copying an empty array field', async () => {
      await page.goto(url.create)
      const arrayFieldPopupBtn = page.locator(
        '#field-collapsedArray .popup.clipboard-action__popup button.popup-button',
      )
      await arrayFieldPopupBtn.click()
      const disabledCopyBtn = page.locator(
        '.popup__content div.popup-button-list__disabled:has-text("Copy Field")',
      )
      await expect(disabledCopyBtn).toBeVisible()
    })

    test('should prevent pasting into readonly array field', async () => {
      await page.goto(url.create)
      await copyPasteField({
        fieldName: 'readOnly',
        page,
      })
      const popupBtn = page.locator(
        '#field-readOnly .popup.clipboard-action__popup button.popup-button',
      )
      await expect(popupBtn).toBeVisible()
      await popupBtn.click()
      const disabledPasteBtn = page.locator(
        '.popup__content div.popup-button-list__disabled:has-text("Paste Field")',
      )
      await expect(disabledPasteBtn).toBeVisible()
    })

    test('should prevent pasting into array field with different schema', async () => {
      await page.goto(url.create)
      await copyPasteField({
        fieldName: 'readOnly',
        page,
      })
      await copyPasteField({
        fieldName: 'items',
        page,
        action: 'paste',
      })
      const pasteErrorToast = page
        .locator('.payload-toast-item.toast-error')
        .filter({ hasText: 'Invalid clipboard data.' })
      await expect(pasteErrorToast).toBeVisible()
    })

    test('should copy and paste array fields', async () => {
      await page.goto(url.create)
      const arrayField = page.locator('#field-items')
      const row = arrayField.locator('#items-row-0')
      const rowTextInput = row.locator('#field-items__0__text')

      const textVal = 'row one copy'
      await rowTextInput.fill(textVal)

      await copyPasteField({
        page,
        fieldName: 'items',
      })

      await page.reload()

      await expect(rowTextInput).toHaveValue('row one')

      await copyPasteField({
        page,
        action: 'paste',
        fieldName: 'items',
      })

      await expect(rowTextInput).toHaveValue(textVal)
    })

    test('should copy and paste array rows', async () => {
      await page.goto(url.create)
      const arrayField = page.locator('#field-items')
      const row = arrayField.locator('#items-row-0')
      const rowTextInput = row.locator('#field-items__0__text')

      const textVal = 'row one copy'
      await rowTextInput.fill(textVal)

      await copyPasteField({
        page,
        fieldName: 'items',
        rowIndex: 0,
      })

      await page.reload()

      await expect(rowTextInput).toHaveValue('row one')

      await copyPasteField({
        page,
        action: 'paste',
        fieldName: 'items',
        rowIndex: 0,
      })

      await expect(rowTextInput).toHaveValue(textVal)
    })

    test('should copy an array row and paste into a field with the same schema', async () => {
      await page.goto(url.create)

      await copyPasteField({
        page,
        fieldName: 'localized',
        rowIndex: 0,
      })

      await copyPasteField({
        page,
        fieldName: 'disableSort',
        action: 'paste',
      })

      const rowsContainer = page
        .locator('#field-disableSort > div.array-field__draggable-rows')
        .first()
      await expect(rowsContainer).toBeVisible()
      const rowTextInput = rowsContainer.locator('#field-disableSort__0__text')
      await expect(rowTextInput).toHaveValue('row one')
    })

    test('should copy an array field and paste into a row with the same schema', async () => {
      await page.goto(url.create)

      await copyPasteField({
        page,
        fieldName: 'localized',
      })

      const field = page.locator('#field-disableSort')
      const addArrayBtn = field
        .locator('button.array-field__add-row')
        .filter({ hasText: 'Add Disable Sort' })
      await expect(addArrayBtn).toBeVisible()
      await addArrayBtn.click()

      const row = field.locator('#disableSort-row-0')
      await expect(row).toBeVisible()

      await copyPasteField({ page, action: 'paste', fieldName: 'disableSort' })

      const rowsContainer = page
        .locator('#field-disableSort > div.array-field__draggable-rows')
        .first()
      await expect(rowsContainer).toBeVisible()
      const rowTextInput = rowsContainer.locator('#field-disableSort__0__text')
      await expect(rowTextInput).toHaveValue('row one')
    })

    test('should correctly paste a row with nested arrays into a row with no children', async () => {
      await page.goto(url.create)

      const field = page.locator('#field-items')

      await addArrayRow(page, { fieldName: 'items__0__subArray' })

      const textInputRowOne = field.locator('#field-items__0__subArray__0__text')
      await expect(textInputRowOne).toBeVisible()

      const textInputRowOneValue = 'sub array row one'
      await textInputRowOne.fill(textInputRowOneValue)

      await copyPasteField({
        page,
        fieldName: 'items',
        rowIndex: 0,
      })

      await copyPasteField({
        page,
        fieldName: 'items',
        rowIndex: 1,
        action: 'paste',
      })

      const textInputRowTwo = field.locator('#field-items__1__subArray__0__text')
      await expect(textInputRowTwo).toBeVisible()
      await expect(textInputRowTwo).toHaveValue(textInputRowOneValue)
    })

    test('should replace the rows of a nested array field with those of its paste counterpart', async () => {
      await page.goto(url.create)

      const field = page.locator('#field-items')

      await addArrayRow(page, { fieldName: 'items__0__subArray' })
      await addArrayRow(page, { fieldName: 'items__0__subArray' })

      await addArrayRow(page, { fieldName: 'items__1__subArray' })

      const subArrayContainer = field.locator(
        '#field-items__0__subArray > div.array-field__draggable-rows > div',
      )
      const subArrayContainer2 = field.locator(
        '#field-items__1__subArray > div.array-field__draggable-rows > div',
      )
      await expect(subArrayContainer).toHaveCount(2)
      await expect(subArrayContainer2).toHaveCount(1)

      await copyPasteField({
        page,
        fieldName: 'items',
        rowIndex: 1,
      })

      await copyPasteField({
        page,
        fieldName: 'items',
        rowIndex: 0,
        action: 'paste',
      })

      await expect(subArrayContainer).toHaveCount(1)
      await expect(subArrayContainer2).toHaveCount(1)
    })
  })
  test('should return empty array from getDataByPath for array fields without rows', async () => {
    await page.goto(url.create)

    // Wait for the test component to render
    await page.waitForSelector('#getDataByPath-test')

    // Check that getDataByPath returned an empty array, not 0
    await expect(page.locator('#empty-array-result')).toHaveText('ARRAY')
    await expect(page.locator('#empty-array-length')).toHaveText('0')
  })
})
