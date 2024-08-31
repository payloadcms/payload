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
  openNav,
} from '../../../helpers.js'
import { AdminUrlUtil } from '../../../helpers/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../../../helpers/initPayloadE2ENoConfig.js'
import { customAdminRoutes } from '../../shared.js'
import { customViews1CollectionSlug, geoCollectionSlug, postsCollectionSlug } from '../../slugs.js'

const { beforeAll, beforeEach, describe } = test

const title = 'Title'
const description = 'Description'

let payload: PayloadTestSDK<Config>

import path from 'path'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../../../helpers/sdk/index.js'

import { reorderColumns } from '../../../helpers/e2e/reorderColumns.js'
import { reInitializeDB } from '../../../helpers/reInitializeDB.js'
import { POLL_TOPASS_TIMEOUT, TEST_TIMEOUT_LONG } from '../../../playwright.config.js'
const filename = fileURLToPath(import.meta.url)
const currentFolder = path.dirname(filename)
const dirname = path.resolve(currentFolder, '../../')

describe('admin2', () => {
  let page: Page
  let geoUrl: AdminUrlUtil
  let postsUrl: AdminUrlUtil
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
    customViewsUrl = new AdminUrlUtil(serverURL, customViews1CollectionSlug)

    const context = await browser.newContext()
    page = await context.newPage()
    initPageConsoleErrorCatch(page)
    await reInitializeDB({
      serverURL,
      snapshotKey: 'adminTests2',
    })

    await ensureCompilationIsDone({ customAdminRoutes, page, serverURL })

    adminRoutes = getRoutes({ customAdminRoutes })
  })
  beforeEach(async () => {
    await reInitializeDB({
      serverURL,
      snapshotKey: 'adminTests2',
    })

    await ensureCompilationIsDone({ customAdminRoutes, page, serverURL })
  })

  describe('custom CSS', () => {
    test('should see custom css in admin UI', async () => {
      await page.goto(postsUrl.admin)
      await page.waitForURL(postsUrl.admin)
      await openNav(page)
      const navControls = page.locator('#custom-css')
      await expect(navControls).toHaveCSS('font-family', 'monospace')
    })
  })

  describe('list view', () => {
    const tableRowLocator = 'table > tbody > tr'

    beforeEach(async () => {
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

    describe('filtering', () => {
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

      test('should toggle columns', async () => {
        const columnCountLocator = 'table > thead > tr > th'
        await createPost()

        await page.locator('.list-controls__toggle-columns').click()

        // track the number of columns before manipulating toggling any
        const numberOfColumns = await page.locator(columnCountLocator).count()

        // wait until the column toggle UI is visible and fully expanded
        await expect(page.locator('.column-selector')).toBeVisible()
        await expect(page.locator('table > thead > tr > th:nth-child(2)')).toHaveText('ID')

        const idButton = page.locator(`.column-selector .column-selector__column`, {
          hasText: exactText('ID'),
        })

        // Remove ID column
        await idButton.click()

        // wait until .cell-id is not present on the page:
        await page.locator('.cell-id').waitFor({ state: 'detached' })

        await expect(page.locator(columnCountLocator)).toHaveCount(numberOfColumns - 1)
        await expect(page.locator('table > thead > tr > th:nth-child(2)')).toHaveText('Number')

        // Add back ID column
        await idButton.click()
        await expect(page.locator('.cell-id').first()).toBeVisible()

        await expect(page.locator(columnCountLocator)).toHaveCount(numberOfColumns)
        await expect(page.locator('table > thead > tr > th:nth-child(2)')).toHaveText('ID')
      })

      test('should link second cell', async () => {
        const { id } = await createPost()
        await page.reload()
        const linkCell = page.locator(`${tableRowLocator} td`).nth(1).locator('a')
        await expect(linkCell).toHaveAttribute(
          'href',
          `${adminRoutes.routes.admin}/collections/posts/${id}`,
        )

        // open the column controls
        await page.locator('.list-controls__toggle-columns').click()
        // wait until the column toggle UI is visible and fully expanded
        await expect(page.locator('.list-controls__columns.rah-static--height-auto')).toBeVisible()

        // toggle off the ID column
        await page
          .locator('.column-selector .column-selector__column', {
            hasText: exactText('ID'),
          })
          .click()

        // wait until .cell-id is not present on the page:
        await page.locator('.cell-id').waitFor({ state: 'detached' })

        // recheck that the 2nd cell is still a link
        await expect(linkCell).toHaveAttribute(
          'href',
          `${adminRoutes.routes.admin}/collections/posts/${id}`,
        )
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

        await page.locator('.list-controls__toggle-where').click()
        // wait until the filter UI is visible and fully expanded
        await expect(page.locator('.list-controls__where.rah-static--height-auto')).toBeVisible()

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
        await page.locator('.list-controls__toggle-where').click()
        await page.waitForSelector('.list-controls__where.rah-static--height-auto')
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

        await page.goto(
          `${postsUrl.list}?limit=10&page=1&where[or][0][and][0][title][equals]=post1`,
        )

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
          `${
            new AdminUrlUtil(serverURL, 'geo').list
          }?limit=10&page=1&where[point][near]=6,-7,200000`,
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
        await mapAsync([...Array(6)], async () => {
          await createPost()
        })
        await page.reload()
        await mapAsync([...Array(6)], async () => {
          await createPost({ title: 'test' })
        })
        await page.reload()

        const pageInfo = page.locator('.collection-list__page-info')
        const perPage = page.locator('.per-page')
        const tableItems = page.locator(tableRowLocator)

        await expect(tableItems).toHaveCount(10)
        await expect(pageInfo).toHaveText('1-10 of 12')
        await expect(perPage).toContainText('Per Page: 10')

        // go to page 2
        await page.goto(`${postsUrl.list}?limit=10&page=2`)

        // add filter
        await page.locator('.list-controls__toggle-where').click()
        await page.locator('.where-builder__add-first-filter').click()
        await page.locator('.condition__field .rs__control').click()
        const options = page.locator('.rs__option')
        await options.locator('text=Tab 1 > Title').click()
        await page.locator('.condition__operator .rs__control').click()
        await options.locator('text=equals').click()
        await page.locator('.condition__value input').fill('test')

        // expect to be on page 1
        await expect(pageInfo).toHaveText('1-6 of 6')
      })
    })

    describe('table columns', () => {
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

        const listDrawer = page.locator('[id^=drawer_1_list-drawer]')
        await expect(listDrawer).toBeVisible()

        const collectionSelector = page.locator(
          '[id^=drawer_1_list-drawer] .list-drawer__select-collection.react-select',
        )

        // select the "Post" collection
        await collectionSelector.click()
        await page
          .locator(
            '[id^=drawer_1_list-drawer] .list-drawer__select-collection.react-select .rs__option',
            {
              hasText: exactText('Post'),
            },
          )
          .click()

        // open the column controls
        const columnSelector = page.locator(
          '[id^=drawer_1_list-drawer] .list-controls__toggle-columns',
        )
        await columnSelector.click()
        // wait until the column toggle UI is visible and fully expanded
        await expect(page.locator('.list-controls__columns.rah-static--height-auto')).toBeVisible()

        // ensure that the columns are in the correct order
        await expect(
          page
            .locator(
              '[id^=drawer_1_list-drawer] .list-controls .column-selector .column-selector__column',
            )
            .first(),
        ).toHaveText('Number')
      })

      test('should retain preferences when changing drawer collections', async () => {
        await page.goto(postsUrl.create)

        // Open the drawer
        await openDocDrawer(page, '.rich-text .list-drawer__toggler')
        const listDrawer = page.locator('[id^=drawer_1_list-drawer]')
        await expect(listDrawer).toBeVisible()

        const collectionSelector = page.locator(
          '[id^=drawer_1_list-drawer] .list-drawer__select-collection.react-select',
        )
        const columnSelector = page.locator(
          '[id^=drawer_1_list-drawer] .list-controls__toggle-columns',
        )

        // open the column controls
        await columnSelector.click()
        // wait until the column toggle UI is visible and fully expanded
        await expect(page.locator('.list-controls__columns.rah-static--height-auto')).toBeVisible()

        // deselect the "id" column
        await page
          .locator(
            '[id^=drawer_1_list-drawer] .list-controls .column-selector .column-selector__column',
            {
              hasText: exactText('ID'),
            },
          )
          .click()

        // select the "Post" collection
        await collectionSelector.click()
        await page
          .locator(
            '[id^=drawer_1_list-drawer] .list-drawer__select-collection.react-select .rs__option',
            {
              hasText: exactText('Post'),
            },
          )
          .click()

        // deselect the "number" column
        await page
          .locator(
            '[id^=drawer_1_list-drawer] .list-controls .column-selector .column-selector__column',
            {
              hasText: exactText('Number'),
            },
          )
          .click()

        // select the "User" collection again
        await collectionSelector.click()
        await page
          .locator(
            '[id^=drawer_1_list-drawer] .list-drawer__select-collection.react-select .rs__option',
            {
              hasText: exactText('User'),
            },
          )
          .click()

        // ensure that the "id" column is still deselected
        await expect(
          page
            .locator(
              '[id^=drawer_1_list-drawer] .list-controls .column-selector .column-selector__column',
            )
            .first(),
        ).not.toHaveClass('column-selector__column--active')

        // select the "Post" collection again
        await collectionSelector.click()

        await page
          .locator(
            '[id^=drawer_1_list-drawer] .list-drawer__select-collection.react-select .rs__option',
            {
              hasText: exactText('Post'),
            },
          )
          .click()

        // ensure that the "number" column is still deselected
        await expect(
          page
            .locator(
              '[id^=drawer_1_list-drawer] .list-controls .column-selector .column-selector__column',
            )
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
      test('should paginate', async () => {
        await deleteAllPosts()
        await mapAsync([...Array(11)], async () => {
          await createPost()
        })
        await page.reload()

        const pageInfo = page.locator('.collection-list__page-info')
        const perPage = page.locator('.per-page')
        const paginator = page.locator('.paginator')
        const tableItems = page.locator(tableRowLocator)

        await expect(tableItems).toHaveCount(10)
        await expect(pageInfo).toHaveText('1-10 of 11')
        await expect(perPage).toContainText('Per Page: 10')

        // Forward one page and back using numbers
        await paginator.locator('button').nth(1).click()
        await expect.poll(() => page.url(), { timeout: POLL_TOPASS_TIMEOUT }).toContain('page=2')
        await expect(tableItems).toHaveCount(1)
        await paginator.locator('button').nth(0).click()
        await expect.poll(() => page.url(), { timeout: POLL_TOPASS_TIMEOUT }).toContain('page=1')
        await expect(tableItems).toHaveCount(10)
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
        await page.locator('.list-controls__toggle-where').click()
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
