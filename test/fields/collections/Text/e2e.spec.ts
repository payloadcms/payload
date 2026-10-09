import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import path from 'path'
import { wait } from 'payload/shared'
import { fileURLToPath } from 'url'

import type { PayloadCollection } from '../../../__helpers/e2e/adminPageModel/index.js'
import type { Config, TextField } from '../../payload-types.js'

import { createPayloadAdmin } from '../../../__helpers/e2e/adminPageModel/index.js'
import {
  getColumnSelectorItem,
  openListColumns,
  toggleColumn,
} from '../../../__helpers/e2e/columns/index.js'
import { addListFilter } from '../../../__helpers/e2e/filters/index.js'
import { exactText, saveDocAndAssert, selectTableRow } from '../../../__helpers/e2e/helpers.js'
import { openListDocument } from '../../../__helpers/e2e/openListDocument.js'
import { runAxeScan } from '../../../__helpers/e2e/runAxeScan.js'
import { reInitializeDB } from '../../../__helpers/shared/clearAndSeed/reInitializeDB.js'
import { initPayloadE2ENoConfig } from '../../../__helpers/shared/initPayloadE2ENoConfig.js'
import { RESTClient } from '../../../__helpers/shared/rest.js'
import { ensureCompilationIsDone } from '../../../__setup/e2e/ensureCompilationIsDone.js'
import { initPage } from '../../../__setup/e2e/initPage.js'
import { TEST_TIMEOUT_LONG } from '../../../playwright.config.js'
import { adminPageModel } from '../../admin-page-model.generated.js'
import { textFieldsSlug } from '../../slugs.js'
import { textDoc } from './shared.js'

const filename = fileURLToPath(import.meta.url)
const currentFolder = path.dirname(filename)
const dirname = path.resolve(currentFolder, '../../')

const { beforeAll, beforeEach, describe } = test

let client: RESTClient
let page: Page
let serverURL: string
let textFields: PayloadCollection<typeof adminPageModel, 'text-fields'>
// If we want to make this run in parallel: test.describe.configure({ mode: 'parallel' })

describe('Text', () => {
  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    ;({ serverURL } = await initPayloadE2ENoConfig<Config>({
      dirname,
      // prebuild,
    }))

    const context = await browser.newContext()
    ;({ page } = await initPage({ context, serverURL }))
    textFields = createPayloadAdmin({ model: adminPageModel, page, serverURL }).collection(
      'text-fields',
    )
  })
  beforeEach(async () => {
    await reInitializeDB({
      serverURL,
    })

    if (client) {
      await client.logout()
    }
    client = new RESTClient({ defaultSlug: 'users', serverURL })
    await client.login()

    await ensureCompilationIsDone({ page, serverURL })
  })

  describe('hidden and disabled fields', () => {
    test('should not render top-level hidden fields in the UI', async () => {
      await textFields.create.goto()
      await expect(textFields.fields.hiddenTextField.input).toBeHidden()
      await textFields.list.goto()
      await expect(textFields.fields.hiddenTextField.cell(0)).toBeHidden()
      await expect(textFields.fields.hiddenTextField.heading).toBeHidden()

      const { columnContainer } = await openListColumns(page, {})

      await expect(
        getColumnSelectorItem({ container: columnContainer, label: 'Hidden Text Field' }),
      ).toBeHidden()

      await selectTableRow(page, 'Seeded text document')
      await page.locator('.edit-many__toggle').click()
      await page.locator('.field-select .rs__control').click()

      const hiddenFieldOption = page.locator('.rs__option', {
        hasText: exactText('Hidden Text Field'),
      })

      await expect(hiddenFieldOption).toBeHidden()
    })

    test('should not show disabled fields in the UI', async () => {
      await textFields.create.goto()
      await expect(textFields.fields.disabledTextField.input).toHaveCount(0)
      await textFields.list.goto()
      await expect(textFields.fields.disabledTextField.cell(0)).toBeHidden()
      await expect(textFields.fields.disabledTextField.heading).toBeHidden()

      const { columnContainer } = await openListColumns(page, {})

      await expect(
        getColumnSelectorItem({ container: columnContainer, label: 'Disabled Text Field' }),
      ).toBeHidden()

      await selectTableRow(page, 'Seeded text document')

      await page.locator('.edit-many__toggle').click()

      await page.locator('.field-select .rs__control').click()

      const disabledFieldOption = page.locator('.rs__option', {
        hasText: exactText('Disabled Text Field'),
      })

      await expect(disabledFieldOption).toBeHidden()
    })

    test('should render hidden input for admin.hidden fields', async () => {
      await textFields.create.goto()
      await expect(textFields.fields.adminHiddenTextField.input).toHaveAttribute('type', 'hidden')
      await textFields.list.goto()
      await expect(textFields.fields.adminHiddenTextField.cell(0).first()).toBeVisible()
      await expect(textFields.fields.adminHiddenTextField.heading).toBeVisible()

      const { columnContainer } = await openListColumns(page, {})

      await expect(
        getColumnSelectorItem({ container: columnContainer, label: 'Admin Hidden Text Field' }),
      ).toBeVisible()

      await selectTableRow(page, 'Seeded text document')
      await page.locator('.edit-many__toggle').click()
      await page.locator('.field-select .rs__control').click()

      const adminHiddenFieldOption = page.locator('.rs__option', {
        hasText: exactText('Admin Hidden Text Field'),
      })

      await expect(adminHiddenFieldOption).toBeVisible()
    })

    test('hidden and disabled fields should not break subsequent field paths', async () => {
      await textFields.create.goto()
      await expect(page.locator('#custom-field-schema-path')).toHaveText('text-fields._index-4')
    })
  })

  test('should display field in list view', async () => {
    await textFields.list.goto()
    await expect(textFields.fields.text.cell(0)).toHaveText(textDoc.text)
  })

  test('should open the first list document by default and accept an index', async () => {
    await textFields.list.goto()

    const rows = page.locator('table > tbody > tr')
    const firstDocumentID = await rows.nth(0).getAttribute('data-id')
    const secondDocumentID = await rows.nth(1).getAttribute('data-id')

    if (firstDocumentID === null || secondDocumentID === null) {
      throw new Error('Expected both list rows to include a document ID.')
    }

    await openListDocument({ page })
    await expect(page).toHaveURL(textFields.document(firstDocumentID).url)

    await textFields.list.goto()
    await openListDocument({ index: 1, page })
    await expect(page).toHaveURL(textFields.document(secondDocumentID).url)
  })

  test('should report context for an out-of-range list document', async () => {
    await textFields.list.goto()

    let listDocumentError: unknown

    try {
      await openListDocument({ index: 5, page })
    } catch (error) {
      listDocumentError = error
    }

    expect(listDocumentError).toBeInstanceOf(Error)

    const message = (listDocumentError as Error).message

    expect(message).toContain('toHaveCount')
    expect(message).toContain('Locator:')
    expect(message).toContain('Expected:')
    expect(message).toContain('Received:')
    expect(message).toContain('Call log:')
    expect(message).toContain('Could not open list document at index 5.')
    expect(message).toContain('Available rows: 2')
    expect(message).toContain('Valid indexes: 0-1')
  })

  test('should report context for an out-of-range array row', async () => {
    await textFields.create.goto()

    let rowError: unknown

    try {
      await textFields.fields.array.row(5)
    } catch (error) {
      rowError = error
    }

    expect(rowError).toBeInstanceOf(Error)

    const message = (rowError as Error).message

    expect(message).toContain('toHaveCount')
    expect(message).toContain('Locator:')
    expect(message).toContain('Expected:')
    expect(message).toContain('Received:')
    expect(message).toContain('Call log:')
    expect(message).toContain('Could not resolve row 5 for "array".')
    expect(message).toContain('Collection: text-fields')
    expect(message).toContain('Scope: document page')
    expect(message).toContain('Field path: array')
    expect(message).toContain('Available rows: 0')
    expect(message).toContain('Valid indexes: none')
  })

  test('should edit nested text values in an array and block', async () => {
    await textFields.create.goto()
    await textFields.fields.text.fill('Nested text document')
    await textFields.fields.text.expectValue('Nested text document')

    const arrayRow = await textFields.fields.array.addRow()
    await arrayRow.fields.texts.addValue('Array text')

    const blockRow = await textFields.fields.blocks.addBlock('blockWithText')
    await blockRow.fields.texts.addValue('Block text')

    await saveDocAndAssert(page)

    const documentID = page.url().split('/').at(-1)
    if (!documentID) {
      throw new Error('Expected the saved document URL to include a document ID.')
    }

    const { doc } = await client.findByID<TextField>({
      id: documentID,
      slug: textFieldsSlug,
      auth: true,
    })

    expect(doc.array?.[0]?.texts).toEqual(['Array text'])
    expect(doc.blocks?.[0]?.texts).toEqual(['Block text'])
  })

  test('should display i18n label in cells when missing field data', async () => {
    await textFields.list.goto()
    await page.waitForURL(new RegExp(`${textFields.list.url}.*\\?.*`))

    await toggleColumn(page, {
      columnLabel: 'Text en',
      columnName: 'i18nText',
      targetState: 'on',
    })

    await expect(textFields.fields.i18nText.cell(0)).toHaveText('<No Text en>')
  })

  test('should show i18n label', async () => {
    await textFields.create.goto()

    await expect(
      textFields.fields.i18nText.wrapper.locator(
        `label[for="${textFields.fields.i18nText.inputID}"]`,
      ),
    ).toHaveText('Text en')
  })

  test('should show i18n placeholder', async () => {
    await textFields.create.goto()
    await expect(textFields.fields.i18nText.input).toHaveAttribute('placeholder', 'en placeholder')
  })

  test('should show i18n descriptions', async () => {
    await textFields.create.goto()
    await expect(textFields.fields.i18nText.wrapper.locator('.field-description')).toHaveText(
      'en description',
    )
  })

  test('should create hasMany with multiple texts', async () => {
    const input = 'five'
    const furtherInput = 'six'

    await textFields.create.goto()
    await textFields.fields.text.fill(input)
    await textFields.fields.hasMany.addValue(input)
    await textFields.fields.hasMany.addValue(furtherInput)
    await saveDocAndAssert(page)
    await textFields.fields.hasMany.expectValues([input, furtherInput])
  })

  test('should allow editing hasMany text field values by clicking', async () => {
    const originalText = 'original'
    const newText = 'new'

    await textFields.create.goto()
    await textFields.fields.text.fill(originalText)
    await textFields.fields.hasMany.addValue(originalText)

    const value = await textFields.fields.hasMany.value(0)
    await value.fill(newText)

    await saveDocAndAssert(page)
    await textFields.fields.hasMany.expectValues([newText])
  })

  test('should not allow editing hasMany text field values when disabled', async () => {
    await textFields.create.goto()
    const field = textFields.fields.readOnlyHasMany
    const value = await field.value(0)

    // Try to click to edit
    await value.wrapper.click({ force: true })

    // Verify it does not become editable
    await expect(value.wrapper).not.toHaveClass(/.*--editable/)
  })

  test('should filter Text field hasMany: false in the collection list view - in', async () => {
    await textFields.list.goto()
    await expect(page.locator('table >> tbody >> tr')).toHaveCount(2)

    await addListFilter({
      fieldLabel: 'Text',
      operatorLabel: 'is in',
      page,
      value: 'Another text document',
    })

    await wait(300)
    await expect(page.locator('table >> tbody >> tr')).toHaveCount(1)
  })

  test('should filter Text field hasMany: false in the collection list view - is not in', async () => {
    await textFields.list.goto()
    await expect(page.locator('table >> tbody >> tr')).toHaveCount(2)

    await addListFilter({
      fieldLabel: 'Text',
      operatorLabel: 'is not in',
      page,
      value: 'Another text document',
    })

    await wait(300)
    await expect(page.locator('table >> tbody >> tr')).toHaveCount(1)
  })

  test('should filter Text field hasMany: true in the collection list view - in', async () => {
    await textFields.list.goto()
    await expect(page.locator('table >> tbody >> tr')).toHaveCount(2)

    await addListFilter({
      fieldLabel: 'Has Many',
      operatorLabel: 'is in',
      page,
      value: 'one',
    })

    await wait(300)
    await expect(page.locator('table >> tbody >> tr')).toHaveCount(1)
  })

  test('should filter Text field hasMany: true in the collection list view - is not in', async () => {
    await textFields.list.goto()
    await expect(page.locator('table >> tbody >> tr')).toHaveCount(2)

    await addListFilter({
      fieldLabel: 'Has Many',
      operatorLabel: 'is not in',
      page,
      value: 'four',
    })

    await wait(300)
    await expect(page.locator('table >> tbody >> tr')).toHaveCount(1)
  })

  test('should filter Text field hasMany: true in the collection list view - contains single value', async () => {
    await textFields.list.goto()
    await expect(page.locator('table >> tbody >> tr')).toHaveCount(2)

    await addListFilter({
      fieldLabel: 'Has Many',
      operatorLabel: 'contains',
      page,
      value: 'two',
    })

    await wait(300)
    await expect(page.locator('table >> tbody >> tr')).toHaveCount(1)
  })

  test('should filter Text field hasMany: true in the collection list view - contains multiple values', async () => {
    await textFields.list.goto()
    await expect(page.locator('table >> tbody >> tr')).toHaveCount(2)

    // Add filter with first value
    const { condition } = await addListFilter({
      fieldLabel: 'Has Many',
      operatorLabel: 'contains',
      page,
      value: 'one',
    })

    // Add second value to the same filter
    const valueInput = condition.locator('.condition__value input')
    await valueInput.click()
    await page.keyboard.type('three')
    await page.keyboard.press('Enter')

    await wait(300)
    await expect(page.locator('table >> tbody >> tr')).toHaveCount(2)
  })

  describe.skip('A11y', () => {
    test.fixme('Edit view should have no accessibility violations', async ({}, testInfo) => {
      await textFields.create.goto()
      await textFields.fields.text.input.waitFor()

      const scanResults = await runAxeScan({
        exclude: ['[id*="react-select-"]'], // ignore react-select elements here
        include: ['.document-fields__main'],
        page,
        testInfo,
      })

      expect(scanResults.violations.length).toBe(0)
    })
  })
})
