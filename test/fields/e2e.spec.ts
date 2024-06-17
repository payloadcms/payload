import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import path from 'path'
import { wait } from 'payload/shared'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../helpers/sdk/index.js'
import type { Config } from './payload-types.js'

import {
  ensureAutoLoginAndCompilationIsDone,
  initPageConsoleErrorCatch,
  saveDocAndAssert,
} from '../helpers.js'
import { AdminUrlUtil } from '../helpers/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../helpers/initPayloadE2ENoConfig.js'
import { reInitializeDB } from '../helpers/reInitializeDB.js'
import { RESTClient } from '../helpers/rest.js'
import { POLL_TOPASS_TIMEOUT, TEST_TIMEOUT_LONG } from '../playwright.config.js'
import { jsonDoc } from './collections/JSON/shared.js'
import {
  arrayFieldsSlug,
  blockFieldsSlug,
  collapsibleFieldsSlug,
  tabsFields2Slug,
} from './slugs.js'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const { beforeAll, beforeEach, describe } = test

let payload: PayloadTestSDK<Config>
let client: RESTClient
let page: Page
let serverURL: string
// If we want to make this run in parallel: test.describe.configure({ mode: 'parallel' })

describe('fields', () => {
  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    process.env.SEED_IN_CONFIG_ONINIT = 'false' // Makes it so the payload config onInit seed is not run. Otherwise, the seed would be run unnecessarily twice for the initial test run - once for beforeEach and once for onInit
    ;({ payload, serverURL } = await initPayloadE2ENoConfig({
      dirname,
      // prebuild,
    }))

    const context = await browser.newContext()
    page = await context.newPage()
    initPageConsoleErrorCatch(page)
    await reInitializeDB({
      serverURL,
      snapshotKey: 'fieldsTest',
      uploadsDir: path.resolve(dirname, './collections/Upload/uploads'),
    })
    await ensureAutoLoginAndCompilationIsDone({ page, serverURL })
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

    await ensureAutoLoginAndCompilationIsDone({ page, serverURL })
  })

  describe('indexed', () => {
    let url: AdminUrlUtil
    beforeEach(() => {
      url = new AdminUrlUtil(serverURL, 'indexed-fields')
    })

    // TODO - This test is flaky. Rarely, but sometimes it randomly fails.
    test('should display unique constraint error in ui', async () => {
      const uniqueText = 'uniqueText'
      await payload.create({
        collection: 'indexed-fields',
        data: {
          group: {
            unique: uniqueText,
          },
          text: 'text',
          uniqueRequiredText: 'text',
          uniqueText,
        },
      })

      await page.goto(url.create)
      await page.waitForURL(url.create)

      await page.locator('#field-text').fill('test')
      await page.locator('#field-uniqueText').fill(uniqueText)
      await page.locator('#field-localizedUniqueRequiredText').fill('localizedUniqueRequired2')

      await wait(500)

      // attempt to save
      await page.click('#action-save', { delay: 200 })

      // toast error
      await expect(page.locator('.payload-toast-container')).toContainText(
        'The following field is invalid: uniqueText',
      )

      await expect.poll(() => page.url(), { timeout: POLL_TOPASS_TIMEOUT }).toContain('create')

      // field specific error
      await expect(page.locator('.field-type.text.error #field-uniqueText')).toBeVisible()

      // reset first unique field
      await page.locator('#field-uniqueText').clear()

      // nested in a group error
      await page.locator('#field-group__unique').fill(uniqueText)

      await wait(1000)

      // attempt to save
      await page.locator('#action-save').click()

      // toast error
      await expect(page.locator('.payload-toast-container')).toContainText(
        'The following field is invalid: group.unique',
      )

      await expect.poll(() => page.url(), { timeout: POLL_TOPASS_TIMEOUT }).toContain('create')

      // field specific error inside group
      await expect(page.locator('.field-type.text.error #field-group__unique')).toBeVisible()
    })
  })

  describe('json', () => {
    let url: AdminUrlUtil
    beforeAll(() => {
      url = new AdminUrlUtil(serverURL, 'json-fields')
    })

    test('should display field in list view', async () => {
      await page.goto(url.list)
      const jsonCell = page.locator('.row-1 .cell-json')
      await expect(jsonCell).toHaveText(JSON.stringify(jsonDoc.json))
    })

    test('should create', async () => {
      const input = '{"foo": "bar"}'
      await page.goto(url.create)
      await page.waitForURL(url.create)
      await expect(() => expect(page.locator('.json-field .code-editor')).toBeVisible()).toPass({
        timeout: POLL_TOPASS_TIMEOUT,
      })
      await page.locator('.json-field .inputarea').fill(input)
      await saveDocAndAssert(page)
      await expect(page.locator('.json-field')).toContainText('"foo": "bar"')
    })
  })

  describe('radio', () => {
    let url: AdminUrlUtil
    beforeAll(() => {
      url = new AdminUrlUtil(serverURL, 'radio-fields')
    })

    test('should show i18n label in list', async () => {
      await page.goto(url.list)
      await expect(page.locator('.cell-radio')).toHaveText('Value One')
    })

    test('should show i18n label while editing', async () => {
      await page.goto(url.create)
      await expect(page.locator('label[for="field-radio"]')).toHaveText('Radio en')
    })

    test('should show i18n radio labels', async () => {
      await page.goto(url.create)
      await expect(page.locator('label[for="field-radio-one"] .radio-input__label')).toHaveText(
        'Value One',
      )
    })
  })

  describe('select', () => {
    let url: AdminUrlUtil
    beforeAll(() => {
      url = new AdminUrlUtil(serverURL, 'select-fields')
    })

    test('should use i18n option labels', async () => {
      await page.goto(url.create)

      const field = page.locator('#field-selectI18n')
      await field.click({ delay: 100 })
      const options = page.locator('.rs__option')
      // Select an option
      await options.locator('text=One').click()

      await saveDocAndAssert(page)
      await expect(field.locator('.rs__value-container')).toContainText('One')
    })
  })

  describe('collapsible', () => {
    let url: AdminUrlUtil
    beforeAll(() => {
      url = new AdminUrlUtil(serverURL, collapsibleFieldsSlug)
    })

    test('should render collapsible as collapsed if initCollapsed is true', async () => {
      await page.goto(url.create)
      const collapsedCollapsible = page.locator(
        '#field-collapsible-1 .collapsible__toggle--collapsed',
      )
      await expect(collapsedCollapsible).toBeVisible()
    })

    test('should render CollapsibleLabel using a function', async () => {
      const label = 'custom row label'
      await page.goto(url.create)
      await page.locator('#field-collapsible-3__1 #field-nestedTitle').fill(label)
      await wait(100)
      const customCollapsibleLabel = page.locator(
        `#field-collapsible-3__1 .collapsible-field__row-label-wrap :text("${label}")`,
      )
      await expect(customCollapsibleLabel).toContainText(label)
    })

    test('should render CollapsibleLabel using a component', async () => {
      const label = 'custom row label as component'
      await page.goto(url.create)
      await page.locator('#field-arrayWithCollapsibles').scrollIntoViewIfNeeded()

      const arrayWithCollapsibles = page.locator('#field-arrayWithCollapsibles')
      await expect(arrayWithCollapsibles).toBeVisible()

      await page.locator('#field-arrayWithCollapsibles >> .array-field__add-row').click()

      await page
        .locator(
          '#arrayWithCollapsibles-row-0 #field-collapsible-4__0-arrayWithCollapsibles__0 #field-arrayWithCollapsibles__0__innerCollapsible',
        )
        .fill(label)
      await wait(100)
      const customCollapsibleLabel = page.locator(
        `#field-arrayWithCollapsibles >> #arrayWithCollapsibles-row-0 >> .collapsible-field__row-label-wrap :text("${label}")`,
      )
      await expect(customCollapsibleLabel).toHaveCSS('text-transform', 'uppercase')
    })
  })

  describe('sortable arrays', () => {
    let url: AdminUrlUtil
    beforeAll(() => {
      url = new AdminUrlUtil(serverURL, arrayFieldsSlug)
    })

    test('should have disabled admin sorting', async () => {
      await page.goto(url.create)
      const field = page.locator('#field-disableSort > div > div > .array-actions__action-chevron')
      expect(await field.count()).toEqual(0)
    })

    test('the drag handle should be hidden', async () => {
      await page.goto(url.create)
      const field = page.locator(
        '#field-disableSort > .blocks-field__rows > div > div > .collapsible__drag',
      )
      expect(await field.count()).toEqual(0)
    })
  })

  describe('sortable blocks', () => {
    let url: AdminUrlUtil
    beforeAll(() => {
      url = new AdminUrlUtil(serverURL, blockFieldsSlug)
    })

    test('should have disabled admin sorting', async () => {
      await page.goto(url.create)
      const field = page.locator('#field-disableSort > div > div > .array-actions__action-chevron')
      expect(await field.count()).toEqual(0)
    })

    test('the drag handle should be hidden', async () => {
      await page.goto(url.create)
      const field = page.locator(
        '#field-disableSort > .blocks-field__rows > div > div > .collapsible__drag',
      )
      expect(await field.count()).toEqual(0)
    })
  })

  describe('row', () => {
    let url: AdminUrlUtil
    beforeAll(() => {
      url = new AdminUrlUtil(serverURL, 'row-fields')
    })

    test('should show row fields as table columns', async () => {
      await page.goto(url.create)

      // fill the required fields, including the row field
      const idInput = page.locator('input#field-id')
      await idInput.fill('123')
      const titleInput = page.locator('input#field-title')
      await titleInput.fill('Row 123')
      await page.locator('#action-save').click()
      await wait(200)
      await expect(page.locator('.payload-toast-container')).toContainText('successfully')

      // ensure the 'title' field is visible in the table header
      await page.goto(url.list)
      const titleHeading = page.locator('th#heading-title')
      await expect(titleHeading).toBeVisible()

      // ensure the 'title' field shows the correct value in the table cell
      const titleCell = page.locator('.row-1 td.cell-title')
      await expect(titleCell).toBeVisible()
      await expect(titleCell).toContainText('Row 123')
    })

    test('should not show duplicative ID field', async () => {
      await page.goto(url.create)
      // fill the required fields, including the custom ID field
      const idInput = page.locator('input#field-id')
      await idInput.fill('456')
      const titleInput = page.locator('input#field-title')
      await titleInput.fill('Row 456')
      await page.locator('#action-save').click()
      await wait(200)
      await expect(page.locator('.payload-toast-container')).toContainText('successfully')

      // ensure there are not two ID fields in the table header
      await page.goto(url.list)
      const idHeadings = page.locator('th#heading-id')
      await expect(idHeadings).toBeVisible()
      await expect(idHeadings).toHaveCount(1)
    })

    test('should render row fields inline and with explicit widths', async () => {
      await page.goto(url.create)
      const fieldA = page.locator('input#field-field_with_width_a')
      await expect(fieldA).toBeVisible()
      const fieldB = page.locator('input#field-field_with_width_b')
      await expect(fieldB).toBeVisible()
      const fieldABox = await fieldA.boundingBox()
      const fieldBBox = await fieldB.boundingBox()

      // Check that the top value of the fields are the same
      // Give it some wiggle room of like 2px to account for differences in rendering
      const tolerance = 2
      expect(fieldABox.y).toBeLessThanOrEqual(fieldBBox.y + tolerance)

      // Check that the widths of the fields are the same
      const difference = Math.abs(fieldABox.width - fieldBBox.width)
      expect(difference).toBeLessThanOrEqual(tolerance)
    })

    test('should render nested row fields in the correct position', async () => {
      await page.goto(url.create)

      // These fields are not given explicit `width` values
      await page.goto(url.create)
      const fieldA = page.locator('input#field-field_within_collapsible_a')
      await expect(fieldA).toBeVisible()
      const fieldB = page.locator('input#field-field_within_collapsible_b')
      await expect(fieldB).toBeVisible()
      const fieldABox = await fieldA.boundingBox()
      const fieldBBox = await fieldB.boundingBox()

      // Check that the top value of the fields are the same
      // Give it some wiggle room of like 2px to account for differences in rendering
      const tolerance = 2
      expect(fieldABox.y).toBeLessThanOrEqual(fieldBBox.y + tolerance)

      // Check that the widths of the fields are the same
      const collapsibleDifference = Math.abs(fieldABox.width - fieldBBox.width)

      expect(collapsibleDifference).toBeLessThanOrEqual(tolerance)
    })
  })

  describe('ui', () => {
    let url: AdminUrlUtil
    beforeAll(() => {
      url = new AdminUrlUtil(serverURL, 'ui-fields')
    })

    test('should show custom: client configuration', async () => {
      await page.goto(url.create)

      const uiField = page.locator('#uiCustomClient')

      await expect(uiField).toBeVisible()
      await expect(uiField).toContainText('client-side-configuration')
    })
  })

  describe('conditional logic', () => {
    let url: AdminUrlUtil
    beforeAll(() => {
      url = new AdminUrlUtil(serverURL, 'conditional-logic')
    })

    test('should toggle conditional field when data changes', async () => {
      await page.goto(url.create)
      const toggleField = page.locator('label[for=field-toggleField]')
      await toggleField.click()

      const fieldToToggle = page.locator('input#field-fieldToToggle')

      await expect(fieldToToggle).toBeVisible()
    })

    test('should show conditional field based on user data', async () => {
      await page.goto(url.create)
      const userConditional = page.locator('input#field-userConditional')
      await expect(userConditional).toBeVisible()
    })

    test('should show conditional field based on fields nested within data', async () => {
      await page.goto(url.create)

      const parentGroupFields = page.locator(
        'div#field-parentGroup > .group-field__wrap > .render-fields',
      )
      await expect(parentGroupFields).toHaveCount(1)

      const toggle = page.locator('label[for=field-parentGroup__enableParentGroupFields]')
      await toggle.click()

      const toggledField = page.locator('input#field-parentGroup__siblingField')

      await expect(toggledField).toBeVisible()
    })

    test('should show conditional field based on fields nested within siblingData', async () => {
      await page.goto(url.create)

      const toggle = page.locator('label[for=field-parentGroup__enableParentGroupFields]')
      await toggle.click()

      const fieldRelyingOnSiblingData = page.locator('input#field-reliesOnParentGroup')
      await expect(fieldRelyingOnSiblingData).toBeVisible()
    })
  })

  describe('tabs', () => {
    let url: AdminUrlUtil
    beforeAll(() => {
      url = new AdminUrlUtil(serverURL, tabsFields2Slug)
    })

    test('should correctly save nested unnamed and named tabs', async () => {
      await page.goto(url.create)

      await page.locator('#field-tabsInArray .array-field__add-row').click()
      await page.locator('#field-tabsInArray__0__text').fill('tab 1 text')
      await page.locator('.tabs-field__tabs button:nth-child(2)').click()
      await page.locator('#field-tabsInArray__0__tab2__text2').fill('tab 2 text')

      await saveDocAndAssert(page)

      await expect(page.locator('#field-tabsInArray__0__text')).toHaveValue('tab 1 text')
      await page.locator('.tabs-field__tabs button:nth-child(2)').click()
      await expect(page.locator('#field-tabsInArray__0__tab2__text2')).toHaveValue('tab 2 text')
    })
  })
})
