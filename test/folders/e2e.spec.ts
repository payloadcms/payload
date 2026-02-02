import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import * as path from 'path'
import { formatAdminURL } from 'payload/shared'
import { fileURLToPath } from 'url'

import {
  closeAllToasts,
  ensureCompilationIsDone,
  getRoutes,
  initPageConsoleErrorCatch,
  saveDocAndAssert,
} from '../helpers/e2e/helpers.js'
import { AdminUrlUtil } from '../helpers/shared/adminUrlUtil.js'
import {
  getSelectInputOptions,
  getSelectInputValue,
  openSelectMenu,
} from '../helpers/e2e/selectInput.js'
import { applyBrowseByFolderTypeFilter } from '../helpers/e2e/folders/applyBrowseByFolderTypeFilter.js'
import { clickFolderCard } from '../helpers/e2e/folders/clickFolderCard.js'
import { createFolder } from '../helpers/e2e/folders/createFolder.js'
import { createFolderDoc } from '../helpers/e2e/folders/createFolderDoc.js'
import { createFolderFromDoc } from '../helpers/e2e/folders/createFolderFromDoc.js'
import { expectNoResultsAndCreateFolderButton } from '../helpers/e2e/folders/expectNoResultsAndCreateFolderButton.js'
import { selectFolderAndConfirmMove } from '../helpers/e2e/folders/selectFolderAndConfirmMove.js'
import { selectFolderAndConfirmMoveFromList } from '../helpers/e2e/folders/selectFolderAndConfirmMoveFromList.js'
import { initPayloadE2ENoConfig } from '../helpers/shared/initPayloadE2ENoConfig.js'
import { reInitializeDB } from '../helpers/shared/clearAndSeed/reInitializeDB.js'
import { TEST_TIMEOUT_LONG } from '../playwright.config.js'
import { omittedFromBrowseBySlug, postSlug } from './shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

test.describe('Folders', () => {
  let page: Page
  let postURL: AdminUrlUtil
  let OmittedFromBrowseBy: AdminUrlUtil
  let serverURL: string
  let adminRoute: string

  test.beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)

    const { serverURL: serverFromInit } = await initPayloadE2ENoConfig({ dirname })
    serverURL = serverFromInit
    postURL = new AdminUrlUtil(serverURL, postSlug)
    OmittedFromBrowseBy = new AdminUrlUtil(serverURL, omittedFromBrowseBySlug)

    const {
      routes: { admin: adminRouteFromConfig },
    } = getRoutes({})
    adminRoute = adminRouteFromConfig

    const context = await browser.newContext()
    page = await context.newPage()
    initPageConsoleErrorCatch(page)
    await ensureCompilationIsDone({ page, serverURL })
  })

  test.beforeEach(async () => {
    await reInitializeDB({
      serverURL,
      snapshotKey: 'foldersTest',
    })
  })

  test.describe('No folders', () => {
    test('should show no results and create button in folder view', async () => {
      await page.goto(formatAdminURL({ adminRoute, path: '/browse-by-folder', serverURL }))
      await expectNoResultsAndCreateFolderButton({ page })
    })

    test('should show no results and create button in document view', async () => {
      await page.goto(postURL.create)
      const folderButton = page.getByRole('button', { name: 'No Folder' })
      await expect(folderButton).toBeVisible()
      await folderButton.click()
      await expectNoResultsAndCreateFolderButton({ page })
    })
  })

  test.describe('Creating folders', () => {
    test('should create new folder from folder view', async () => {
      await page.goto(formatAdminURL({ adminRoute, path: '/browse-by-folder', serverURL }))
      await createFolder({ folderName: 'New Folder From Root', page })
    })

    test('should create new folder from collection view', async () => {
      await page.goto(postURL.byFolder)
      await createFolder({ folderName: 'New Folder From Collection', fromDropdown: false, page })
    })

    test('should create new folder from document view', async () => {
      await page.goto(postURL.create)
      await createPostWithNoFolder()
      const folderPill = page.locator('.doc-controls .move-doc-to-folder', { hasText: 'No Folder' })
      await folderPill.click()
      await createFolderFromDoc({ folderName: 'New Folder From Doc', page })
    })

    test('should create folder with collection that has translation function labels', async () => {
      await page.goto(formatAdminURL({ adminRoute, path: '/browse-by-folder', serverURL }))

      const createButton = page
        .locator('.list-header__title-and-actions .create-new-doc-in-folder__button')
        .filter({ hasText: 'Create folder' })
      await expect(createButton).toBeVisible()
      await createButton.click()

      // The folder drawer should open successfully without React serialization errors
      const drawer = page.locator('dialog .collection-edit--payload-folders')
      await expect(drawer).toBeVisible()

      const selectLocator = drawer.locator('#field-folderType')
      await expect(selectLocator).toBeVisible()

      // Should be able to open the select menu without errors
      await openSelectMenu({ selectLocator })

      const translatedLabelsOption = page.locator('.rs__option', {
        hasText: 'Documents',
      })
      await expect(translatedLabelsOption).toBeVisible()
    })
  })

  test.describe('Folder view actions', () => {
    test('should show Browse by Folder button', async () => {
      await page.goto(formatAdminURL({ adminRoute, path: '', serverURL }))
      const folderButton = page.locator('text=Browse by folder')
      await expect(folderButton).toBeVisible()
    })

    test('should rename folder', async () => {
      await page.goto(formatAdminURL({ adminRoute, path: '/browse-by-folder', serverURL }))
      await createFolder({ folderName: 'Test Folder', page })
      await clickFolderCard({ folderName: 'Test Folder', page })
      const editFolderDocButton = page.locator('.list-selection__actions button', {
        hasText: 'Edit',
      })
      await editFolderDocButton.click()
      await createFolderDoc({
        page,
        folderName: 'Renamed Folder',
        folderType: ['Posts'],
      })
      const renamedFolderCard = page
        .locator('.folder-file-card__name', {
          hasText: 'Renamed Folder',
        })
        .first()
      await expect(renamedFolderCard).toBeVisible()
    })

    test('should delete folder', async () => {
      await page.goto(formatAdminURL({ adminRoute, path: '/browse-by-folder', serverURL }))
      await createFolder({ folderName: 'Delete This Folder', page })
      await clickFolderCard({ folderName: 'Delete This Folder', page })
      const deleteButton = page.locator('.list-selection__actions button', {
        hasText: 'Delete',
      })
      await deleteButton.click()
      const confirmButton = page.getByRole('button', { name: 'Confirm' })
      await confirmButton.click()
      await expect(page.locator('.payload-toast-container')).toContainText('successfully')
      const deletedFolderCard = page.locator('.folder-file-card__name', {
        hasText: 'Delete This Folder',
      })
      await expect(deletedFolderCard).toBeHidden()
    })

    test('should delete folder but not delete documents', async () => {
      await page.goto(formatAdminURL({ adminRoute, path: '/browse-by-folder', serverURL }))
      await createFolder({ folderName: 'Folder With Documents', page })
      await createPostWithExistingFolder('Document 1', 'Folder With Documents')
      await createPostWithExistingFolder('Document 2', 'Folder With Documents')

      await page.goto(formatAdminURL({ adminRoute, path: '/browse-by-folder', serverURL }))
      await clickFolderCard({ folderName: 'Folder With Documents', page })
      const deleteButton = page.locator('.list-selection__actions button', {
        hasText: 'Delete',
      })
      await deleteButton.click()
      const confirmButton = page.getByRole('button', { name: 'Confirm' })
      await confirmButton.click()
      await expect(page.locator('.payload-toast-container')).toContainText('successfully')
      const deletedFolderCard = page.locator('.folder-file-card__name', {
        hasText: 'Folder With Documents',
      })
      await expect(deletedFolderCard).toBeHidden()

      await page.goto(postURL.list)
      const firstDoc = page.locator('tbody .row-1')
      const secondDoc = page.locator('tbody .row-2')
      await expect(firstDoc).toContainText('Document 2')
      await expect(secondDoc).toContainText('Document 1')
    })

    test('should move folder', async () => {
      await page.goto(formatAdminURL({ adminRoute, path: '/browse-by-folder', serverURL }))
      await createFolder({ folderName: 'Move Into This Folder', page })
      await createFolder({ folderName: 'Move Me', page })
      await clickFolderCard({ folderName: 'Move Me', page })
      const moveButton = page.locator('.list-selection__actions button', {
        hasText: 'Move',
      })
      await moveButton.click()
      await clickFolderCard({
        folderName: 'Move Into This Folder',
        page,
        doubleClick: true,
        rootLocator: page.locator('dialog#move-to-folder--list'),
      })
      const selectButton = page.locator(
        'dialog#move-to-folder--list button[aria-label="Apply Changes"]',
      )
      await selectButton.click()
      const confirmMoveButton = page
        .locator('dialog#move-folder-drawer-confirm-move')
        .getByRole('button', { name: 'Move' })
      await confirmMoveButton.click()
      await expect(page.locator('.payload-toast-container')).toContainText('Item moved')
      await closeAllToasts(page)
      const movedFolderCard = page.locator('.folder-list--folders .folder-file-card__name', {
        hasText: 'Move Me',
      })
      await expect(movedFolderCard).toBeHidden()
    })

    // this test currently fails in postgres
    test('should create new document from folder', async () => {
      await page.goto(formatAdminURL({ adminRoute, path: '/browse-by-folder', serverURL }))
      await createFolder({
        folderName: 'Create New Here',
        page,
        folderType: ['Posts', 'Drafts'],
      })
      await clickFolderCard({ folderName: 'Create New Here', page, doubleClick: true })
      const createDocButton = page.locator('.create-new-doc-in-folder__popup-button', {
        hasText: 'Create document',
      })
      await expect(createDocButton).toBeVisible()
      await createDocButton.click()
      const postButton = page
        .locator('.popup__content')
        .locator('.popup-button-list__button', { hasText: 'Post' })
      await expect(postButton).toBeVisible()
      await postButton.click()

      const drawer = page.locator('dialog#create-document--no-results-new-doc-in-folder-drawer')
      const titleInput = drawer.locator('input[name="title"]')
      await titleInput.fill('Document Created From Folder')
      await drawer.getByRole('button', { name: 'Save', exact: true }).click()

      await expect(page.locator('.payload-toast-container')).toContainText('successfully')
      const folderCard = page.locator('.folder-file-card', {
        has: page.locator('text=Document Created From Folder'),
      })
      await expect(folderCard).toBeVisible()
    })

    test('should create nested folder from folder view', async () => {
      await page.goto(formatAdminURL({ adminRoute, path: '/browse-by-folder', serverURL }))
      await createFolder({ folderName: 'Parent Folder', page })
      await clickFolderCard({ folderName: 'Parent Folder', page, doubleClick: true })
      const pageTitle = page.locator('h1.list-header__title')
      await expect(pageTitle).toHaveText('Parent Folder')

      const createFolderButton = page.locator(
        '.create-new-doc-in-folder__button:has-text("Create folder")',
      )
      await expect(createFolderButton).toBeVisible()
      await createFolderButton.click()

      await createFolderDoc({
        page,
        folderName: 'Nested Folder',
        folderType: ['Posts'],
      })

      await expect(page.locator('dialog#create-folder--no-results-new-folder-drawer')).toBeHidden()
    })

    test('should toggle between grid and list view', async () => {
      await page.goto(formatAdminURL({ adminRoute, path: '/browse-by-folder', serverURL }))
      await createFolder({ folderName: 'Test Folder', page })
      const listViewButton = page.locator('.folder-view-toggle-button').nth(1)
      await listViewButton.click()
      const listView = page.locator('.simple-table')
      await expect(listView).toBeVisible()

      const gridViewButton = page.locator('.folder-view-toggle-button').nth(0)
      await gridViewButton.click()
      const gridView = page.locator('.item-card-grid')
      await expect(gridView).toBeVisible()
    })

    test('should sort folders', async () => {
      await page.goto(formatAdminURL({ adminRoute, path: '/browse-by-folder', serverURL }))
      await createFolder({ folderName: 'A Folder', page })
      await createFolder({ folderName: 'B Folder', page })
      await createFolder({ folderName: 'C Folder', page })

      const firstFolderCard = page.locator('.folder-file-card__name').first()
      await expect(firstFolderCard).toHaveText('A Folder')

      const sortButton = page.locator('.sort-by-pill', { hasText: 'Name' })
      await sortButton.click()
      const decendingSortButton = page.locator('.sort-by-pill__order-option', {
        hasText: 'Descending',
      })
      await decendingSortButton.click()

      const sortedFirstFolderCard = page.locator('.folder-file-card__name').first()
      await expect(sortedFirstFolderCard).toHaveText('C Folder')
    })

    test('should allow filtering within folders', async () => {
      await page.goto(formatAdminURL({ adminRoute, path: '/browse-by-folder', serverURL }))
      await createFolder({ folderName: 'Filtering Folder', page })
      await clickFolderCard({ folderName: 'Filtering Folder', page, doubleClick: true })

      const createNewDropdown = page.locator('.create-new-doc-in-folder__popup-button', {
        hasText: 'Create New',
      })
      await createNewDropdown.click()
      const createFolderButton = page.locator('.popup__content .popup-button-list__button').first()
      await createFolderButton.click()
      await createFolderDoc({
        page,
        folderName: 'Nested Folder',
        folderType: ['Posts'],
      })
      await expect(page.locator('.folder-file-card__name')).toHaveText('Nested Folder')

      await createNewDropdown.click()
      const createPostButton = page.locator('.popup__content .popup-button-list__button', {
        hasText: 'Post',
      })
      await createPostButton.click()

      const postTitleInput = page.locator('input[id="field-title"]')
      await postTitleInput.fill('Test Post')
      const saveButton = page.locator('#action-save')
      await saveButton.click()
      await expect(page.locator('.payload-toast-container')).toContainText('successfully')

      // should filter out folders and only show posts
      await applyBrowseByFolderTypeFilter({
        page,
        type: { label: 'Folders', value: 'payload-folders' },
        on: false,
      })
      const folderGroup = page.locator('.item-card-grid__title', { hasText: 'Folders' })
      const postGroup = page.locator('.item-card-grid__title', { hasText: 'Documents' })
      await expect(folderGroup).toBeHidden()
      await expect(postGroup).toBeVisible()

      // should filter out posts and only show folders
      await applyBrowseByFolderTypeFilter({
        page,
        type: { label: 'Folders', value: 'payload-folders' },
        on: true,
      })
      await applyBrowseByFolderTypeFilter({
        page,
        type: { label: 'Posts', value: 'posts' },
        on: false,
      })

      await expect(folderGroup).toBeVisible()
      await expect(postGroup).toBeHidden()
    })

    test('should allow searching within folders', async () => {
      await page.goto(formatAdminURL({ adminRoute, path: '/browse-by-folder', serverURL }))
      await createFolder({ folderName: 'Test', page })
      await createFolder({ folderName: 'Search Me', page })

      const testFolderCard = page.locator('.folder-file-card__name', {
        hasText: 'Test',
      })
      const searchFolderCard = page.locator('.folder-file-card__name', {
        hasText: 'Search Me',
      })

      await expect(testFolderCard).toBeVisible()
      await expect(searchFolderCard).toBeVisible()

      const searchInput = page.locator('input[placeholder="Search by Name in Folders"]')
      await searchInput.fill('Search Me')
      await expect(testFolderCard).toBeHidden()
      await expect(searchFolderCard).toBeVisible()
    })
  })

  test.describe('Collection view actions', () => {
    test.beforeEach(async () => {
      await page.goto(formatAdminURL({ adminRoute, path: '/browse-by-folder', serverURL }))
      await createFolder({ folderName: 'Move Into This Folder', page })
      await createPostWithNoFolder()
      await page.goto(postURL.list)
    })

    test('should show By Folder button', async () => {
      const folderButton = page.locator('.default-list-view-tabs__button', { hasText: 'By Folder' })
      await expect(folderButton).toBeVisible()
    })
    test('should navigate to By Folder view', async () => {
      const folderButton = page.locator('.default-list-view-tabs__button', { hasText: 'By Folder' })
      await folderButton.click()
      await expect(page).toHaveURL(
        formatAdminURL({ adminRoute, path: '/collections/posts/payload-folders', serverURL }),
      )
      const foldersTitle = page.locator('.collection-folder-list', { hasText: 'Folders' })
      await expect(foldersTitle).toBeVisible()
    })
    test('should show folder pill in doc row', async () => {
      await page.goto(postURL.list)
      const firstListItem = page.locator('tbody .row-1')
      const folderPill = firstListItem.locator('.move-doc-to-folder')
      await expect(folderPill).toHaveText('No Folder')
    })

    test('should update folder from doc folder pill', async () => {
      await selectFolderAndConfirmMoveFromList({ folderName: 'Move Into This Folder', page })
      await expect(page.locator('.payload-toast-container')).toContainText(
        'Test Post has been moved',
      )
    })

    test('should resolve folder pills and not get stuck as Loading...', async () => {
      await selectFolderAndConfirmMoveFromList({ folderName: 'Move Into This Folder', page })
      const folderPill = page.locator('tbody .row-1 .move-doc-to-folder')
      await expect(folderPill).not.toHaveText('Loading...')
    })
    test('should show updated folder pill after folder change', async () => {
      const folderPill = page.locator('tbody .row-1 .move-doc-to-folder')
      await selectFolderAndConfirmMoveFromList({ folderName: 'Move Into This Folder', page })
      await expect(folderPill).toHaveText('Move Into This Folder')
    })

    test('should show updated folder pill after removing doc folder', async () => {
      const folderPill = page.locator('tbody .row-1 .move-doc-to-folder')
      await selectFolderAndConfirmMoveFromList({ folderName: 'Move Into This Folder', page })
      await expect(folderPill).toHaveText('Move Into This Folder')
      await folderPill.click()
      const drawerLocator = page.locator('dialog .move-folder-drawer')
      await drawerLocator
        .locator('.droppable-button.folderBreadcrumbs__crumb-item', {
          hasText: 'Folder',
        })
        .click()
      await expect(
        drawerLocator.locator('.folder-file-card__name', { hasText: 'Move Into This Folder' }),
      ).toBeVisible()
      await selectFolderAndConfirmMove({ page })
      await expect(folderPill).toHaveText('No Folder')
    })

    test('should create folder from By Folder view', async () => {
      await page.goto(postURL.byFolder)
      const createButton = page.locator('.create-new-doc-in-folder__button', {
        hasText: 'Create folder',
      })
      await createButton.click()
      await createFolderDoc({
        page,
        folderName: 'New Folder From Collection',
        folderType: ['Posts'],
      })
    })
  })

  test.describe('Document view actions', () => {
    test.beforeEach(async () => {
      await page.goto(formatAdminURL({ adminRoute, path: '/browse-by-folder', serverURL }))
      await createFolder({ folderName: 'Test Folder', page })
      await createPostWithNoFolder()
    })

    test('should show folder pill in doc controls', async () => {
      const folderPill = page.locator('.doc-controls .move-doc-to-folder', { hasText: 'No Folder' })
      await expect(folderPill).toBeVisible()
    })

    test('should update folder from folder pill in doc controls', async () => {
      const folderPill = page.locator('.doc-controls .move-doc-to-folder', { hasText: 'No Folder' })
      await folderPill.click()
      await clickFolderCard({ folderName: 'Test Folder', doubleClick: true, page })
      const selectButton = page
        .locator('button[aria-label="Apply Changes"]')
        .filter({ hasText: 'Select' })
      await selectButton.click()
      await expect(page.locator('.payload-toast-container')).toContainText(
        'Test Post has been moved',
      )
    })

    test('should show updated folder pill after folder change', async () => {
      const folderPill = page.locator('.doc-controls .move-doc-to-folder', { hasText: 'No Folder' })
      await folderPill.click()
      await clickFolderCard({ folderName: 'Test Folder', doubleClick: true, page })
      const selectButton = page
        .locator('button[aria-label="Apply Changes"]')
        .filter({ hasText: 'Select' })
      await selectButton.click()
      const updatedFolderPill = page.locator('.doc-controls .move-doc-to-folder', {
        hasText: 'Test Folder',
      })
      await expect(updatedFolderPill).toBeVisible()
    })
  })

  test.describe('Collection with browse by folders disabled', () => {
    test('should not show omitted collection documents in browse by folder view', async () => {
      await page.goto(OmittedFromBrowseBy.byFolder)
      const folderName = 'Folder without omitted Docs'
      await page.goto(OmittedFromBrowseBy.byFolder)
      await createFolder({
        folderName,
        page,
        fromDropdown: false,
        folderType: ['Omitted From Browse By', 'Posts'],
      })

      // create document
      await page.goto(OmittedFromBrowseBy.create)
      const titleInput = page.locator('input[name="title"]')
      await titleInput.fill('Omitted Doc')
      await saveDocAndAssert(page)

      // assign to folder
      const folderPill = page.locator('.doc-controls .move-doc-to-folder', { hasText: 'No Folder' })
      await folderPill.click()
      await clickFolderCard({ folderName, page })
      const selectButton = page
        .locator('button[aria-label="Apply Changes"]')
        .filter({ hasText: 'Select' })
      await selectButton.click()
      await saveDocAndAssert(page)

      // go to browse by folder view
      await page.goto(formatAdminURL({ adminRoute, path: '/browse-by-folder', serverURL }))
      await clickFolderCard({ folderName, page, doubleClick: true })

      // folder should be empty
      await expectNoResultsAndCreateFolderButton({ page })
    })

    test('should not show collection type in browse by folder view', async () => {
      const folderName = 'omitted collection pill test folder'
      await page.goto(formatAdminURL({ adminRoute, path: '/browse-by-folder', serverURL }))
      await createFolder({ folderName, page })
      await clickFolderCard({ folderName, page, doubleClick: true })

      await page.locator('button:has(.collection-type__count)').click()

      await expect(
        page.locator('.checkbox-input .field-label', {
          hasText: 'Omitted From Browse By',
        }),
      ).toBeHidden()
    })
  })

  test.describe('Multiple select options', () => {
    test.beforeEach(async () => {
      await page.goto(formatAdminURL({ adminRoute, path: '/browse-by-folder', serverURL }))
      await createFolder({ folderName: 'Test Folder 1', page })
      await createFolder({ folderName: 'Test Folder 2', page })
      await createFolder({ folderName: 'Test Folder 3', page })
    })

    test('should show how many folders are selected', async () => {
      const firstFolderCard = page.locator('.folder-file-card', {
        hasText: 'Test Folder 1',
      })
      const thirdFolderCard = page.locator('.folder-file-card', {
        hasText: 'Test Folder 3',
      })

      await page.keyboard.up('Shift')
      await firstFolderCard.click()
      await page.keyboard.down('Shift')
      await thirdFolderCard.click()

      const selectedCount = page.locator('.list-selection')
      await expect(selectedCount).toContainText('3 selected')
    })

    test('should allow multiple folder delete', async () => {
      const firstFolderCard = page.locator('.folder-file-card', {
        hasText: 'Test Folder 1',
      })
      const thirdFolderCard = page.locator('.folder-file-card', {
        hasText: 'Test Folder 3',
      })

      await page.keyboard.up('Shift')
      await firstFolderCard.click()
      await page.keyboard.down('Shift')
      await thirdFolderCard.click()

      const deleteButton = page.locator('.list-selection__actions button', {
        hasText: 'Delete',
      })
      await deleteButton.click()
      const confirmButton = page.getByRole('button', { name: 'Confirm' })
      await confirmButton.click()
      await expect(page.locator('.payload-toast-container')).toContainText('successfully')
      await expect(firstFolderCard).toBeHidden()
    })
    test('should move multiple folders', async () => {
      await createFolder({ folderName: 'Move into here', page })
      const firstFolderCard = page.locator('.folder-file-card', {
        hasText: 'Test Folder 1',
      })
      const thirdFolderCard = page.locator('.folder-file-card', {
        hasText: 'Test Folder 3',
      })

      await page.keyboard.up('Shift')
      await firstFolderCard.click()
      await page.keyboard.down('Shift')
      await thirdFolderCard.click()

      const moveButton = page.locator('.list-selection__actions button', {
        hasText: 'Move',
      })
      await moveButton.click()
      const destinationFolder = page.locator('dialog#move-to-folder--list .folder-file-card', {
        hasText: 'Move into here',
      })
      await destinationFolder.click()
      await selectFolderAndConfirmMove({ page })
      await expect(page.locator('.payload-toast-container')).toContainText('moved')
      await expect(firstFolderCard).toBeHidden()
    })
  })

  test.describe('should inherit folderType select values from parent folder', () => {
    test('should scope folderType select options for: scoped > child folder', async () => {
      await page.goto(formatAdminURL({ adminRoute, path: '/browse-by-folder', serverURL }))
      await createFolder({ folderName: 'Posts and Media', page, folderType: ['Posts', 'Media'] })
      await clickFolderCard({ folderName: 'Posts and Media', page, doubleClick: true })

      const createNewDropdown = page.locator('.create-new-doc-in-folder__popup-button', {
        hasText: 'Create New',
      })
      await createNewDropdown.click()
      const createFolderButton = page.locator('.popup__content .popup-button-list__button', {
        hasText: 'Folder',
      })
      await createFolderButton.click()

      const drawer = page.locator('dialog .collection-edit--payload-folders')
      const titleInput = drawer.locator('#field-name')
      await titleInput.fill('Should only allow Posts and Media')
      const selectLocator = drawer.locator('#field-folderType')
      await expect(selectLocator).toBeVisible()

      // should prefill with Posts and Media
      await expect
        .poll(async () => {
          const options = await getSelectInputValue<true>({ selectLocator, multiSelect: true })
          return options.sort()
        })
        .toEqual(['Posts', 'Media'].sort())

      // should have no more select options available
      await openSelectMenu({ selectLocator })
      await expect(
        selectLocator.locator('.rs__menu-notice', { hasText: 'No options' }),
      ).toBeVisible()
    })

    test('should scope folderType select options for: unscoped > scoped > child folder', async () => {
      await page.goto(formatAdminURL({ adminRoute, path: '/browse-by-folder', serverURL }))

      // create an unscoped parent folder
      await createFolder({ folderName: 'All collections', page, folderType: [] })
      await clickFolderCard({ folderName: 'All collections', page, doubleClick: true })

      // create a scoped child folder
      await createFolder({
        folderName: 'Posts and Media',
        page,
        folderType: ['Posts', 'Media'],
        fromDropdown: true,
      })
      await clickFolderCard({ folderName: 'Posts and Media', page, doubleClick: true })

      await expect(
        page.locator('.step-nav', {
          hasText: 'Posts and Media',
        }),
      ).toBeVisible()

      const titleActionsLocator = page.locator('.list-header__title-actions')
      await expect(titleActionsLocator).toBeVisible()
      const folderDropdown = page.locator(
        '.list-header__title-actions .create-new-doc-in-folder__action-popup',
        {
          hasText: 'Create',
        },
      )
      await expect(folderDropdown).toBeVisible()
      await folderDropdown.click()
      const createFolderButton = page.locator('.popup__content .popup-button-list__button', {
        hasText: 'Folder',
      })
      await createFolderButton.click()

      const drawer = page.locator('dialog .collection-edit--payload-folders')
      const titleInput = drawer.locator('#field-name')
      await titleInput.fill('Should only allow posts and media')
      const selectLocator = drawer.locator('#field-folderType')
      await expect(selectLocator).toBeVisible()

      // should not prefill with any options
      await expect
        .poll(async () => {
          const options = await getSelectInputValue<true>({ selectLocator, multiSelect: true })
          return options.sort()
        })
        .toEqual(['Posts', 'Media'].sort())

      // should have no more select options available
      await openSelectMenu({ selectLocator })
      await expect(
        selectLocator.locator('.rs__menu-notice', { hasText: 'No options' }),
      ).toBeVisible()
    })

    test('should not scope child folder of an unscoped parent folder', async () => {
      await page.goto(formatAdminURL({ adminRoute, path: '/browse-by-folder', serverURL }))
      await createFolder({ folderName: 'All collections', page, folderType: [] })
      await clickFolderCard({ folderName: 'All collections', page, doubleClick: true })

      const createNewDropdown = page.locator('.create-new-doc-in-folder__popup-button', {
        hasText: 'Create New',
      })
      await createNewDropdown.click()
      const createFolderButton = page.locator('.popup__content .popup-button-list__button', {
        hasText: 'Folder',
      })
      await createFolderButton.click()

      const drawer = page.locator('dialog .collection-edit--payload-folders')
      const titleInput = drawer.locator('#field-name')
      await titleInput.fill('Should allow all collections')
      const selectLocator = drawer.locator('#field-folderType')
      await expect(selectLocator).toBeVisible()

      // should not prefill with any options
      await expect
        .poll(async () => {
          const options = await getSelectInputValue<true>({ selectLocator, multiSelect: true })
          return options
        })
        .toEqual([])

      // should have many options
      await expect
        .poll(async () => {
          const options = await getSelectInputOptions({ selectLocator })
          return options.length
        })
        .toBeGreaterThan(4)
    })
  })

  // Helper functions

  async function createPostWithNoFolder() {
    await page.goto(postURL.create)
    const titleInput = page.locator('input[name="title"]')
    await titleInput.fill('Test Post')
    await saveDocAndAssert(page)
  }

  async function createPostWithExistingFolder(postTitle: string, folderName: string) {
    await page.goto(postURL.create)
    const titleInput = page.locator('input[name="title"]')
    await titleInput.fill(postTitle)
    await saveDocAndAssert(page)
    const folderPill = page.locator('.doc-controls .move-doc-to-folder', { hasText: 'No Folder' })
    await folderPill.click()
    await clickFolderCard({ folderName, page })
    const selectButton = page
      .locator('button[aria-label="Apply Changes"]')
      .filter({ hasText: 'Select' })
    await selectButton.click()
  }
})

// tests to write
//  ------ NICE TO HAVE -------
// - check copy is correct in the confirm modal and toast notifications when moving docs / folders
//    - when moving from no folder to folder
//    - when moving folder to no folder
//    - when moving from folder to folder
