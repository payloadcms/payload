import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import { devUser } from 'credentials.js'
import * as path from 'path'
import { wait } from 'payload/shared'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../__helpers/shared/sdk/index.js'
import type { Config, Post } from './payload-types.js'

import {
  ensureCompilationIsDone,
  exactText,
  initPageConsoleErrorCatch,
  saveDocAndAssert,
  selectTableRow,
} from '../__helpers/e2e/helpers.js'
import { AdminUrlUtil } from '../__helpers/shared/adminUrlUtil.js'
import { sortColumn, toggleColumn } from '../__helpers/e2e/columns/index.js'
import { addListFilter } from '../__helpers/e2e/filters/index.js'
import { goToNextPage } from '../__helpers/e2e/goToNextPage.js'
import {
  addGroupBy,
  clearGroupBy,
  closeGroupBy,
  openGroupBy,
} from '../__helpers/e2e/groupBy/index.js'
import { deletePreferences } from '../__helpers/e2e/preferences.js'
import { openNav } from '../__helpers/e2e/toggleNav.js'
import { initPayloadE2ENoConfig } from '../__helpers/shared/initPayloadE2ENoConfig.js'
import { reInitializeDB } from '../__helpers/shared/clearAndSeed/reInitializeDB.js'
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
      key: `${postsSlug}.list`,
      payload,
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

  test('should group by relationships even when their values are null', async () => {
    await payload.create({
      collection: postsSlug,
      data: {
        category: null,
        title: 'My Post',
      },
    })

    await page.goto(url.list)

    await addGroupBy(page, { fieldLabel: 'Category', fieldPath: 'category' })

    await expect(page.locator('.table-wrap')).toHaveCount(3)

    await expect(
      page.locator('.group-by-header__heading', { hasText: exactText('No value') }),
    ).toBeVisible()
  })

  test('should group by date fields even when their values are null', async () => {
    await payload.create({
      collection: postsSlug,
      data: {
        date: null,
        title: 'My Post',
      },
    })

    await page.goto(url.list)

    await addGroupBy(page, { fieldLabel: 'Date', fieldPath: 'date' })

    await expect(page.locator('.table-wrap')).toHaveCount(1)

    await expect(
      page.locator('.group-by-header__heading', { hasText: exactText('No value') }),
    ).toBeVisible()
  })

  test('should group by boolean values', async () => {
    await Promise.all([
      await payload.create({
        collection: postsSlug,
        data: {
          checkbox: null,
          title: 'Null Post',
        },
      }),
      await payload.create({
        collection: postsSlug,
        data: {
          checkbox: true,
          title: 'True Post',
        },
      }),
      await payload.create({
        collection: postsSlug,
        data: {
          checkbox: false,
          title: 'False Post',
        },
      }),
    ])

    await page.goto(url.list)

    await addGroupBy(page, {
      fieldLabel: 'Checkbox',
      fieldPath: 'checkbox',
    })

    await expect(page.locator('.table-wrap')).toHaveCount(3)

    await expect(page.locator('.group-by-header')).toHaveCount(3)

    await expect(
      page.locator('.group-by-header__heading', { hasText: exactText('No value') }),
    ).toBeVisible()

    await expect(
      page.locator('.group-by-header__heading', { hasText: exactText('True') }),
    ).toBeVisible()

    await expect(
      page.locator('.group-by-header__heading', { hasText: exactText('False') }),
    ).toBeVisible()
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
      fieldPath: 'title',
      scope: table1,
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
      fieldPath: 'title',
      scope: table1,
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
      fieldLabel: 'Title',
      operatorLabel: 'equals',
      page,
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
      fieldLabel: 'Category',
      operatorLabel: 'equals',
      page,
      value: 'Category 1',
    })

    await expect(page.locator('.table-wrap')).toHaveCount(1)

    // Reset the filter by reloading the page without URL params
    // TODO: There are no current test helpers for this
    await page.goto(url.list)

    await addListFilter({
      fieldLabel: 'Title',
      operatorLabel: 'equals',
      page,
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

  test('should paginate globally when grouping by virtual relationship field', async () => {
    await page.goto(url.list)

    // Open the group-by dropdown
    const { groupByContainer } = await openGroupBy(page)

    // Select the virtual field
    const field = groupByContainer.locator('#group-by--field-select')
    await field.click()
    await field
      .locator('.rs__option', {
        hasText: exactText('Virtual Title From Page'),
      })
      .click()

    // Wait for the field to be selected
    await expect(field.locator('.react-select--single-value')).toHaveText('Virtual Title From Page')

    // Virtual fields get transformed to their resolved path in the URL (page.title)
    await expect(page).toHaveURL(/&groupBy=page\.title/)

    // Should show sticky toolbar when there are 30 distinct page titles
    await expect(page.locator('.sticky-toolbar')).toBeVisible()

    // Verify the pagination controls are present
    await expect(page.locator('.sticky-toolbar .page-controls')).toBeVisible()

    // Verify we have multiple pages (30 pages with default limit of 10 = 3 pages)
    const pageInfo = page.locator('.sticky-toolbar .page-controls .page-controls__page-info')
    await expect(pageInfo).toBeVisible()
    await expect(pageInfo).toContainText('of 30')
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
      affectsURL: false,
      scope: table1,
    })

    await expect(page).toHaveURL(/queryByGroup=/)

    await clearGroupBy(page)

    await expect(page).not.toHaveURL(/queryByGroup=/)
  })

  test('should not render per table pagination controls when group-by is not active', async () => {
    // delete user prefs to ensure that group-by isn't populated after loading the page
    await deletePreferences({ key: `${postsSlug}.list`, payload, user })
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
      fieldPath: 'title',
      scope: firstTable,
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
      fieldPath: 'title',
      scope: firstTable,
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
    // TODO: This test is flaky, only in CI.
    await page.goto(url.list)
    await wait(500)
    // Wait until it doesn't say loading anywhere on the page
    await expect(page.locator('body')).not.toContainText('Loading')
    await wait(500)

    await addGroupBy(page, { fieldLabel: 'Category', fieldPath: 'category' })
    await wait(500)

    const firstTable = page.locator('.table-wrap').first()
    const secondTable = page.locator('.table-wrap').nth(1)

    const firstTableRows = firstTable.locator('tbody tr')
    const secondTableRows = secondTable.locator('tbody tr')

    // click the select all checkbox, then the "select all across pages" button
    await firstTable.locator('input#select-all').check()
    await wait(500)

    await firstTable.locator('button#select-all-across-pages').click()
    await wait(500)

    // now edit all titles and ensure that only the first table gets updated, not the second
    await firstTable.locator('.list-selection .edit-many__toggle').click()
    await wait(500)

    const modal = page.locator('[id$="-edit-posts"]').first()

    await expect(modal).toBeVisible()

    await modal.locator('.field-select .rs__control').click()
    await wait(500)

    await modal.locator('.field-select .rs__option', { hasText: exactText('Title') }).click()
    await wait(500)

    const field = modal.locator(`#field-title`)
    await expect(field).toBeVisible()
    await field.fill('Bulk edit across all pages')
    await wait(500)

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

  test('should group by monomorphic has one relationship field', async () => {
    const relationshipsUrl = new AdminUrlUtil(serverURL, 'relationships')
    await page.goto(relationshipsUrl.list)

    await addGroupBy(page, {
      fieldLabel: 'Mono Has One Relationship',
      fieldPath: 'MonoHasOneRelationship',
    })

    // Should show populated values first, then "No value"
    await expect(page.locator('.table-wrap')).toHaveCount(2)
    await expect(page.locator('.group-by-header')).toHaveCount(2)

    // Check that Category 1 appears as a group
    await expect(
      page.locator('.group-by-header__heading', { hasText: exactText('Category 1') }),
    ).toBeVisible()

    // Check that "No value" appears last
    await expect(
      page.locator('.group-by-header__heading', { hasText: exactText('No value') }),
    ).toBeVisible()
  })

  test('should group by monomorphic has many relationship field', async () => {
    const relationshipsUrl = new AdminUrlUtil(serverURL, 'relationships')
    await page.goto(relationshipsUrl.list)

    await addGroupBy(page, {
      fieldLabel: 'Mono Has Many Relationship',
      fieldPath: 'MonoHasManyRelationship',
    })

    // Should flatten hasMany arrays - each category gets its own group
    await expect(page.locator('.table-wrap')).toHaveCount(3)
    await expect(page.locator('.group-by-header')).toHaveCount(3)

    // Both categories should appear as separate groups
    await expect(
      page.locator('.group-by-header__heading', { hasText: exactText('Category 1') }),
    ).toBeVisible()

    await expect(
      page.locator('.group-by-header__heading', { hasText: exactText('Category 2') }),
    ).toBeVisible()

    // "No value" should appear last
    await expect(
      page.locator('.group-by-header__heading', { hasText: exactText('No value') }),
    ).toBeVisible()
  })

  test('should group by polymorphic has one relationship field', async () => {
    const relationshipsUrl = new AdminUrlUtil(serverURL, 'relationships')
    await page.goto(relationshipsUrl.list)

    await addGroupBy(page, {
      fieldLabel: 'Poly Has One Relationship',
      fieldPath: 'PolyHasOneRelationship',
    })

    // Should show groups for both collection types plus "No value"
    await expect(page.locator('.table-wrap')).toHaveCount(3)
    await expect(page.locator('.group-by-header')).toHaveCount(3)

    // Check for Category 1 group
    await expect(
      page.locator('.group-by-header__heading', { hasText: exactText('Category 1') }),
    ).toBeVisible()

    // Check for Post group (should display the post's title as useAsTitle)
    await expect(page.locator('.group-by-header__heading', { hasText: 'Find me' })).toBeVisible()

    // "No value" should appear last
    await expect(
      page.locator('.group-by-header__heading', { hasText: exactText('No value') }),
    ).toBeVisible()
  })

  test('should group by polymorphic has many relationship field', async () => {
    const relationshipsUrl = new AdminUrlUtil(serverURL, 'relationships')
    await page.goto(relationshipsUrl.list)

    await addGroupBy(page, {
      fieldLabel: 'Poly Has Many Relationship',
      fieldPath: 'PolyHasManyRelationship',
    })

    // Should flatten polymorphic hasMany arrays - each relationship gets its own group
    // Expecting: Category 1, Category 2, Post, and "No value" = 4 groups
    await expect(page.locator('.table-wrap')).toHaveCount(4)
    await expect(page.locator('.group-by-header')).toHaveCount(4)

    // Check for both category groups
    await expect(
      page.locator('.group-by-header__heading', { hasText: exactText('Category 1') }),
    ).toBeVisible()

    await expect(
      page.locator('.group-by-header__heading', { hasText: exactText('Category 2') }),
    ).toBeVisible()

    // Check for post group
    await expect(page.locator('.group-by-header__heading', { hasText: 'Find me' })).toBeVisible()

    // "No value" should appear last (documents without any relationships)
    await expect(
      page.locator('.group-by-header__heading', { hasText: exactText('No value') }),
    ).toBeVisible()
  })

  test('should hide field from groupBy options when admin.disableGroupBy is true', async () => {
    await page.goto(url.list)
    const { groupByContainer } = await openGroupBy(page)

    const field = groupByContainer.locator('#group-by--field-select')
    await field.click()

    await expect(
      field.locator('.rs__option', {
        hasText: exactText('Disabled Virtual Relationship From Category'),
      }),
    ).toBeHidden()
  })

  test.describe('Trash', () => {
    test('should show trashed docs in trash view when group-by is active', async () => {
      await page.goto(url.list)

      // Enable group-by on Category
      await addGroupBy(page, { fieldLabel: 'Category', fieldPath: 'category' })
      await expect(page.locator('.table-wrap')).toHaveCount(2) // We expect 2 groups initially

      // Trash the first document in the first group
      const firstTable = page.locator('.table-wrap').first()
      await firstTable.locator('.row-1 .cell-_select input').check()
      await firstTable.locator('.list-selection__button[aria-label="Delete"]').click()

      const firstGroupID = await firstTable
        .locator('.group-by-header__heading')
        .getAttribute('data-group-id')

      const modalId = `[id^="${firstGroupID}-confirm-delete-many-docs"]`
      await expect(page.locator(modalId)).toBeVisible()

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

    test('should properly clear group-by in trash view', async () => {
      await createTrashedPostDoc({ title: 'Trashed Post 1' })
      await page.goto(url.trash)

      // Enable group-by on Title
      await addGroupBy(page, { fieldLabel: 'Title', fieldPath: 'title' })
      await expect(page.locator('.table-wrap')).toHaveCount(1)
      await expect(page.locator('.group-by-header')).toHaveText('Trashed Post 1')

      await page.locator('#group-by--reset').click()
      await expect(page.locator('.group-by-header')).toBeHidden()
    })

    test('should properly navigate to trashed doc edit view from group-by in trash view', async () => {
      await createTrashedPostDoc({ title: 'Trashed Post 1' })
      await page.goto(url.trash)

      // Enable group-by on Title
      await addGroupBy(page, { fieldLabel: 'Title', fieldPath: 'title' })
      await expect(page.locator('.table-wrap')).toHaveCount(1)
      await expect(page.locator('.group-by-header')).toHaveText('Trashed Post 1')

      await page.locator('.table-wrap tbody tr td.cell-title a').click()
      await expect(page).toHaveURL(/\/posts\/trash\/\d+/)
    })
  })

  async function createTrashedPostDoc(data: Partial<Post>): Promise<Post> {
    return payload.create({
      collection: postsSlug,
      data: {
        ...data,
        deletedAt: new Date().toISOString(), // Set the post as trashed
      },
    }) as unknown as Promise<Post>
  }

  test.describe('Query Presets with Virtual Fields', () => {
    test('should display virtual field label in preset drawer when groupBy is saved', async () => {
      await page.goto(url.list)

      // Add group by virtual field
      const { groupByContainer } = await openGroupBy(page)
      const field = groupByContainer.locator('#group-by--field-select')
      await field.click()
      await field
        .locator('.rs__option', {
          hasText: exactText('Virtual Title From Page'),
        })
        .click()

      await expect(field.locator('.react-select--single-value')).toHaveText(
        'Virtual Title From Page',
      )
      await expect(page).toHaveURL(/&groupBy=page\.title/)

      // Create a new preset with this groupBy
      await page.locator('#create-new-preset').click()
      const modal = page.locator('[id^=doc-drawer_payload-query-presets_0_]')
      await expect(modal).toBeVisible()

      const presetTitle = 'Virtual Field Preset'
      await modal.locator('input[name="title"]').fill(presetTitle)

      // Check that the groupBy field shows the proper label (not "page.title")
      const groupByField = modal.locator('.query-preset-group-by-field .value-wrapper')
      await expect(groupByField).toBeVisible()
      await expect(groupByField).toContainText('Virtual Title From Page')
      await expect(groupByField).toContainText('ascending')

      await saveDocAndAssert(page)
      await expect(modal).toBeHidden()

      await expect(page).toHaveURL(/groupBy=page\.title/)
    })

    test('should display virtual field label in preset list cell', async () => {
      await page.goto(url.list)

      await payload.create({
        collection: 'payload-query-presets',
        data: {
          access: {
            delete: { constraint: 'onlyMe' },
            read: { constraint: 'onlyMe' },
            update: { constraint: 'onlyMe' },
          },
          groupBy: 'page.title',
          isShared: false,
          relatedCollection: postsSlug,
          title: 'Virtual Field Cell Test',
          where: {},
        },
        user,
      })

      // Open the preset drawer
      await page.click('button#select-preset')
      const drawer = page.locator('dialog[id^="list-drawer_0_"]')
      await expect(drawer).toBeVisible()

      // Find the row with our preset in the drawer
      const presetRow = drawer.locator('tbody tr', {
        has: page.locator('button:has-text("Virtual Field Cell Test")'),
      })
      await expect(presetRow).toBeVisible()

      // Check the groupBy cell displays the proper label (not "page.title")
      const groupByCell = presetRow.locator('td.cell-groupBy')
      await expect(groupByCell).toBeVisible()
      await expect(groupByCell).toContainText('Virtual Title From Page')
      await expect(groupByCell).toContainText('ascending')
    })

    test('should display virtual field label when editing a preset', async () => {
      await page.goto(url.list)

      const presetTitle = 'Virtual Field Edit Test'
      await payload.create({
        collection: 'payload-query-presets',
        data: {
          access: {
            delete: { constraint: 'onlyMe' },
            read: { constraint: 'onlyMe' },
            update: { constraint: 'onlyMe' },
          },
          groupBy: '-page.title',
          isShared: false,
          relatedCollection: postsSlug,
          title: presetTitle,
          where: {},
        },
        user,
      })

      // Select the preset to make it active
      await page.locator('button#select-preset').click()
      const drawer = page.locator('[id^=list-drawer_0_]')
      await expect(drawer).toBeVisible()

      await drawer
        .locator('tbody tr td button', {
          hasText: exactText(presetTitle),
        })
        .first()
        .click()

      await expect(drawer).toBeHidden()

      // Now open the edit preset drawer
      await page.locator('#edit-preset').click()
      const editModal = page.locator('[id^=doc-drawer_payload-query-presets_0_]')
      await expect(editModal).toBeVisible()

      // Check that the groupBy field shows the proper label with descending direction
      const groupByField = editModal.locator('.query-preset-group-by-field .value-wrapper')
      await expect(groupByField).toBeVisible()
      await expect(groupByField).toContainText('Virtual Title From Page')
      await expect(groupByField).toContainText('descending')
    })
  })
})
