import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import { runAxeScan } from 'helpers/e2e/runAxeScan.js'
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
import { dateFieldsSlug } from '../../slugs.js'

const filename = fileURLToPath(import.meta.url)
const currentFolder = path.dirname(filename)
const dirname = path.resolve(currentFolder, '../../')

const { beforeAll, beforeEach, describe } = test

const londonTimezone = 'Europe/London'
const aucklandTimezone = 'Pacific/Auckland'
const detroitTimezone = 'America/Detroit'

let payload: PayloadTestSDK<Config>
let client: RESTClient
let page: Page
let serverURL: string
// If we want to make this run in parallel: test.describe.configure({ mode: 'parallel' })
let url: AdminUrlUtil

async function goToListView(page: Page) {
  await page.goto(url.list)
  await expect(page.locator('body')).not.toContainText('Loading...')
}

describe('Date', () => {
  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    process.env.SEED_IN_CONFIG_ONINIT = 'false' // Makes it so the payload config onInit seed is not run. Otherwise, the seed would be run unnecessarily twice for the initial test run - once for beforeEach and once for onInit
    ;({ payload, serverURL } = await initPayloadE2ENoConfig<Config>({
      dirname,
      // prebuild,
    }))
    url = new AdminUrlUtil(serverURL, dateFieldsSlug)

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

  test('should display formatted date in list view table cell', async () => {
    await goToListView(page)
    const formattedDateCell = page.locator('.row-1 .cell-timeOnly')
    await expect(formattedDateCell).toContainText(' Aug ')

    const notFormattedDateCell = page.locator('.row-1 .cell-default')
    await expect(notFormattedDateCell).toContainText('August')
  })

  test('should display formatted date in useAsTitle', async () => {
    await goToListView(page)
    // Wait for hydration
    await wait(1000)
    await page.locator('.row-1 .cell-default a').click()
    await expect(page.locator('.doc-header__title.render-title')).toContainText('August')
  })

  test('should retain date format in useAsTitle after modifying value', async () => {
    await goToListView(page)
    // Wait for hydration
    await wait(1000)
    await page.locator('.row-1 .cell-default a').click()
    await expect(page.locator('.doc-header__title.render-title')).toContainText('August')

    const dateField = page.locator('#field-default input')
    await expect(dateField).toBeVisible()
    await dateField.fill('02/07/2023')

    await expect(dateField).toHaveValue('02/07/2023')
    await expect(page.locator('.doc-header__title.render-title')).toContainText('February')
  })

  test('should clear date', async () => {
    await page.goto(url.create)
    const dateField = page.locator('#field-default input')
    await expect(dateField).toBeVisible()
    await dateField.fill('02/07/2023')
    await expect(dateField).toHaveValue('02/07/2023')

    // Fill in remaining required fields, this is just to make sure saving is possible
    const dateWithTz = page.locator('#field-dayAndTimeWithTimezone .react-datepicker-wrapper input')

    await dateWithTz.fill('08/12/2027 10:00 AM')

    const dropdownControlSelector = `#field-dayAndTimeWithTimezone .rs__control`

    const timezoneOptionSelector = `#field-dayAndTimeWithTimezone .rs__menu .rs__option:has-text("London")`
    await page.click(dropdownControlSelector)
    await page.click(timezoneOptionSelector)

    await saveDocAndAssert(page)

    const clearButton = page.locator('#field-default .date-time-picker__clear-button')
    await expect(clearButton).toBeVisible()
    await clearButton.click()
    await expect(dateField).toHaveValue('')
  })

  test('should clear miliseconds from dates with time', async () => {
    await page.goto(url.create)
    const dateField = page.locator('#field-default input')
    await expect(dateField).toBeVisible()
    // Fill in required fields, this is just to make sure saving is possible
    await dateField.fill('02/07/2023')
    const dateWithTz = page.locator('#field-dayAndTimeWithTimezone .react-datepicker-wrapper input')

    await dateWithTz.fill('08/12/2027 10:00 AM')

    const dropdownControlSelector = `#field-dayAndTimeWithTimezone .rs__control`
    const timezoneOptionSelector = `#field-dayAndTimeWithTimezone .rs__menu .rs__option:has-text("London")`

    await page.click(dropdownControlSelector)
    await page.click(timezoneOptionSelector)

    // Test the time field
    const timeField = page.locator('#field-timeOnly input')
    await timeField.fill('08/12/2027 10:00:00.123 AM')

    await saveDocAndAssert(page)

    const id = page.url().split('/').pop()

    const { doc } = await client.findByID({ id: id!, auth: true, slug: 'date-fields' })

    await expect(() => {
      // Ensure that the time field does not contain milliseconds
      expect(doc?.timeOnly).toContain('00:00.000Z')
    }).toPass()
  })

  test("should keep miliseconds when they're provided in the date format", async () => {
    await page.goto(url.create)
    const dateField = page.locator('#field-default input')
    await expect(dateField).toBeVisible()
    // Fill in required fields, this is just to make sure saving is possible
    await dateField.fill('02/07/2023')
    const dateWithTz = page.locator('#field-dayAndTimeWithTimezone .react-datepicker-wrapper input')

    await dateWithTz.fill('08/12/2027 10:00 AM')

    const dropdownControlSelector = `#field-dayAndTimeWithTimezone .rs__control`
    const timezoneOptionSelector = `#field-dayAndTimeWithTimezone .rs__menu .rs__option:has-text("London")`

    await page.click(dropdownControlSelector)
    await page.click(timezoneOptionSelector)

    // Test the time field
    const timeField = page.locator('#field-timeOnlyWithMiliseconds input')
    await timeField.fill('6:00.00.625 PM')

    await saveDocAndAssert(page)

    const id = page.url().split('/').pop()

    const { doc } = await client.findByID({ id: id!, auth: true, slug: 'date-fields' })

    await expect(() => {
      // Ensure that the time with miliseconds field contains the exact miliseconds specified
      expect(doc?.timeOnlyWithMiliseconds).toContain('625Z')
    }).toPass()
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
        const dateField = page.locator('#field-default input')

        // enter date in default date field
        await dateField.fill('02/07/2023')

        // Fill in remaining required fields, this is just to make sure saving is possible
        const dateWithTz = page.locator(
          '#field-dayAndTimeWithTimezone .react-datepicker-wrapper input',
        )

        await dateWithTz.fill('08/12/2027 10:00 AM')

        const dropdownControlSelector = `#field-dayAndTimeWithTimezone .rs__control`

        const timezoneOptionSelector = `#field-dayAndTimeWithTimezone .rs__menu .rs__option:has-text("London")`
        await page.click(dropdownControlSelector)
        await page.click(timezoneOptionSelector)

        await saveDocAndAssert(page)

        // get the ID of the doc
        const routeSegments = page.url().split('/')
        const id = routeSegments.pop()

        // fetch the doc (need the date string from the DB)
        const { doc } = await client.findByID({ id: id!, auth: true, slug: 'date-fields' })

        await expect(() => {
          expect(doc.default).toEqual('2023-02-07T12:00:00.000Z')
        }).toPass({ timeout: 10000, intervals: [100] })
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
        const dateField = page.locator('#field-default input')

        // enter date in default date field
        await dateField.fill('02/07/2023')

        // Fill in remaining required fields, this is just to make sure saving is possible
        const dateWithTz = page.locator(
          '#field-dayAndTimeWithTimezone .react-datepicker-wrapper input',
        )

        await dateWithTz.fill('08/12/2027 10:00 AM')

        const dropdownControlSelector = `#field-dayAndTimeWithTimezone .rs__control`

        const timezoneOptionSelector = `#field-dayAndTimeWithTimezone .rs__menu .rs__option:has-text("London")`
        await page.click(dropdownControlSelector)
        await page.click(timezoneOptionSelector)

        await saveDocAndAssert(page)

        // get the ID of the doc
        const routeSegments = page.url().split('/')
        const id = routeSegments.pop()

        // fetch the doc (need the date string from the DB)
        const { doc } = await client.findByID({ id: id!, auth: true, slug: 'date-fields' })

        await expect(() => {
          expect(doc.default).toEqual('2023-02-07T12:00:00.000Z')
        }).toPass({ timeout: 10000, intervals: [100] })
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
        const dateField = page.locator('#field-default input')

        // enter date in default date field
        await dateField.fill('02/07/2023')

        // Fill in remaining required fields, this is just to make sure saving is possible
        const dateWithTz = page.locator(
          '#field-dayAndTimeWithTimezone .react-datepicker-wrapper input',
        )

        await dateWithTz.fill('08/12/2027 10:00 AM')

        const dropdownControlSelector = `#field-dayAndTimeWithTimezone .rs__control`

        const timezoneOptionSelector = `#field-dayAndTimeWithTimezone .rs__menu .rs__option:has-text("London")`
        await page.click(dropdownControlSelector)
        await page.click(timezoneOptionSelector)

        await saveDocAndAssert(page)

        // get the ID of the doc
        const routeSegments = page.url().split('/')
        const id = routeSegments.pop()

        // fetch the doc (need the date string from the DB)
        const { doc } = await client.findByID({ id: id!, auth: true, slug: 'date-fields' })

        await expect(() => {
          expect(doc.default).toEqual('2023-02-07T12:00:00.000Z')
        }).toPass({ timeout: 10000, intervals: [100] })
      })
    })
  })

  describe('dates with timezones', () => {
    /**
     * For now we can only configure one timezone for this entire test suite because the .use is not isolating it per test block
     * The last .use options always overrides the rest
     *
     * See: https://github.com/microsoft/playwright/issues/27138
     */

    test('should display the value in the selected time', async () => {
      const {
        docs: [existingDoc],
      } = await payload.find({
        collection: dateFieldsSlug,
      })

      await page.goto(url.edit(existingDoc!.id))

      const dateTimeLocator = page.locator(
        '#field-dayAndTimeWithTimezone .react-datepicker-wrapper input',
      )

      const expectedValue = 'Aug 12, 2027 10:00 AM' // This is the seeded value for 10AM at Asia/Tokyo time
      const expectedUTCValue = '2027-08-12T01:00:00.000Z' // This is the expected UTC value for the above
      const expectedTimezone = 'Asia/Tokyo'

      await expect(dateTimeLocator).toHaveValue(expectedValue)

      await expect(() => {
        expect(existingDoc?.dayAndTimeWithTimezone).toEqual(expectedUTCValue)
        expect(existingDoc?.dayAndTimeWithTimezone_tz).toEqual(expectedTimezone)
      }).toPass({ timeout: 10000, intervals: [100] })
    })

    test('changing the timezone should update the date to the new equivalent', async () => {
      // Tests to see if the date value is updated when the timezone is changed,
      // it should change to the equivalent time in the new timezone as the UTC value remains the same
      const {
        docs: [existingDoc],
      } = await payload.find({
        collection: dateFieldsSlug,
      })

      await page.goto(url.edit(existingDoc!.id))

      const dateTimeLocator = page.locator(
        '#field-dayAndTimeWithTimezone .react-datepicker-wrapper input',
      )

      const initialDateValue = await dateTimeLocator.inputValue()

      const dropdownControlSelector = `#field-dayAndTimeWithTimezone .rs__control`

      const timezoneOptionSelector = `#field-dayAndTimeWithTimezone .rs__menu .rs__option:has-text("London")`

      await page.click(dropdownControlSelector)

      await page.click(timezoneOptionSelector)

      // todo: fix
      await expect(dateTimeLocator).not.toHaveValue(initialDateValue)
    })

    test('can change timezone inside a block', async () => {
      // Tests to see if the date value is updated when the timezone is changed,
      // it should change to the equivalent time in the new timezone as the UTC value remains the same
      const {
        docs: [existingDoc],
      } = await payload.find({
        collection: dateFieldsSlug,
      })

      await page.goto(url.edit(existingDoc!.id))

      const dateTimeLocator = page.locator(
        '#field-timezoneBlocks__0__dayAndTime .react-datepicker-wrapper input',
      )

      const initialDateValue = await dateTimeLocator.inputValue()

      const dropdownControlSelector = `#field-timezoneBlocks__0__dayAndTime .rs__control`
      const timezoneOptionSelector = `#field-timezoneBlocks__0__dayAndTime .rs__menu .rs__option:has-text("London")`

      await page.click(dropdownControlSelector)
      await page.click(timezoneOptionSelector)

      await expect(dateTimeLocator).not.toHaveValue(initialDateValue)
    })

    test('can change timezone inside an array', async () => {
      // Tests to see if the date value is updated when the timezone is changed,
      // it should change to the equivalent time in the new timezone as the UTC value remains the same
      const {
        docs: [existingDoc],
      } = await payload.find({
        collection: dateFieldsSlug,
      })

      await page.goto(url.edit(existingDoc!.id))

      const dateTimeLocator = page.locator(
        '#field-timezoneArray__0__dayAndTime .react-datepicker-wrapper input',
      )

      const initialDateValue = await dateTimeLocator.inputValue()

      const dropdownControlSelector = `#field-timezoneArray__0__dayAndTime .rs__control`

      const timezoneOptionSelector = `#field-timezoneArray__0__dayAndTime .rs__menu .rs__option:has-text("London")`

      await page.click(dropdownControlSelector)

      await page.click(timezoneOptionSelector)

      await expect(dateTimeLocator).not.toHaveValue(initialDateValue)
    })

    test('can see custom timezone in timezone picker', async () => {
      // Tests to see if the date value is updated when the timezone is changed,
      // it should change to the equivalent time in the new timezone as the UTC value remains the same
      const {
        docs: [existingDoc],
      } = await payload.find({
        collection: dateFieldsSlug,
      })

      await page.goto(url.edit(existingDoc!.id))

      const dropdownControlSelector = `#field-dayAndTimeWithTimezone .rs__control`

      const timezoneOptionSelector = `#field-dayAndTimeWithTimezone .rs__menu .rs__option:has-text("Monterrey")`

      await page.click(dropdownControlSelector)

      const timezoneOption = page.locator(timezoneOptionSelector)

      await expect(timezoneOption).toBeVisible()
    })

    test('can see default timezone in timezone picker', async () => {
      await page.goto(url.create)

      const selectedTimezoneSelector = `#field-dayAndTimeWithTimezone .rs__value-container`

      const selectedTimezone = page.locator(selectedTimezoneSelector)

      await expect(selectedTimezone).toContainText('Monterrey')
    })

    test('can see an error when the date field is required and timezone is empty', async () => {
      await page.goto(url.create)

      const dateField = page.locator('#field-default input')
      await expect(dateField).toBeVisible()
      await dateField.fill('02/07/2023')
      await expect(dateField).toHaveValue('02/07/2023')

      // Fill in the date but don't select a timezone
      const dateWithTz = page.locator(
        '#field-dayAndTimeWithTimezone .react-datepicker-wrapper input',
      )

      await dateWithTz.fill('08/12/2027 10:00 AM')

      const timezoneClearButton = page.locator(
        `#field-dayAndTimeWithTimezone .rs__control .clear-indicator`,
      )

      await expect(timezoneClearButton).toBeHidden()
    })

    test('can clear a selected timezone', async () => {
      const {
        docs: [existingDoc],
      } = await payload.find({
        collection: dateFieldsSlug,
      })

      await page.goto(url.edit(existingDoc!.id))

      const dateField = page.locator('#field-defaultWithTimezone .react-datepicker-wrapper input')

      const initialDate = await dateField.inputValue()

      const timezoneClearButton = page.locator(
        `#field-defaultWithTimezone .rs__control .clear-indicator`,
      )
      await timezoneClearButton.click()

      const updatedDate = dateField.inputValue()

      await expect(() => {
        expect(updatedDate).not.toEqual(initialDate)
      }).toPass({ timeout: 10000, intervals: [100] })
    })

    // This test should pass but it does not currently due to a11y issues with date fields - will fix in follow up PR
    test.skip('can not clear a timezone that is required', async () => {
      const {
        docs: [existingDoc],
      } = await payload.find({
        collection: dateFieldsSlug,
      })

      await page.goto(url.edit(existingDoc!.id))

      const dateField = page.locator(
        '#field-dayAndTimeWithTimezone .react-datepicker-wrapper input',
      )

      await expect(dateField).toBeVisible()
      await expect(dateField).toHaveAttribute('required')

      const timezoneClearButton = page.locator(
        `#field-dayAndTimeWithTimezone .rs__control .clear-indicator`,
      )
      await expect(timezoneClearButton).toBeHidden()

      const dateFieldRequiredOnlyTz = page.locator(
        '#field-dayAndTimeWithTimezoneRequired .react-datepicker-wrapper input',
      )

      await expect(dateFieldRequiredOnlyTz).toBeVisible()
      await expect(dateFieldRequiredOnlyTz).not.toHaveAttribute('required')

      const timezoneClearButtonOnlyTz = page.locator(
        `#field-dayAndTimeWithTimezoneRequired .rs__control .clear-indicator`,
      )
      await expect(timezoneClearButtonOnlyTz).toBeHidden()
    })

    test('creates the expected UTC value when the timezone is Tokyo', async () => {
      // We send this value through the input
      const expectedDateInput = 'Jan 1, 2025 6:00 PM'

      const expectedUTCValue = '2025-01-01T09:00:00.000Z'

      await page.goto(url.create)

      const dateField = page.locator('#field-default input')
      await dateField.fill('01/01/2025')

      const dateTimeLocator = page.locator(
        '#field-dayAndTimeWithTimezone .react-datepicker-wrapper input',
      )

      const dropdownControlSelector = `#field-dayAndTimeWithTimezone .rs__control`
      const timezoneOptionSelector = `#field-dayAndTimeWithTimezone .rs__menu .rs__option:has-text("Tokyo")`

      await page.click(dropdownControlSelector)
      await page.click(timezoneOptionSelector)
      await dateTimeLocator.fill(expectedDateInput)

      await saveDocAndAssert(page)

      const docID = page.url().split('/').pop()

      // eslint-disable-next-line payload/no-flaky-assertions
      expect(docID).toBeTruthy()

      const {
        docs: [existingDoc],
      } = await payload.find({
        collection: dateFieldsSlug,
        where: {
          id: {
            equals: docID,
          },
        },
      })

      // eslint-disable-next-line payload/no-flaky-assertions
      expect(existingDoc?.dayAndTimeWithTimezone).toEqual(expectedUTCValue)
    })
  })

  describe('dates with offset timezones', () => {
    test('can see UTC offset timezone options in picker', async () => {
      await page.goto(url.create)

      const dropdownControlSelector = `#field-dateWithOffsetTimezone .rs__control`

      await page.click(dropdownControlSelector)

      // Check for UTC+5:30 (India) option
      const indiaOption = page.locator(
        `#field-dateWithOffsetTimezone .rs__menu .rs__option:has-text("UTC+5:30 (India)")`,
      )
      await expect(indiaOption).toBeVisible()

      // Check for UTC-8 (PST) option
      const pstOption = page.locator(
        `#field-dateWithOffsetTimezone .rs__menu .rs__option:has-text("UTC-8 (PST)")`,
      )
      await expect(pstOption).toBeVisible()

      // Check for UTC+0 option
      const utcOption = page.locator(
        `#field-dateWithOffsetTimezone .rs__menu .rs__option:has-text("UTC+0")`,
      )
      await expect(utcOption).toBeVisible()
    })

    // Note: The 'can select offset timezone and save document' test has been moved to
    // createTimezoneContextTests to verify it works across different browser timezone contexts

    test('can see mixed IANA and offset timezone options', async () => {
      await page.goto(url.create)

      const dropdownControlSelector = `#field-dateWithMixedTimezones .rs__control`

      await page.click(dropdownControlSelector)

      // Check for IANA timezone option
      const newYorkOption = page.locator(
        `#field-dateWithMixedTimezones .rs__menu .rs__option:has-text("New York")`,
      )
      await expect(newYorkOption).toBeVisible()

      // Check for UTC offset option
      const offsetOption = page.locator(
        `#field-dateWithMixedTimezones .rs__menu .rs__option:text-is("UTC+5:30")`,
      )
      await expect(offsetOption).toBeVisible()

      // Check for UTC option
      const utcOption = page.locator(
        `#field-dateWithMixedTimezones .rs__menu .rs__option:text-is("UTC")`,
      )
      await expect(utcOption).toBeVisible()
    })

    test('default offset timezone is pre-selected', async () => {
      await page.goto(url.create)

      const selectedTimezoneSelector = `#field-dateWithOffsetTimezone .rs__value-container`
      const selectedTimezone = page.locator(selectedTimezoneSelector)

      // Default is +05:30 which has label "UTC+5:30 (India)"
      await expect(selectedTimezone).toContainText('UTC+5:30 (India)')
    })

    test('changing offset timezone updates displayed date value', async () => {
      const {
        docs: [existingDoc],
      } = await payload.find({
        collection: dateFieldsSlug,
      })

      await page.goto(url.edit(existingDoc!.id))

      const dateTimeLocator = page.locator(
        '#field-dateWithOffsetTimezone .react-datepicker-wrapper input',
      )

      const initialDateValue = await dateTimeLocator.inputValue()

      const dropdownControlSelector = `#field-dateWithOffsetTimezone .rs__control`
      const timezoneOptionSelector = `#field-dateWithOffsetTimezone .rs__menu .rs__option:has-text("UTC-8 (PST)")`

      await page.click(dropdownControlSelector)
      await page.click(timezoneOptionSelector)

      // Date value should change to reflect the new timezone
      await expect(dateTimeLocator).not.toHaveValue(initialDateValue)
    })
  })

  describe('A11y', () => {
    test.fixme('Edit view should have no accessibility violations', async ({}, testInfo) => {
      await page.goto(url.create)
      await page.locator('#field-default').waitFor()

      const scanResults = await runAxeScan({
        page,
        testInfo,
        include: ['.document-fields__main'],
        exclude: ['.field-description'], // known issue - reported elsewhere @todo: remove this once fixed - see report https://github.com/payloadcms/payload/discussions/14489
      })

      expect(scanResults.violations.length).toBe(0)
    })
  })
})

/**
 * Helper function to create timezone context test suites
 * Reduces repetition across different timezone test scenarios
 */
const createTimezoneContextTests = (contextName: string, timezoneId: string) => {
  describe(`Date with TZ - Context: ${contextName}`, () => {
    beforeAll(async ({ browser }, testInfo) => {
      testInfo.setTimeout(TEST_TIMEOUT_LONG)
      process.env.SEED_IN_CONFIG_ONINIT = 'false'
      ;({ payload, serverURL } = await initPayloadE2ENoConfig<Config>({
        dirname,
      }))
      url = new AdminUrlUtil(serverURL, dateFieldsSlug)

      const context = await browser.newContext({ timezoneId })
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

    test('displayed value should remain unchanged', async () => {
      const {
        docs: [existingDoc],
      } = await payload.find({
        collection: dateFieldsSlug,
      })

      await page.goto(url.edit(existingDoc!.id))

      const result = await page.evaluate(() => {
        return Intl.DateTimeFormat().resolvedOptions().timeZone
      })

      await expect(() => {
        expect(result).toEqual(timezoneId)
      }).toPass({ timeout: 10000, intervals: [100] })

      const dateOnlyLocator = page.locator(
        '#field-defaultWithTimezone .react-datepicker-wrapper input',
      )
      const dateTimeLocator = page.locator(
        '#field-dayAndTimeWithTimezone .react-datepicker-wrapper input',
      )

      const expectedDateOnlyValue = '08/12/2027'
      const expectedDateTimeValue = 'Aug 12, 2027 10:00 AM'

      await expect(dateOnlyLocator).toHaveValue(expectedDateOnlyValue)
      await expect(dateTimeLocator).toHaveValue(expectedDateTimeValue)
    })

    test('displayed value in list view should remain unchanged', async () => {
      await goToListView(page)

      const dateTimeLocator = page.locator('.cell-timezoneGroup__dayAndTime').first()

      await expect(async () => {
        await expect(dateTimeLocator).toHaveText('January 31st 2025, 10:00 AM')
      }).toPass({ timeout: 10000, intervals: [100] })

      const dateTimeLocatorFixed = page.locator('.cell-dayAndTimeWithTimezoneFixed').first()

      await expect(async () => {
        await expect(dateTimeLocatorFixed).toHaveText('October 29th 2025, 8:00 PM')
      }).toPass({ timeout: 10000, intervals: [100] })
    })

    test('date field with hidden timezone column should display date correctly in list view', async () => {
      await goToListView(page)

      // The date field value should still be displayed correctly
      const dateTimeLocator = page.locator('.cell-dateWithTimezoneWithDisabledColumns').first()

      await expect(async () => {
        // The date is 2027-08-12T14:00:00.000Z with America/New_York timezone
        // In New York (UTC-4 in summer), this should display as 10:00 AM
        await expect(dateTimeLocator).toHaveText('August 12th 2027, 10:00 AM')
      }).toPass({ timeout: 10000, intervals: [100] })

      // The timezone column should NOT be visible (hidden via disableListColumn override)
      const timezoneColumnCell = page.locator('.cell-dateWithTimezoneWithDisabledColumns_tz')
      await expect(timezoneColumnCell).toHaveCount(0)

      await page.locator('.list-controls__toggle-columns').click()

      const dateColumnOption = page.locator('#dateWithTimezoneWithDisabledColumns')
      await expect(dateColumnOption).toBeVisible()

      const timezoneColumnOption = page.locator('#dateWithTimezoneWithDisabledColumns_tz')
      await expect(timezoneColumnOption).toBeHidden()
    })

    test('creates the expected UTC value when the selected timezone is UTC', async () => {
      const expectedDateInput = 'Jan 1, 2025 6:00 PM'
      const expectedUTCValue = '2025-01-01T18:00:00.000Z'

      await page.goto(url.create)

      const dateField = page.locator('#field-default input')
      await dateField.fill('01/01/2025')

      const dateTimeLocator = page.locator(
        '#field-dayAndTimeWithTimezone .react-datepicker-wrapper input',
      )

      const dropdownControlSelector = `#field-dayAndTimeWithTimezone .rs__control`
      const timezoneOptionSelector = `#field-dayAndTimeWithTimezone .rs__menu .rs__option:has-text("Custom UTC")`

      await page.click(dropdownControlSelector)
      await page.click(timezoneOptionSelector)
      await dateTimeLocator.fill(expectedDateInput)

      await saveDocAndAssert(page)

      const docID = page.url().split('/').pop()

      // eslint-disable-next-line payload/no-flaky-assertions
      expect(docID).toBeTruthy()

      const {
        docs: [existingDoc],
      } = await payload.find({
        collection: dateFieldsSlug,
        where: {
          id: {
            equals: docID,
          },
        },
      })

      // eslint-disable-next-line payload/no-flaky-assertions
      expect(existingDoc?.dayAndTimeWithTimezone).toEqual(expectedUTCValue)
    })

    test('creates the expected UTC value when the selected timezone is Paris - no daylight savings', async () => {
      const expectedDateInput = 'Jan 1, 2025 6:00 PM'
      const expectedUTCValue = '2025-01-01T17:00:00.000Z'

      await page.goto(url.create)

      const dateField = page.locator('#field-default input')
      await dateField.fill('01/01/2025')

      const dateTimeLocator = page.locator(
        '#field-dayAndTimeWithTimezone .react-datepicker-wrapper input',
      )

      const dropdownControlSelector = `#field-dayAndTimeWithTimezone .rs__control`
      const timezoneOptionSelector = `#field-dayAndTimeWithTimezone .rs__menu .rs__option:has-text("Paris")`

      await page.click(dropdownControlSelector)
      await page.click(timezoneOptionSelector)
      await dateTimeLocator.fill(expectedDateInput)

      await saveDocAndAssert(page)

      const docID = page.url().split('/').pop()

      // eslint-disable-next-line payload/no-flaky-assertions
      expect(docID).toBeTruthy()

      const {
        docs: [existingDoc],
      } = await payload.find({
        collection: dateFieldsSlug,
        where: {
          id: {
            equals: docID,
          },
        },
      })

      // eslint-disable-next-line payload/no-flaky-assertions
      expect(existingDoc?.dayAndTimeWithTimezone).toEqual(expectedUTCValue)
    })

    test('creates the expected UTC value when the selected timezone is Paris - with daylight savings', async () => {
      const expectedDateInput = 'Jul 1, 2025 6:00 PM'
      const expectedUTCValue = '2025-07-01T16:00:00.000Z'

      await page.goto(url.create)

      const dateField = page.locator('#field-default input')
      await dateField.fill('01/01/2025')

      const dateTimeLocator = page.locator(
        '#field-dayAndTimeWithTimezone .react-datepicker-wrapper input',
      )

      const dropdownControlSelector = `#field-dayAndTimeWithTimezone .rs__control`
      const timezoneOptionSelector = `#field-dayAndTimeWithTimezone .rs__menu .rs__option:has-text("Paris")`

      await page.click(dropdownControlSelector)
      await page.click(timezoneOptionSelector)
      await dateTimeLocator.fill(expectedDateInput)

      await saveDocAndAssert(page)

      const docID = page.url().split('/').pop()

      // eslint-disable-next-line payload/no-flaky-assertions
      expect(docID).toBeTruthy()

      const {
        docs: [existingDoc],
      } = await payload.find({
        collection: dateFieldsSlug,
        where: {
          id: {
            equals: docID,
          },
        },
      })

      // eslint-disable-next-line payload/no-flaky-assertions
      expect(existingDoc?.dayAndTimeWithTimezone).toEqual(expectedUTCValue)
    })

    test('creates the expected UTC value when the selected timezone is Auckland - no daylight savings', async () => {
      const expectedDateTimeInput = 'Jan 1, 2025 6:00 PM'
      const expectedDateOnlyInput = '01/02/2025'

      const expectedDateTimeUTCValue = '2025-01-01T05:00:00.000Z'
      const expectedDateOnlyUTCValue = '2025-01-01T23:00:00.000Z'

      await page.goto(url.create)

      const dateField = page.locator('#field-default input')
      await dateField.fill('01/01/2025')

      const dateTimeLocator = page.locator(
        '#field-dayAndTimeWithTimezone .react-datepicker-wrapper input',
      )
      const dateOnlyLocator = page.locator(
        '#field-defaultWithTimezone .react-datepicker-wrapper input',
      )

      const dateOnlyDropdownSelector = `#field-defaultWithTimezone .rs__control`
      const dateOnlytimezoneSelector = `#field-defaultWithTimezone .rs__menu .rs__option:has-text("Auckland")`
      await page.click(dateOnlyDropdownSelector)
      await page.click(dateOnlytimezoneSelector)
      await dateOnlyLocator.fill(expectedDateOnlyInput)

      const dropdownControlSelector = `#field-dayAndTimeWithTimezone .rs__control`
      const timezoneOptionSelector = `#field-dayAndTimeWithTimezone .rs__menu .rs__option:has-text("Auckland")`
      await page.click(dropdownControlSelector)
      await page.click(timezoneOptionSelector)
      await dateTimeLocator.fill(expectedDateTimeInput)

      await saveDocAndAssert(page)

      const docID = page.url().split('/').pop()

      // eslint-disable-next-line payload/no-flaky-assertions
      expect(docID).toBeTruthy()

      const {
        docs: [existingDoc],
      } = await payload.find({
        collection: dateFieldsSlug,
        where: {
          id: {
            equals: docID,
          },
        },
      })

      // eslint-disable-next-line payload/no-flaky-assertions
      expect(existingDoc?.dayAndTimeWithTimezone).toEqual(expectedDateTimeUTCValue)
      expect(existingDoc?.defaultWithTimezone).toEqual(expectedDateOnlyUTCValue)
    })

    test('creates the expected UTC value when the selected timezone is Auckland - with daylight savings', async () => {
      const expectedDateTimeInput = 'Jul 1, 2025 6:00 PM'
      const expectedDateOnlyInput = '07/02/2025'

      const expectedDateTimeUTCValue = '2025-07-01T06:00:00.000Z'
      const expectedDateOnlyUTCValue = '2025-07-02T00:00:00.000Z'

      await page.goto(url.create)

      const dateField = page.locator('#field-default input')
      await dateField.fill('01/01/2025')

      const dateTimeLocator = page.locator(
        '#field-dayAndTimeWithTimezone .react-datepicker-wrapper input',
      )
      const dateOnlyLocator = page.locator(
        '#field-defaultWithTimezone .react-datepicker-wrapper input',
      )

      const dateOnlyDropdownSelector = `#field-defaultWithTimezone .rs__control`
      const dateOnlytimezoneSelector = `#field-defaultWithTimezone .rs__menu .rs__option:has-text("Auckland")`
      await page.click(dateOnlyDropdownSelector)
      await page.click(dateOnlytimezoneSelector)
      await dateOnlyLocator.fill(expectedDateOnlyInput)

      const dropdownControlSelector = `#field-dayAndTimeWithTimezone .rs__control`
      const timezoneOptionSelector = `#field-dayAndTimeWithTimezone .rs__menu .rs__option:has-text("Auckland")`
      await page.click(dropdownControlSelector)
      await page.click(timezoneOptionSelector)
      await dateTimeLocator.fill(expectedDateTimeInput)

      await saveDocAndAssert(page)

      const docID = page.url().split('/').pop()

      // eslint-disable-next-line payload/no-flaky-assertions
      expect(docID).toBeTruthy()

      const {
        docs: [existingDoc],
      } = await payload.find({
        collection: dateFieldsSlug,
        where: {
          id: {
            equals: docID,
          },
        },
      })

      // eslint-disable-next-line payload/no-flaky-assertions
      expect(existingDoc?.dayAndTimeWithTimezone).toEqual(expectedDateTimeUTCValue)
      expect(existingDoc?.defaultWithTimezone).toEqual(expectedDateOnlyUTCValue)
    })

    test('when only one timezone is supported the timezone should be disabled and enforced', async () => {
      const expectedFixedUTCValue = '2025-10-29T20:00:00.000Z' // This is 8PM UTC on Oct 29, 2025
      const expectedFixedTimezoneValue = 'Europe/London'

      const expectedUpdatedInput = 'Oct 29, 2025 4:00 PM'
      const expectedUpdatedUTCValue = '2025-10-29T16:00:00.000Z' // This is 4PM UTC on Oct 29, 2025

      const {
        docs: [existingDoc],
      } = await payload.find({
        collection: dateFieldsSlug,
      })

      await page.goto(url.edit(existingDoc!.id))

      const dateTimeLocator = page.locator(
        '#field-dayAndTimeWithTimezoneFixed .date-time-picker input',
      )

      await expect(dateTimeLocator).toBeEnabled()

      const dateFieldWrapper = page.locator('.date-time-field').filter({ has: dateTimeLocator })
      const dropdownInput = dateFieldWrapper.locator('.timezone-picker .rs__input')
      const dropdownValue = dateFieldWrapper.locator('.timezone-picker .rs__value-container')

      await expect(dropdownInput).toBeDisabled()
      await expect(dropdownValue).toContainText('London')

      // Verify the stored values are as expected
      expect(existingDoc?.dayAndTimeWithTimezoneFixed).toEqual(expectedFixedUTCValue)
      expect(existingDoc?.dayAndTimeWithTimezoneFixed_tz).toEqual(expectedFixedTimezoneValue)

      await dateTimeLocator.fill(expectedUpdatedInput)

      await saveDocAndAssert(page)

      const {
        docs: [updatedDoc],
      } = await payload.find({
        collection: dateFieldsSlug,
      })

      expect(updatedDoc?.dayAndTimeWithTimezoneFixed).toEqual(expectedUpdatedUTCValue)
      expect(updatedDoc?.dayAndTimeWithTimezoneFixed_tz).toEqual(expectedFixedTimezoneValue)
    })

    test('readonly field should be disabled and timezone should not be selectable', async () => {
      const expectedReadOnlyUTCValue = '2027-08-12T01:00:00.000Z'
      const expectedReadOnlyTimezoneValue = 'Asia/Tokyo'

      const {
        docs: [existingDoc],
      } = await payload.find({
        collection: dateFieldsSlug,
      })

      await page.goto(url.edit(existingDoc!.id))

      const dateTimeLocator = page.locator(
        '#field-dayAndTimeWithTimezoneReadOnly .date-time-picker input',
      )

      await expect(dateTimeLocator).toBeDisabled()

      const dateFieldWrapper = page.locator('.date-time-field').filter({ has: dateTimeLocator })
      const dropdownInput = dateFieldWrapper.locator('.timezone-picker .rs__input')
      const dropdownValue = dateFieldWrapper.locator('.timezone-picker .rs__value-container')

      await expect(dropdownInput).toBeDisabled()
      await expect(dropdownValue).toContainText('Tokyo')

      // Verify the stored values are as expected
      expect(existingDoc?.dayAndTimeWithTimezoneReadOnly).toEqual(expectedReadOnlyUTCValue)
      expect(existingDoc?.dayAndTimeWithTimezoneReadOnly_tz).toEqual(expectedReadOnlyTimezoneValue)
    })
    describe('offset timezone handling', () => {
      test('offset timezone saves correct UTC value regardless of browser context', async () => {
        // This test verifies that UTC offset conversion is independent of browser timezone
        // Input: Jan 1, 2025 6:00 PM with +05:30 selected
        // Expected UTC: 2025-01-01T12:30:00.000Z (should be same in ALL browser contexts)
        const expectedDateInput = 'Jan 1, 2025 6:00 PM'
        const expectedUTCValue = '2025-01-01T12:30:00.000Z'
        const expectedTimezone = '+05:30'

        await page.goto(url.create)

        const dateField = page.locator('#field-default input')
        await dateField.fill('01/01/2025')

        // Fill required dayAndTimeWithTimezone field
        const requiredDateWithTz = page.locator(
          '#field-dayAndTimeWithTimezone .react-datepicker-wrapper input',
        )
        await requiredDateWithTz.fill('01/01/2025 10:00 AM')

        const requiredTzDropdown = `#field-dayAndTimeWithTimezone .rs__control`
        const requiredTzOption = `#field-dayAndTimeWithTimezone .rs__menu .rs__option:has-text("Tokyo")`
        await page.click(requiredTzDropdown)
        await page.click(requiredTzOption)

        // Set up the offset timezone field
        const dateTimeLocator = page.locator(
          '#field-dateWithOffsetTimezone .react-datepicker-wrapper input',
        )

        const dropdownControlSelector = `#field-dateWithOffsetTimezone .rs__control`
        const timezoneOptionSelector = `#field-dateWithOffsetTimezone .rs__menu .rs__option:has-text("UTC+5:30 (India)")`

        await page.click(dropdownControlSelector)
        await page.click(timezoneOptionSelector)
        await dateTimeLocator.fill(expectedDateInput)

        await saveDocAndAssert(page)

        const docID = page.url().split('/').pop()

        // eslint-disable-next-line payload/no-flaky-assertions
        expect(docID).toBeTruthy()

        const {
          docs: [existingDoc],
        } = await payload.find({
          collection: dateFieldsSlug,
          where: {
            id: {
              equals: docID,
            },
          },
        })

        // The UTC value should be identical regardless of browser timezone context
        // eslint-disable-next-line payload/no-flaky-assertions
        expect(existingDoc?.dateWithOffsetTimezone).toEqual(expectedUTCValue)
        expect(existingDoc?.dateWithOffsetTimezone_tz).toEqual(expectedTimezone)
      })

      test('negative offset timezone saves correct UTC value regardless of browser context', async () => {
        // Input: Jan 1, 2025 6:00 PM with -08:00 selected
        // Expected UTC: 2025-01-02T02:00:00.000Z (6PM + 8 hours = 2AM next day)
        const expectedDateInput = 'Jan 1, 2025 6:00 PM'
        const expectedUTCValue = '2025-01-02T02:00:00.000Z'
        const expectedTimezone = '-08:00'

        await page.goto(url.create)

        const dateField = page.locator('#field-default input')
        await dateField.fill('01/01/2025')

        // Fill required dayAndTimeWithTimezone field
        const requiredDateWithTz = page.locator(
          '#field-dayAndTimeWithTimezone .react-datepicker-wrapper input',
        )
        await requiredDateWithTz.fill('01/01/2025 10:00 AM')

        const requiredTzDropdown = `#field-dayAndTimeWithTimezone .rs__control`
        const requiredTzOption = `#field-dayAndTimeWithTimezone .rs__menu .rs__option:has-text("Tokyo")`
        await page.click(requiredTzDropdown)
        await page.click(requiredTzOption)

        // Set up the offset timezone field with negative offset
        const dateTimeLocator = page.locator(
          '#field-dateWithOffsetTimezone .react-datepicker-wrapper input',
        )

        const dropdownControlSelector = `#field-dateWithOffsetTimezone .rs__control`
        const timezoneOptionSelector = `#field-dateWithOffsetTimezone .rs__menu .rs__option:has-text("UTC-8 (PST)")`

        await page.click(dropdownControlSelector)
        await page.click(timezoneOptionSelector)
        await dateTimeLocator.fill(expectedDateInput)

        await saveDocAndAssert(page)

        const docID = page.url().split('/').pop()

        // eslint-disable-next-line payload/no-flaky-assertions
        expect(docID).toBeTruthy()

        const {
          docs: [existingDoc],
        } = await payload.find({
          collection: dateFieldsSlug,
          where: {
            id: {
              equals: docID,
            },
          },
        })

        // eslint-disable-next-line payload/no-flaky-assertions
        expect(existingDoc?.dateWithOffsetTimezone).toEqual(expectedUTCValue)
        expect(existingDoc?.dateWithOffsetTimezone_tz).toEqual(expectedTimezone)
      })

      test('switching between IANA and offset timezone works correctly', async () => {
        // Test the mixed timezone field that supports both IANA and offset formats
        const expectedDateInput = 'Jan 1, 2025 6:00 PM'

        await page.goto(url.create)

        const dateField = page.locator('#field-default input')
        await dateField.fill('01/01/2025')

        // Fill required dayAndTimeWithTimezone field
        const requiredDateWithTz = page.locator(
          '#field-dayAndTimeWithTimezone .react-datepicker-wrapper input',
        )
        await requiredDateWithTz.fill('01/01/2025 10:00 AM')

        const requiredTzDropdown = `#field-dayAndTimeWithTimezone .rs__control`
        const requiredTzOption = `#field-dayAndTimeWithTimezone .rs__menu .rs__option:has-text("Tokyo")`
        await page.click(requiredTzDropdown)
        await page.click(requiredTzOption)

        // Set up the mixed timezone field - first with IANA timezone
        const dateTimeLocator = page.locator(
          '#field-dateWithMixedTimezones .react-datepicker-wrapper input',
        )
        const dropdownControlSelector = `#field-dateWithMixedTimezones .rs__control`

        // Select IANA timezone first
        const ianaOptionSelector = `#field-dateWithMixedTimezones .rs__menu .rs__option:has-text("New York")`
        await page.click(dropdownControlSelector)
        await page.click(ianaOptionSelector)
        await dateTimeLocator.fill(expectedDateInput)

        // Now switch to offset timezone
        const offsetOptionSelector = `#field-dateWithMixedTimezones .rs__menu .rs__option:text-is("UTC+5:30")`
        await page.click(dropdownControlSelector)
        await page.click(offsetOptionSelector)

        await saveDocAndAssert(page)

        const docID = page.url().split('/').pop()

        // eslint-disable-next-line payload/no-flaky-assertions
        expect(docID).toBeTruthy()

        const {
          docs: [existingDoc],
        } = await payload.find({
          collection: dateFieldsSlug,
          where: {
            id: {
              equals: docID,
            },
          },
        })

        // Should have saved with the offset timezone
        expect(existingDoc?.dateWithMixedTimezones_tz).toEqual('+05:30')
      })

      test('offset timezone display is independent of browser timezone', async () => {
        // Create a doc with a known offset timezone value
        const doc = await payload.create({
          collection: dateFieldsSlug,
          data: {
            default: '2025-01-01T00:00:00.000Z',
            dayAndTimeWithTimezone: '2025-01-01T01:00:00.000Z',
            dayAndTimeWithTimezone_tz: 'Asia/Tokyo',
            // 2025-01-01T12:30:00.000Z with +05:30 should display as Jan 1, 2025 6:00 PM
            dateWithOffsetTimezone: '2025-01-01T12:30:00.000Z',
            dateWithOffsetTimezone_tz: '+05:30',
          },
        })

        await page.goto(url.edit(doc.id))

        const dateTimeLocator = page.locator(
          '#field-dateWithOffsetTimezone .react-datepicker-wrapper input',
        )

        // The displayed value should be 6:00 PM regardless of browser timezone
        // because offset timezones are absolute (not affected by browser TZ)
        await expect(dateTimeLocator).toHaveValue('Jan 1, 2025 6:00 PM')
      })
    })
  })
}

// Create timezone context test suites for different timezones
createTimezoneContextTests('America/Detroit', detroitTimezone)
createTimezoneContextTests('Europe/London', londonTimezone)
createTimezoneContextTests('Pacific/Auckland', aucklandTimezone)
