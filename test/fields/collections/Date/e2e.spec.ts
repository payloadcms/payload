import type { Page } from '@playwright/test'

import { TZDateMini } from '@date-fns/tz/date/mini'
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
      await timezoneClearButton.click()

      // Expect an error here
      await saveDocAndAssert(page, undefined, 'error')

      const errorMessage = page.locator(
        '#field-dayAndTimeWithTimezone .field-error .tooltip-content:has-text("A timezone is required.")',
      )

      await expect(errorMessage).toBeVisible()
    })

    test('can clear a selected timezone', async () => {
      const {
        docs: [existingDoc],
      } = await payload.find({
        collection: dateFieldsSlug,
      })

      await page.goto(url.edit(existingDoc!.id))

      const dateField = page.locator(
        '#field-dayAndTimeWithTimezone .react-datepicker-wrapper input',
      )

      const initialDate = await dateField.inputValue()

      const timezoneClearButton = page.locator(
        `#field-dayAndTimeWithTimezone .rs__control .clear-indicator`,
      )
      await timezoneClearButton.click()

      const updatedDate = dateField.inputValue()

      await expect(() => {
        expect(updatedDate).not.toEqual(initialDate)
      }).toPass({ timeout: 10000, intervals: [100] })
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
})

describe('Date with TZ - Context: America/Detroit', () => {
  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    process.env.SEED_IN_CONFIG_ONINIT = 'false' // Makes it so the payload config onInit seed is not run. Otherwise, the seed would be run unnecessarily twice for the initial test run - once for beforeEach and once for onInit
    ;({ payload, serverURL } = await initPayloadE2ENoConfig<Config>({
      dirname,
      // prebuild,
    }))
    url = new AdminUrlUtil(serverURL, dateFieldsSlug)

    const context = await browser.newContext({ timezoneId: detroitTimezone })
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
      // Confirm that the emulated timezone is set to London
      expect(result).toEqual(detroitTimezone)
    }).toPass({ timeout: 10000, intervals: [100] })

    const dateOnlyLocator = page.locator(
      '#field-defaultWithTimezone .react-datepicker-wrapper input',
    )
    const dateTimeLocator = page.locator(
      '#field-dayAndTimeWithTimezone .react-datepicker-wrapper input',
    )

    const expectedDateOnlyValue = '08/12/2027'
    const expectedDateTimeValue = 'Aug 12, 2027 10:00 AM' // This is the seeded value for 10AM at Asia/Tokyo time

    await expect(dateOnlyLocator).toHaveValue(expectedDateOnlyValue)
    await expect(dateTimeLocator).toHaveValue(expectedDateTimeValue)
  })

  test('creates the expected UTC value when the selected timezone is Paris - no daylight savings', async () => {
    // We send this value through the input
    const expectedDateInput = 'Jan 1, 2025 6:00 PM'
    // We're testing this specific date because Paris has no daylight savings time in January
    // but the UTC date will be different from 6PM local time in the summer versus the winter
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
    // We send this value through the input
    const expectedDateInput = 'Jul 1, 2025 6:00 PM'

    // We're testing specific date because Paris has daylight savings time in July (+1 hour to the local timezone)
    // but the UTC date will be different from 6PM local time in the summer versus the winter
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
    // We send this value through the input
    const expectedDateTimeInput = 'Jan 1, 2025 6:00 PM'
    // The timestamp for this date should be normalised to 12PM local time
    const expectedDateOnlyInput = '01/02/2025' // 2nd July 2025

    // We're testing specific date because Paris has daylight savings time in July (+1 hour to the local timezone)
    // but the UTC date will be different from 6PM local time in the summer versus the winter
    const expectedDateTimeUTCValue = '2025-01-01T05:00:00.000Z'
    // The timestamp for this date should be normalised to 12PM local time
    const expectedDateOnlyUTCValue = '2025-01-01T23:00:00.000Z' // 2nd July 2025 at 12PM in Auckland

    await page.goto(url.create)

    // Default date field - filling it because it's required for the form to be valid
    const dateField = page.locator('#field-default input')
    await dateField.fill('01/01/2025')

    // Date input fields
    const dateTimeLocator = page.locator(
      '#field-dayAndTimeWithTimezone .react-datepicker-wrapper input',
    )
    const dateOnlyLocator = page.locator(
      '#field-defaultWithTimezone .react-datepicker-wrapper input',
    )

    // Fill in date only
    const dateOnlyDropdownSelector = `#field-defaultWithTimezone .rs__control`
    const dateOnlytimezoneSelector = `#field-defaultWithTimezone .rs__menu .rs__option:has-text("Auckland")`
    await page.click(dateOnlyDropdownSelector)
    await page.click(dateOnlytimezoneSelector)
    await dateOnlyLocator.fill(expectedDateOnlyInput)

    // Fill in date and time
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
    // We send this value through the input
    const expectedDateTimeInput = 'Jul 1, 2025 6:00 PM'
    // The timestamp for this date should be normalised to 12PM local time
    const expectedDateOnlyInput = '07/02/2025' // 2nd July 2025

    // We're testing specific date because Paris has daylight savings time in July (+1 hour to the local timezone)
    // but the UTC date will be different from 6PM local time in the summer versus the winter
    const expectedDateTimeUTCValue = '2025-07-01T06:00:00.000Z'
    // The timestamp for this date should be normalised to 12PM local time
    const expectedDateOnlyUTCValue = '2025-07-02T00:00:00.000Z' // 2nd July 2025 at 12PM in Auckland

    await page.goto(url.create)

    // Default date field - filling it because it's required for the form to be valid
    const dateField = page.locator('#field-default input')
    await dateField.fill('01/01/2025')

    // Date input fields
    const dateTimeLocator = page.locator(
      '#field-dayAndTimeWithTimezone .react-datepicker-wrapper input',
    )
    const dateOnlyLocator = page.locator(
      '#field-defaultWithTimezone .react-datepicker-wrapper input',
    )

    // Fill in date only
    const dateOnlyDropdownSelector = `#field-defaultWithTimezone .rs__control`
    const dateOnlytimezoneSelector = `#field-defaultWithTimezone .rs__menu .rs__option:has-text("Auckland")`
    await page.click(dateOnlyDropdownSelector)
    await page.click(dateOnlytimezoneSelector)
    await dateOnlyLocator.fill(expectedDateOnlyInput)

    // Fill in date and time
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
})

describe('Date with TZ - Context: Europe/London', () => {
  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    process.env.SEED_IN_CONFIG_ONINIT = 'false' // Makes it so the payload config onInit seed is not run. Otherwise, the seed would be run unnecessarily twice for the initial test run - once for beforeEach and once for onInit
    ;({ payload, serverURL } = await initPayloadE2ENoConfig<Config>({
      dirname,
      // prebuild,
    }))
    url = new AdminUrlUtil(serverURL, dateFieldsSlug)

    const context = await browser.newContext({ timezoneId: londonTimezone })
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
      // Confirm that the emulated timezone is set to London
      expect(result).toEqual(londonTimezone)
    }).toPass({ timeout: 10000, intervals: [100] })

    const dateOnlyLocator = page.locator(
      '#field-defaultWithTimezone .react-datepicker-wrapper input',
    )
    const dateTimeLocator = page.locator(
      '#field-dayAndTimeWithTimezone .react-datepicker-wrapper input',
    )

    const expectedDateOnlyValue = '08/12/2027'
    const expectedDateTimeValue = 'Aug 12, 2027 10:00 AM' // This is the seeded value for 10AM at Asia/Tokyo time

    await expect(dateOnlyLocator).toHaveValue(expectedDateOnlyValue)
    await expect(dateTimeLocator).toHaveValue(expectedDateTimeValue)
  })

  test('creates the expected UTC value when the selected timezone is Paris - no daylight savings', async () => {
    // We send this value through the input
    const expectedDateInput = 'Jan 1, 2025 6:00 PM'
    // We're testing this specific date because Paris has no daylight savings time in January
    // but the UTC date will be different from 6PM local time in the summer versus the winter
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
    // We send this value through the input
    const expectedDateInput = 'Jul 1, 2025 6:00 PM'

    // We're testing specific date because Paris has daylight savings time in July (+1 hour to the local timezone)
    // but the UTC date will be different from 6PM local time in the summer versus the winter
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
    // We send this value through the input
    const expectedDateTimeInput = 'Jan 1, 2025 6:00 PM'
    // The timestamp for this date should be normalised to 12PM local time
    const expectedDateOnlyInput = '01/02/2025' // 2nd July 2025

    // We're testing specific date because Paris has daylight savings time in July (+1 hour to the local timezone)
    // but the UTC date will be different from 6PM local time in the summer versus the winter
    const expectedDateTimeUTCValue = '2025-01-01T05:00:00.000Z'
    // The timestamp for this date should be normalised to 12PM local time
    const expectedDateOnlyUTCValue = '2025-01-01T23:00:00.000Z' // 2nd July 2025 at 12PM in Auckland

    await page.goto(url.create)

    // Default date field - filling it because it's required for the form to be valid
    const dateField = page.locator('#field-default input')
    await dateField.fill('01/01/2025')

    // Date input fields
    const dateTimeLocator = page.locator(
      '#field-dayAndTimeWithTimezone .react-datepicker-wrapper input',
    )
    const dateOnlyLocator = page.locator(
      '#field-defaultWithTimezone .react-datepicker-wrapper input',
    )

    // Fill in date only
    const dateOnlyDropdownSelector = `#field-defaultWithTimezone .rs__control`
    const dateOnlytimezoneSelector = `#field-defaultWithTimezone .rs__menu .rs__option:has-text("Auckland")`
    await page.click(dateOnlyDropdownSelector)
    await page.click(dateOnlytimezoneSelector)
    await dateOnlyLocator.fill(expectedDateOnlyInput)

    // Fill in date and time
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
    // We send this value through the input
    const expectedDateTimeInput = 'Jul 1, 2025 6:00 PM'
    // The timestamp for this date should be normalised to 12PM local time
    const expectedDateOnlyInput = '07/02/2025' // 2nd July 2025

    // We're testing specific date because Paris has daylight savings time in July (+1 hour to the local timezone)
    // but the UTC date will be different from 6PM local time in the summer versus the winter
    const expectedDateTimeUTCValue = '2025-07-01T06:00:00.000Z'
    // The timestamp for this date should be normalised to 12PM local time
    const expectedDateOnlyUTCValue = '2025-07-02T00:00:00.000Z' // 2nd July 2025 at 12PM in Auckland

    await page.goto(url.create)

    // Default date field - filling it because it's required for the form to be valid
    const dateField = page.locator('#field-default input')
    await dateField.fill('01/01/2025')

    // Date input fields
    const dateTimeLocator = page.locator(
      '#field-dayAndTimeWithTimezone .react-datepicker-wrapper input',
    )
    const dateOnlyLocator = page.locator(
      '#field-defaultWithTimezone .react-datepicker-wrapper input',
    )

    // Fill in date only
    const dateOnlyDropdownSelector = `#field-defaultWithTimezone .rs__control`
    const dateOnlytimezoneSelector = `#field-defaultWithTimezone .rs__menu .rs__option:has-text("Auckland")`
    await page.click(dateOnlyDropdownSelector)
    await page.click(dateOnlytimezoneSelector)
    await dateOnlyLocator.fill(expectedDateOnlyInput)

    // Fill in date and time
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
})

describe('Date with TZ - Context: Pacific/Auckland', () => {
  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    process.env.SEED_IN_CONFIG_ONINIT = 'false' // Makes it so the payload config onInit seed is not run. Otherwise, the seed would be run unnecessarily twice for the initial test run - once for beforeEach and once for onInit
    ;({ payload, serverURL } = await initPayloadE2ENoConfig<Config>({
      dirname,
      // prebuild,
    }))
    url = new AdminUrlUtil(serverURL, dateFieldsSlug)

    const context = await browser.newContext({ timezoneId: aucklandTimezone })
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
      // Confirm that the emulated timezone is set to London
      expect(result).toEqual(aucklandTimezone)
    }).toPass({ timeout: 10000, intervals: [100] })

    const dateOnlyLocator = page.locator(
      '#field-defaultWithTimezone .react-datepicker-wrapper input',
    )
    const dateTimeLocator = page.locator(
      '#field-dayAndTimeWithTimezone .react-datepicker-wrapper input',
    )

    const expectedDateOnlyValue = '08/12/2027'
    const expectedDateTimeValue = 'Aug 12, 2027 10:00 AM' // This is the seeded value for 10AM at Asia/Tokyo time

    await expect(dateOnlyLocator).toHaveValue(expectedDateOnlyValue)
    await expect(dateTimeLocator).toHaveValue(expectedDateTimeValue)
  })

  test('creates the expected UTC value when the selected timezone is Paris - no daylight savings', async () => {
    // We send this value through the input
    const expectedDateInput = 'Jan 1, 2025 6:00 PM'
    // We're testing this specific date because Paris has no daylight savings time in January
    // but the UTC date will be different from 6PM local time in the summer versus the winter
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
    // We send this value through the input
    const expectedDateInput = 'Jul 1, 2025 6:00 PM'

    // We're testing specific date because Paris has daylight savings time in July (+1 hour to the local timezone)
    // but the UTC date will be different from 6PM local time in the summer versus the winter
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
    // We send this value through the input
    const expectedDateTimeInput = 'Jan 1, 2025 6:00 PM'
    // The timestamp for this date should be normalised to 12PM local time
    const expectedDateOnlyInput = '01/02/2025' // 2nd July 2025

    // We're testing specific date because Paris has daylight savings time in July (+1 hour to the local timezone)
    // but the UTC date will be different from 6PM local time in the summer versus the winter
    const expectedDateTimeUTCValue = '2025-01-01T05:00:00.000Z'
    // The timestamp for this date should be normalised to 12PM local time
    const expectedDateOnlyUTCValue = '2025-01-01T23:00:00.000Z' // 2nd July 2025 at 12PM in Auckland

    await page.goto(url.create)

    // Default date field - filling it because it's required for the form to be valid
    const dateField = page.locator('#field-default input')
    await dateField.fill('01/01/2025')

    // Date input fields
    const dateTimeLocator = page.locator(
      '#field-dayAndTimeWithTimezone .react-datepicker-wrapper input',
    )
    const dateOnlyLocator = page.locator(
      '#field-defaultWithTimezone .react-datepicker-wrapper input',
    )

    // Fill in date only
    const dateOnlyDropdownSelector = `#field-defaultWithTimezone .rs__control`
    const dateOnlytimezoneSelector = `#field-defaultWithTimezone .rs__menu .rs__option:has-text("Auckland")`
    await page.click(dateOnlyDropdownSelector)
    await page.click(dateOnlytimezoneSelector)
    await dateOnlyLocator.fill(expectedDateOnlyInput)

    // Fill in date and time
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
    // We send this value through the input
    const expectedDateTimeInput = 'Jul 1, 2025 6:00 PM'
    // The timestamp for this date should be normalised to 12PM local time
    const expectedDateOnlyInput = '07/02/2025' // 2nd July 2025

    // We're testing specific date because Paris has daylight savings time in July (+1 hour to the local timezone)
    // but the UTC date will be different from 6PM local time in the summer versus the winter
    const expectedDateTimeUTCValue = '2025-07-01T06:00:00.000Z'
    // The timestamp for this date should be normalised to 12PM local time
    const expectedDateOnlyUTCValue = '2025-07-02T00:00:00.000Z' // 2nd July 2025 at 12PM in Auckland

    await page.goto(url.create)

    // Default date field - filling it because it's required for the form to be valid
    const dateField = page.locator('#field-default input')
    await dateField.fill('01/01/2025')

    // Date input fields
    const dateTimeLocator = page.locator(
      '#field-dayAndTimeWithTimezone .react-datepicker-wrapper input',
    )
    const dateOnlyLocator = page.locator(
      '#field-defaultWithTimezone .react-datepicker-wrapper input',
    )

    // Fill in date only
    const dateOnlyDropdownSelector = `#field-defaultWithTimezone .rs__control`
    const dateOnlytimezoneSelector = `#field-defaultWithTimezone .rs__menu .rs__option:has-text("Auckland")`
    await page.click(dateOnlyDropdownSelector)
    await page.click(dateOnlytimezoneSelector)
    await dateOnlyLocator.fill(expectedDateOnlyInput)

    // Fill in date and time
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
})
