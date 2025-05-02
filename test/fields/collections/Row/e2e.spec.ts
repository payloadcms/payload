import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import path from 'path'
import { wait } from 'payload/shared'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../../../helpers/sdk/index.js'
import type { Config } from '../../payload-types.js'

import { ensureCompilationIsDone, initPageConsoleErrorCatch } from '../../../helpers.js'
import { AdminUrlUtil } from '../../../helpers/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../../../helpers/initPayloadE2ENoConfig.js'
import { reInitializeDB } from '../../../helpers/reInitializeDB.js'
import { RESTClient } from '../../../helpers/rest.js'
import { TEST_TIMEOUT_LONG } from '../../../playwright.config.js'
import { rowFieldsSlug } from '../../slugs.js'

const filename = fileURLToPath(import.meta.url)
const currentFolder = path.dirname(filename)
const dirname = path.resolve(currentFolder, '../../')

const { beforeAll, beforeEach, describe } = test

let payload: PayloadTestSDK<Config>
let client: RESTClient
let page: Page
let serverURL: string
let url: AdminUrlUtil

describe('Row', () => {
  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    process.env.SEED_IN_CONFIG_ONINIT = 'false' // Makes it so the payload config onInit seed is not run. Otherwise, the seed would be run unnecessarily twice for the initial test run - once for beforeEach and once for onInit
    ;({ payload, serverURL } = await initPayloadE2ENoConfig<Config>({
      dirname,
      // prebuild,
    }))

    url = new AdminUrlUtil(serverURL, rowFieldsSlug)

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
    const fieldB = page.locator('input#field-field_with_width_b')

    await expect(fieldA).toBeVisible()
    await expect(fieldB).toBeVisible()

    const fieldABox = await fieldA.boundingBox()
    const fieldBBox = await fieldB.boundingBox()

    await expect(() => {
      expect(fieldABox.y).toEqual(fieldBBox.y)
      expect(fieldABox.width).toEqual(fieldBBox.width)
    }).toPass()

    const field_30_percent = page.locator(
      '.field-type.text:has(input#field-field_with_width_30_percent)',
    )
    const field_60_percent = page.locator(
      '.field-type.text:has(input#field-field_with_width_60_percent)',
    )
    const field_20_percent = page.locator(
      '.field-type.text:has(input#field-field_with_width_20_percent)',
    )
    const collapsible_30_percent = page.locator(
      '.collapsible-field:has(#field-field_within_collapsible_a)',
    )

    const field_20_percent_width_within_row_a = page.locator(
      '.field-type.text:has(input#field-field_20_percent_width_within_row_a)',
    )
    const field_no_set_width_within_row_b = page.locator(
      '.field-type.text:has(input#field-no_set_width_within_row_b)',
    )
    const field_no_set_width_within_row_c = page.locator(
      '.field-type.text:has(input#field-no_set_width_within_row_c)',
    )
    const field_20_percent_width_within_row_d = page.locator(
      '.field-type.text:has(input#field-field_20_percent_width_within_row_d)',
    )

    await expect(field_30_percent).toBeVisible()
    await expect(field_60_percent).toBeVisible()
    await expect(field_20_percent).toBeVisible()
    await expect(collapsible_30_percent).toBeVisible()
    await expect(field_20_percent_width_within_row_a).toBeVisible()
    await expect(field_no_set_width_within_row_b).toBeVisible()
    await expect(field_no_set_width_within_row_c).toBeVisible()
    await expect(field_20_percent_width_within_row_d).toBeVisible()

    const field_30_boundingBox = await field_30_percent.boundingBox()
    const field_60_boundingBox = await field_60_percent.boundingBox()
    const field_20_boundingBox = await field_20_percent.boundingBox()
    const collapsible_30_boundingBox = await collapsible_30_percent.boundingBox()
    const field_20_percent_width_within_row_a_box =
      await field_20_percent_width_within_row_a.boundingBox()
    const field_no_set_width_within_row_b_box = await field_no_set_width_within_row_b.boundingBox()
    const field_no_set_width_within_row_c_box = await field_no_set_width_within_row_c.boundingBox()
    const field_20_percent_width_within_row_d_box =
      await field_20_percent_width_within_row_d.boundingBox()

    await expect(() => {
      expect(field_30_boundingBox.y).toEqual(field_60_boundingBox.y)
      expect(field_30_boundingBox.x).toEqual(field_20_boundingBox.x)
      expect(field_30_boundingBox.y).not.toEqual(field_20_boundingBox.y)
      expect(field_30_boundingBox.height).toEqual(field_60_boundingBox.height)
      expect(collapsible_30_boundingBox.width).toEqual(field_30_boundingBox.width)

      expect(field_20_percent_width_within_row_a_box.y).toEqual(
        field_no_set_width_within_row_b_box.y,
      )
      expect(field_no_set_width_within_row_b_box.y).toEqual(field_no_set_width_within_row_c_box.y)
      expect(field_no_set_width_within_row_c_box.y).toEqual(
        field_20_percent_width_within_row_d_box.y,
      )

      expect(field_20_percent_width_within_row_a_box.width).toEqual(
        field_20_percent_width_within_row_d_box.width,
      )
      expect(field_no_set_width_within_row_b_box.width).toEqual(
        field_no_set_width_within_row_c_box.width,
      )
    }).toPass()
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

    await expect(() => {
      // Check that the top value of the fields are the same
      expect(fieldABox.y).toEqual(fieldBBox.y)
      expect(fieldABox.height).toEqual(fieldBBox.height)
    }).toPass()
  })
})
