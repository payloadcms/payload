import type { Page } from '@playwright/test'
import type { GeneratedTypes } from 'helpers/sdk/types.js'

import { expect, test } from '@playwright/test'
import { addListFilter } from 'helpers/e2e/addListFilter.js'
import { openListColumns } from 'helpers/e2e/openListColumns.js'
import { upsertPreferences } from 'helpers/e2e/preferences.js'
import { toggleColumn } from 'helpers/e2e/toggleColumn.js'
import path from 'path'
import { wait } from 'payload/shared'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../../../helpers/sdk/index.js'
import type { Config } from '../../payload-types.js'

import {
  ensureCompilationIsDone,
  exactText,
  initPageConsoleErrorCatch,
  saveDocAndAssert,
  selectTableRow,
} from '../../../helpers.js'
import { AdminUrlUtil } from '../../../helpers/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../../../helpers/initPayloadE2ENoConfig.js'
import { reInitializeDB } from '../../../helpers/reInitializeDB.js'
import { RESTClient } from '../../../helpers/rest.js'
import { TEST_TIMEOUT_LONG } from '../../../playwright.config.js'
import { textFieldsSlug } from '../../slugs.js'
import { textDoc } from './shared.js'

const filename = fileURLToPath(import.meta.url)
const currentFolder = path.dirname(filename)
const dirname = path.resolve(currentFolder, '../../')

const { beforeAll, beforeEach, describe } = test

let payload: PayloadTestSDK<Config>
let client: RESTClient
let page: Page
let serverURL: string
// If we want to make this run in parallel: test.describe.configure({ mode: 'parallel' })
let url: AdminUrlUtil

describe('Text', () => {
  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    process.env.SEED_IN_CONFIG_ONINIT = 'false' // Makes it so the payload config onInit seed is not run. Otherwise, the seed would be run unnecessarily twice for the initial test run - once for beforeEach and once for onInit
    ;({ payload, serverURL } = await initPayloadE2ENoConfig<Config>({
      dirname,
      // prebuild,
    }))
    url = new AdminUrlUtil(serverURL, textFieldsSlug)

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

  describe('hidden and disabled fields', () => {
    test('should not render top-level hidden fields in the UI', async () => {
      await page.goto(url.create)
      await expect(page.locator('#field-hiddenTextField')).toBeHidden()
      await page.goto(url.list)
      await expect(page.locator('.cell-hiddenTextField')).toBeHidden()
      await expect(page.locator('#heading-hiddenTextField')).toBeHidden()

      const { columnContainer } = await openListColumns(page, {})

      await expect(
        columnContainer.locator('.column-selector__column', {
          hasText: exactText('Hidden Text Field'),
        }),
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
      await page.goto(url.create)
      await expect(page.locator('#field-disabledTextField')).toHaveCount(0)
      await page.goto(url.list)
      await expect(page.locator('.cell-disabledTextField')).toBeHidden()
      await expect(page.locator('#heading-disabledTextField')).toBeHidden()

      const { columnContainer } = await openListColumns(page, {})

      await expect(
        columnContainer.locator('.column-selector__column', {
          hasText: exactText('Disabled Text Field'),
        }),
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
      await page.goto(url.create)
      await expect(page.locator('#field-adminHiddenTextField')).toHaveAttribute('type', 'hidden')
      await page.goto(url.list)
      await expect(page.locator('.cell-adminHiddenTextField').first()).toBeVisible()
      await expect(page.locator('#heading-adminHiddenTextField')).toBeVisible()

      const { columnContainer } = await openListColumns(page, {})

      await expect(
        columnContainer.locator('.column-selector__column', {
          hasText: exactText('Admin Hidden Text Field'),
        }),
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
      await page.goto(url.create)
      await expect(page.locator('#custom-field-schema-path')).toHaveText('text-fields._index-4')
    })
  })

  test('should display field in list view', async () => {
    await page.goto(url.list)
    const textCell = page.locator('.row-1 .cell-text')
    await expect(textCell).toHaveText(textDoc.text)
  })

  test('should respect admin.disableListColumn despite preferences', async () => {
    await upsertPreferences<Config, GeneratedTypes<any>>({
      payload,
      user: client.user,
      key: 'text-fields-list',
      value: {
        columns: [
          {
            accessor: 'disableListColumnText',
            active: true,
          },
        ],
      },
    })

    await page.goto(url.list)
    await openListColumns(page, {})
    await expect(
      page.locator(`.column-selector .column-selector__column`, {
        hasText: exactText('Disable List Column Text'),
      }),
    ).toBeHidden()

    await expect(page.locator('#heading-disableListColumnText')).toBeHidden()
    await expect(page.locator('table .row-1 .cell-disableListColumnText')).toBeHidden()
  })

  test('should display i18n label in cells when missing field data', async () => {
    await page.goto(url.list)
    await page.waitForURL(new RegExp(`${url.list}.*\\?.*`))

    await toggleColumn(page, {
      targetState: 'on',
      columnLabel: 'Text en',
      columnName: 'localizedText',
    })

    const textCell = page.locator('.row-1 .cell-i18nText')

    await expect(textCell).toHaveText('<No Text en>')
  })

  test('should show i18n label', async () => {
    await page.goto(url.create)

    await expect(page.locator('label[for="field-i18nText"]')).toHaveText('Text en')
  })

  test('should show i18n placeholder', async () => {
    await page.goto(url.create)
    await expect(page.locator('#field-i18nText')).toHaveAttribute('placeholder', 'en placeholder')
  })

  test('should show i18n descriptions', async () => {
    await page.goto(url.create)
    const description = page.locator('.field-description-i18nText')
    await expect(description).toHaveText('en description')
  })

  test('should create hasMany with multiple texts', async () => {
    const input = 'five'
    const furtherInput = 'six'

    await page.goto(url.create)
    const requiredField = page.locator('#field-text')
    const field = page.locator('.field-hasMany')

    await requiredField.fill(String(input))
    await field.click()
    await page.keyboard.type(input)
    await page.keyboard.press('Enter')
    await page.keyboard.type(furtherInput)
    await page.keyboard.press('Enter')
    await saveDocAndAssert(page)
    await expect(field.locator('.rs__value-container')).toContainText(input)
    await expect(field.locator('.rs__value-container')).toContainText(furtherInput)
  })

  test('should allow editing hasMany text field values by clicking', async () => {
    const originalText = 'original'
    const newText = 'new'

    await page.goto(url.create)

    // fill required field
    const requiredField = page.locator('#field-text')
    await requiredField.fill(String(originalText))

    const field = page.locator('.field-hasMany')

    // Add initial value
    await field.click()
    await page.keyboard.type(originalText)
    await page.keyboard.press('Enter')

    // Click to edit existing value
    const value = field.locator('.multi-value-label__text')
    await value.click()
    await value.dblclick()
    await page.keyboard.type(newText)
    await page.keyboard.press('Enter')

    await saveDocAndAssert(page)
    await expect(field.locator('.rs__value-container')).toContainText(`${newText}`)
  })

  test('should not allow editing hasMany text field values when disabled', async () => {
    await page.goto(url.create)
    const field = page.locator('.field-readOnlyHasMany')

    // Try to click to edit
    const value = field.locator('.multi-value-label__text')
    await value.click({ force: true })

    // Verify it does not become editable
    await expect(field.locator('.multi-value-label__text')).not.toHaveClass(/.*--editable/)
  })

  test('should filter Text field hasMany: false in the collection list view - in', async () => {
    await page.goto(url.list)
    await expect(page.locator('table >> tbody >> tr')).toHaveCount(2)

    await addListFilter({
      page,
      fieldLabel: 'Text',
      operatorLabel: 'is in',
      value: 'Another text document',
    })

    await wait(300)
    await expect(page.locator('table >> tbody >> tr')).toHaveCount(1)
  })

  test('should filter Text field hasMany: false in the collection list view - is not in', async () => {
    await page.goto(url.list)
    await expect(page.locator('table >> tbody >> tr')).toHaveCount(2)

    await addListFilter({
      page,
      fieldLabel: 'Text',
      operatorLabel: 'is not in',
      value: 'Another text document',
    })

    await wait(300)
    await expect(page.locator('table >> tbody >> tr')).toHaveCount(1)
  })

  test('should filter Text field hasMany: true in the collection list view - in', async () => {
    await page.goto(url.list)
    await expect(page.locator('table >> tbody >> tr')).toHaveCount(2)

    await addListFilter({
      page,
      fieldLabel: 'Has Many',
      operatorLabel: 'is in',
      value: 'one',
    })

    await wait(300)
    await expect(page.locator('table >> tbody >> tr')).toHaveCount(1)
  })

  test('should filter Text field hasMany: true in the collection list view - is not in', async () => {
    await page.goto(url.list)
    await expect(page.locator('table >> tbody >> tr')).toHaveCount(2)

    await addListFilter({
      page,
      fieldLabel: 'Has Many',
      operatorLabel: 'is not in',
      value: 'four',
    })

    await wait(300)
    await expect(page.locator('table >> tbody >> tr')).toHaveCount(1)
  })
})
