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
import { dateFieldsSlug } from '../../slugs.js'

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
    client = new RESTClient(null, { defaultSlug: 'users', serverURL })
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
