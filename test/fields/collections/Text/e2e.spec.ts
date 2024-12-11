import type { Page } from '@playwright/test'
import type { GeneratedTypes } from 'helpers/sdk/types.js'

import { expect, test } from '@playwright/test'
import { openListColumns } from 'helpers/e2e/openListColumns.js'
import { openListFilters } from 'helpers/e2e/openListFilters.js'
import { toggleColumn } from 'helpers/e2e/toggleColumn.js'
import { upsertPrefs } from 'helpers/e2e/upsertPrefs.js'
import path from 'path'
import { wait } from 'payload/shared'
import * as qs from 'qs-esm'
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
    ;({ payload, serverURL } = await initPayloadE2ENoConfig({
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
    client = new RESTClient(null, { defaultSlug: 'users', serverURL })
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

      const columnContainer = await openListColumns(page, {})

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

      const columnContainer = await openListColumns(page, {})

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

      const columnContainer = await openListColumns(page, {})

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

  test('should hide field in column selector when admin.disableListColumn', async () => {
    await page.goto(url.list)
    await page.locator('.list-controls__toggle-columns').click()

    await expect(page.locator('.column-selector')).toBeVisible()

    // Check if "Disable List Column Text" is not present in the column options
    await expect(
      page.locator(`.column-selector .column-selector__column`, {
        hasText: exactText('Disable List Column Text'),
      }),
    ).toBeHidden()
  })

  test('should show field in filter when admin.disableListColumn is true', async () => {
    await page.goto(url.list)
    await openListFilters(page, {})
    await page.locator('.where-builder__add-first-filter').click()

    const initialField = page.locator('.condition__field')
    await initialField.click()

    await expect(
      initialField.locator(`.rs__menu-list:has-text("Disable List Column Text")`),
    ).toBeVisible()
  })

  test('should display field in list view column selector despite admin.disableListFilter', async () => {
    await page.goto(url.list)
    await page.locator('.list-controls__toggle-columns').click()

    await expect(page.locator('.column-selector')).toBeVisible()

    // Check if "Disable List Filter Text" is present in the column options
    await expect(
      page.locator(`.column-selector .column-selector__column`, {
        hasText: exactText('Disable List Filter Text'),
      }),
    ).toBeVisible()
  })

  test('should disable field when admin.disableListFilter is true but still exists in the query', async () => {
    await page.goto(
      `${url.list}${qs.stringify(
        {
          where: {
            or: [
              {
                and: [
                  {
                    disableListFilterText: {
                      equals: 'Disable List Filter Text',
                    },
                  },
                ],
              },
            ],
          },
        },
        { addQueryPrefix: true },
      )}`,
    )

    await openListFilters(page, {})

    const condition = page.locator('.condition__field')
    await expect(condition.locator('input.rs__input')).toBeDisabled()
    await expect(page.locator('.condition__operator input.rs__input')).toBeDisabled()
    await expect(page.locator('.condition__value input.condition-value-text')).toBeDisabled()
    await expect(condition.locator('.rs__single-value')).toHaveText('Disable List Filter Text')
    await page.locator('button.condition__actions-add').click()
    const condition2 = page.locator('.condition__field').nth(1)
    await condition2.click()
    await expect(
      condition2?.locator('.rs__menu-list:has-text("Disable List Filter Text")'),
    ).toBeHidden()
  })

  test('should respect admin.disableListColumn despite preferences', async () => {
    await upsertPrefs<Config, GeneratedTypes<any>>({
      payload,
      user: client.user,
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

  test('should hide field in filter when admin.disableListFilter is true', async () => {
    await page.goto(url.list)
    await openListFilters(page, {})
    await page.locator('.where-builder__add-first-filter').click()

    const initialField = page.locator('.condition__field')
    await initialField.click()

    await expect(
      initialField.locator(`.rs__option :has-text("Disable List Filter Text")`),
    ).toBeHidden()
  })

  test('should display i18n label in cells when missing field data', async () => {
    await page.goto(url.list)
    await page.waitForURL(new RegExp(`${url.list}.*\\?.*`))

    await toggleColumn(page, {
      targetState: 'on',
      columnLabel: 'Text en',
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

  test('should reset filter conditions when adding additional filters', async () => {
    await page.goto(url.list)

    // open the first filter options
    await openListFilters(page, {})
    await page.locator('.where-builder__add-first-filter').click()

    const firstInitialField = page.locator('.condition__field')
    const firstOperatorField = page.locator('.condition__operator')
    const firstValueField = page.locator('.condition__value >> input')

    await firstInitialField.click()
    const firstInitialFieldOptions = firstInitialField.locator('.rs__option')
    await firstInitialFieldOptions.locator('text=text').first().click()
    await expect(firstInitialField.locator('.rs__single-value')).toContainText('Text')

    await firstOperatorField.click()
    await firstOperatorField.locator('.rs__option').locator('text=equals').click()

    await firstValueField.fill('hello')

    await wait(500)

    await expect(firstValueField).toHaveValue('hello')

    // open the second filter options
    await page.locator('.condition__actions-add').click()

    const secondLi = page.locator('.where-builder__and-filters li:nth-child(2)')

    await expect(secondLi).toBeVisible()

    const secondInitialField = secondLi.locator('.condition__field')
    const secondOperatorField = secondLi.locator('.condition__operator >> input')
    const secondValueField = secondLi.locator('.condition__value >> input')

    await expect(secondInitialField.locator('.rs__single-value')).toContainText('Text')
    await expect(secondOperatorField).toHaveValue('')
    await expect(secondValueField).toHaveValue('')
  })

  test('should not re-render page upon typing in a value in the filter value field', async () => {
    await page.goto(url.list)

    // open the first filter options
    await openListFilters(page, {})
    await page.locator('.where-builder__add-first-filter').click()

    const firstInitialField = page.locator('.condition__field')
    const firstOperatorField = page.locator('.condition__operator')
    const firstValueField = page.locator('.condition__value >> input')

    await firstInitialField.click()
    const firstInitialFieldOptions = firstInitialField.locator('.rs__option')
    await firstInitialFieldOptions.locator('text=text').first().click()
    await expect(firstInitialField.locator('.rs__single-value')).toContainText('Text')

    await firstOperatorField.click()
    await firstOperatorField.locator('.rs__option').locator('text=equals').click()

    // Type into the input field instead of filling it
    await firstValueField.click()
    await firstValueField.type('hello', { delay: 100 }) // Add a delay to simulate typing speed

    // Wait for a short period to see if the input loses focus
    await page.waitForTimeout(500)

    // Check if the input still has the correct value
    await expect(firstValueField).toHaveValue('hello')
  })

  test('should still show second filter if two filters exist and first filter is removed', async () => {
    await page.goto(url.list)

    // open the first filter options
    await openListFilters(page, {})
    await page.locator('.where-builder__add-first-filter').click()

    const firstInitialField = page.locator('.condition__field')
    const firstOperatorField = page.locator('.condition__operator')
    const firstValueField = page.locator('.condition__value >> input')

    await firstInitialField.click()
    const firstInitialFieldOptions = firstInitialField.locator('.rs__option')
    await firstInitialFieldOptions.locator('text=text').first().click()
    await expect(firstInitialField.locator('.rs__single-value')).toContainText('Text')

    await firstOperatorField.click()
    await firstOperatorField.locator('.rs__option').locator('text=equals').click()

    await firstValueField.fill('hello')

    await wait(500)

    await expect(firstValueField).toHaveValue('hello')

    // open the second filter options
    await page.locator('.condition__actions-add').click()

    const secondLi = page.locator('.where-builder__and-filters li:nth-child(2)')

    await expect(secondLi).toBeVisible()

    const secondInitialField = secondLi.locator('.condition__field')
    const secondOperatorField = secondLi.locator('.condition__operator')
    const secondValueField = secondLi.locator('.condition__value >> input')

    await secondInitialField.click()
    const secondInitialFieldOptions = secondInitialField.locator('.rs__option')
    await secondInitialFieldOptions.locator('text=text').first().click()
    await expect(secondInitialField.locator('.rs__single-value')).toContainText('Text')

    await secondOperatorField.click()
    await secondOperatorField.locator('.rs__option').locator('text=equals').click()

    await secondValueField.fill('world')
    await expect(secondValueField).toHaveValue('world')

    await wait(500)

    const firstLi = page.locator('.where-builder__and-filters li:nth-child(1)')
    const removeButton = firstLi.locator('.condition__actions-remove')

    // remove first filter
    await removeButton.click()

    const filterListItems = page.locator('.where-builder__and-filters li')
    await expect(filterListItems).toHaveCount(1)

    await expect(firstValueField).toHaveValue('world')
  })
})
