import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import { reInitializeDB } from 'helpers/reInitializeDB.js'
import * as path from 'path'
import { fileURLToPath } from 'url'

import { ensureCompilationIsDone, initPageConsoleErrorCatch, saveDocAndAssert } from '../helpers.js'
import { AdminUrlUtil } from '../helpers/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../helpers/initPayloadE2ENoConfig.js'
import { TEST_TIMEOUT_LONG } from '../playwright.config.js'
import { postSlug } from './shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

test.describe('Folders', () => {
  let page: Page
  let postURL: AdminUrlUtil
  let serverURL: string

  test.beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)

    const { serverURL: serverFromInit } = await initPayloadE2ENoConfig({ dirname })
    serverURL = serverFromInit
    postURL = new AdminUrlUtil(serverURL, postSlug)

    const context = await browser.newContext()
    page = await context.newPage()
    initPageConsoleErrorCatch(page)
    await ensureCompilationIsDone({ page, serverURL })

    await reInitializeDB({
      serverURL,
      snapshotKey: 'foldersTest',
    })
  })

  test.describe('No folders', () => {
    /* eslint-disable playwright/expect-expect */
    test('should show no results and create button in folder view', async () => {
      await page.goto(`${serverURL}/admin/browse-by-folder`)
      await expectNoResultsAndCreateFolderButton()
    })
    /* eslint-disable playwright/expect-expect */
    test('should show no results and create button in document view', async () => {
      await page.goto(postURL.create)
      const folderButton = page.getByRole('button', { name: 'No Folder' })
      await expect(folderButton).toBeVisible()
      await folderButton.click()
      await expectNoResultsAndCreateFolderButton()
    })
  })

  test.describe('Creating folders', () => {
    test('should create new folder from folder view', async () => {
      await page.goto(`${serverURL}/admin/browse-by-folder`)
      await createFolder('New Folder From Root')
    })

    test('should create new folder from document view', async () => {
      await page.goto(postURL.create)
      const folderButton = page.getByRole('button', { name: 'No Folder' })
      await folderButton.click()
      const addFolderButton = page.locator('button.move-folder-drawer__add-folder-button', {
        hasText: 'Add Folder',
      })
      await addFolderButton.click()
      const folderNameInput = page.locator('input[id="field-name"]')
      await folderNameInput.fill('New Folder From Doc')
      const createButton = page
        .locator('dialog#move-folder-drawer-new-folder button[aria-label="Apply Changes"]')
        .filter({ hasText: 'Create' })
      await createButton.click()
      await expect(page.locator('.payload-toast-container')).toContainText('successfully')
      const folderCard = page.locator('.folder-file-card__name', { hasText: 'New Folder From Doc' })
      await expect(folderCard).toBeVisible()
    })
  })

  test.describe('Folder View Actions', () => {
    test('should show Browse by Folder button', async () => {
      await page.goto(`${serverURL}/admin`)
      const folderButton = page.locator('text=Browse by folder')
      await expect(folderButton).toBeVisible()
    })

    test('should rename folder', async () => {
      await page.goto(`${serverURL}/admin/browse-by-folder`)
      await createFolder('Test Folder')
      await clickFolderCard('Test Folder')
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
      await createFolder('Delete This Folder')
      await clickFolderCard('Delete This Folder')
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

    test('should move folder', async () => {
      await page.goto(`${serverURL}/admin/browse-by-folder`)
      await createFolder('Move Into This Folder')
      await createFolder('Move Me')
      await clickFolderCard('Move Me')
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
      await createFolder('Create New Here')
      await clickFolderCard('Create New Here', true)
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

    // this test currently fails in postgres
    test('should create nested folder from folder view', async () => {
      await page.goto(`${serverURL}/admin/browse-by-folder`)
      await createFolder('Parent Folder')
      await clickFolderCard('Parent Folder', true)
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
  })

  test.describe('Collection view actions', () => {
    test('should show By Folder button', async () => {
      await page.goto(postURL.list)
      const folderButton = page.locator('.list-folder-pills__button', { hasText: 'By Folder' })
      await expect(folderButton).toBeVisible()
    })
    test('should navigate to By Folder view', async () => {
      await page.goto(postURL.list)
      const folderButton = page.locator('.list-folder-pills__button', { hasText: 'By Folder' })
      await folderButton.click()
      await expect(page).toHaveURL(`${serverURL}/admin/collections/posts/payload-folders`)
      const foldersTitle = page.locator('.collection-folder-list', { hasText: 'Folders' })
      await expect(foldersTitle).toBeVisible()
    })
    test('should show folder pill in doc row', async () => {
      await createPostWithNoFolder()
      await page.goto(postURL.list)
      const firstListItem = page.locator('tbody .row-1')
      const folderPill = firstListItem.locator('.move-doc-to-folder')
      await expect(folderPill).toHaveText('No Folder')
    })

    test('should update folder from doc folder pill', async () => {
      await createPostWithNoFolder()
      await page.goto(postURL.list)
      await selectFolderAndConfirmMoveFromList('Move Into This Folder')
      await expect(page.locator('.payload-toast-container')).toContainText(
        'Test Post has been moved',
      )
    })

    test('should resolve folder pills and not get stuck as Loading...', async () => {
      await createPostWithNoFolder()
      await page.goto(postURL.list)
      await selectFolderAndConfirmMoveFromList('Move Into This Folder')
      const folderPill = page.locator('tbody .row-1 .move-doc-to-folder')
      await page.reload()
      await expect(folderPill).not.toHaveText('Loading...')
    })
    test('should show updated folder pill after folder change', async () => {
      await createPostWithNoFolder()
      await page.goto(postURL.list)
      const folderPill = page.locator('tbody .row-1 .move-doc-to-folder')
      await selectFolderAndConfirmMoveFromList('Move Into This Folder')
      await expect(folderPill).toHaveText('Move Into This Folder')
    })

    test('should show updated folder pill after removing doc folder', async () => {
      await createPostWithNoFolder()
      await page.goto(postURL.list)
      const folderPill = page.locator('tbody .row-1 .move-doc-to-folder')
      await selectFolderAndConfirmMoveFromList('Move Into This Folder')
      await expect(folderPill).toHaveText('Move Into This Folder')
      await page.reload()
      await folderPill.click()
      const folderBreadcrumb = page.locator('.folderBreadcrumbs__crumb-item', { hasText: 'Folder' })
      await folderBreadcrumb.click()
      await selectFolderAndConfirmMove()
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

  async function expectNoResultsAndCreateFolderButton() {
    const noResultsDiv = page.locator('div.no-results')
    await expect(noResultsDiv).toBeVisible()
    const createFolderButton = page.locator('text=Create Folder')
    await expect(createFolderButton).toBeVisible()
  }

  async function createFolder(folderName: string) {
    const createFolderButton = page.locator(
      '.create-new-doc-in-folder__button:has-text("Create New")',
    )
    await createFolderButton.click()

    const folderNameInput = page.locator(
      'dialog#create-document--header-pill-new-folder-drawer div.drawer-content-container input#field-name',
    )

    await folderNameInput.fill(folderName)

    const createButton = page.getByRole('button', { name: 'Apply Changes' })
    await createButton.click()

    await expect(page.locator('.payload-toast-container')).toContainText('successfully')

    const folderCard = page.locator('.folder-file-card__name', { hasText: folderName }).first()
    await expect(folderCard).toBeVisible()
  }

  async function clickFolderCard(folderName: string, doubleClick: boolean = false) {
    const folderCard = page
      .locator('.folder-file-card')
      .filter({
        has: page.locator('.folder-file-card__name', { hasText: folderName }),
      })
      .first()

    const dragHandleButton = folderCard.locator('div[role="button"].folder-file-card__drag-handle')

    if (doubleClick) {
      await dragHandleButton.dblclick()
    } else {
      await dragHandleButton.click()
    }
  }
  async function selectFolderAndConfirmMoveFromList(folderName: string | undefined = undefined) {
    const firstListItem = page.locator('tbody .row-1')
    const folderPill = firstListItem.locator('.move-doc-to-folder')
    await folderPill.click()

    if (folderName) {
      await clickFolderCard(folderName, true)
    }

    const selectButton = page
      .locator('button[aria-label="Apply Changes"]')
      .filter({ hasText: 'Select' })
    await selectButton.click()
    const confirmMoveButton = page
      .locator('dialog#move-folder-drawer-confirm-move')
      .getByRole('button', { name: 'Move' })
    await confirmMoveButton.click()
  }

  async function selectFolderAndConfirmMove(folderName: string | undefined = undefined) {
    if (folderName) {
      await clickFolderCard(folderName, true)
    }

    const selectButton = page
      .locator('button[aria-label="Apply Changes"]')
      .filter({ hasText: 'Select' })
    await selectButton.click()
    const confirmMoveButton = page
      .locator('dialog#move-folder-drawer-confirm-move')
      .getByRole('button', { name: 'Move' })
    await confirmMoveButton.click()
  }

  async function createPostWithNoFolder() {
    await page.goto(postURL.create)
    const titleInput = page.locator('input[name="title"]')
    await titleInput.fill('Test Post')
    await saveDocAndAssert(page)
  }
})

// tests to write
// ---------- TODO -----------
// - actions from document view
// - check multiple select actions (2 or more folders or docs) are selected
//    - should show how many are selected
//    - should allow multiple delete
//    - should allow multiple move
// - toggle grid/list view from folder view
// - test sort and filter in folder view
// - test search in folder view
//  ------ NICE TO HAVE -------
// - check copy is correct in the confirm modal and toast notifications when moving docs / folders
//    - when moving from no folder to folder
//    - when moving folder to no folder
//    - when moving from folder to folder
