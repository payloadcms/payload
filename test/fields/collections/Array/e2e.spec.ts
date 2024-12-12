import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import path from 'path'
import { wait } from 'payload/shared'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../../../helpers/sdk/index.js'
import type { Config } from '../../payload-types.js'

import {
  ensureCompilationIsDone,
  initPageConsoleErrorCatch,
  saveDocAndAssert,
} from '../../../helpers.js'
import { AdminUrlUtil } from '../../../helpers/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../../../helpers/initPayloadE2ENoConfig.js'
import { reInitializeDB } from '../../../helpers/reInitializeDB.js'
import { RESTClient } from '../../../helpers/rest.js'
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
    ;({ payload, serverURL } = await initPayloadE2ENoConfig({
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
    client = new RESTClient(null, { defaultSlug: 'users', serverURL })
    await client.login()

    await ensureCompilationIsDone({ page, serverURL })
  })

  let url: AdminUrlUtil
  beforeAll(() => {
    url = new AdminUrlUtil(serverURL, 'array-fields')
  })

  test('should be readOnly', async () => {
    await page.goto(url.create)
    const field = page.locator('#field-readOnly__0__text')
    await expect(field).toBeDisabled()
  })

  test('should have defaultValue', async () => {
    await page.goto(url.create)
    const field = page.locator('#field-readOnly__0__text')
    await expect(field).toHaveValue('defaultValue')
  })

  test('should render RowLabel using a component', async () => {
    const label = 'custom row label as component'
    await page.goto(url.create)
    await page.locator('#field-rowLabelAsComponent >> .array-field__add-row').click()

    await page.locator('#field-rowLabelAsComponent__0__title').fill(label)
    await wait(100)
    const customRowLabel = page.locator(
      '#rowLabelAsComponent-row-0 >> .array-field__row-header > :text("custom row label")',
    )
    await expect(customRowLabel).toHaveCSS('text-transform', 'uppercase')
  })

  // eslint-disable-next-line playwright/expect-expect
  test('should bypass min rows validation when no rows present and field is not required', async () => {
    await page.goto(url.create)
    await saveDocAndAssert(page)
  })

  test('should fail min rows validation when rows are present', async () => {
    await page.goto(url.create)
    await page.locator('#field-arrayWithMinRows >> .array-field__add-row').click()

    await page.click('#action-save', { delay: 100 })
    await expect(page.locator('.payload-toast-container')).toContainText(
      'The following field is invalid: arrayWithMinRows',
    )
  })

  test('should show singular label for array rows', async () => {
    await page.goto(url.create)
    await expect(page.locator('#field-items #items-row-0 .row-label')).toContainText('Item 01')
  })

  describe('row manipulation', () => {
    test('should add, remove and duplicate rows', async () => {
      const assertText0 = 'array row 1'
      const assertGroupText0 = 'text in group in row 1'
      const assertText1 = 'array row 2'
      const assertText3 = 'array row 3'
      const assertGroupText3 = 'text in group in row 3'
      await page.goto(url.create)
      await page.mouse.wheel(0, 1750)
      await page.locator('#field-potentiallyEmptyArray').scrollIntoViewIfNeeded()
      await wait(300)

      // Add 3 rows
      await page.locator('#field-potentiallyEmptyArray > .array-field__add-row').click()
      await wait(300)
      await page.locator('#field-potentiallyEmptyArray > .array-field__add-row').click()
      await wait(300)
      await page.locator('#field-potentiallyEmptyArray > .array-field__add-row').click()
      await wait(300)

      // Fill out row 1
      await page.locator('#field-potentiallyEmptyArray__0__text').fill(assertText0)
      await page
        .locator('#field-potentiallyEmptyArray__0__groupInRow__textInGroupInRow')
        .fill(assertGroupText0)
      // Fill out row 2
      await page.locator('#field-potentiallyEmptyArray__1__text').fill(assertText1)
      // Fill out row 3
      await page.locator('#field-potentiallyEmptyArray__2__text').fill(assertText3)
      await page
        .locator('#field-potentiallyEmptyArray__2__groupInRow__textInGroupInRow')
        .fill(assertGroupText3)

      // Remove row 1
      await page.locator('#potentiallyEmptyArray-row-0 .array-actions__button').click()
      await page
        .locator('#potentiallyEmptyArray-row-0 .popup__scroll-container .array-actions__remove')
        .click()
      // Remove row 2
      await page.locator('#potentiallyEmptyArray-row-0 .array-actions__button').click()
      await page
        .locator('#potentiallyEmptyArray-row-0 .popup__scroll-container .array-actions__remove')
        .click()

      // Save document
      await saveDocAndAssert(page)

      // Scroll to array row (fields are not rendered in DOM until on screen)
      await page.locator('#field-potentiallyEmptyArray__0__groupInRow').scrollIntoViewIfNeeded()

      // Expect the remaining row to be the third row
      const input = page.locator('#field-potentiallyEmptyArray__0__groupInRow__textInGroupInRow')
      await expect(input).toHaveValue(assertGroupText3)

      // Duplicate row
      await page.locator('#potentiallyEmptyArray-row-0 .array-actions__button').click()
      await page
        .locator('#potentiallyEmptyArray-row-0 .popup__scroll-container .array-actions__duplicate')
        .click()

      // Update duplicated row group field text
      await page
        .locator('#field-potentiallyEmptyArray__1__groupInRow__textInGroupInRow')
        .fill(`${assertGroupText3} duplicate`)

      // Save document
      await saveDocAndAssert(page)

      // Expect the second row to be a duplicate of the remaining row
      await expect(
        page.locator('#field-potentiallyEmptyArray__1__groupInRow__textInGroupInRow'),
      ).toHaveValue(`${assertGroupText3} duplicate`)

      // Remove row 1
      await page.locator('#potentiallyEmptyArray-row-0 .array-actions__button').click()
      await page
        .locator('#potentiallyEmptyArray-row-0 .popup__scroll-container .array-actions__remove')
        .click()

      // Save document
      await saveDocAndAssert(page)

      // Expect the remaining row to be the copy of the duplicate row
      await expect(
        page.locator('#field-potentiallyEmptyArray__0__groupInRow__textInGroupInRow'),
      ).toHaveValue(`${assertGroupText3} duplicate`)
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

    const addRowButton = page.locator('#field-items > .array-field__add-row')

    await expect(addRowButton).toBeVisible()

    await addRowButton.click()
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
    await page.goto(url.create)
    await page.locator('#updateArrayExternally').click()
    await expect(page.locator('#custom-field')).toBeVisible()
  })

  test('should not re-close initCollapsed true array rows on input in create new view', async () => {
    await page.goto(url.create)
    await page.locator('#field-collapsedArray >> .array-field__add-row').click()
    await page.locator('#field-collapsedArray__0__text').fill('test')
    const collapsedArrayRow = page.locator('#collapsedArray-row-0 .collapsible--collapsed')
    await expect(collapsedArrayRow).toBeHidden()
  })
})
