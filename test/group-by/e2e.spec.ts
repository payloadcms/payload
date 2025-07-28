import type { Page } from '@playwright/test'
import type { PayloadTestSDK } from 'helpers/sdk/index.js'

import { expect, test } from '@playwright/test'
import { devUser } from 'credentials.js'
import { addListFilter } from 'helpers/e2e/addListFilter.js'
import { goToNextPage } from 'helpers/e2e/goToNextPage.js'
import { addGroupBy, clearGroupBy, closeGroupBy, openGroupBy } from 'helpers/e2e/groupBy.js'
import { deletePreferences } from 'helpers/e2e/preferences.js'
import { sortColumn } from 'helpers/e2e/sortColumn.js'
import { toggleColumn } from 'helpers/e2e/toggleColumn.js'
import { openNav } from 'helpers/e2e/toggleNav.js'
import { reInitializeDB } from 'helpers/reInitializeDB.js'
import * as path from 'path'
import { fileURLToPath } from 'url'

import type { Config } from './payload-types.js'

import {
  ensureCompilationIsDone,
  exactText,
  initPageConsoleErrorCatch,
  selectTableRow,
} from '../helpers.js'
import { AdminUrlUtil } from '../helpers/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../helpers/initPayloadE2ENoConfig.js'
import { TEST_TIMEOUT_LONG } from '../playwright.config.js'
import { postsSlug } from './collections/Posts/index.js'

const { beforeEach } = test

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

test.describe('Group By', () => {
  let page: Page
  let url: AdminUrlUtil
  let serverURL: string
  let payload: PayloadTestSDK<Config>
  let user: any
  let category1Id: number | string

  test.beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    ;({ payload, serverURL } = await initPayloadE2ENoConfig<Config>({ dirname }))
    url = new AdminUrlUtil(serverURL, 'posts')

    const context = await browser.newContext()
    page = await context.newPage()
    initPageConsoleErrorCatch(page)
    await ensureCompilationIsDone({ page, serverURL })

    user = await payload.login({
      collection: 'users',
      data: {
        email: devUser.email,
        password: devUser.password,
      },
    })

    // Fetch category IDs from already-seeded data
    const categories = await payload.find({
      collection: 'categories',
      limit: 1,
      sort: 'title',
      where: { title: { equals: 'Category 1' } },
    })

    const [category1] = categories.docs
    category1Id = category1?.id as number | string
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

  test('should open and close group-by dropdown', async () => {
    await page.goto(url.list)
    await openGroupBy(page)
    await expect(page.locator('#list-controls-group-by.rah-static--height-auto')).toBeVisible()
    await closeGroupBy(page)
    await expect(page.locator('#list-controls-group-by.rah-static--height-auto')).toBeHidden()
  })

  test('should display field options in group-by dropdown', async () => {
    await page.goto(url.list)
    const { groupByContainer } = await openGroupBy(page)

    // TODO: expect no initial selection and for the sort control to be disabled

    const field = groupByContainer.locator('#group-by--field-select')
    await field.click()

    await expect(
      field.locator('.rs__option', {
        hasText: exactText('Title'),
      }),
    ).toBeVisible()
  })

  test('should omit unsupported fields from appearing as options in the group-by dropdown', async () => {
    await page.goto(url.list)

    await openGroupBy(page)

    // certain fields are not allowed to be grouped by, for example rich text and the ID field itself
    const forbiddenOptions = ['ID', 'Content']

    const field = page.locator('#group-by--field-select')
    await field.click()

    for (const fieldOption of forbiddenOptions) {
      const optionEl = page.locator('.rs__option', { hasText: exactText(fieldOption) })
      await expect(optionEl).toHaveCount(0)
    }
  })

  test('should properly group by field', async () => {
    await page.goto(url.list)

    await addGroupBy(page, { fieldLabel: 'Category', fieldPath: 'category' })

    await expect(page.locator('.table-wrap')).toHaveCount(2)

    await expect(page.locator('.group-by-header')).toHaveCount(2)

    await expect(
      page.locator('.group-by-header__heading', { hasText: exactText('Category 1') }),
    ).toBeVisible()

    await expect(page.locator('.table-wrap').first().locator('tbody tr')).toHaveCount(10)

    const table1CategoryCells = page
      .locator('.table-wrap')
      .first()
      .locator('tbody tr td.cell-category')

    // TODO: is there a way to iterate over all cells and check they all match? I could not get this to work.
    await expect(table1CategoryCells.first()).toHaveText(/Category 1/)

    await expect(
      page.locator('.group-by-header__heading', { hasText: exactText('Category 2') }),
    ).toBeVisible()

    const table2 = page.locator('.table-wrap').nth(1)
    await expect(table2).toBeVisible()
    await table2.scrollIntoViewIfNeeded()

    await expect(page.locator('.table-wrap').nth(1).locator('tbody tr')).toHaveCount(10)

    const table2CategoryCells = page
      .locator('.table-wrap')
      .nth(1)
      .locator('tbody tr td.cell-category')

    // TODO: is there a way to iterate over all cells and check they all match? I could not get this to work.
    await expect(table2CategoryCells.first()).toHaveText(/Category 2/)
  })

  test('should load group-by from user preferences', async () => {
    await deletePreferences({
      payload,
      key: `${postsSlug}.list`,
      user,
    })

    await page.goto(url.list)
    await expect(page).not.toHaveURL(/groupBy=/)
    await addGroupBy(page, { fieldLabel: 'Category', fieldPath: 'category' })
    await expect(page).toHaveURL(/groupBy=category/)
    await expect(page.locator('.table-wrap')).toHaveCount(2)

    await page.goto(url.admin)

    // click on the "Posts" link in the sidebar to invoke a soft navigation
    await openNav(page)
    await page.locator(`.nav a[href="/admin/collections/${postsSlug}"]`).click()

    await expect(page).toHaveURL(/groupBy=category/)
    await expect(page.locator('.table-wrap')).toHaveCount(2)
  })

  test('should reset group-by using the global "clear" button', async () => {
    await page.goto(url.list)
    const { groupByContainer } = await openGroupBy(page)

    const field = groupByContainer.locator('#group-by--field-select')
    await expect(field.locator('.react-select--single-value')).toHaveText('Select a value')
    await expect(groupByContainer.locator('#group-by--reset')).toBeHidden()

    await addGroupBy(page, { fieldLabel: 'Category', fieldPath: 'category' })
    await expect(page.locator('.table-wrap')).toHaveCount(2)
    await expect(page.locator('.group-by-header')).toHaveCount(2)

    await clearGroupBy(page)
  })

  test('should reset group-by using the select field\'s "x" button', async () => {
    await page.goto(url.list)

    const { field, groupByContainer } = await addGroupBy(page, {
      fieldLabel: 'Category',
      fieldPath: 'category',
    })

    await expect(page.locator('.table-wrap')).toHaveCount(2)
    await expect(page.locator('.group-by-header')).toHaveCount(2)

    // click the "x" button on the select field itself
    await field.locator('.clear-indicator').click()

    await expect(field.locator('.react-select--single-value')).toHaveText('Select a value')

    await expect(page).not.toHaveURL(/&groupBy=/)
    await expect(groupByContainer.locator('#field-direction input')).toBeDisabled()
    await expect(page.locator('.table-wrap')).toHaveCount(1)
    await expect(page.locator('.group-by-header')).toHaveCount(0)
  })

  test('should sort the group-by field globally', async () => {
    await page.goto(url.list)

    const { groupByContainer } = await addGroupBy(page, {
      fieldLabel: 'Category',
      fieldPath: 'category',
    })

    const firstHeading = page.locator('.group-by-header__heading').first()
    await expect(firstHeading).toHaveText(/Category 1/)
    const secondHeading = page.locator('.group-by-header__heading').nth(1)
    await expect(secondHeading).toHaveText(/Category 2/)

    await groupByContainer.locator('#group-by--sort').click()
    await groupByContainer.locator('.rs__option', { hasText: exactText('Descending') })?.click()

    await expect(page.locator('.group-by-header__heading').first()).toHaveText(/Category 2/)
    await expect(page.locator('.group-by-header__heading').nth(1)).toHaveText(/Category 1/)
  })

  test('should sort by columns within each table (will affect all tables)', async () => {
    await page.goto(url.list)

    await addGroupBy(page, {
      fieldLabel: 'Category',
      fieldPath: 'category',
    })

    const table1 = page.locator('.table-wrap').first()

    await sortColumn(page, {
      scope: table1,
      fieldLabel: 'Title',
      fieldPath: 'title',
      targetState: 'asc',
    })

    const table1AscOrder = ['Find me', 'Post 1', 'Post 10', 'Post 11']
    const table2AscOrder = ['Find me', 'Post 16', 'Post 17', 'Post 18']

    const table1Titles = table1.locator('tbody tr td.cell-title')
    const table2Titles = page.locator('.table-wrap').nth(1).locator('tbody tr td.cell-title')

    await expect(table1Titles).toHaveCount(10)
    await expect(table2Titles).toHaveCount(10)

    // Note: it would be nice to put this in a loop, but this was flaky
    await expect(table1Titles.nth(0)).toHaveText(table1AscOrder[0] || '')
    await expect(table1Titles.nth(1)).toHaveText(table1AscOrder[1] || '')
    await expect(table2Titles.nth(0)).toHaveText(table2AscOrder[0] || '')
    await expect(table2Titles.nth(1)).toHaveText(table2AscOrder[1] || '')

    await sortColumn(page, {
      scope: table1,
      fieldLabel: 'Title',
      fieldPath: 'title',
      targetState: 'desc',
    })

    const table1DescOrder = ['Post 9', 'Post 8', 'Post 7', 'Post 6']
    const table2DescOrder = ['Post 30', 'Post 29', 'Post 28', 'Post 27']

    // Note: it would be nice to put this in a loop, but this was flaky
    await expect(table1Titles.nth(0)).toHaveText(table1DescOrder[0] || '')
    await expect(table1Titles.nth(1)).toHaveText(table1DescOrder[1] || '')
    await expect(table2Titles.nth(0)).toHaveText(table2DescOrder[0] || '')
    await expect(table2Titles.nth(1)).toHaveText(table2DescOrder[1] || '')
  })

  test('should apply columns to all tables', async () => {
    await page.goto(url.list)

    await addGroupBy(page, {
      fieldLabel: 'Category',
      fieldPath: 'category',
    })

    const table1ColumnHeadings = page.locator('.table-wrap').nth(0).locator('thead tr th')
    await expect(table1ColumnHeadings.nth(1)).toHaveText('Title')
    await expect(table1ColumnHeadings.nth(2)).toHaveText('Category')

    const table2ColumnHeadings = page.locator('.table-wrap').nth(1).locator('thead tr th')
    await expect(table2ColumnHeadings.nth(1)).toHaveText('Title')
    await expect(table2ColumnHeadings.nth(2)).toHaveText('Category')

    await toggleColumn(page, { columnLabel: 'Title', targetState: 'off' })

    await expect(table1ColumnHeadings.locator('text=Title')).toHaveCount(0)
    await expect(table1ColumnHeadings.nth(1)).toHaveText('Category')

    await expect(table2ColumnHeadings.locator('text=Title')).toHaveCount(0)
    await expect(table2ColumnHeadings.nth(1)).toHaveText('Category')
  })

  test('should apply filters to all tables', async () => {
    await page.goto(url.list)

    await addGroupBy(page, {
      fieldLabel: 'Category',
      fieldPath: 'category',
    })

    await addListFilter({
      page,
      fieldLabel: 'Title',
      operatorLabel: 'equals',
      value: 'Find me',
    })

    const table1 = page.locator('.table-wrap').first()
    await expect(table1).toBeVisible()
    const table1Rows = table1.locator('tbody tr')
    await expect(table1Rows).toHaveCount(1)
    await expect(table1Rows.first().locator('td.cell-title')).toHaveText('Find me')

    const table2 = page.locator('.table-wrap').nth(1)
    await expect(table2).toBeVisible()
    const table2Rows = table2.locator('tbody tr')
    await expect(table2Rows).toHaveCount(1)
    await expect(table2Rows.first().locator('td.cell-title')).toHaveText('Find me')
  })

  test('should apply filters to the distinct results of the group-by field', async () => {
    // This ensures that no tables are rendered without docs

    await page.goto(url.list)

    await addGroupBy(page, {
      fieldLabel: 'Category',
      fieldPath: 'category',
    })

    await expect(page.locator('.table-wrap')).toHaveCount(2)

    await addListFilter({
      page,
      fieldLabel: 'Category',
      operatorLabel: 'equals',
      value: 'Category 1',
    })

    await expect(page.locator('.table-wrap')).toHaveCount(1)

    // Reset the filter by reloading the page without URL params
    // TODO: There are no current test helpers for this
    await page.goto(url.list)

    await addListFilter({
      page,
      fieldLabel: 'Title',
      operatorLabel: 'equals',
      value: 'This title does not exist',
    })

    await expect(page.locator('.table-wrap')).toHaveCount(0)

    await page.locator('.collection-list__no-results').isVisible()
  })

  test('should paginate globally (all tables)', async () => {
    await page.goto(url.list)

    await addGroupBy(page, { fieldLabel: 'Title', fieldPath: 'title' })

    await expect(page.locator('.sticky-toolbar')).toBeVisible()
  })

  test('should paginate per table', async () => {
    await page.goto(url.list)

    await addGroupBy(page, { fieldLabel: 'Category', fieldPath: 'category' })

    const table1 = page.locator('.table-wrap').first()
    const table2 = page.locator('.table-wrap').nth(1)

    await expect(table1.locator('.page-controls')).toBeVisible()
    await expect(table2.locator('.page-controls')).toBeVisible()

    await goToNextPage(page, {
      scope: table1,
      // TODO: this actually does affect the URL, but not in the same way as traditional pagination
      // e.g. it manipulates the `?queryByGroup=` param instead of `?page=2`
      affectsURL: false,
    })
  })

  test('should reset ?queryByGroup= param when other params change', async () => {
    await page.goto(url.list)

    await addGroupBy(page, { fieldLabel: 'Category', fieldPath: 'category' })

    const table1 = page.locator('.table-wrap').first()
    const table2 = page.locator('.table-wrap').nth(1)

    await expect(table1.locator('.page-controls')).toBeVisible()
    await expect(table2.locator('.page-controls')).toBeVisible()

    await goToNextPage(page, {
      scope: table1,
      affectsURL: false,
    })

    await expect(page).toHaveURL(/queryByGroup=/)

    await clearGroupBy(page)

    await expect(page).not.toHaveURL(/queryByGroup=/)
  })

  test('should not render per table pagination controls when group-by is not active', async () => {
    // delete user prefs to ensure that group-by isn't populated after loading the page
    await deletePreferences({ payload, key: `${postsSlug}.list`, user })
    await page.goto(url.list)
    await expect(page.locator('.page-controls')).toHaveCount(1)
  })

  test('should render date fields in proper format when displayed as table headers', async () => {
    await page.goto(url.list)
    await addGroupBy(page, { fieldLabel: 'Updated At', fieldPath: 'updatedAt' })

    // the value of the updated at column in the table should match exactly the value in the table cell
    const table1 = page.locator('.table-wrap').first()
    const firstTableHeading = table1.locator('.group-by-header__heading')
    const firstRowUpdatedAtCell = table1.locator('tbody tr td.cell-updatedAt').first()

    const headingText = (await firstTableHeading.textContent())?.trim()
    const cellText = (await firstRowUpdatedAtCell.textContent())?.trim()

    expect(headingText).toBeTruthy()
    expect(cellText).toBeTruthy()
    expect(headingText).toEqual(cellText)
  })

  test.skip('should group by nested fields', async () => {
    await page.goto(url.list)
    expect(true).toBe(true)
  })

  test('can select all rows within a single table as expected', async () => {
    await page.goto(url.list)

    await addGroupBy(page, { fieldLabel: 'Category', fieldPath: 'category' })

    const firstTable = page.locator('.table-wrap').first()
    const firstTableRows = firstTable.locator('tbody tr')

    await expect(firstTableRows).toHaveCount(10)

    await firstTable.locator('input#select-all').check()

    await expect(page.locator('.list-header .list-selection')).toBeHidden()

    await expect(firstTable.locator('button#select-all-across-pages')).toBeVisible()

    await firstTable.locator('button#select-all-across-pages').click()

    await expect(firstTable.locator('button#select-all-across-pages')).toBeHidden()
  })

  test('can bulk edit within a single table without affecting the others', async () => {
    await page.goto(url.list)

    await addGroupBy(page, { fieldLabel: 'Category', fieldPath: 'category' })

    const firstTable = page.locator('.table-wrap').first()
    const secondTable = page.locator('.table-wrap').nth(1)

    const firstTableRows = firstTable.locator('tbody tr')
    const secondTableRows = secondTable.locator('tbody tr')

    await sortColumn(page, {
      scope: firstTable,
      fieldLabel: 'Title',
      fieldPath: 'title',
      targetState: 'asc',
    })

    // select 'Find me' from both tables, only the first should get edited in the end
    await selectTableRow(firstTable, 'Find me')
    await selectTableRow(secondTable, 'Find me')

    await firstTable.locator('.list-selection .edit-many__toggle').click()
    const modal = page.locator('[id$="-edit-posts"]').first()

    await expect(modal).toBeVisible()

    await modal.locator('.field-select .rs__control').click()
    await modal.locator('.field-select .rs__option', { hasText: exactText('Title') }).click()

    const field = modal.locator(`#field-title`)
    await expect(field).toBeVisible()

    await field.fill('Find me (updated)')
    await modal.locator('.form-submit button[type="submit"].edit-many__save').click()

    await expect(
      firstTableRows.locator('td.cell-title', { hasText: exactText('Find me (updated)') }),
    ).toHaveCount(0)

    await expect(
      secondTableRows.locator('td.cell-title', { hasText: exactText('Find me') }),
    ).toHaveCount(1)
  })

  test('can bulk delete within a single table without affecting the others', async () => {
    await page.goto(url.list)

    await addGroupBy(page, { fieldLabel: 'Category', fieldPath: 'category' })

    const firstTable = page.locator('.table-wrap').first()
    const secondTable = page.locator('.table-wrap').nth(1)

    const firstTableRows = firstTable.locator('tbody tr')
    const secondTableRows = secondTable.locator('tbody tr')

    await sortColumn(page, {
      scope: firstTable,
      fieldLabel: 'Title',
      fieldPath: 'title',
      targetState: 'asc',
    })

    // select 'Find me' from both tables, only the first should get deleted in the end
    await selectTableRow(firstTable, 'Find me')
    await selectTableRow(secondTable, 'Find me')

    await firstTable.locator('.list-selection .delete-documents__toggle').click()
    const modal = page.locator('[id$="-confirm-delete-many-docs"]').first()

    await expect(modal).toBeVisible()
    await modal.locator('#confirm-action').click()

    await expect(
      firstTableRows.locator('td.cell-title', { hasText: exactText('Find me') }),
    ).toHaveCount(0)

    await expect(
      secondTableRows.locator('td.cell-title', { hasText: exactText('Find me') }),
    ).toHaveCount(1)
  })

  test('can bulk edit across pages within a single table without affecting the others', async () => {
    await page.goto(url.list)

    await addGroupBy(page, { fieldLabel: 'Category', fieldPath: 'category' })

    const firstTable = page.locator('.table-wrap').first()
    const secondTable = page.locator('.table-wrap').nth(1)

    const firstTableRows = firstTable.locator('tbody tr')
    const secondTableRows = secondTable.locator('tbody tr')

    // click the select all checkbox, then the "select all across pages" button
    await firstTable.locator('input#select-all').check()
    await firstTable.locator('button#select-all-across-pages').click()

    // now edit all titles and ensure that only the first table gets updated, not the second
    await firstTable.locator('.list-selection .edit-many__toggle').click()
    const modal = page.locator('[id$="-edit-posts"]').first()

    await expect(modal).toBeVisible()

    await modal.locator('.field-select .rs__control').click()
    await modal.locator('.field-select .rs__option', { hasText: exactText('Title') }).click()

    const field = modal.locator(`#field-title`)
    await expect(field).toBeVisible()
    await field.fill('Bulk edit across all pages')
    await modal.locator('.form-submit button[type="submit"].edit-many__save').click()

    await expect(
      firstTableRows.locator('td.cell-title', { hasText: exactText('Bulk edit across all pages') }),
    ).toHaveCount(10)

    await expect(
      secondTableRows.locator('td.cell-title', {
        hasText: exactText('Bulk edit across all pages'),
      }),
    ).toHaveCount(0)
  })

  test('should show trashed docs in trash view when group-by is active', async () => {
    await page.goto(url.list)

    // Enable group-by on Category
    await addGroupBy(page, { fieldLabel: 'Category', fieldPath: 'category' })
    await expect(page.locator('.table-wrap')).toHaveCount(2) // We expect 2 groups initially

    // Trash the first document in the first group
    const firstTable = page.locator('.table-wrap').first()
    await firstTable.locator('.row-1 .cell-_select input').check()
    await firstTable.locator('.list-selection__button[aria-label="Delete"]').click()

    const modalId = `[id^="${category1Id}-confirm-delete-many-docs"]`

    // Confirm trash (skip permanent delete)
    await page.locator(`${modalId} #confirm-action`).click()
    await expect(page.locator('.payload-toast-container .toast-success')).toHaveText(
      '1 Post moved to trash.',
    )

    // Go to the trash view
    await page.locator('#trash-view-pill').click()
    await expect(page).toHaveURL(/\/posts\/trash(\?|$)/)

    // Re-enable group-by on Category in trash view
    await addGroupBy(page, { fieldLabel: 'Category', fieldPath: 'category' })
    await expect(page.locator('.table-wrap')).toHaveCount(1) // Should only have Category 1 (or the trashed doc's category)

    // Ensure the trashed doc is visible
    await expect(
      page.locator('.table-wrap tbody tr td.cell-title', { hasText: 'Find me' }),
    ).toBeVisible()
  })
})
