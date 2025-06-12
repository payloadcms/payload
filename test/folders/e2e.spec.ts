import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import { reInitializeDB } from 'helpers/reInitializeDB.js'
import * as path from 'path'
import { fileURLToPath } from 'url'

import { ensureCompilationIsDone, initPageConsoleErrorCatch, saveDocAndAssert } from '../helpers.js'
import { AdminUrlUtil } from '../helpers/adminUrlUtil.js'
import { clickFolderCard } from '../helpers/folders/clickFolderCard.js'
import { createFolder } from '../helpers/folders/createFolder.js'
import { createFolderFromDoc } from '../helpers/folders/createFolderFromDoc.js'
import { expectNoResultsAndCreateFolderButton } from '../helpers/folders/expectNoResultsAndCreateFolderButton.js'
import { selectFolderAndConfirmMove } from '../helpers/folders/selectFolderAndConfirmMove.js'
import { selectFolderAndConfirmMoveFromList } from '../helpers/folders/selectFolderAndConfirmMoveFromList.js'
import { initPayloadE2ENoConfig } from '../helpers/initPayloadE2ENoConfig.js'
import { TEST_TIMEOUT_LONG } from '../playwright.config.js'
import { omittedFromBrowseBySlug, postSlug } from './shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

test.describe('Folders', () => {
  let page: Page
  let postURL: AdminUrlUtil
  let OmittedFromBrowseBy: AdminUrlUtil
  let serverURL: string

  test.beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)

    const { serverURL: serverFromInit } = await initPayloadE2ENoConfig({ dirname })
    serverURL = serverFromInit
    postURL = new AdminUrlUtil(serverURL, postSlug)
    OmittedFromBrowseBy = new AdminUrlUtil(serverURL, omittedFromBrowseBySlug)

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
      await page.goto(`${serverURL}/admin/browse-by-folder`)
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
      await page.goto(`${serverURL}/admin/browse-by-folder`)
      await createFolder({ folderName: 'New Folder From Root', page })
    })

    test('should create new folder from collection view', async () => {
      await page.goto(postURL.byFolder)
      await createFolder({ folderName: 'New Folder From Collection', fromDropdown: true, page })
    })

    test('should create new folder from document view', async () => {
      await page.goto(postURL.create)
      await createPostWithNoFolder()
      const folderPill = page.locator('.doc-controls .move-doc-to-folder', { hasText: 'No Folder' })
      await folderPill.click()
      await createFolderFromDoc({ folderName: 'New Folder From Doc', page })
    })
  })

  test.describe('Folder view actions', () => {
    test('should show Browse by Folder button', async () => {
      await page.goto(`${serverURL}/admin`)
      const folderButton = page.locator('text=Browse by folder')
      await expect(folderButton).toBeVisible()
    })

    test('should rename folder', async () => {
      await page.goto(`${serverURL}/admin/browse-by-folder`)
      await createFolder({ folderName: 'Test Folder', page })
      await clickFolderCard({ folderName: 'Test Folder', page })
      const renameButton = page.locator('.list-selection__actions button', {
        hasText: 'Rename',
      })
      await renameButton.click()
      const folderNameInput = page.locator('input[id="field-name"]')
      await folderNameInput.fill('Renamed Folder')
      const applyChangesButton = page.locator(
        'dialog#rename-folder--list button[aria-label="Apply Changes"]',
      )
      await applyChangesButton.click()
      await expect(page.locator('.payload-toast-container')).toContainText('successfully')
      const renamedFolderCard = page
        .locator('.folder-file-card__name', {
          hasText: 'Renamed Folder',
        })
        .first()
      await expect(renamedFolderCard).toBeVisible()
    })

    test('should delete folder', async () => {
      await page.goto(`${serverURL}/admin/browse-by-folder`)
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
      await page.goto(`${serverURL}/admin/browse-by-folder`)
      await createFolder({ folderName: 'Folder With Documents', page })
      await createPostWithExistingFolder('Document 1', 'Folder With Documents')
      await createPostWithExistingFolder('Document 2', 'Folder With Documents')

      await page.goto(`${serverURL}/admin/browse-by-folder`)
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
      await page.goto(`${serverURL}/admin/browse-by-folder`)
      await createFolder({ folderName: 'Move Into This Folder', page })
      await createFolder({ folderName: 'Move Me', page })
      await clickFolderCard({ folderName: 'Move Me', page })
      const moveButton = page.locator('.list-selection__actions button', {
        hasText: 'Move',
      })
      await moveButton.click()
      const destinationFolder = page
        .locator('dialog#move-to-folder--list .folder-file-card')
        .filter({
          has: page.locator('.folder-file-card__name', { hasText: 'Move Into This Folder' }),
        })
        .first()
      const destinationFolderButton = destinationFolder.locator(
        'div[role="button"].folder-file-card__drag-handle',
      )
      await destinationFolderButton.click()
      const selectButton = page.locator(
        'dialog#move-to-folder--list button[aria-label="Apply Changes"]',
      )
      await selectButton.click()
      const confirmMoveButton = page
        .locator('dialog#move-folder-drawer-confirm-move')
        .getByRole('button', { name: 'Move' })
      await confirmMoveButton.click()
      await expect(page.locator('.payload-toast-container')).toContainText('successfully')
      const movedFolderCard = page.locator('.folder-list--folders .folder-file-card__name', {
        hasText: 'Move Me',
      })
      await expect(movedFolderCard).toBeHidden()
    })

    // this test currently fails in postgres
    test('should create new document from folder', async () => {
      await page.goto(`${serverURL}/admin/browse-by-folder`)
      await createFolder({ folderName: 'Create New Here', page })
      await clickFolderCard({ folderName: 'Create New Here', page, doubleClick: true })
      const createDocButton = page.locator('.create-new-doc-in-folder__popup-button', {
        hasText: 'Create document',
      })
      await expect(createDocButton).toBeVisible()
      await createDocButton.click()
      const postButton = page
        .locator('.popup--active')
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
      await page.goto(`${serverURL}/admin/browse-by-folder`)
      await createFolder({ folderName: 'Parent Folder', page })
      await clickFolderCard({ folderName: 'Parent Folder', page, doubleClick: true })
      const pageTitle = page.locator('h1.list-header__title')
      await expect(pageTitle).toHaveText('Parent Folder')

      const createFolderButton = page.locator(
        '.create-new-doc-in-folder__button:has-text("Create folder")',
      )
      await expect(createFolderButton).toBeVisible()
      await createFolderButton.click()

      const drawerHeader = page.locator(
        'dialog#create-folder--no-results-new-folder-drawer h1.drawerHeader__title',
      )
      await expect(drawerHeader).toHaveText('New Folder')

      const titleField = page.locator(
        'dialog#create-folder--no-results-new-folder-drawer input[id="field-name"]',
      )
      await titleField.fill('Nested Folder')
      const createButton = page
        .locator(
          'dialog#create-folder--no-results-new-folder-drawer button[aria-label="Apply Changes"]',
        )
        .filter({ hasText: 'Create' })
        .first()
      await createButton.click()
      await expect(page.locator('.payload-toast-container')).toContainText('successfully')
      await expect(page.locator('dialog#create-folder--no-results-new-folder-drawer')).toBeHidden()
    })

    test('should toggle between grid and list view', async () => {
      await page.goto(`${serverURL}/admin/browse-by-folder`)
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
      await page.goto(`${serverURL}/admin/browse-by-folder`)
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
      await page.goto(`${serverURL}/admin/browse-by-folder`)
      await createFolder({ folderName: 'Filtering Folder', page })
      await clickFolderCard({ folderName: 'Filtering Folder', page, doubleClick: true })

      const createNewDropdown = page.locator('.create-new-doc-in-folder__popup-button', {
        hasText: 'Create New',
      })
      await createNewDropdown.click()
      const createFolderButton = page.locator('.popup-button-list__button').first()
      await createFolderButton.click()
      const folderNameInput = page.locator('input[id="field-name"]')
      await folderNameInput.fill('Nested Folder')
      const createButton = page
        .locator('.drawerHeader button[aria-label="Apply Changes"]')
        .filter({ hasText: 'Create' })
      await createButton.click()
      await expect(page.locator('.folder-file-card__name')).toHaveText('Nested Folder')

      await createNewDropdown.click()
      const createPostButton = page.locator('.popup-button-list__button', { hasText: 'Post' })
      await createPostButton.click()

      const postTitleInput = page.locator('input[id="field-title"]')
      await postTitleInput.fill('Test Post')
      const saveButton = page.locator('#action-save')
      await saveButton.click()
      await expect(page.locator('.payload-toast-container')).toContainText('successfully')

      const typeButton = page.locator('.popup-button', { hasText: 'Type' })
      await typeButton.click()
      const folderCheckbox = page.locator('.checkbox-popup__options .checkbox-input__input').first()
      await folderCheckbox.click()
      const folderGroup = page.locator('.item-card-grid__title', { hasText: 'Folders' })
      const postGroup = page.locator('.item-card-grid__title', { hasText: 'Documents' })
      await expect(folderGroup).toBeHidden()
      await expect(postGroup).toBeVisible()

      await folderCheckbox.click()
      const postCheckbox = page.locator('.checkbox-popup__options .checkbox-input__input').nth(1)
      await postCheckbox.click()

      await expect(folderGroup).toBeVisible()
      await expect(postGroup).toBeHidden()
    })

    test('should allow searching within folders', async () => {
      await page.goto(`${serverURL}/admin/browse-by-folder`)
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
      await page.goto(`${serverURL}/admin/browse-by-folder`)
      await createFolder({ folderName: 'Move Into This Folder', page })
      await createPostWithNoFolder()
      await page.goto(postURL.list)
    })

    test('should show By Folder button', async () => {
      const folderButton = page.locator('.list-folder-pills__button', { hasText: 'By Folder' })
      await expect(folderButton).toBeVisible()
    })
    test('should navigate to By Folder view', async () => {
      const folderButton = page.locator('.list-folder-pills__button', { hasText: 'By Folder' })
      await folderButton.click()
      await expect(page).toHaveURL(`${serverURL}/admin/collections/posts/payload-folders`)
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
      await page.reload()
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
      await page.reload()
      await folderPill.click()
      const folderBreadcrumb = page.locator('.folderBreadcrumbs__crumb-item', { hasText: 'Folder' })
      await folderBreadcrumb.click()
      await selectFolderAndConfirmMove({ page })
      await expect(folderPill).toHaveText('No Folder')
    })

    test('should create folder from By Folder view', async () => {
      await page.goto(postURL.byFolder)
      const createDropdown = page.locator('.create-new-doc-in-folder__popup-button', {
        hasText: 'Create',
      })
      await createDropdown.click()
      const createFolderButton = page.locator('.popup-button-list__button', { hasText: 'Folder' })
      await createFolderButton.click()
      const drawerHeader = page.locator('.drawerHeader__title', { hasText: 'New Folder' })
      await expect(drawerHeader).toBeVisible()
      const folderNameInput = page.locator('input[id="field-name"]')
      await folderNameInput.fill('New Folder From Collection')
      const createButton = page
        .locator('.drawerHeader button[aria-label="Apply Changes"]')
        .filter({ hasText: 'Create' })
      await createButton.click()
      await expect(page.locator('.payload-toast-container')).toContainText('successfully')
    })
  })

  test.describe('Document view actions', () => {
    test.beforeEach(async () => {
      await page.goto(`${serverURL}/admin/browse-by-folder`)
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

  test.describe('Multiple select options', () => {
    test.beforeEach(async () => {
      await page.goto(`${serverURL}/admin/browse-by-folder`)
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

  test.describe('Collection with browse by folders disabled', () => {
    const folderName = 'Folder without omitted Docs'
    test('should not show omitted collection documents in browse by folder view', async () => {
      await page.goto(OmittedFromBrowseBy.byFolder)
      await createFolder({ folderName, page, fromDropdown: true })

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

      // go to browse by folder view
      await page.goto(`${serverURL}/admin/browse-by-folder`)
      await clickFolderCard({ folderName, page, doubleClick: true })

      // folder should be empty
      await expectNoResultsAndCreateFolderButton({ page })
    })

    test('should not show collection type in browse by folder view', async () => {
      const folderName = 'omitted collection pill test folder'
      await page.goto(`${serverURL}/admin/browse-by-folder`)
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
