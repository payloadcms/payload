import { expect, test } from '@playwright/test'
import { openListColumns, toggleColumn } from '__helpers/e2e/columns/index.js'
import { addListFilter, openListFilters } from '__helpers/e2e/filters/index.js'
import { addGroupBy, clearGroupBy } from '__helpers/e2e/groupBy/index.js'
import { openNav } from '__helpers/e2e/toggleNav.js'
import { reInitializeDB } from '__helpers/shared/clearAndSeed/reInitializeDB.js'
import * as path from 'path'
import { wait } from 'payload/shared'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../__helpers/shared/sdk/index.js'
import type { Config, PayloadQueryPreset } from './payload-types.js'

import {
  ensureCompilationIsDone,
  exactText,
  initPageConsoleErrorCatch,
  saveDocAndAssert,
} from '../__helpers/e2e/helpers.js'
import { AdminUrlUtil } from '../__helpers/shared/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../__helpers/shared/initPayloadE2ENoConfig.js'
import { TEST_TIMEOUT_LONG } from '../playwright.config.js'
import { assertURLParams } from './helpers/assertURLParams.js'
import { openQueryPresetDrawer } from './helpers/openQueryPresetDrawer.js'
import { clearSelectedPreset, selectPreset } from './helpers/togglePreset.js'
import { defaultColumnsSlug, pagesSlug } from './slugs.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const { beforeAll, beforeEach, describe } = test

let pagesUrl: AdminUrlUtil
let payload: PayloadTestSDK<Config>
let serverURL: string

let seededData: {
  everyone: PayloadQueryPreset
  onlyMe: PayloadQueryPreset
  specificUsers: PayloadQueryPreset
}

describe('Query Presets', () => {
  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    ;({ payload, serverURL } = await initPayloadE2ENoConfig<Config>({ dirname }))

    pagesUrl = new AdminUrlUtil(serverURL, pagesSlug)

    await ensureCompilationIsDone({ browser, serverURL })
  })

  beforeEach(async ({ page }) => {
    initPageConsoleErrorCatch(page)

    await reInitializeDB({
      serverURL,
      snapshotKey: 'querypresets',
    })

    await ensureCompilationIsDone({ page, serverURL })

    const allDocs = (
      await payload.find({
        collection: 'payload-query-presets',
        depth: 0,
        limit: 3,
        pagination: false,
        where: {
          title: {
            in: ['Everyone', 'Only Me', 'Specific Users'],
          },
        },
      })
    ).docs

    seededData = {
      everyone: allDocs.find((doc) => doc.title === 'Everyone')!,
      onlyMe: allDocs.find((doc) => doc.title === 'Only Me')!,
      specificUsers: allDocs.find((doc) => doc.title === 'Specific Users')!,
    }
  })

  test('can create and view preset with no filters or columns', async ({ page }) => {
    await page.goto(pagesUrl.list)

    const presetTitle = 'Empty Preset'

    // Create a new preset without setting any filters or columns
    await page.locator('#create-new-preset').click()
    const modal = page.locator('[id^=doc-drawer_payload-query-presets_0_]')
    await expect(modal).toBeVisible()
    await modal.locator('input[name="title"]').fill(presetTitle)

    const currentURL = page.url()
    await saveDocAndAssert(page)
    await expect(modal).toBeHidden()

    await page.waitForURL(() => page.url() !== currentURL)

    await expect(
      page.locator('button#select-preset', {
        hasText: exactText(presetTitle),
      }),
    ).toBeVisible()

    // Open the edit modal to verify where/columns fields handle null values
    await page.locator('#edit-preset').click()
    const editModal = page.locator('[id^=doc-drawer_payload-query-presets_0_]')
    await expect(editModal).toBeVisible()

    // Verify the Where field is visible (empty state: "Add Filter" or "No filters set")
    const whereField = editModal.locator('.query-preset-where-field')
    await expect(whereField).toBeVisible()
    await expect(whereField.locator('.where-builder')).toBeVisible()
    await expect(whereField.locator('.where-builder__no-filters')).toBeVisible()

    // Verify the Columns field is visible and no columns are selected (0 selected pills)
    const columnsField = editModal.locator('.query-preset-columns-field')
    await expect(columnsField).toBeVisible()
    await expect(columnsField.locator('.pill-selector__pill--selected')).toHaveCount(0)

    await editModal.locator('button.doc-drawer__header-close').click()
    await expect(editModal).toBeHidden()

    await openQueryPresetDrawer({ page })
    const drawer = page.locator('[id^=list-drawer_0_]')
    await expect(drawer).toBeVisible()

    const presetRow = drawer.locator('tbody tr', {
      has: page.locator(`button:has-text("${presetTitle}")`),
    })

    await expect(presetRow).toBeVisible()

    // Column order: title (0), isShared (1), access (2), where (3), columns (4)
    const whereCell = presetRow.locator('td').nth(3)
    await expect(whereCell).toContainText('No where query')

    const columnsCell = presetRow.locator('td').nth(4)
    await expect(columnsCell).toContainText('No columns selected')
  })

  test('should select preset and apply filters', async ({ page }) => {
    await page.goto(pagesUrl.list)

    await selectPreset({ page, presetTitle: seededData.everyone.title })

    await assertURLParams({
      columns: seededData.everyone.columns,
      page,
      preset: seededData.everyone.id,
    })
  })

  test('should clear selected preset and reset filters', async ({ page }) => {
    await page.goto(pagesUrl.list)

    await selectPreset({ page, presetTitle: seededData.everyone.title })

    await clearSelectedPreset({ page })

    // ensure that the preset was cleared from preferences by navigating without the `?preset=` param
    // e.g. do not do `page.reload()`
    await page.goto(pagesUrl.list)

    // poll url to ensure that `?preset=` param is not present
    // this is first set to an empty string to clear from the user's preferences
    // it is then removed entirely after it is processed on the server
    const regex = /preset=/
    await page.waitForURL((url) => !regex.test(url.search), { timeout: TEST_TIMEOUT_LONG })

    await expect(
      page.locator('button#select-preset', {
        hasText: exactText('Select Preset'),
      }),
    ).toBeVisible()
  })

  test('should delete a preset, clear selection, and reset changes', async ({ page }) => {
    await page.goto(pagesUrl.list)
    await selectPreset({ page, presetTitle: seededData.everyone.title })

    await page.locator('#delete-preset').click()

    await page.locator('#confirm-delete-preset #confirm-action').click()

    // columns can either be omitted or an empty string after being cleared
    const regex = /columns=(?:\[\]|$)/

    await page.waitForURL((url) => !regex.test(url.search), {
      timeout: TEST_TIMEOUT_LONG,
    })

    await expect(
      page.locator('button#select-preset', {
        hasText: exactText('Select Preset'),
      }),
    ).toBeVisible()

    await openQueryPresetDrawer({ page })
    const modal = page.locator('[id^=list-drawer_0_]')
    await expect(modal).toBeVisible()

    await expect(
      modal.locator('tbody tr td button', {
        hasText: exactText(seededData.everyone.title),
      }),
    ).toBeHidden()
  })

  test('should save last used preset to preferences and load on initial render', async ({
    page,
  }) => {
    await page.goto(pagesUrl.list)

    await selectPreset({ page, presetTitle: seededData.everyone.title })

    await page.goto(pagesUrl.list)

    await assertURLParams({
      columns: seededData.everyone.columns,
      page,
      preset: seededData.everyone.id,
      where: seededData.everyone.where,
    })

    // for good measure, also soft navigate away and back
    await page.goto(pagesUrl.admin)
    await openNav(page)
    await page.click(`a[href="/admin/collections/${pagesSlug}"]`)

    await assertURLParams({
      columns: seededData.everyone.columns,
      page,
      preset: seededData.everyone.id,
      where: seededData.everyone.where,
    })
  })

  test('should only show "edit" and "delete" controls when there is an active preset', async ({
    page,
  }) => {
    await page.goto(pagesUrl.list)
    await expect(page.locator('#edit-preset')).toBeHidden()
    await expect(page.locator('#delete-preset')).toBeHidden()
    await selectPreset({ page, presetTitle: seededData.everyone.title })
    await expect(page.locator('#edit-preset')).toBeVisible()
    await expect(page.locator('#delete-preset')).toBeVisible()
  })

  test('should only show "reset" and "save" controls when there is an active preset and changes have been made', async ({
    page,
  }) => {
    await page.goto(pagesUrl.list)

    await expect(page.locator('#reset-preset')).toBeHidden()

    await expect(page.locator('#save-preset')).toBeHidden()

    await selectPreset({ page, presetTitle: seededData.onlyMe.title })

    await toggleColumn(page, { columnLabel: 'ID' })

    await expect(page.locator('#reset-preset')).toBeVisible()

    await expect(
      page.locator('#save-preset', {
        hasText: exactText('Save changes'),
      }),
    ).toBeVisible()
  })

  test('should conditionally render "update for everyone" label based on if preset is shared', async ({
    page,
  }) => {
    await page.goto(pagesUrl.list)

    await selectPreset({ page, presetTitle: seededData.onlyMe.title })

    await toggleColumn(page, { columnLabel: 'ID' })

    // When not shared, the label is "Save"
    await expect(page.locator('#save-preset')).toBeVisible()

    await expect(
      page.locator('#save-preset', {
        hasText: exactText('Save changes'),
      }),
    ).toBeVisible()

    await selectPreset({ page, presetTitle: seededData.everyone.title })

    await toggleColumn(page, { columnLabel: 'ID' })

    // When shared, the label is "Update for everyone"
    await expect(
      page.locator('#save-preset', {
        hasText: exactText('Update for everyone'),
      }),
    ).toBeVisible()
  })

  test('should reset active changes', async ({ page }) => {
    await page.goto(pagesUrl.list)
    await selectPreset({ page, presetTitle: seededData.everyone.title })

    const { columnContainer } = await toggleColumn(page, { columnLabel: 'ID' })

    const column = columnContainer.locator(`.pill-selector .pill-selector__pill`, {
      hasText: exactText('ID'),
    })

    await page.locator('#reset-preset').click()

    await openListColumns(page, {})
    await expect(column).toHaveClass(/pill-selector__pill--selected/)
  })

  test.skip('should only enter modified state when changes are made to an active preset', async ({
    page,
  }) => {
    await page.goto(pagesUrl.list)
    await expect(page.locator('.list-controls__modified')).toBeHidden()
    await selectPreset({ page, presetTitle: seededData.everyone.title })
    await expect(page.locator('.list-controls__modified')).toBeHidden()
    await toggleColumn(page, { columnLabel: 'ID' })
    await expect(page.locator('.list-controls__modified')).toBeVisible()

    await page.locator('#save-preset').click()

    await expect(page.locator('.list-controls__modified')).toBeHidden()
    await toggleColumn(page, { columnLabel: 'ID' })
    await expect(page.locator('.list-controls__modified')).toBeVisible()

    await page.locator('#reset-preset').click()

    await expect(page.locator('.list-controls__modified')).toBeHidden()
  })

  test('can edit a preset through the document drawer', async ({ page }) => {
    const presetTitle = 'New Preset'

    await page.goto(pagesUrl.list)

    await selectPreset({ page, presetTitle: seededData.everyone.title })
    await page.locator('#edit-preset').click()

    const drawer = page.locator('[id^=doc-drawer_payload-query-presets_0_]')
    const titleValue = drawer.locator('input[name="title"]')
    await expect(titleValue).toHaveValue(seededData.everyone.title)

    const newTitle = `${seededData.everyone.title} (Updated)`
    await drawer.locator('input[name="title"]').fill(newTitle)

    await saveDocAndAssert(page)

    await drawer.locator('button.doc-drawer__header-close').click()
    await expect(drawer).toBeHidden()

    await expect(page.locator('button#select-preset')).toHaveText(newTitle)
  })

  test('should not display query presets when admin.enableQueryPresets is not true', async ({
    page,
  }) => {
    // go to users list view and ensure the query presets select is not visible
    const usersURL = new AdminUrlUtil(serverURL, 'users')
    await page.goto(usersURL.list)
    await expect(page.locator('#select-preset')).toBeHidden()
  })

  // eslint-disable-next-line playwright/no-skipped-test, playwright/expect-expect
  test.skip('can save a preset', ({ page }) => {
    // select a preset, make a change to the presets, click "save for everyone" or "save", and ensure the changes persist
  })

  test('can create new preset', async ({ page }) => {
    await page.goto(pagesUrl.list)

    const presetTitle = 'New Preset'

    await page.locator('#create-new-preset').click()
    const modal = page.locator('[id^=doc-drawer_payload-query-presets_0_]')
    await expect(modal).toBeVisible()
    await modal.locator('input[name="title"]').fill(presetTitle)

    const currentURL = page.url()
    await saveDocAndAssert(page)
    await expect(modal).toBeHidden()

    await page.waitForURL(() => page.url() !== currentURL)

    await expect(
      page.locator('button#select-preset', {
        hasText: exactText(presetTitle),
      }),
    ).toBeVisible()
  })

  test('only shows query presets related to the underlying collection', async ({ page }) => {
    // no results on `posts` collection
    const postsURL = new AdminUrlUtil(serverURL, 'posts')
    await page.goto(postsURL.list)
    const drawer = await openQueryPresetDrawer({ page })
    await expect(drawer.locator('.table table > tbody > tr')).toHaveCount(0)
    await expect(drawer.locator('.collection-list__no-results')).toBeVisible()

    // results on `pages` collection
    await page.goto(pagesUrl.list)
    await openQueryPresetDrawer({ page })
    await expect(drawer.locator('.table table > tbody > tr')).toHaveCount(3)
    await drawer.locator('.collection-list__no-results').isHidden()
  })

  test('should display single relationship value in query preset modal', async ({ page }) => {
    await page.goto(pagesUrl.list)

    // Get a post to use for filtering
    const posts = await payload.find({
      collection: 'posts',
      limit: 1,
    })
    const testPost = posts.docs[0]

    await addListFilter({
      fieldLabel: 'Posts Relationship',
      operatorLabel: 'is in',
      page,
      value: testPost?.text ?? '',
    })

    // Create a new preset with this filter
    await page.locator('#create-new-preset').click()
    const modal = page.locator('[id^=doc-drawer_payload-query-presets_0_]')
    await expect(modal).toBeVisible()

    const presetTitle = 'Single Relationship Filter Test'
    await modal.locator('input[name="title"]').fill(presetTitle)

    await saveDocAndAssert(page)
    await expect(modal).toBeHidden()

    // Wait for URL to update with the new preset
    await page.waitForURL((url) => url.searchParams.has('preset'))

    // Open the edit preset modal to check the filter display
    await page.locator('#edit-preset').click()
    const editModal = page.locator('[id^=doc-drawer_payload-query-presets_0_]')
    await expect(editModal).toBeVisible()

    // Check that the Where field properly displays the relationship filter
    const whereFieldContent = editModal.locator('.query-preset-where-field')
    await expect(whereFieldContent).toBeVisible()

    // Verify that the filter shows the relationship field, operator, and post value (displayed as title/text)
    await expect(whereFieldContent).toContainText('Posts Relationship')
    await expect(whereFieldContent).toContainText('in')
    await expect(whereFieldContent).toContainText(testPost?.text ?? '')
  })

  test('should display multiple relationship values in query preset modal', async ({ page }) => {
    await page.goto(pagesUrl.list)

    // Get posts to use for filtering
    const posts = await payload.find({
      collection: 'posts',
      limit: 2,
    })
    const [testPost1, testPost2] = posts.docs

    await openListFilters(page, {})

    const whereBuilder = page.locator('.where-builder')
    const addFirst = whereBuilder.locator('.where-builder__add-first-filter')

    await addFirst.click()

    const condition = whereBuilder.locator('.where-builder__or-filters > li').first()

    // Select field
    await condition.locator('.condition__field .rs__control').click()
    await page.locator('.rs__option:has-text("Posts Relationship")').click()

    // Select operator
    await condition.locator('.condition__operator .rs__control').click()
    await page.locator('.rs__option:has-text("is in")').click()

    // Select multiple values
    const valueSelect = condition.locator('.condition__value')

    // Select first post
    await valueSelect.locator('.rs__control').click()
    await page.locator(`.rs__option:has-text("${testPost1?.text}")`).click()

    // Reopen dropdown and select second post
    await valueSelect.locator('.rs__control').click()
    await page.locator(`.rs__option:has-text("${testPost2?.text}")`).click()

    // Wait for network response
    await page.waitForResponse(
      (response) =>
        response.url().includes(encodeURIComponent('where[or')) && response.status() === 200,
    )

    // Create a new preset with this filter
    await page.locator('#create-new-preset').click()
    const modal = page.locator('[id^=doc-drawer_payload-query-presets_0_]')
    await expect(modal).toBeVisible()

    const presetTitle = 'Multiple Relationship Filter Test'
    await modal.locator('input[name="title"]').fill(presetTitle)

    await saveDocAndAssert(page)
    await expect(modal).toBeHidden()

    // Wait for URL to update with the new preset
    await page.waitForURL((url) => url.searchParams.has('preset'))

    // Open the edit preset modal to check the filter display
    await page.locator('#edit-preset').click()
    const editModal = page.locator('[id^=doc-drawer_payload-query-presets_0_]')
    await expect(editModal).toBeVisible()

    const whereFieldContent = editModal.locator('.query-preset-where-field')
    await expect(whereFieldContent).toBeVisible()

    await expect(whereFieldContent).toContainText('Posts Relationship')
    await expect(whereFieldContent).toContainText('in')
    // Both selected posts are displayed (as titles); multi-value may show comma or separate pills
    await expect(whereFieldContent).toContainText(testPost1?.text ?? '')
    await expect(whereFieldContent).toContainText(testPost2?.text ?? '')
  })

  test('should save groupBy when creating a new preset', async ({ page }) => {
    const postsUrl = new AdminUrlUtil(serverURL, 'posts')
    await page.goto(postsUrl.list)

    await addGroupBy(page, { fieldLabel: 'Text', fieldPath: 'text' })

    // Create a new preset
    await page.locator('#create-new-preset').click()
    const modal = page.locator('[id^=doc-drawer_payload-query-presets_0_]')
    await expect(modal).toBeVisible()

    const presetTitle = 'GroupBy Test Preset'
    await modal.locator('input[name="title"]').fill(presetTitle)

    // Verify groupBy field displays the current groupBy value (from initialData)
    const groupByField = modal.locator('.query-preset-group-by-field')
    await expect(groupByField).toBeVisible()
    await expect(groupByField.locator('.group-by-builder')).toBeVisible()
    await expect(groupByField).toContainText('Text')
    await expect(groupByField).toContainText(/ascending/i)

    await saveDocAndAssert(page)
    await expect(modal).toBeHidden()

    await expect(page).toHaveURL(/groupBy=text/)
  })

  test('should apply groupBy when selecting a preset', async ({ page }) => {
    const postsUrl = new AdminUrlUtil(serverURL, 'posts')

    // First, create a preset with groupBy
    await page.goto(postsUrl.list)
    await addGroupBy(page, { fieldLabel: 'Text', fieldPath: 'text' })

    await page.locator('#create-new-preset').click()
    const modal = page.locator('[id^=doc-drawer_payload-query-presets_0_]')
    await expect(modal).toBeVisible()

    const presetTitle = 'GroupBy Apply Test'
    await modal.locator('input[name="title"]').fill(presetTitle)
    await saveDocAndAssert(page)
    await expect(modal).toBeHidden()

    // Clear the preset
    await clearSelectedPreset({ page })

    await page.goto(postsUrl.list)
    await expect(page).not.toHaveURL(/groupBy=/)

    await selectPreset({ page, presetTitle })

    await expect(page).toHaveURL(/groupBy=text/)

    await expect(page.locator('.group-by-header').first()).toBeVisible()
  })

  test('should clear groupBy when deselecting a preset', async ({ page }) => {
    const postsUrl = new AdminUrlUtil(serverURL, 'posts')

    // Create a preset with groupBy
    await page.goto(postsUrl.list)
    await addGroupBy(page, { fieldLabel: 'Text', fieldPath: 'text' })

    await page.locator('#create-new-preset').click()
    const modal = page.locator('[id^=doc-drawer_payload-query-presets_0_]')
    await expect(modal).toBeVisible()

    const presetTitle = 'GroupBy Clear Test'
    await modal.locator('input[name="title"]').fill(presetTitle)
    await saveDocAndAssert(page)
    await expect(modal).toBeHidden()

    // Verify groupBy is in URL and grouped view is active
    await expect(page).toHaveURL(/groupBy=text/)
    await expect(page.locator('.group-by-header').first()).toBeVisible()

    await clearSelectedPreset({ page })

    // Verify groupBy is removed from URL and grouped view is gone
    await expect(page).not.toHaveURL(/groupBy=/)
    await expect(page.locator('.group-by-header')).toHaveCount(0)
  })

  test('should update groupBy when saving changes to an active preset', async ({ page }) => {
    const postsUrl = new AdminUrlUtil(serverURL, 'posts')

    // Create a preset without groupBy
    await page.goto(postsUrl.list)
    await wait(1000)

    await page.locator('#create-new-preset').click()
    const modal = page.locator('[id^=doc-drawer_payload-query-presets_0_]')
    await expect(modal).toBeVisible()

    const presetTitle = 'GroupBy Update Test'
    await modal.locator('input[name="title"]').fill(presetTitle)

    await saveDocAndAssert(page)
    await expect(modal).toBeHidden()

    await addGroupBy(page, { fieldLabel: 'Text', fieldPath: 'text' })

    await page.locator('#save-preset').click()

    // Wait for the modified indicator to disappear (indicates save completed)
    await expect(page.locator('.list-controls__modified')).toBeHidden()

    // Clear and reselect the preset to verify groupBy was saved
    await clearSelectedPreset({ page })
    await page.goto(postsUrl.list)
    await selectPreset({ page, presetTitle })

    // Verify groupBy is applied from the preset
    await expect(page).toHaveURL(/groupBy=text/)
    await expect(page.locator('.group-by-header').first()).toBeVisible()
  })

  test('should not show save button after page reload with preset applied', async ({ page }) => {
    await page.goto(pagesUrl.list)

    // 1. Apply query preset
    await selectPreset({ page, presetTitle: seededData.onlyMe.title })

    // 2. Reload page
    await page.reload()
    await expect(page.locator('button#select-preset')).toContainText(seededData.onlyMe.title)

    // 3. #save-preset button should NOT show (no modifications yet)
    await expect(page.locator('#save-preset')).toBeHidden()

    // 4. Make a change
    await toggleColumn(page, { columnLabel: 'ID' })

    // 5. #save-preset button should show
    await expect(page.locator('#save-preset')).toBeVisible()
  })

  test('should reset groupBy when clicking reset button on modified preset', async ({ page }) => {
    const postsUrl = new AdminUrlUtil(serverURL, 'posts')

    // Create a preset with groupBy
    await page.goto(postsUrl.list)
    await addGroupBy(page, { fieldLabel: 'Text', fieldPath: 'text' })

    await page.locator('#create-new-preset').click()
    const modal = page.locator('[id^=doc-drawer_payload-query-presets_0_]')
    await expect(modal).toBeVisible()

    const presetTitle = 'GroupBy Reset Test'
    await modal.locator('input[name="title"]').fill(presetTitle)
    await saveDocAndAssert(page)
    await expect(modal).toBeHidden()

    // Verify groupBy is in URL and grouped view is visible
    await expect(page).toHaveURL(/groupBy=text/)
    await expect(page.locator('.group-by-header').first()).toBeVisible()

    // Verify reset button is not visible initially
    await expect(page.locator('#reset-preset')).toBeHidden()

    // Clear the groupBy (modify the preset)
    await clearGroupBy(page)
    await expect(page).not.toHaveURL(/groupBy=/)
    await expect(page.locator('.group-by-header')).toHaveCount(0)

    // Verify reset button becomes visible after modification
    await expect(page.locator('#reset-preset')).toBeVisible()

    await page.locator('#reset-preset').click()

    // Verify groupBy is restored from preset
    await expect(page).toHaveURL(/groupBy=text/)
    await expect(page.locator('.group-by-header').first()).toBeVisible()

    // Verify reset button is hidden again after reset
    await expect(page.locator('#reset-preset')).toBeHidden()
  })

  test('should apply preset from URL query param', async ({ page }) => {
    // Navigate directly to the list view with a preset query param
    await page.goto(`${pagesUrl.list}?preset=${seededData.everyone.id}`)

    // Verify the where query is in the URL
    await assertURLParams({
      page,
      columns: seededData.everyone.columns,
      where: seededData.everyone.where,
      preset: seededData.everyone.id,
    })

    // Verify the preset is selected in the preset selector
    await expect(
      page.locator('button#select-preset', {
        hasText: exactText(seededData.everyone.title),
      }),
    ).toBeVisible()

    // Verify the actual results are filtered correctly
    // The seeded preset filters for text: { equals: 'example page' }
    const tableRows = page.locator('.collection-list .table tbody tr')
    await expect(tableRows).toHaveCount(1)
    await expect(tableRows.first()).toContainText('example page')
  })

  test('should restore default columns after clearing a preset', async ({ page }) => {
    const defaultColumnsUrl = new AdminUrlUtil(serverURL, defaultColumnsSlug)

    // The DefaultColumns collection has defaultColumns: ['id', 'field1', 'field2', 'defaultColumnField']
    const expectedDefaultColumns = ['ID', 'Field1', 'Field2', 'Default Column Field']

    // Step 1: Go to list view and verify default columns are shown initially
    await page.goto(defaultColumnsUrl.list)

    const tableHeaders = page.locator('table > thead > tr > th')

    // Verify default columns are visible (skipping first th which is checkbox)
    for (let i = 0; i < expectedDefaultColumns.length; i++) {
      await expect(tableHeaders.nth(i + 1)).toHaveText(expectedDefaultColumns[i]!)
    }

    // Step 2: Apply query preset (the "Default Columns" preset seeded for this collection)
    await selectPreset({ page, presetTitle: 'Default Columns' })

    // Step 3: Remove the query preset
    await clearSelectedPreset({ page })

    // Step 4: Verify default columns are STILL shown after clearing preset
    // BUG: Currently shows columns in field order instead of defaultColumns order
    for (let i = 0; i < expectedDefaultColumns.length; i++) {
      await expect(tableHeaders.nth(i + 1)).toHaveText(expectedDefaultColumns[i]!)
    }

    // Step 5: Navigate away and back (fresh navigation without URL params)
    await page.goto(defaultColumnsUrl.admin)
    await page.goto(defaultColumnsUrl.list)

    // Step 6: Verify default columns are STILL shown after fresh page load
    // BUG: Currently shows columns in field order instead of defaultColumns order
    for (let i = 0; i < expectedDefaultColumns.length; i++) {
      await expect(tableHeaders.nth(i + 1)).toHaveText(expectedDefaultColumns[i]!)
    }
  })
})
