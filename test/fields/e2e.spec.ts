import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import path from 'path'
import { wait } from 'payload/utilities'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../helpers/sdk/index.js'
import type { Config } from './payload-types.js'

import {
  ensureAutoLoginAndCompilationIsDone,
  initPageConsoleErrorCatch,
  navigateToListCellLink,
  openDocDrawer,
  saveDocAndAssert,
  switchTab,
} from '../helpers.js'
import { AdminUrlUtil } from '../helpers/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../helpers/initPayloadE2ENoConfig.js'
import { reInitializeDB } from '../helpers/reInitializeDB.js'
import { RESTClient } from '../helpers/rest.js'
import { POLL_TOPASS_TIMEOUT } from '../playwright.config.js'
import { jsonDoc } from './collections/JSON/shared.js'
import { numberDoc } from './collections/Number/shared.js'
import { textDoc } from './collections/Text/shared.js'
import { collapsibleFieldsSlug, pointFieldsSlug, tabsFieldsSlug, textFieldsSlug } from './slugs.js'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const { beforeAll, beforeEach, describe } = test

let payload: PayloadTestSDK<Config>
let client: RESTClient
let page: Page
let serverURL: string
// If we want to make this run in parallel: test.describe.configure({ mode: 'parallel' })

describe('fields', () => {
  beforeAll(async ({ browser }) => {
    process.env.SEED_IN_CONFIG_ONINIT = 'false' // Makes it so the payload config onInit seed is not run. Otherwise, the seed would be run unnecessarily twice for the initial test run - once for beforeEach and once for onInit
    ;({ payload, serverURL } = await initPayloadE2ENoConfig({
      dirname,
      // prebuild,
    }))

    const context = await browser.newContext()
    page = await context.newPage()
    initPageConsoleErrorCatch(page)
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
  describe('text', () => {
    let url: AdminUrlUtil
    beforeAll(() => {
      url = new AdminUrlUtil(serverURL, textFieldsSlug)
    })

    test('should display field in list view', async () => {
      await page.goto(url.list)
      const textCell = page.locator('.row-1 .cell-text')
      await expect(textCell).toHaveText(textDoc.text)
    })

    test('should display i18n label in cells when missing field data', async () => {
      await page.goto(url.list)
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

    test('should render custom label', async () => {
      await page.goto(url.create)
      const label = page.locator('label.custom-label[for="field-customLabel"]')
      await expect(label).toHaveText('#label')
    })

    test('should render custom error', async () => {
      await page.goto(url.create)
      const input = page.locator('input[id="field-customError"]')
      await input.fill('ab')
      await expect(input).toHaveValue('ab')
      const error = page.locator('.custom-error:near(input[id="field-customError"])')
      const submit = page.locator('button[type="button"][id="action-save"]')
      await submit.click()
      await expect(error).toHaveText('#custom-error')
    })

    test('should render beforeInput and afterInput', async () => {
      await page.goto(url.create)
      const input = page.locator('input[id="field-beforeAndAfterInput"]')

      const prevSibling = await input.evaluateHandle((el) => {
        return el.previousElementSibling
      })
      const prevSiblingText = await page.evaluate((el) => el.textContent, prevSibling)
      expect(prevSiblingText).toEqual('#before-input')

      const nextSibling = await input.evaluateHandle((el) => {
        return el.nextElementSibling
      })
      const nextSiblingText = await page.evaluate((el) => el.textContent, nextSibling)
      expect(nextSiblingText).toEqual('#after-input')
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
  })

  describe('number', () => {
    let url: AdminUrlUtil
    beforeAll(() => {
      url = new AdminUrlUtil(serverURL, 'number-fields')
    })

    test('should display field in list view', async () => {
      await page.goto(url.list)
      const textCell = page.locator('.row-1 .cell-number')
      await expect(textCell).toHaveText(String(numberDoc.number))
    })

    test('should filter Number fields in the collection view - greaterThanOrEqual', async () => {
      await page.goto(url.list)

      // should have 3 entries
      await expect(page.locator('table >> tbody >> tr')).toHaveCount(3)

      // open the filter options
      await page.locator('.list-controls__toggle-where').click()
      await expect(page.locator('.list-controls__where.rah-static--height-auto')).toBeVisible()
      await page.locator('.where-builder__add-first-filter').click()

      const initialField = page.locator('.condition__field')
      const operatorField = page.locator('.condition__operator')
      const valueField = page.locator('.condition__value >> input')

      // select Number field to filter on
      await initialField.click()
      const initialFieldOptions = initialField.locator('.rs__option')
      await initialFieldOptions.locator('text=number').first().click()
      await expect(initialField.locator('.rs__single-value')).toContainText('Number')

      // select >= operator
      await operatorField.click()
      const operatorOptions = operatorField.locator('.rs__option')
      await operatorOptions.last().click()
      await expect(operatorField.locator('.rs__single-value')).toContainText(
        'is greater than or equal to',
      )

      // enter value of 3
      await valueField.fill('3')
      await expect(valueField).toHaveValue('3')
      await wait(300)

      // should have 2 entries after filtering
      await expect(page.locator('table >> tbody >> tr')).toHaveCount(2)
    })

    test('should create', async () => {
      const input = 5

      await page.goto(url.create)
      const field = page.locator('#field-number')
      await field.fill(String(input))
      await saveDocAndAssert(page)
      await expect(field).toHaveValue(String(input))
    })

    test('should create hasMany', async () => {
      const input = 5

      await page.goto(url.create)
      const field = page.locator('.field-hasMany')
      await field.click()
      await page.keyboard.type(String(input))
      await page.keyboard.press('Enter')
      await saveDocAndAssert(page)
      await expect(field.locator('.rs__value-container')).toContainText(String(input))
    })

    test('should bypass min rows validation when no rows present and field is not required', async () => {
      await page.goto(url.create)
      await saveDocAndAssert(page)
      await expect(page.locator('.Toastify')).toContainText('successfully')
    })

    test('should fail min rows validation when rows are present', async () => {
      const input = 5

      await page.goto(url.create)
      await page.locator('.field-withMinRows').click()

      await page.keyboard.type(String(input))
      await page.keyboard.press('Enter')
      await page.click('#action-save', { delay: 100 })

      await expect(page.locator('.Toastify')).toContainText(
        'The following field is invalid: withMinRows',
      )
    })
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
      await expect(page.locator('.Toastify')).toContainText(
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
      await expect(page.locator('.Toastify')).toContainText(
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
      const json = page.locator('.json-field .inputarea')
      await json.fill(input)

      await saveDocAndAssert(page, '.form-submit button')
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

  describe('point', () => {
    let url: AdminUrlUtil
    let filledGroupPoint
    let emptyGroupPoint
    beforeEach(async () => {
      url = new AdminUrlUtil(serverURL, pointFieldsSlug)
      filledGroupPoint = await payload.create({
        collection: pointFieldsSlug,
        data: {
          group: { point: [4, 2] },
          localized: [4, 2],
          point: [5, 5],
        },
      })
      emptyGroupPoint = await payload.create({
        collection: pointFieldsSlug,
        data: {
          group: {},
          localized: [3, -2],
          point: [5, 5],
        },
      })
    })

    test('should save point', async () => {
      await page.goto(url.create)
      const longField = page.locator('#field-longitude-point')
      await longField.fill('9')

      const latField = page.locator('#field-latitude-point')
      await latField.fill('-2')

      const localizedLongField = page.locator('#field-longitude-localized')
      await localizedLongField.fill('1')

      const localizedLatField = page.locator('#field-latitude-localized')
      await localizedLatField.fill('-1')

      const groupLongitude = page.locator('#field-longitude-group__point')
      await groupLongitude.fill('3')

      const groupLatField = page.locator('#field-latitude-group__point')
      await groupLatField.fill('-8')

      await saveDocAndAssert(page)
      await expect(longField).toHaveAttribute('value', '9')
      await expect(latField).toHaveAttribute('value', '-2')
      await expect(localizedLongField).toHaveAttribute('value', '1')
      await expect(localizedLatField).toHaveAttribute('value', '-1')
      await expect(groupLongitude).toHaveAttribute('value', '3')
      await expect(groupLatField).toHaveAttribute('value', '-8')
    })

    test('should update point', async () => {
      await page.goto(url.edit(emptyGroupPoint.id))
      await page.waitForURL(`**/${emptyGroupPoint.id}`)
      const longField = page.locator('#field-longitude-point')
      await longField.fill('9')

      const latField = page.locator('#field-latitude-point')
      await latField.fill('-2')

      const localizedLongField = page.locator('#field-longitude-localized')
      await localizedLongField.fill('2')

      const localizedLatField = page.locator('#field-latitude-localized')
      await localizedLatField.fill('-2')

      const groupLongitude = page.locator('#field-longitude-group__point')
      await groupLongitude.fill('3')

      const groupLatField = page.locator('#field-latitude-group__point')
      await groupLatField.fill('-8')

      await saveDocAndAssert(page)

      await expect(longField).toHaveAttribute('value', '9')
      await expect(latField).toHaveAttribute('value', '-2')
      await expect(localizedLongField).toHaveAttribute('value', '2')
      await expect(localizedLatField).toHaveAttribute('value', '-2')
      await expect(groupLongitude).toHaveAttribute('value', '3')
      await expect(groupLatField).toHaveAttribute('value', '-8')
    })

    test('should be able to clear a value point', async () => {
      await page.goto(url.edit(filledGroupPoint.id))
      await page.waitForURL(`**/${filledGroupPoint.id}`)

      const groupLongitude = page.locator('#field-longitude-group__point')
      await groupLongitude.fill('')

      const groupLatField = page.locator('#field-latitude-group__point')
      await groupLatField.fill('')

      await saveDocAndAssert(page)

      await expect(groupLongitude).toHaveAttribute('value', '')
      await expect(groupLatField).toHaveAttribute('value', '')
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

  describe('tabs', () => {
    let url: AdminUrlUtil
    beforeAll(() => {
      url = new AdminUrlUtil(serverURL, tabsFieldsSlug)
    })

    test('should fill and retain a new value within a tab while switching tabs', async () => {
      const textInRowValue = 'hello'
      const numberInRowValue = '23'
      const jsonValue = '{ "foo": "bar"}'

      await page.goto(url.create)
      await page.waitForURL(url.create)

      await switchTab(page, '.tabs-field__tab-button:has-text("Tab with Row")')
      await page.locator('#field-textInRow').fill(textInRowValue)
      await page.locator('#field-numberInRow').fill(numberInRowValue)
      await page.locator('.json-field .inputarea').fill(jsonValue)

      await wait(300)

      await switchTab(page, '.tabs-field__tab-button:has-text("Tab with Array")')
      await switchTab(page, '.tabs-field__tab-button:has-text("Tab with Row")')

      await expect(page.locator('#field-textInRow')).toHaveValue(textInRowValue)
      await expect(page.locator('#field-numberInRow')).toHaveValue(numberInRowValue)
      await expect(page.locator('.json-field .lines-content')).toContainText(jsonValue)
    })

    test('should retain updated values within tabs while switching between tabs', async () => {
      const textInRowValue = 'new value'
      const jsonValue = '{ "new": "value"}'
      await page.goto(url.list)
      await navigateToListCellLink(page)

      // Go to Row tab, update the value
      await switchTab(page, '.tabs-field__tab-button:has-text("Tab with Row")')

      await page.locator('#field-textInRow').fill(textInRowValue)
      await page.locator('.json-field .inputarea').fill(jsonValue)

      await wait(500)

      // Go to Array tab, then back to Row. Make sure new value is still there
      await switchTab(page, '.tabs-field__tab-button:has-text("Tab with Array")')
      await switchTab(page, '.tabs-field__tab-button:has-text("Tab with Row")')

      await expect(page.locator('#field-textInRow')).toHaveValue(textInRowValue)
      await expect(page.locator('.json-field .lines-content')).toContainText(jsonValue)

      // Go to array tab, save the doc
      await switchTab(page, '.tabs-field__tab-button:has-text("Tab with Array")')
      await saveDocAndAssert(page)

      // Go back to row tab, make sure the new value is still present
      await switchTab(page, '.tabs-field__tab-button:has-text("Tab with Row")')
      await expect(page.locator('#field-textInRow')).toHaveValue(textInRowValue)
    })

    test('should render array data within unnamed tabs', async () => {
      await page.goto(url.list)
      await navigateToListCellLink(page)
      await switchTab(page, '.tabs-field__tab-button:has-text("Tab with Array")')
      await expect(page.locator('#field-array__0__text')).toHaveValue("Hello, I'm the first row")
    })

    test('should render array data within named tabs', async () => {
      await page.goto(url.list)
      await navigateToListCellLink(page)
      await switchTab(page, '.tabs-field__tab-button:nth-child(5)')
      await expect(page.locator('#field-tab__array__0__text')).toHaveValue(
        "Hello, I'm the first row, in a named tab",
      )
    })
  })

  describe('date', () => {
    let url: AdminUrlUtil
    beforeAll(() => {
      url = new AdminUrlUtil(serverURL, 'date-fields')
    })

    test('should display formatted date in list view table cell', async () => {
      await page.goto(url.list)
      const formattedDateCell = page.locator('.row-1 .cell-timeOnly')
      await expect(formattedDateCell).toContainText(' Aug ')

      const notFormattedDateCell = page.locator('.row-1 .cell-default')
      await expect(notFormattedDateCell).toContainText('August')
    })

    test('should display formatted date in useAsTitle', async () => {
      await page.goto(url.list)
      await page.locator('.row-1 .cell-default a').click()
      await expect(page.locator('.doc-header__title.render-title')).toContainText('August')
    })

    test('should clear date', async () => {
      await page.goto(url.create)
      const dateField = page.locator('#field-default input')
      await expect(dateField).toBeVisible()
      await dateField.fill('02/07/2023')
      await expect(dateField).toHaveValue('02/07/2023')
      await saveDocAndAssert(page)

      const clearButton = page.locator('#field-default .date-time-picker__clear-button')
      await expect(clearButton).toBeVisible()
      await clearButton.click()
      await expect(dateField).toHaveValue('')
    })

    describe('localized dates', () => {
      describe('EST', () => {
        test.use({
          geolocation: {
            latitude: 42.3314,
            longitude: -83.0458,
          },
          timezoneId: 'America/Detroit',
        })
        test('create EST day only date', async () => {
          await page.goto(url.create)
          await page.waitForURL(`**/${url.create}`)
          const dateField = page.locator('#field-default input')

          // enter date in default date field
          await dateField.fill('02/07/2023')
          await saveDocAndAssert(page)

          // get the ID of the doc
          const routeSegments = page.url().split('/')
          const id = routeSegments.pop()

          // fetch the doc (need the date string from the DB)
          const { doc } = await client.findByID({ id, auth: true, slug: 'date-fields' })

          expect(doc.default).toEqual('2023-02-07T12:00:00.000Z')
        })
      })

      describe('PST', () => {
        test.use({
          geolocation: {
            latitude: 37.774929,
            longitude: -122.419416,
          },
          timezoneId: 'America/Los_Angeles',
        })

        test('create PDT day only date', async () => {
          await page.goto(url.create)
          await page.waitForURL(`**/${url.create}`)
          const dateField = page.locator('#field-default input')

          // enter date in default date field
          await dateField.fill('02/07/2023')
          await saveDocAndAssert(page)

          // get the ID of the doc
          const routeSegments = page.url().split('/')
          const id = routeSegments.pop()

          // fetch the doc (need the date string from the DB)
          const { doc } = await client.findByID({ id, auth: true, slug: 'date-fields' })

          expect(doc.default).toEqual('2023-02-07T12:00:00.000Z')
        })
      })

      describe('ST', () => {
        test.use({
          geolocation: {
            latitude: -14.5994,
            longitude: -171.857,
          },
          timezoneId: 'Pacific/Apia',
        })

        test('create ST day only date', async () => {
          await page.goto(url.create)
          await page.waitForURL(`**/${url.create}`)
          const dateField = page.locator('#field-default input')

          // enter date in default date field
          await dateField.fill('02/07/2023')
          await saveDocAndAssert(page)

          // get the ID of the doc
          const routeSegments = page.url().split('/')
          const id = routeSegments.pop()

          // fetch the doc (need the date string from the DB)
          const { doc } = await client.findByID({ id, auth: true, slug: 'date-fields' })

          expect(doc.default).toEqual('2023-02-07T12:00:00.000Z')
        })
      })
    })
  })

  describe('upload', () => {
    let url: AdminUrlUtil
    beforeAll(() => {
      url = new AdminUrlUtil(serverURL, 'uploads')
    })

    async function uploadImage() {
      await page.goto(url.create)

      // create a jpg upload
      await page
        .locator('.file-field__upload input[type="file"]')
        .setInputFiles(path.resolve(dirname, './collections/Upload/payload.jpg'))
      await expect(page.locator('.file-field .file-field__filename')).toHaveValue('payload.jpg')
      await saveDocAndAssert(page)
    }

    // eslint-disable-next-line playwright/expect-expect
    test('should upload files', async () => {
      await uploadImage()
    })

    // test that the image renders
    test('should render uploaded image', async () => {
      await uploadImage()
      await expect(page.locator('.file-field .file-details img')).toHaveAttribute(
        'src',
        '/api/uploads/file/payload-1.jpg',
      )
    })

    test('should upload using the document drawer', async () => {
      await uploadImage()
      await wait(1000)
      // Open the media drawer and create a png upload

      await openDocDrawer(page, '.field-type.upload .upload__toggler.doc-drawer__toggler')

      await page
        .locator('[id^=doc-drawer_uploads_1_] .file-field__upload input[type="file"]')
        .setInputFiles(path.resolve(dirname, './uploads/payload.png'))
      await expect(
        page.locator('[id^=doc-drawer_uploads_1_] .file-field__upload .file-field__filename'),
      ).toHaveValue('payload.png')
      await page.locator('[id^=doc-drawer_uploads_1_] #action-save').click()
      await expect(page.locator('.Toastify')).toContainText('successfully')

      // Assert that the media field has the png upload
      await expect(
        page.locator('.field-type.upload .file-details .file-meta__url a'),
      ).toHaveAttribute('href', '/api/uploads/file/payload-1.png')
      await expect(
        page.locator('.field-type.upload .file-details .file-meta__url a'),
      ).toContainText('payload-1.png')
      await expect(page.locator('.field-type.upload .file-details img')).toHaveAttribute(
        'src',
        '/api/uploads/file/payload-1.png',
      )
      await saveDocAndAssert(page)
    })

    test('should clear selected upload', async () => {
      await uploadImage()
      await wait(1000) // TODO: Fix this. Need to wait a bit until the form in the drawer mounted, otherwise values sometimes disappear. This is an issue for all drawers

      await openDocDrawer(page, '.field-type.upload .upload__toggler.doc-drawer__toggler')

      await wait(1000)

      await page
        .locator('[id^=doc-drawer_uploads_1_] .file-field__upload input[type="file"]')
        .setInputFiles(path.resolve(dirname, './uploads/payload.png'))
      await expect(
        page.locator('[id^=doc-drawer_uploads_1_] .file-field__upload .file-field__filename'),
      ).toHaveValue('payload.png')
      await page.locator('[id^=doc-drawer_uploads_1_] #action-save').click()
      await expect(page.locator('.Toastify')).toContainText('successfully')
      await page.locator('.field-type.upload .file-details__remove').click()
    })

    test('should select using the list drawer and restrict mimetype based on filterOptions', async () => {
      await uploadImage()

      await openDocDrawer(page, '.field-type.upload .upload__toggler.list-drawer__toggler')

      const jpgImages = page.locator('[id^=list-drawer_1_] .upload-gallery img[src$=".jpg"]')
      await expect
        .poll(async () => await jpgImages.count(), { timeout: POLL_TOPASS_TIMEOUT })
        .toEqual(0)
    })

    test.skip('should show drawer for input field when enableRichText is false', async () => {
      const uploads3URL = new AdminUrlUtil(serverURL, 'uploads3')
      await page.goto(uploads3URL.create)

      // create file in uploads 3 collection
      await page
        .locator('.file-field__upload input[type="file"]')
        .setInputFiles(path.resolve(dirname, './collections/Upload/payload.jpg'))
      await expect(page.locator('.file-field .file-field__filename')).toContainText('payload.jpg')
      await page.locator('#action-save').click()

      await wait(200)

      // open drawer
      await openDocDrawer(page, '.field-type.upload .list-drawer__toggler')
      // check title
      await expect(page.locator('.list-drawer__header-text')).toContainText('Uploads 3')
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
      await expect(page.locator('.Toastify')).toContainText('successfully')

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
      await expect(page.locator('.Toastify')).toContainText('successfully')

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
})
