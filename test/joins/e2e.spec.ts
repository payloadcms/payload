import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import { reorderColumns } from 'helpers/e2e/reorderColumns.js'
import * as path from 'path'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../helpers/sdk/index.js'
import type { Config } from './payload-types.js'

import {
  changeLocale,
  ensureCompilationIsDone,
  exactText,
  initPageConsoleErrorCatch,
  saveDocAndAssert,
  throttleTest,
} from '../helpers.js'
import { AdminUrlUtil } from '../helpers/adminUrlUtil.js'
import { navigateToDoc } from '../helpers/e2e/navigateToDoc.js'
import { initPayloadE2ENoConfig } from '../helpers/initPayloadE2ENoConfig.js'
import { reInitializeDB } from '../helpers/reInitializeDB.js'
import { RESTClient } from '../helpers/rest.js'
import { EXPECT_TIMEOUT, TEST_TIMEOUT_LONG } from '../playwright.config.js'
import { categoriesJoinRestrictedSlug, categoriesSlug, postsSlug, uploadsSlug } from './shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

let payload: PayloadTestSDK<Config>
let serverURL: string
let client: RESTClient

const { beforeAll, beforeEach, describe } = test

describe('Join Field', () => {
  let page: Page
  let categoriesURL: AdminUrlUtil
  let foldersURL: AdminUrlUtil
  let uploadsURL: AdminUrlUtil
  let categoriesJoinRestrictedURL: AdminUrlUtil
  let categoryID: number | string
  let rootFolderID: number | string

  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    process.env.SEED_IN_CONFIG_ONINIT = 'false' // Makes it so the payload config onInit seed is not run. Otherwise, the seed would be run unnecessarily twice for the initial test run - once for beforeEach and once for onInit
    ;({ payload, serverURL } = await initPayloadE2ENoConfig<Config>({
      dirname,
    }))

    categoriesURL = new AdminUrlUtil(serverURL, categoriesSlug)
    uploadsURL = new AdminUrlUtil(serverURL, uploadsSlug)
    categoriesJoinRestrictedURL = new AdminUrlUtil(serverURL, categoriesJoinRestrictedSlug)
    foldersURL = new AdminUrlUtil(serverURL, 'folders')

    const context = await browser.newContext()
    page = await context.newPage()
    initPageConsoleErrorCatch(page)
    await ensureCompilationIsDone({ page, serverURL })

    //await throttleTest({ context, delay: 'Slow 4G', page })
  })

  beforeEach(async () => {
    await reInitializeDB({
      serverURL,
      snapshotKey: 'joinsTest',
      uploadsDir: [],
    })

    if (client) {
      await client.logout()
    }
    client = new RESTClient({ defaultSlug: postsSlug, serverURL })
    await client.login()

    const { docs } = await payload.find({
      collection: categoriesSlug,
      where: {
        name: {
          equals: 'example',
        },
      },
    })

    if (!docs[0]) {
      throw new Error('No category found with the name "example"')
    }

    ;({ id: categoryID } = docs[0])

    const folder = await payload.find({ collection: 'folders', sort: 'createdAt', depth: 0 })
    rootFolderID = folder.docs[0]!.id
  })

  test('should populate joined relationships in table cells of list view', async () => {
    await page.goto(categoriesURL.list)
    await expect
      .poll(
        async () =>
          await page
            .locator('tbody tr:first-child td.cell-relatedPosts', {
              hasText: exactText('Test Post 3, Test Post 2, Test Post 1'),
            })
            .isVisible(),
      )
      .toBeTruthy()
  })

  test('should render initial rows within relationship table', async () => {
    await navigateToDoc(page, categoriesURL)
    const joinField = page.locator('#field-relatedPosts.field-type.join')
    await expect(joinField).toBeVisible()
    await expect(joinField.locator('.relationship-table table')).toBeVisible()
    const rows = joinField.locator('.relationship-table tbody tr')
    await expect(rows).toHaveCount(3)
  })

  test('should apply defaultLimit and defaultSort on relationship table', async () => {
    const result = await payload.find({
      collection: categoriesSlug,
      limit: 1,
    })
    const category = result.docs[0]
    if (!category) {
      throw new Error('No category found')
    }
    // seed additional posts to test defaultLimit (5)
    await payload.create({
      collection: postsSlug,
      data: {
        title: 'a',
        category: category.id,
      },
    })
    await payload.create({
      collection: postsSlug,
      data: {
        title: 'b',
        category: category.id,
      },
    })
    await payload.create({
      collection: postsSlug,
      data: {
        title: 'z',
        category: category.id,
      },
    })
    await navigateToDoc(page, categoriesURL)
    const joinField = page.locator('#field-relatedPosts.field-type.join')
    await expect(joinField.locator('.row-1 > .cell-title')).toContainText('z')
    await expect(joinField.locator('.paginator > .clickable-arrow--right')).toBeVisible()
    const rows = joinField.locator('.relationship-table tbody tr')
    await expect(rows).toHaveCount(5)
  })

  test('should render join field for hidden posts', async () => {
    await navigateToDoc(page, categoriesURL)
    const joinField = page.locator('#field-hiddenPosts.field-type.join')
    await expect(joinField).toBeVisible()
    await expect(joinField.locator('.relationship-table table')).toBeVisible()
    const columns = joinField.locator('.relationship-table tbody tr')
    await expect(columns).toHaveCount(1)
    const button = joinField.locator('button.doc-drawer__toggler.relationship-table__add-new')
    await expect(button).toBeVisible()
    await button.click()
    const drawer = page.locator('[id^=doc-drawer_hidden-posts_1_]')
    await expect(drawer).toBeVisible()
    const titleField = drawer.locator('#field-title')
    await expect(titleField).toBeVisible()
    await titleField.fill('Test Hidden Post')
    await drawer.locator('button[id="action-save"]').click()
    await expect(joinField.locator('.relationship-table tbody tr.row-2')).toBeVisible()
  })

  test('should render the create page and create doc with the join field', async () => {
    await page.goto(categoriesURL.create)
    const nameField = page.locator('#field-name')
    await expect(nameField).toBeVisible()

    // assert that the join field is visible and is not stuck in a loading state
    await expect(page.locator('#field-relatedPosts')).toContainText('No Posts found.')
    await expect(page.locator('#field-relatedPosts')).not.toContainText('loading')

    // assert that the create new button is not visible
    await expect(page.locator('#field-relatedPosts > .relationship-table__add-new')).toBeHidden()

    // assert that the admin.description is visible
    await expect(page.locator('.field-description-hasManyPosts')).toHaveText('Static Description')

    //assert that the admin.components.Description is visible
    await expect(page.locator('.field-description-relatedPosts')).toHaveText(
      'Component description: relatedPosts',
    )

    await nameField.fill('test category')
    await saveDocAndAssert(page)
  })

  test('should render collection type in first column of relationship table', async () => {
    await page.goto(categoriesURL.edit(categoryID))
    const joinField = page.locator('#field-relatedPosts.field-type.join')
    await expect(joinField).toBeVisible()
    const text = joinField.locator('thead tr th#heading-collection:first-child')
    await expect(text).toHaveText('Type')
    const cells = joinField.locator('.relationship-table tbody tr td:first-child .pill__label')

    const count = await cells.count()

    for (let i = 0; i < count; i++) {
      const element = cells.nth(i)
      // Perform actions on each element
      await expect(element).toBeVisible()
      await expect(element).toHaveText('Post')
    }
  })

  test('should render drawer toggler without document link in second column of relationship table', async () => {
    await page.goto(categoriesURL.edit(categoryID))
    const joinField = page.locator('#field-relatedPosts.field-type.join')
    await expect(joinField).toBeVisible()
    const actionColumn = joinField.locator('tbody tr td:nth-child(2)').first()
    const toggler = actionColumn.locator('button.doc-drawer__toggler')
    await expect(toggler).toBeVisible()
    const link = actionColumn.locator('a')
    await expect(link).toBeHidden()

    await reorderColumns(page, {
      togglerSelector: '.relationship-table__toggle-columns',
      columnContainerSelector: '.relationship-table__columns',
      fromColumn: 'Category',
      toColumn: 'Title',
    })

    const newActionColumn = joinField.locator('tbody tr td:nth-child(2)').first()
    const newToggler = newActionColumn.locator('button.doc-drawer__toggler')
    await expect(newToggler).toBeVisible()
    const newLink = newActionColumn.locator('a')
    await expect(newLink).toBeHidden()

    // put columns back in original order for the next test
    await reorderColumns(page, {
      togglerSelector: '.relationship-table__toggle-columns',
      columnContainerSelector: '.relationship-table__columns',
      fromColumn: 'Title',
      toColumn: 'Category',
    })
  })

  test('should sort relationship table by clicking on column headers', async () => {
    await page.goto(categoriesURL.edit(categoryID))
    const joinField = page.locator('#field-group__relatedPosts.field-type.join')
    await expect(joinField).toBeVisible()
    const titleColumn = joinField.locator('thead tr th#heading-title')
    const titleAscButton = titleColumn.locator('button.sort-column__asc')
    await expect(titleAscButton).toBeVisible()
    await titleAscButton.click()
    await expect(joinField.locator('tbody .row-1')).toContainText('Test Post 1')

    const titleDescButton = titleColumn.locator('button.sort-column__desc')
    await expect(titleDescButton).toBeVisible()
    await titleDescButton.click()
    await expect(joinField.locator('tbody .row-1')).toContainText('Test Post 3')
  })

  test('should display relationship table with columns from admin.defaultColumns', async () => {
    await page.goto(categoriesURL.edit(categoryID))
    const joinField = page.locator('#field-group__relatedPosts.field-type.join')
    const thead = joinField.locator('.relationship-table thead')
    await expect(thead).toContainText('ID')
    await expect(thead).toContainText('Created At')
    await expect(thead).toContainText('Title')
    const innerText = await thead.innerText()

    // expect the order of columns to be 'ID', 'Created At', 'Title'
    // eslint-disable-next-line payload/no-flaky-assertions
    expect(innerText.indexOf('ID')).toBeLessThan(innerText.indexOf('Created At'))
    // eslint-disable-next-line payload/no-flaky-assertions
    expect(innerText.indexOf('Created At')).toBeLessThan(innerText.indexOf('Title'))
  })

  test('should update relationship table when new document is created', async () => {
    await page.goto(categoriesURL.edit(categoryID))
    const joinField = page.locator('#field-relatedPosts.field-type.join')
    await expect(joinField).toBeVisible()

    await expect(joinField.locator('tbody tr')).toHaveCount(3)

    const addButton = joinField.locator('.relationship-table__actions button.doc-drawer__toggler', {
      hasText: exactText('Add new'),
    })

    await expect(addButton).toBeVisible()

    await addButton.click()
    const drawer = page.locator('[id^=doc-drawer_posts_1_]')
    await expect(drawer).toBeVisible()

    const categoryField = drawer.locator('#field-category')
    await expect(categoryField).toBeVisible({ timeout: EXPECT_TIMEOUT * 5 })
    const categoryValue = categoryField.locator('.relationship--single-value__text')
    await expect(categoryValue).toHaveText('example')
    const titleField = drawer.locator('#field-title')
    await expect(titleField).toBeVisible()
    await titleField.fill('Test Post 4')
    await drawer.locator('button[id="action-save"]').click()
    await expect(drawer).toBeHidden()
    await expect(
      joinField.locator('tbody tr td:nth-child(2)', {
        hasText: exactText('Test Post 4'),
      }),
    ).toBeVisible()
  })

  test('should update relationship table when document is updated', async () => {
    await page.goto(categoriesURL.edit(categoryID))
    const joinField = page.locator('#field-group__relatedPosts.field-type.join')
    await expect(joinField).toBeVisible()
    const editButton = joinField.locator(
      'tbody tr:first-child td:nth-child(2) button.doc-drawer__toggler',
    )
    await expect(editButton).toBeVisible()
    await editButton.click()
    const drawer = page.locator('[id^=doc-drawer_posts_1_]')
    await expect(drawer).toBeVisible()
    const titleField = drawer.locator('#field-title')
    await expect(titleField).toBeVisible()
    await titleField.fill('Test Post 1 Updated')
    await drawer.locator('button[id="action-save"]').click()
    await expect(drawer).toBeHidden()
    await expect(joinField.locator('tbody .row-1')).toContainText('Test Post 1 Updated')
  })

  test('should update relationship table when document is deleted', async () => {
    await page.goto(categoriesURL.edit(categoryID))
    const joinField = page.locator('#field-group__relatedPosts.field-type.join')
    await expect(joinField).toBeVisible()

    const expectedRows = 3
    const rows = joinField.locator('.relationship-table tbody tr')
    await expect(rows).toHaveCount(expectedRows)

    const editButton = joinField.locator(
      'tbody tr:first-child td:nth-child(2) button.doc-drawer__toggler',
    )
    await expect(editButton).toBeVisible()
    await editButton.click()
    const drawer = page.locator('[id^=doc-drawer_posts_1_]')
    await expect(drawer).toBeVisible()
    const popupButton = drawer.locator('button.popup-button')
    await expect(popupButton).toBeVisible()
    await popupButton.click()
    const deleteButton = drawer.locator('#action-delete')
    await expect(deleteButton).toBeVisible()
    await deleteButton.click()
    const deleteConfirmModal = page.locator('dialog[id^="delete-"][open]')
    await expect(deleteConfirmModal).toBeVisible()
    const confirmDeleteButton = deleteConfirmModal.locator('button#confirm-action')
    await expect(confirmDeleteButton).toBeVisible()
    await confirmDeleteButton.click()
    await expect(drawer).toBeHidden()

    // We should have one less row than we started with
    await expect(rows).toHaveCount(expectedRows - 1)
  })

  test('should create join collection from polymorphic relationships', async () => {
    await page.goto(categoriesURL.edit(categoryID))
    const joinField = page.locator('#field-polymorphic.field-type.join')
    await expect(joinField).toBeVisible()
    await joinField.locator('.relationship-table__add-new').click()
    const drawer = page.locator('[id^=doc-drawer_posts_1_]')
    await expect(drawer).toBeVisible()
    const titleField = drawer.locator('#field-title')
    await expect(titleField).toBeVisible()
    await titleField.fill('Test polymorphic Post')
    await expect(drawer.locator('#field-polymorphic')).toContainText('example')
    await drawer.locator('button[id="action-save"]').click()
    await expect(drawer).toBeHidden()
    await expect(joinField.locator('tbody .row-1')).toContainText('Test polymorphic Post')
  })
  test('should create join collection from polymorphic, hasMany relationships', async () => {
    await page.goto(categoriesURL.edit(categoryID))
    const joinField = page.locator('#field-polymorphics.field-type.join')
    await expect(joinField).toBeVisible()
    await joinField.locator('.relationship-table__add-new').click()
    const drawer = page.locator('[id^=doc-drawer_posts_1_]')
    await expect(drawer).toBeVisible()
    const titleField = drawer.locator('#field-title')
    await expect(titleField).toBeVisible()
    await titleField.fill('Test polymorphic Post')
    await expect(drawer.locator('#field-polymorphics')).toContainText('example')
    await drawer.locator('button[id="action-save"]').click()
    await expect(drawer).toBeHidden()
    await expect(joinField.locator('tbody .row-1')).toContainText('Test polymorphic Post')
  })
  test('should create join collection from polymorphic localized relationships', async () => {
    await page.goto(categoriesURL.edit(categoryID))
    const joinField = page.locator('#field-localizedPolymorphic.field-type.join')
    await expect(joinField).toBeVisible()
    await joinField.locator('.relationship-table__add-new').click()
    const drawer = page.locator('[id^=doc-drawer_posts_1_]')
    await expect(drawer).toBeVisible()
    const titleField = drawer.locator('#field-title')
    await expect(titleField).toBeVisible()
    await titleField.fill('Test polymorphic Post')
    await expect(drawer.locator('#field-localizedPolymorphic')).toContainText('example')
    await drawer.locator('button[id="action-save"]').click()
    await expect(drawer).toBeHidden()
    await expect(joinField.locator('tbody .row-1')).toContainText('Test polymorphic Post')
  })
  test('should create join collection from polymorphic, hasMany, localized relationships', async () => {
    await page.goto(categoriesURL.edit(categoryID))
    const joinField = page.locator('#field-localizedPolymorphics.field-type.join')
    await expect(joinField).toBeVisible()
    await joinField.locator('.relationship-table__add-new').click()
    const drawer = page.locator('[id^=doc-drawer_posts_1_]')
    await expect(drawer).toBeVisible()
    const titleField = drawer.locator('#field-title')
    await expect(titleField).toBeVisible()
    await titleField.fill('Test polymorphic Post')
    await expect(drawer.locator('#field-localizedPolymorphics')).toContainText('example')
    await drawer.locator('button[id="action-save"]').click()
    await expect(drawer).toBeHidden()
    await expect(joinField.locator('tbody .row-1')).toContainText('Test polymorphic Post')
  })

  test('should render empty relationship table when creating new document', async () => {
    await page.goto(categoriesURL.create)
    const joinField = page.locator('#field-relatedPosts.field-type.join')
    await expect(joinField).toBeVisible()
    await expect(joinField.locator('.relationship-table tbody tr')).toBeHidden()
  })

  test('should update relationship table when new upload is created', async () => {
    await navigateToDoc(page, uploadsURL)
    const joinField = page.locator('#field-relatedPosts.field-type.join')
    await expect(joinField).toBeVisible()

    // TODO: change this to edit the first row in the join table
    const addButton = joinField.locator('.relationship-table__actions button.doc-drawer__toggler', {
      hasText: exactText('Add new'),
    })

    await expect(addButton).toBeVisible()

    await addButton.click()
    const drawer = page.locator('[id^=doc-drawer_posts_1_]')
    await expect(drawer).toBeVisible()
    const uploadField = drawer.locator('#field-upload')
    await expect(uploadField).toBeVisible()
    const uploadValue = uploadField.locator('.upload-relationship-details img')
    await expect(uploadValue).toBeVisible()
    const titleField = drawer.locator('#field-title')
    await expect(titleField).toBeVisible()
    await titleField.fill('Edited title for upload')
    await drawer.locator('button[id="action-save"]').click()
    await expect(drawer).toBeHidden()
    await expect(
      joinField.locator('tbody tr td:nth-child(2)', {
        hasText: exactText('Edited title for upload'),
      }),
    ).toBeVisible()
  })

  test('should render initial rows within relationship table respecting access control', async () => {
    await navigateToDoc(page, categoriesJoinRestrictedURL)
    const joinField = page.locator('#field-collectionRestrictedJoin.field-type.join')
    await expect(joinField).toBeVisible()
    await expect(joinField.locator('.relationship-table table')).toBeVisible()
    const rows = joinField.locator('.relationship-table tbody tr')
    await expect(rows).toHaveCount(1)
    await expect(joinField.locator('.cell-canRead')).not.toContainText('false')
  })

  test('should render join field with array of collections', async () => {
    await page.goto(foldersURL.edit(rootFolderID))
    const joinField = page.locator('#field-children.field-type.join')
    await expect(joinField).toBeVisible()
    await expect(
      joinField.locator('.relationship-table tbody .row-1 .cell-collection .pill__label'),
    ).toHaveText('Folder')
    await expect(
      joinField.locator('.relationship-table tbody .row-3 .cell-collection .pill__label'),
    ).toHaveText('Example Post')
    await expect(
      joinField.locator('.relationship-table tbody .row-5 .cell-collection .pill__label'),
    ).toHaveText('Example Page')
  })

  test('should create a new document from join field with array of collections', async () => {
    await page.goto(foldersURL.edit(rootFolderID))
    const joinField = page.locator('#field-children.field-type.join')
    await expect(joinField).toBeVisible()

    const addNewPopupBtn = joinField.locator('.relationship-table__add-new-polymorphic')
    await expect(addNewPopupBtn).toBeVisible()
    await addNewPopupBtn.click()
    const pageOption = joinField.locator('.relationship-table__relation-button--example-pages')
    await expect(pageOption).toHaveText('Example Page')
    await pageOption.click()
    await page.locator('.drawer__content input#field-title').fill('Some new page')
    await page.locator('.drawer__content #action-save').click()

    await expect(
      joinField.locator('.relationship-table tbody .row-1 .cell-collection .pill__label'),
    ).toHaveText('Example Page')
    await expect(
      joinField.locator('.relationship-table tbody .row-1 .cell-title .drawer-link__cell'),
    ).toHaveText('Some new page')
  })

  test('should render create-first-user with when users collection has a join field and hide it', async () => {
    await payload.delete({ collection: 'users', where: {} })
    const url = new AdminUrlUtil(serverURL, 'users')
    await page.goto(url.admin + '/create-first-user')
    await expect(page.locator('.field-type.join')).toBeHidden()
  })

  test('should render error message when ValidationError is thrown', async () => {
    await navigateToDoc(page, categoriesURL)

    await page.locator('#field-enableErrorOnJoin').click()
    await page.locator('#action-save').click()

    await expect(page.locator('#field-joinWithError')).toContainText('enableErrorOnJoin is true')
  })

  test('should render localized data in table when locale changes', async () => {
    await page.goto(categoriesURL.edit(categoryID))
    const joinField = page.locator('#field-relatedPosts.field-type.join')
    await expect(joinField).toBeVisible()
    await expect(joinField.locator('.relationship-table table')).toBeVisible()

    const row = joinField.locator('.relationship-table tbody tr.row-1')
    await expect(row).toBeVisible()
    const localizedTextCell = row.locator('.cell-localizedText span')
    await expect(localizedTextCell).toBeVisible()
    await expect(localizedTextCell).toHaveText('Text in en')

    await changeLocale(page, 'es')
    await expect(localizedTextCell).toHaveText('Text in es')
  })
})
