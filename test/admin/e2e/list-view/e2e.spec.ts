import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import { mapAsync } from 'payload'
import * as qs from 'qs-esm'

import type { Config, Geo, Post } from '../../payload-types.js'

import {
  ensureCompilationIsDone,
  exactText,
  getRoutes,
  initPageConsoleErrorCatch,
  openDocDrawer,
} from '../../../helpers.js'
import { AdminUrlUtil } from '../../../helpers/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../../../helpers/initPayloadE2ENoConfig.js'
import { customAdminRoutes } from '../../shared.js'
import { customViews1CollectionSlug, geoCollectionSlug, postsCollectionSlug } from '../../slugs.js'

const { beforeAll, beforeEach, describe } = test

const title = 'Title'
const description = 'Description'

let payload: PayloadTestSDK<Config>

import { goToFirstCell } from 'helpers/e2e/navigateToDoc.js'
import { openListColumns } from 'helpers/e2e/openListColumns.js'
import { openListFilters } from 'helpers/e2e/openListFilters.js'
import { toggleColumn } from 'helpers/e2e/toggleColumn.js'
import path from 'path'
import { wait } from 'payload/shared'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../../../helpers/sdk/index.js'

import { reorderColumns } from '../../../helpers/e2e/reorderColumns.js'
import { reInitializeDB } from '../../../helpers/reInitializeDB.js'
import { POLL_TOPASS_TIMEOUT, TEST_TIMEOUT_LONG } from '../../../playwright.config.js'
const filename = fileURLToPath(import.meta.url)
const currentFolder = path.dirname(filename)
const dirname = path.resolve(currentFolder, '../../')

describe('List View', () => {
  let page: Page
  let geoUrl: AdminUrlUtil
  let postsUrl: AdminUrlUtil
  let baseListFiltersUrl: AdminUrlUtil
  let customViewsUrl: AdminUrlUtil

  let serverURL: string
  let adminRoutes: ReturnType<typeof getRoutes>

  beforeAll(async ({ browser }, testInfo) => {
    const prebuild = false // Boolean(process.env.CI)

    testInfo.setTimeout(TEST_TIMEOUT_LONG)

    process.env.SEED_IN_CONFIG_ONINIT = 'false' // Makes it so the payload config onInit seed is not run. Otherwise, the seed would be run unnecessarily twice for the initial test run - once for beforeEach and once for onInit
    ;({ payload, serverURL } = await initPayloadE2ENoConfig<Config>({
      dirname,
      prebuild,
    }))

    geoUrl = new AdminUrlUtil(serverURL, geoCollectionSlug)
    postsUrl = new AdminUrlUtil(serverURL, postsCollectionSlug)
    baseListFiltersUrl = new AdminUrlUtil(serverURL, 'base-list-filters')
    customViewsUrl = new AdminUrlUtil(serverURL, customViews1CollectionSlug)

    const context = await browser.newContext()
    page = await context.newPage()
    initPageConsoleErrorCatch(page)

    await ensureCompilationIsDone({ customAdminRoutes, page, serverURL })

    adminRoutes = getRoutes({ customAdminRoutes })
  })

  beforeEach(async () => {
    await reInitializeDB({
      serverURL,
      snapshotKey: 'adminTests',
    })

    await ensureCompilationIsDone({ customAdminRoutes, page, serverURL })

    // delete all posts created by the seed
    await deleteAllPosts()
    await page.goto(postsUrl.list)
    await page.waitForURL((url) => url.toString().startsWith(postsUrl.list))
    await expect(page.locator(tableRowLocator)).toBeHidden()

    await createPost({ title: 'post1' })
    await createPost({ title: 'post2' })
    await page.reload()
    await expect(page.locator(tableRowLocator)).toHaveCount(2)
  })

  const tableRowLocator = 'table > tbody > tr'

  describe('list view descriptions', () => {
    test('should render static collection descriptions', async () => {
      await page.goto(postsUrl.list)
      await expect(
        page.locator('.view-description', {
          hasText: exactText('This is a custom collection description.'),
        }),
      ).toBeVisible()
    })

    test('should render dynamic collection description components', async () => {
      await page.goto(customViewsUrl.list)
      await expect(
        page.locator('.view-description', {
          hasText: exactText('This is a custom view description component.'),
        }),
      ).toBeVisible()
    })
  })

  describe('list view table', () => {
    test('should link second cell', async () => {
      const { id } = await createPost()
      await page.reload()
      const linkCell = page.locator(`${tableRowLocator} td`).nth(1).locator('a')

      await expect(linkCell).toHaveAttribute(
        'href',
        `${adminRoutes.routes.admin}/collections/posts/${id}`,
      )

      await page.locator('.list-controls__toggle-columns').click()
      await expect(page.locator('.list-controls__columns.rah-static--height-auto')).toBeVisible()

      await page
        .locator('.column-selector .column-selector__column', {
          hasText: exactText('ID'),
        })
        .click()

      await page.locator('#heading-id').waitFor({ state: 'detached' })
      await page.locator('.cell-id').first().waitFor({ state: 'detached' })

      await expect(linkCell).toHaveAttribute(
        'href',
        `${adminRoutes.routes.admin}/collections/posts/${id}`,
      )
    })
  })

  describe('search', () => {
    test('should prefill search input from query param', async () => {
      await createPost({ title: 'dennis' })
      await createPost({ title: 'charlie' })

      // prefill search with "a" from the query param
      await page.goto(`${postsUrl.list}?search=dennis`)
      await page.waitForURL(new RegExp(`${postsUrl.list}\\?search=dennis`))

      // input should be filled out, list should filter
      await expect(page.locator('.search-filter__input')).toHaveValue('dennis')
      await expect(page.locator(tableRowLocator)).toHaveCount(1)
    })

    test('should search by id with listSearchableFields', async () => {
      const { id } = await createPost()
      const url = `${postsUrl.list}?limit=10&page=1&search=${id}`
      await page.goto(url)
      await page.waitForURL(url)
      const tableItems = page.locator(tableRowLocator)
      await expect(tableItems).toHaveCount(1)
    })

    test('should search by id without listSearchableFields', async () => {
      const { id } = await createGeo()
      const url = `${geoUrl.list}?limit=10&page=1&search=${id}`
      await page.goto(url)
      await page.waitForURL(url)
      const tableItems = page.locator(tableRowLocator)
      await expect(tableItems).toHaveCount(1)
    })

    test('should search by title or description', async () => {
      await createPost({
        description: 'this is fun',
        title: 'find me',
      })

      await page.locator('.search-filter__input').fill('find me')
      await expect(page.locator(tableRowLocator)).toHaveCount(1)

      await page.locator('.search-filter__input').fill('this is fun')
      await expect(page.locator(tableRowLocator)).toHaveCount(1)
    })

    test('search should persist through browser back button', async () => {
      const url = `${postsUrl.list}?limit=10&page=1&search=post1`
      await page.goto(url)
      await page.waitForURL(url)
      await expect(page.locator('#search-filter-input')).toHaveValue('post1')
      await goToFirstCell(page, postsUrl)
      await page.goBack()
      await wait(1000) // wait one second to ensure that the new view does not accidentally reset the search
      await page.waitForURL(url)
    })

    test('search should not persist between navigation', async () => {
      const url = `${postsUrl.list}?limit=10&page=1&search=test`
      await page.goto(url)
      await page.waitForURL(url)

      await expect(page.locator('#search-filter-input')).toHaveValue('test')

      await page.locator('.nav-toggler.template-default__nav-toggler').click()
      await expect(page.locator('#nav-uploads')).toContainText('Uploads')

      const uploadsUrl = await page.locator('#nav-uploads').getAttribute('href')
      await page.goto(serverURL + uploadsUrl)
      await page.waitForURL(serverURL + uploadsUrl)

      await expect(page.locator('#search-filter-input')).toHaveValue('')
    })
  })

  describe('filters', () => {
    test('should respect base list filters', async () => {
      await page.goto(baseListFiltersUrl.list)
      await page.waitForURL((url) => url.toString().startsWith(baseListFiltersUrl.list))
      await expect(page.locator(tableRowLocator)).toHaveCount(1)
    })

    test('should filter rows', async () => {
      // open the column controls
      await page.locator('.list-controls__toggle-columns').click()

      // wait until the column toggle UI is visible and fully expanded
      await expect(page.locator('.column-selector')).toBeVisible()
      await expect(page.locator('table > thead > tr > th:nth-child(2)')).toHaveText('ID')

      // ensure the ID column is active
      const idButton = page.locator('.column-selector .column-selector__column', {
        hasText: exactText('ID'),
      })

      const id = (await page.locator('.cell-id').first().innerText()).replace('ID: ', '')

      const buttonClasses = await idButton.getAttribute('class')

      if (buttonClasses && !buttonClasses.includes('column-selector__column--active')) {
        await idButton.click()
        await expect(page.locator(tableRowLocator).first().locator('.cell-id')).toBeVisible()
      }

      await expect(page.locator(tableRowLocator)).toHaveCount(2)

      await openListFilters(page, {})

      await page.locator('.where-builder__add-first-filter').click()

      const conditionField = page.locator('.condition__field')
      await conditionField.click()
      const dropdownFieldOption = conditionField.locator('.rs__option', {
        hasText: exactText('ID'),
      })
      await dropdownFieldOption.click()
      await expect(page.locator('.condition__field')).toContainText('ID')

      const operatorField = page.locator('.condition__operator')
      const valueField = page.locator('.condition__value input')

      await operatorField.click()

      const dropdownOptions = operatorField.locator('.rs__option')
      await dropdownOptions.locator('text=equals').click()

      await valueField.fill(id)

      const tableRows = page.locator(tableRowLocator)

      await expect(tableRows).toHaveCount(1)
      const firstId = page.locator(tableRowLocator).first().locator('.cell-id')
      await expect(firstId).toHaveText(`ID: ${id}`)

      // Remove filter
      await page.locator('.condition__actions-remove').click()
      await expect(page.locator(tableRowLocator)).toHaveCount(2)
    })

    test('should reset filter value and operator on field update', async () => {
      const id = (await page.locator('.cell-id').first().innerText()).replace('ID: ', '')

      // open the column controls
      await page.locator('.list-controls__toggle-columns').click()
      await openListFilters(page, {})
      await page.locator('.where-builder__add-first-filter').click()

      const operatorField = page.locator('.condition__operator')
      await operatorField.click()

      const dropdownOperatorOptions = operatorField.locator('.rs__option')
      await dropdownOperatorOptions.locator('text=equals').click()

      // execute filter (where ID equals id value)
      const valueField = page.locator('.condition__value > input')
      await valueField.fill(id)

      const filterField = page.locator('.condition__field')
      await filterField.click()

      // select new filter field of Number
      const dropdownFieldOption = filterField.locator('.rs__option', {
        hasText: exactText('Status'),
      })
      await dropdownFieldOption.click()
      await expect(filterField).toContainText('Status')

      // expect operator & value field to reset (be empty)
      await expect(operatorField.locator('.rs__placeholder')).toContainText('Select a value')
      await expect(page.locator('.condition__value input')).toHaveValue('')
    })

    test('should accept where query from valid URL where parameter', async () => {
      // delete all posts created by the seed
      await deleteAllPosts()
      await page.goto(postsUrl.list)
      await expect(page.locator(tableRowLocator)).toBeHidden()

      await createPost({ title: 'post1' })
      await createPost({ title: 'post2' })
      await page.goto(postsUrl.list)
      await expect(page.locator(tableRowLocator)).toHaveCount(2)

      await page.goto(`${postsUrl.list}?limit=10&page=1&where[or][0][and][0][title][equals]=post1`)

      await expect(page.locator('.react-select--single-value').first()).toContainText('Title')
      await expect(page.locator(tableRowLocator)).toHaveCount(1)
    })

    test('should accept transformed where query from invalid URL where parameter', async () => {
      // delete all posts created by the seed
      await deleteAllPosts()
      await page.goto(postsUrl.list)
      await expect(page.locator(tableRowLocator)).toBeHidden()

      await createPost({ title: 'post1' })
      await createPost({ title: 'post2' })
      await page.goto(postsUrl.list)
      await expect(page.locator(tableRowLocator)).toHaveCount(2)

      // [title][equals]=post1 should be getting transformed into a valid where[or][0][and][0][title][equals]=post1
      await page.goto(`${postsUrl.list}?limit=10&page=1&where[title][equals]=post1`)

      await expect(page.locator('.react-select--single-value').first()).toContainText('Title')
      await expect(page.locator(tableRowLocator)).toHaveCount(1)
    })

    test('should accept where query from complex, valid URL where parameter using the near operator', async () => {
      // We have one point collection with the point [5,-5] and one with [7,-7]. This where query should kick out the [5,-5] point
      await page.goto(
        `${
          new AdminUrlUtil(serverURL, 'geo').list
        }?limit=10&page=1&where[or][0][and][0][point][near]=6,-7,200000`,
      )

      await expect(page.getByPlaceholder('Enter a value')).toHaveValue('6,-7,200000')
      await expect(page.locator(tableRowLocator)).toHaveCount(1)
    })

    test('should accept transformed where query from complex, invalid URL where parameter using the near operator', async () => {
      // We have one point collection with the point [5,-5] and one with [7,-7]. This where query should kick out the [5,-5] point
      await page.goto(
        `${new AdminUrlUtil(serverURL, 'geo').list}?limit=10&page=1&where[point][near]=6,-7,200000`,
      )

      await expect(page.getByPlaceholder('Enter a value')).toHaveValue('6,-7,200000')
      await expect(page.locator(tableRowLocator)).toHaveCount(1)
    })

    test('should accept where query from complex, valid URL where parameter using the within operator', async () => {
      type Point = [number, number]
      const polygon: Point[] = [
        [3.5, -3.5], // bottom-left
        [3.5, -6.5], // top-left
        [6.5, -6.5], // top-right
        [6.5, -3.5], // bottom-right
        [3.5, -3.5], // back to starting point to close the polygon
      ]

      const whereQueryJSON = {
        point: {
          within: {
            type: 'Polygon',
            coordinates: [polygon],
          },
        },
      }

      const whereQuery = qs.stringify(
        {
          ...{ where: whereQueryJSON },
        },
        {
          addQueryPrefix: false,
        },
      )

      // We have one point collection with the point [5,-5] and one with [7,-7]. This where query should kick out the [7,-7] point, as it's not within the polygon
      await page.goto(`${new AdminUrlUtil(serverURL, 'geo').list}?limit=10&page=1&${whereQuery}`)

      await expect(page.getByPlaceholder('Enter a value')).toHaveValue('[object Object]')
      await expect(page.locator(tableRowLocator)).toHaveCount(1)
    })

    test('should reset page when filters are applied', async () => {
      await deleteAllPosts()

      await Promise.all(
        Array.from({ length: 6 }, async (_, i) => {
          if (i < 3) {
            await createPost()
          } else {
            await createPost({ title: 'test' })
          }
        }),
      )

      await page.reload()

      const tableItems = page.locator(tableRowLocator)

      await expect(tableItems).toHaveCount(5)
      await expect(page.locator('.collection-list__page-info')).toHaveText('1-5 of 6')
      await expect(page.locator('.per-page')).toContainText('Per Page: 5')
      await page.goto(`${postsUrl.list}?limit=5&page=2`)
      await openListFilters(page, {})
      await page.locator('.where-builder__add-first-filter').click()
      await page.locator('.condition__field .rs__control').click()
      const options = page.locator('.rs__option')
      await options.locator('text=Tab 1 > Title').click()
      await page.locator('.condition__operator .rs__control').click()
      await options.locator('text=equals').click()
      await page.locator('.condition__value input').fill('test')
      await page.waitForURL(new RegExp(`${postsUrl.list}\\?limit=5&page=1`))
      await expect(page.locator('.collection-list__page-info')).toHaveText('1-3 of 3')
    })

    test('should reset filter values for every additional filters', async () => {
      await page.goto(postsUrl.list)
      await openListFilters(page, {})
      await page.locator('.where-builder__add-first-filter').click()
      const firstConditionField = page.locator('.condition__field')
      const firstOperatorField = page.locator('.condition__operator')
      const firstValueField = page.locator('.condition__value >> input')

      await firstConditionField.click()
      await firstConditionField
        .locator('.rs__option', {
          hasText: exactText('Tab 1 > Title'),
        })
        .click()

      await expect(firstConditionField.locator('.rs__single-value')).toContainText('Tab 1 > Title')
      await firstOperatorField.click()
      await firstOperatorField.locator('.rs__option').locator('text=equals').click()
      await firstValueField.fill('Test')
      await expect(firstValueField).toHaveValue('Test')
      await page.locator('.condition__actions-add').click()
      const secondLi = page.locator('.where-builder__and-filters li:nth-child(2)')
      await expect(secondLi).toBeVisible()

      await expect(
        secondLi.locator('.condition__field').locator('.rs__single-value'),
      ).toContainText('Tab 1 > Title')

      await expect(secondLi.locator('.condition__operator >> input')).toHaveValue('')
      await expect(secondLi.locator('.condition__value >> input')).toHaveValue('')
    })

    test('should not re-render page upon typing in a value in the filter value field', async () => {
      await page.goto(postsUrl.list)
      await openListFilters(page, {})
      await page.locator('.where-builder__add-first-filter').click()
      const firstConditionField = page.locator('.condition__field')
      const firstOperatorField = page.locator('.condition__operator')
      const firstValueField = page.locator('.condition__value >> input')

      await firstConditionField.click()
      await firstConditionField
        .locator('.rs__option', { hasText: exactText('Tab 1 > Title') })
        .click()
      await expect(firstConditionField.locator('.rs__single-value')).toContainText('Tab 1 > Title')

      await firstOperatorField.click()
      await firstOperatorField.locator('.rs__option').locator('text=equals').click()

      // Type into the input field instead of filling it
      await firstValueField.click()
      await firstValueField.type('Test', { delay: 100 }) // Add a delay to simulate typing speed

      // Wait for a short period to see if the input loses focus
      await page.waitForTimeout(500)

      // Check if the input still has the correct value
      await expect(firstValueField).toHaveValue('Test')
    })

    test('should still show second filter if two filters exist and first filter is removed', async () => {
      await page.goto(postsUrl.list)
      await openListFilters(page, {})
      await page.locator('.where-builder__add-first-filter').click()
      const firstConditionField = page.locator('.condition__field')
      const firstOperatorField = page.locator('.condition__operator')
      const firstValueField = page.locator('.condition__value >> input')
      await firstConditionField.click()
      await firstConditionField
        .locator('.rs__option', { hasText: exactText('Tab 1 > Title') })
        .click()
      await expect(firstConditionField.locator('.rs__single-value')).toContainText('Tab 1 > Title')
      await firstOperatorField.click()
      await firstOperatorField.locator('.rs__option').locator('text=equals').click()
      await firstValueField.fill('Test 1')
      await expect(firstValueField).toHaveValue('Test 1')

      await wait(500)

      await page.locator('.condition__actions-add').click()

      const secondLi = page.locator('.where-builder__and-filters li:nth-child(2)')
      await expect(secondLi).toBeVisible()
      const secondConditionField = secondLi.locator('.condition__field')
      const secondOperatorField = secondLi.locator('.condition__operator')
      const secondValueField = secondLi.locator('.condition__value >> input')
      await secondConditionField.click()

      await secondConditionField
        .locator('.rs__option', { hasText: exactText('Tab 1 > Title') })
        .click()

      await expect(secondConditionField.locator('.rs__single-value')).toContainText('Tab 1 > Title')
      await secondOperatorField.click()
      await secondOperatorField.locator('.rs__option').locator('text=equals').click()
      await secondValueField.fill('Test 2')
      await expect(secondValueField).toHaveValue('Test 2')

      const firstLi = page.locator('.where-builder__and-filters li:nth-child(1)')
      const removeButton = firstLi.locator('.condition__actions-remove')

      await wait(500)

      // remove first filter
      await removeButton.click()
      const filterListItems = page.locator('.where-builder__and-filters li')
      await expect(filterListItems).toHaveCount(1)
      await expect(firstValueField).toHaveValue('Test 2')
    })

    test('should hide field filter when admin.disableListFilter is true', async () => {
      await page.goto(postsUrl.list)
      await openListFilters(page, {})
      await page.locator('.where-builder__add-first-filter').click()

      const initialField = page.locator('.condition__field')
      await initialField.click()

      await expect(
        initialField.locator(`.rs__option :has-text("Disable List Filter Text")`),
      ).toBeHidden()
    })

    test('should simply disable field filter when admin.disableListFilter is true but still exists in the query', async () => {
      await page.goto(
        `${postsUrl.list}${qs.stringify(
          {
            where: {
              or: [
                {
                  and: [
                    {
                      disableListFilterText: {
                        equals: 'Disable List Filter Text',
                      },
                    },
                  ],
                },
              ],
            },
          },
          { addQueryPrefix: true },
        )}`,
      )

      console.log('URL', page.url())

      await openListFilters(page, {})

      const condition = page.locator('.condition__field')
      await expect(condition.locator('input.rs__input')).toBeDisabled()
      await expect(page.locator('.condition__operator input.rs__input')).toBeDisabled()
      await expect(page.locator('.condition__value input.condition-value-text')).toBeDisabled()
      await expect(condition.locator('.rs__single-value')).toHaveText('Disable List Filter Text')
      await page.locator('button.condition__actions-add').click()
      const condition2 = page.locator('.condition__field').nth(1)
      await condition2.click()
      await expect(
        condition2?.locator('.rs__menu-list:has-text("Disable List Filter Text")'),
      ).toBeHidden()
    })
  })

  describe('table columns', () => {
    test('should hide field column when field.hidden is true', async () => {
      await page.goto(postsUrl.list)
      await page.locator('.list-controls__toggle-columns').click()

      await expect(page.locator('.column-selector')).toBeVisible()

      await expect(
        page.locator(`.column-selector .column-selector__column`, {
          hasText: exactText('Hidden Field'),
        }),
      ).toBeHidden()
    })

    test('should show field column despite admin.hidden being true', async () => {
      await page.goto(postsUrl.list)
      await page.locator('.list-controls__toggle-columns').click()

      await expect(page.locator('.column-selector')).toBeVisible()

      await expect(
        page.locator(`.column-selector .column-selector__column`, {
          hasText: exactText('Admin Hidden Field'),
        }),
      ).toBeVisible()
    })

    test('should hide field in column selector when admin.disableListColumn is true', async () => {
      await page.goto(postsUrl.list)
      await page.locator('.list-controls__toggle-columns').click()

      await expect(page.locator('.column-selector')).toBeVisible()

      // Check if "Disable List Column Text" is not present in the column options
      await expect(
        page.locator(`.column-selector .column-selector__column`, {
          hasText: exactText('Disable List Column Text'),
        }),
      ).toBeHidden()
    })

    test('should display field in column selector despite admin.disableListFilter', async () => {
      await page.goto(postsUrl.list)
      await page.locator('.list-controls__toggle-columns').click()

      await expect(page.locator('.column-selector')).toBeVisible()

      // Check if "Disable List Filter Text" is present in the column options
      await expect(
        page.locator(`.column-selector .column-selector__column`, {
          hasText: exactText('Disable List Filter Text'),
        }),
      ).toBeVisible()
    })

    test('should still show field in filter when admin.disableListColumn is true', async () => {
      await page.goto(postsUrl.list)
      await openListFilters(page, {})
      await page.locator('.where-builder__add-first-filter').click()

      const initialField = page.locator('.condition__field')
      await initialField.click()

      await expect(
        initialField.locator(`.rs__menu-list:has-text("Disable List Column Text")`),
      ).toBeVisible()
    })

    test('should toggle columns', async () => {
      const columnCountLocator = 'table > thead > tr > th'
      await createPost()
      await openListColumns(page, {})
      const numberOfColumns = await page.locator(columnCountLocator).count()
      await expect(page.locator('.column-selector')).toBeVisible()
      await expect(page.locator('table > thead > tr > th:nth-child(2)')).toHaveText('ID')
      await toggleColumn(page, { columnLabel: 'ID', targetState: 'off' })
      await page.locator('#heading-id').waitFor({ state: 'detached' })
      await page.locator('.cell-id').first().waitFor({ state: 'detached' })
      await expect(page.locator(columnCountLocator)).toHaveCount(numberOfColumns - 1)
      await expect(page.locator('table > thead > tr > th:nth-child(2)')).toHaveText('Number')
      await toggleColumn(page, { columnLabel: 'ID', targetState: 'on' })
      await expect(page.locator('.cell-id').first()).toBeVisible()
      await expect(page.locator(columnCountLocator)).toHaveCount(numberOfColumns)
      await expect(page.locator('table > thead > tr > th:nth-child(2)')).toHaveText('ID')
    })

    test('should drag to reorder columns and save to preferences', async () => {
      await createPost()

      await reorderColumns(page, { fromColumn: 'Number', toColumn: 'ID' })

      // reload to ensure the preferred order was stored in the database
      await page.reload()
      await expect(
        page.locator('.list-controls .column-selector .column-selector__column').first(),
      ).toHaveText('Number')
      await expect(page.locator('table thead tr th').nth(1)).toHaveText('Number')
    })

    test('should render drawer columns in order', async () => {
      // Re-order columns like done in the previous test
      await createPost()
      await reorderColumns(page, { fromColumn: 'Number', toColumn: 'ID' })

      await page.reload()

      await createPost()
      await page.goto(postsUrl.create)

      await openDocDrawer(page, '.rich-text .list-drawer__toggler')

      const listDrawer = page.locator('[id^=list-drawer_1_]')
      await expect(listDrawer).toBeVisible()

      const collectionSelector = page.locator(
        '[id^=list-drawer_1_] .list-header__select-collection.react-select',
      )

      // select the "Post" collection
      await collectionSelector.click()
      await page
        .locator('[id^=list-drawer_1_] .list-header__select-collection.react-select .rs__option', {
          hasText: exactText('Post'),
        })
        .click()

      // open the column controls
      const columnSelector = page.locator('[id^=list-drawer_1_] .list-controls__toggle-columns')
      await columnSelector.click()
      // wait until the column toggle UI is visible and fully expanded
      await expect(page.locator('.list-controls__columns.rah-static--height-auto')).toBeVisible()

      // ensure that the columns are in the correct order
      await expect(
        page
          .locator('[id^=list-drawer_1_] .list-controls .column-selector .column-selector__column')
          .first(),
      ).toHaveText('Number')
    })

    test('should retain preferences when changing drawer collections', async () => {
      await page.goto(postsUrl.create)

      // Open the drawer
      await openDocDrawer(page, '.rich-text .list-drawer__toggler')
      const listDrawer = page.locator('[id^=list-drawer_1_]')
      await expect(listDrawer).toBeVisible()

      const collectionSelector = page.locator(
        '[id^=list-drawer_1_] .list-header__select-collection.react-select',
      )
      const columnSelector = page.locator('[id^=list-drawer_1_] .list-controls__toggle-columns')

      // open the column controls
      await columnSelector.click()
      // wait until the column toggle UI is visible and fully expanded
      await expect(page.locator('.list-controls__columns.rah-static--height-auto')).toBeVisible()

      // deselect the "id" column
      await page
        .locator('[id^=list-drawer_1_] .list-controls .column-selector .column-selector__column', {
          hasText: exactText('ID'),
        })
        .click()

      // select the "Post" collection
      await collectionSelector.click()
      await page
        .locator('[id^=list-drawer_1_] .list-header__select-collection.react-select .rs__option', {
          hasText: exactText('Post'),
        })
        .click()

      // deselect the "number" column
      await page
        .locator('[id^=list-drawer_1_] .list-controls .column-selector .column-selector__column', {
          hasText: exactText('Number'),
        })
        .click()

      // select the "User" collection again
      await collectionSelector.click()
      await page
        .locator('[id^=list-drawer_1_] .list-header__select-collection.react-select .rs__option', {
          hasText: exactText('User'),
        })
        .click()

      // ensure that the "id" column is still deselected
      await expect(
        page
          .locator('[id^=list-drawer_1_] .list-controls .column-selector .column-selector__column')
          .first(),
      ).not.toHaveClass('column-selector__column--active')

      // select the "Post" collection again
      await collectionSelector.click()

      await page
        .locator('[id^=list-drawer_1_] .list-header__select-collection.react-select .rs__option', {
          hasText: exactText('Post'),
        })
        .click()

      // ensure that the "number" column is still deselected
      await expect(
        page
          .locator('[id^=list-drawer_1_] .list-controls .column-selector .column-selector__column')
          .first(),
      ).not.toHaveClass('column-selector__column--active')
    })

    test('should render custom table cell component', async () => {
      await createPost()
      await page.goto(postsUrl.list)
      await expect(
        page.locator('table > thead > tr > th', {
          hasText: exactText('Demo UI Field'),
        }),
      ).toBeVisible()
    })
  })

  describe('multi-select', () => {
    beforeEach(async () => {
      // delete all posts created by the seed
      await deleteAllPosts()

      await createPost()
      await createPost()
      await createPost()
    })

    test('should select multiple rows', async () => {
      await page.reload()
      const selectAll = page.locator('.checkbox-input:has(#select-all)')
      await page.locator('.row-1 .cell-_select input').check()

      const indeterminateSelectAll = selectAll.locator('.checkbox-input__icon.partial')
      expect(indeterminateSelectAll).toBeDefined()

      await selectAll.locator('input').click()
      const emptySelectAll = selectAll.locator('.checkbox-input__icon:not(.check):not(.partial)')
      await expect(emptySelectAll).toHaveCount(0)

      await selectAll.locator('input').click()
      const checkSelectAll = selectAll.locator('.checkbox-input__icon.check')
      expect(checkSelectAll).toBeDefined()
    })

    test('should delete many', async () => {
      await page.goto(postsUrl.list)
      await page.waitForURL(new RegExp(postsUrl.list))
      // delete should not appear without selection
      await expect(page.locator('#confirm-delete')).toHaveCount(0)
      // select one row
      await page.locator('.row-1 .cell-_select input').check()

      // delete button should be present
      await expect(page.locator('#confirm-delete')).toHaveCount(1)

      await page.locator('.row-2 .cell-_select input').check()

      await page.locator('.delete-documents__toggle').click()
      await page.locator('#confirm-delete').click()
      await expect(page.locator('.cell-_select')).toHaveCount(1)
    })
  })

  describe('pagination', () => {
    test('should use custom admin.pagination.defaultLimit', async () => {
      await deleteAllPosts()

      await mapAsync([...Array(6)], async () => {
        await createPost()
      })

      await page.goto(postsUrl.list)
      await expect(page.locator('.per-page .per-page__base-button')).toContainText('Per Page: 5')
      await expect(page.locator(tableRowLocator)).toHaveCount(5)
    })

    test('should use custom admin.pagination.limits', async () => {
      await deleteAllPosts()

      await mapAsync([...Array(6)], async () => {
        await createPost()
      })

      await page.goto(postsUrl.list)
      await page.locator('.per-page .popup-button').click()
      await page.locator('.per-page .popup-button').click()
      const options = await page.locator('.per-page button.per-page__button')
      await expect(options).toHaveCount(3)
      await expect(options.nth(0)).toContainText('5')
      await expect(options.nth(1)).toContainText('10')
      await expect(options.nth(2)).toContainText('15')
    })

    test('should paginate', async () => {
      await deleteAllPosts()

      await mapAsync([...Array(6)], async () => {
        await createPost()
      })

      await page.reload()
      await expect(page.locator(tableRowLocator)).toHaveCount(5)
      await expect(page.locator('.collection-list__page-info')).toHaveText('1-5 of 6')
      await expect(page.locator('.per-page')).toContainText('Per Page: 5')
      await page.locator('.paginator button').nth(1).click()
      await expect.poll(() => page.url(), { timeout: POLL_TOPASS_TIMEOUT }).toContain('page=2')
      await expect(page.locator(tableRowLocator)).toHaveCount(1)
      await page.locator('.paginator button').nth(0).click()
      await expect.poll(() => page.url(), { timeout: POLL_TOPASS_TIMEOUT }).toContain('page=1')
      await expect(page.locator(tableRowLocator)).toHaveCount(5)
    })

    test('should paginate without resetting selected limit', async () => {
      await deleteAllPosts()

      await mapAsync([...Array(16)], async () => {
        await createPost()
      })

      await page.reload()
      const tableItems = page.locator(tableRowLocator)
      await expect(tableItems).toHaveCount(5)
      await expect(page.locator('.collection-list__page-info')).toHaveText('1-5 of 16')
      await expect(page.locator('.per-page')).toContainText('Per Page: 5')
      await page.locator('.per-page .popup-button').click()

      await page
        .locator('.per-page button.per-page__button', {
          hasText: '15',
        })
        .click()

      await expect(tableItems).toHaveCount(15)
      await expect(page.locator('.per-page .per-page__base-button')).toContainText('Per Page: 15')
      await page.locator('.paginator button').nth(1).click()
      await expect.poll(() => page.url(), { timeout: POLL_TOPASS_TIMEOUT }).toContain('page=2')
      await expect(tableItems).toHaveCount(1)
      await expect(page.locator('.per-page')).toContainText('Per Page: 15') // ensure this hasn't changed
      await expect(page.locator('.collection-list__page-info')).toHaveText('16-16 of 16')
    })
  })

  // TODO: Troubleshoot flaky suite
  describe('sorting', () => {
    beforeEach(async () => {
      // delete all posts created by the seed
      await deleteAllPosts()
      await createPost({ number: 1 })
      await createPost({ number: 2 })
    })

    test('should sort', async () => {
      await page.reload()
      const upChevron = page.locator('#heading-number .sort-column__asc')
      const downChevron = page.locator('#heading-number .sort-column__desc')

      await upChevron.click()
      await page.waitForURL(/sort=number/)

      await expect(page.locator('.row-1 .cell-number')).toHaveText('1')
      await expect(page.locator('.row-2 .cell-number')).toHaveText('2')

      await downChevron.click()
      await page.waitForURL(/sort=-number/)

      await expect(page.locator('.row-1 .cell-number')).toHaveText('2')
      await expect(page.locator('.row-2 .cell-number')).toHaveText('1')
    })

    test('should sort with existing filters', async () => {
      await page.goto(postsUrl.list)
      await toggleColumn(page, { columnLabel: 'ID', targetState: 'off' })
      await page.locator('#heading-id').waitFor({ state: 'detached' })
      await page.locator('#heading-title button.sort-column__asc').click()
      await page.waitForURL(/sort=title/)

      const columnAfterSort = page.locator(
        `.list-controls__columns .column-selector .column-selector__column`,
        {
          hasText: exactText('ID'),
        },
      )

      await expect(columnAfterSort).not.toHaveClass('column-selector__column--active')
      await expect(page.locator('#heading-id')).toBeHidden()
      await expect(page.locator('.cell-id')).toHaveCount(0)
    })
  })

  describe('i18n', () => {
    test('should display translated collections and globals config options', async () => {
      await page.goto(postsUrl.list)
      await expect(page.locator('#nav-posts')).toContainText('Posts')
      await expect(page.locator('#nav-global-global')).toContainText('Global')
    })

    test('should display translated field titles', async () => {
      await createPost()

      // column controls
      await page.locator('.list-controls__toggle-columns').click()
      await expect(
        page.locator('.column-selector__column', {
          hasText: exactText('Title'),
        }),
      ).toHaveText('Title')

      // filters
      await openListFilters(page, {})
      await page.locator('.where-builder__add-first-filter').click()
      await page.locator('.condition__field .rs__control').click()
      const options = page.locator('.rs__option')

      await expect(options.locator('text=Tab 1 > Title')).toHaveText('Tab 1 > Title')

      // list columns
      await expect(page.locator('#heading-title .sort-column__label')).toHaveText('Title')
      await expect(page.locator('.search-filter input')).toHaveAttribute('placeholder', /(Title)/)
    })

    test('should use fallback language on field titles', async () => {
      // change language German
      await page.goto(postsUrl.account)
      await page.locator('.payload-settings__language .react-select').click()
      const languageSelect = page.locator('.rs__option')
      // text field does not have a 'de' label
      await languageSelect.locator('text=Deutsch').click()

      await page.goto(postsUrl.list)
      await page.locator('.list-controls__toggle-columns').click()
      // expecting the label to fall back to english as default fallbackLng
      await expect(
        page.locator('.column-selector__column', {
          hasText: exactText('Title'),
        }),
      ).toHaveText('Title')
    })
  })
})

async function createPost(overrides?: Partial<Post>): Promise<Post> {
  return payload.create({
    collection: postsCollectionSlug,
    data: {
      description,
      title,
      ...overrides,
    },
  }) as unknown as Promise<Post>
}

async function deleteAllPosts() {
  await payload.delete({ collection: postsCollectionSlug, where: { id: { exists: true } } })
}

async function createGeo(overrides?: Partial<Geo>): Promise<Geo> {
  return payload.create({
    collection: geoCollectionSlug,
    data: {
      point: [4, -4],
      ...overrides,
    },
  }) as unknown as Promise<Geo>
}
