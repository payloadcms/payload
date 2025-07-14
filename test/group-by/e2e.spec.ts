import type { Page } from '@playwright/test'
import type { PayloadTestSDK } from 'helpers/sdk/index.js'

import { expect, test } from '@playwright/test'
import { addListFilter } from 'helpers/e2e/addListFilter.js'
import { toggleColumn } from 'helpers/e2e/toggleColumn.js'
import { openGroupBy, selectGroupByField } from 'helpers/e2e/toggleGroupBy.js'
import { reInitializeDB } from 'helpers/reInitializeDB.js'
import * as path from 'path'
import { fileURLToPath } from 'url'

import type { Config } from './payload-types.js'

import { ensureCompilationIsDone, exactText, initPageConsoleErrorCatch } from '../helpers.js'
import { AdminUrlUtil } from '../helpers/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../helpers/initPayloadE2ENoConfig.js'
import { TEST_TIMEOUT_LONG } from '../playwright.config.js'

const { beforeEach } = test

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

test.describe('Group By', () => {
  let page: Page
  let url: AdminUrlUtil
  let serverURL: string
  let payload: PayloadTestSDK<Config>

  test.beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    ;({ payload, serverURL } = await initPayloadE2ENoConfig<Config>({ dirname }))
    url = new AdminUrlUtil(serverURL, 'posts')

    const context = await browser.newContext()
    page = await context.newPage()
    initPageConsoleErrorCatch(page)
    await ensureCompilationIsDone({ page, serverURL })
  })

  beforeEach(async () => {
    // await throttleTest({
    //   page,
    //   context,
    //   delay: 'Fast 4G',
    // })

    await reInitializeDB({
      serverURL,
      snapshotKey: 'groupByTests',
    })

    await ensureCompilationIsDone({ page, serverURL })
  })

  test('should display group-by button only when `admin.groupBy` is enabled', async () => {
    await page.goto(url.list)
    await expect(page.locator('#toggle-group-by')).toBeVisible()

    await page.goto(new AdminUrlUtil(serverURL, 'users').list)
    await expect(page.locator('#toggle-group-by')).toBeHidden()
  })

  test('should open group-by drawer', async () => {
    await page.goto(url.list)
    await openGroupBy(page, {})
    await expect(page.locator('#list-controls-group-by.rah-static--height-auto')).toBeVisible()
  })

  test('should display field options in group-by drawer', async () => {
    await page.goto(url.list)
    const { groupByContainer } = await openGroupBy(page, {})
    const field = groupByContainer.locator('#group-by--field-select')
    await field.click()

    await expect(
      field.locator('.rs__option', {
        hasText: exactText('Title'),
      }),
    ).toBeVisible()
  })

  test('should reset a field selection', async () => {
    await page.goto(url.list)
    const { groupByContainer } = await openGroupBy(page, {})

    const field = groupByContainer.locator('#group-by--field-select')
    await expect(field.locator('.react-select--single-value')).toHaveText('Select a value')

    await expect(groupByContainer.locator('#group-by--reset')).toBeHidden()

    await field.click()

    await field
      .locator('.rs__option', {
        hasText: exactText('Title'),
      })
      ?.click()

    await expect(groupByContainer.locator('#group-by--reset')).toBeVisible()
    await groupByContainer.locator('#group-by--reset').click()
    await expect(field.locator('.react-select--single-value')).toHaveText('Select a value')
    await expect(groupByContainer.locator('#group-by--reset')).toBeHidden()

    await expect(page).not.toHaveURL(/&groupBy=/)
  })

  test('should group by field', async () => {
    await page.goto(url.list)

    await selectGroupByField(page, { fieldLabel: 'Category', fieldPath: 'category' })

    await expect(page.locator('.table-wrap')).toHaveCount(2)

    await expect(page.locator('.table__heading')).toHaveCount(2)

    await expect(
      page.locator('.table__heading', { hasText: exactText('Category 1') }),
    ).toBeVisible()

    await expect(page.locator('.table-wrap').first().locator('tbody tr')).toHaveCount(10)

    const group1CategoryCells = page
      .locator('.table-wrap')
      .first()
      .locator('tbody tr td.cell-category')

    // TODO: is there a way to iterate over all cells and check they all match? I could not get this to work.
    await expect(group1CategoryCells.first()).toHaveText(/Category 1/)

    await expect(
      page.locator('.table__heading', { hasText: exactText('Category 2') }),
    ).toBeVisible()

    const group2 = page.locator('.table-wrap').nth(1)
    await expect(group2).toBeVisible()
    await group2.scrollIntoViewIfNeeded()

    await expect(page.locator('.table-wrap').nth(1).locator('tbody tr')).toHaveCount(10)

    const group2CategoryCells = page
      .locator('.table-wrap')
      .nth(1)
      .locator('tbody tr td.cell-category')

    // TODO: is there a way to iterate over all cells and check they all match? I could not get this to work.
    await expect(group2CategoryCells.first()).toHaveText(/Category 2/)
  })

  test('should sort groups', async () => {
    await page.goto(url.list)

    const { groupByContainer } = await selectGroupByField(page, {
      fieldLabel: 'Category',
      fieldPath: 'category',
    })

    const firstHeading = page.locator('.table__heading').first()
    await expect(firstHeading).toHaveText(/Category 1/)
    const secondHeading = page.locator('.table__heading').nth(1)
    await expect(secondHeading).toHaveText(/Category 2/)

    await groupByContainer.locator('#group-by--sort').click()
    await groupByContainer.locator('.rs__option', { hasText: exactText('Descending') })?.click()

    await expect(page.locator('.table__heading').first()).toHaveText(/Category 2/)
    await expect(page.locator('.table__heading').nth(1)).toHaveText(/Category 1/)
  })

  test('should apply columns to all tables', async () => {
    await page.goto(url.list)

    await selectGroupByField(page, {
      fieldLabel: 'Category',
      fieldPath: 'category',
    })

    const group1ColumnHeadings = page.locator('.table-wrap').nth(0).locator('thead tr th')
    await expect(group1ColumnHeadings.nth(1)).toHaveText('Title')
    await expect(group1ColumnHeadings.nth(2)).toHaveText('Category')

    // scroll second table into view
    const group2ColumnHeadings = page.locator('.table-wrap').nth(1).locator('thead tr th')
    await expect(group2ColumnHeadings.nth(1)).toHaveText('Title')
    await expect(group2ColumnHeadings.nth(2)).toHaveText('Category')

    await toggleColumn(page, { columnLabel: 'Title', targetState: 'off' })

    await expect(group1ColumnHeadings.locator('text=Title')).toHaveCount(0)
    await expect(group1ColumnHeadings.nth(1)).toHaveText('Category')

    await expect(group2ColumnHeadings.locator('text=Title')).toHaveCount(0)
    await expect(group2ColumnHeadings.nth(1)).toHaveText('Category')
  })

  test('should apply filters to all tables', async () => {
    await page.goto(url.list)

    await selectGroupByField(page, {
      fieldLabel: 'Category',
      fieldPath: 'category',
    })

    await addListFilter({
      page,
      fieldLabel: 'Title',
      operatorLabel: 'equals',
      value: 'Find me',
    })

    const group1 = page.locator('.table-wrap').first()
    await expect(group1).toBeVisible()
    const group1Rows = group1.locator('tbody tr')
    await expect(group1Rows).toHaveCount(1)
    await expect(group1Rows.first().locator('td.cell-title')).toHaveText('Find me')

    const group2 = page.locator('.table-wrap').nth(1)
    await expect(group2).toBeVisible()
    const group2Rows = group2.locator('tbody tr')
    await expect(group2Rows).toHaveCount(1)
    await expect(group2Rows.first().locator('td.cell-title')).toHaveText('Find me')
  })

  test.skip('should sort within groups (will affect all groups)', async () => {
    await page.goto(url.list)
    expect(true).toBe(true)
  })

  test.skip('should render pagination controls per table when table results exceed page size', async () => {
    await page.goto(url.list)
    expect(true).toBe(true)
  })

  test.skip('should render global pagination controls when total results exceed page size', async () => {
    await page.goto(url.list)
    expect(true).toBe(true)
  })

  test.skip('should group by within a document drawer', async () => {
    await page.goto(url.list)
    expect(true).toBe(true)
  })
})
