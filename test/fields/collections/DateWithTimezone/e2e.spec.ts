import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import path from 'path'
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
import { dateFieldsWithTimezoneSlug } from '../../slugs.js'
import exp from 'constants'
import { desc } from 'drizzle-orm'
import { wait } from 'payload/shared'

const filename = fileURLToPath(import.meta.url)
const currentFolder = path.dirname(filename)
const dirname = path.resolve(currentFolder, '../../')

const { beforeAll, beforeEach, describe } = test

const londonTimezone = 'Europe/London'

let payload: PayloadTestSDK<Config>
let client: RESTClient
let page: Page
let serverURL: string
// If we want to make this run in parallel: test.describe.configure({ mode: 'parallel' })
let url: AdminUrlUtil

describe('Date with timezone', () => {
  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    process.env.SEED_IN_CONFIG_ONINIT = 'false' // Makes it so the payload config onInit seed is not run. Otherwise, the seed would be run unnecessarily twice for the initial test run - once for beforeEach and once for onInit
    ;({ payload, serverURL } = await initPayloadE2ENoConfig<Config>({
      dirname,
      // prebuild,
    }))
    url = new AdminUrlUtil(serverURL, dateFieldsWithTimezoneSlug)

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

  /**
   * For now we can only configure one timezone for this entire test suite because the .use is not isolating it per test block
   * The last .use options always overrides the rest
   *
   * See: https://github.com/microsoft/playwright/issues/27138
   */
  test.use({
    timezoneId: londonTimezone,
  })

  test('should display the value in the selected time', async () => {
    const {
      docs: [existingDoc],
    } = await payload.find({
      collection: dateFieldsWithTimezoneSlug,
    })

    await page.goto(url.edit(existingDoc!.id))

    const dateTimeLocator = page.locator('#field-dayAndTime .react-datepicker-wrapper input')

    const expectedValue = 'Aug 12, 2027 10:00 AM' // This is the seeded value for 10AM at Asia/Tokyo time
    const expectedUTCValue = '2027-08-12T01:00:00.000Z' // This is the expected UTC value for the above
    const expectedTimezone = 'Asia/Tokyo'

    const dateValue = await dateTimeLocator.inputValue()

    await expect(dateValue).toEqual(expectedValue)
    await expect(existingDoc?.dayAndTime).toEqual(expectedUTCValue)
    await expect(existingDoc?.dayAndTime_timezone).toEqual(expectedTimezone)
  })

  test('changing the timezone should update the date to the new equivalent', async () => {
    // Tests to see if the date value is updated when the timezone is changed,
    // it should change to the equivalent time in the new timezone as the UTC value remains the same
    const {
      docs: [existingDoc],
    } = await payload.find({
      collection: dateFieldsWithTimezoneSlug,
    })

    await page.goto(url.edit(existingDoc!.id))

    const dateTimeLocator = page.locator('#field-dayAndTime .react-datepicker-wrapper input')

    const initialDateValue = await dateTimeLocator.inputValue()

    const dropdownControlSelector = `#field-dayAndTime .rs__control`

    const timezoneOptionSelector = `#field-dayAndTime .rs__menu .rs__option:has-text("London")`

    await page.click(dropdownControlSelector)

    await page.click(timezoneOptionSelector)

    const newDateValue = await dateTimeLocator.inputValue()

    await expect(newDateValue).not.toEqual(initialDateValue)
  })

  // /// copied for tests
  // test('create EST day only date', async () => {
  //   await page.goto(url.create)
  //   await page.waitForURL(`**/${url.create}`)
  //   const dateField = page.locator('#field-default input')

  //   // enter date in default date field
  //   await dateField.fill('02/07/2023')
  //   await saveDocAndAssert(page)

  //   // get the ID of the doc
  //   const routeSegments = page.url().split('/')
  //   const id = routeSegments.pop()

  //   // fetch the doc (need the date string from the DB)
  //   const { doc } = await client.findByID({ id, auth: true, slug: 'date-fields' })

  //   expect(doc.default).toEqual('2023-02-07T12:00:00.000Z')
  // })
  // /// copied for tests

  describe('while timezone is set to London', () => {
    test('displayed value should be the same while timezone is set to London', async ({
      timezoneId,
    }) => {
      const {
        docs: [existingDoc],
      } = await payload.find({
        collection: dateFieldsWithTimezoneSlug,
      })

      await page.goto(url.edit(existingDoc!.id))

      const result = await page.evaluate(() => {
        return Intl.DateTimeFormat().resolvedOptions().timeZone
      })

      // Confirm that the emulated timezone is set to London
      await expect(result).toEqual(londonTimezone)

      const dateTimeLocator = page.locator('#field-dayAndTime .react-datepicker-wrapper input')

      const expectedValue = 'Aug 12, 2027 10:00 AM' // This is the seeded value for 10AM at Asia/Tokyo time

      const dateValue = await dateTimeLocator.inputValue()

      await expect(dateValue).toEqual(expectedValue)
    })
  })
})
