import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import * as path from 'path'
import { fileURLToPath } from 'url'

import {
  ensureCompilationIsDone,
  getRoutes,
  initPageConsoleErrorCatch,
  saveDocAndAssert,
} from '../__helpers/e2e/helpers.js'
import { AdminUrlUtil } from '../__helpers/shared/adminUrlUtil.js'
import { reInitializeDB } from '../__helpers/shared/clearAndSeed/reInitializeDB.js'
import { initPayloadE2ENoConfig } from '../__helpers/shared/initPayloadE2ENoConfig.js'
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

    const {
      routes: { admin: adminRouteFromConfig },
    } = getRoutes({})

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

  test.describe('Document view - folder assignment via Miller columns', () => {
    test('should show hierarchy button in doc controls', async () => {
      await page.goto(postURL.create)
      // Wait for the hierarchy button to load (initially shows "Loading..." then "None")
      const hierarchyButton = page.locator('.doc-controls button').filter({ hasText: 'None' })
      await expect(hierarchyButton).toBeVisible()
    })

    test('should open Miller columns drawer when clicking hierarchy button', async () => {
      await page.goto(postURL.create)
      await page.locator('.doc-controls button', { hasText: 'None' }).click()

      // Verify drawer opens with Miller columns
      const drawer = page.locator('dialog')
      await expect(drawer).toBeVisible()
      // Check for the drawer header text
      await expect(drawer.getByRole('heading', { name: 'Select a value' })).toBeVisible()
      // Check for the Folders section
      await expect(drawer.getByRole('heading', { name: 'Folders' })).toBeVisible()
    })

    test('should show existing folders in Miller columns', async () => {
      await page.goto(postURL.create)
      await page.locator('.doc-controls button', { hasText: 'None' }).click()

      const drawer = page.locator('dialog')
      // Test data has seeded folders - verify at least one appears
      await expect(drawer.getByRole('button', { name: 'Archive' })).toBeVisible()
    })

    test('should show New Folder button in drawer', async () => {
      await page.goto(postURL.create)
      await page.locator('.doc-controls button', { hasText: 'None' }).click()

      const drawer = page.locator('dialog')
      await expect(drawer.getByRole('button', { name: 'New Folder' })).toBeVisible()
    })

    test('should select a folder and update hierarchy button', async () => {
      await page.goto(postURL.create)
      const titleInput = page.locator('input[name="title"]')
      await titleInput.fill('Test Post')
      await saveDocAndAssert(page)

      // Open drawer and select a folder
      await page.locator('.doc-controls button', { hasText: 'None' }).click()
      const drawer = page.locator('dialog')

      // Click the checkbox to select the folder (clicking the row expands it)
      const archiveItem = drawer.locator('.hierarchy-column-item', { hasText: 'Archive' })
      const checkbox = archiveItem.locator('.hierarchy-column-item__checkbox input')
      await checkbox.click()

      // Wait for selection to be checked
      await expect(archiveItem).toHaveClass(/--selected/)

      // Click Select to apply
      await drawer.locator('button', { hasText: 'Select' }).click()

      // Verify the hierarchy button now shows the selected folder
      await expect(page.locator('.doc-controls button', { hasText: 'Archive' })).toBeVisible()
    })

    test('should cancel folder selection without changes', async () => {
      await page.goto(postURL.create)
      await page.locator('.doc-controls button', { hasText: 'None' }).click()

      const drawer = page.locator('dialog')

      // Select a folder
      await drawer.getByRole('button', { name: 'Archive' }).click()

      // Click Cancel
      await drawer.getByRole('button', { name: 'Cancel' }).click()

      // Drawer should close
      await expect(drawer).toBeHidden()

      // Hierarchy button should still show "None"
      await expect(page.locator('.doc-controls button', { hasText: 'None' })).toBeVisible()
    })

    test('should close drawer with close button', async () => {
      await page.goto(postURL.create)
      await page.locator('.doc-controls button', { hasText: 'None' }).click()

      const drawer = page.locator('dialog')
      await expect(drawer).toBeVisible()

      // Click close button
      await drawer.getByRole('button', { name: 'Close' }).click()

      // Drawer should close
      await expect(drawer).toBeHidden()
    })
  })

  test.describe('Collection list view - hierarchy cell', () => {
    test('should show hierarchy cell with "None" for document without folder', async () => {
      // Create a post without a folder
      await page.goto(postURL.create)
      const titleInput = page.locator('input[name="title"]')
      await titleInput.fill('Test Post Without Folder')
      await saveDocAndAssert(page)

      // Go to list view
      await page.goto(postURL.list)

      // Find the row with our post
      const row = page.locator('tbody tr', { hasText: 'Test Post Without Folder' })
      const hierarchyCell = row.locator('.hierarchy-cell')
      await expect(hierarchyCell).toBeVisible()
      await expect(hierarchyCell.locator('.btn')).toHaveText('None')
    })

    test('should open drawer when clicking hierarchy cell button', async () => {
      // Create a post
      await page.goto(postURL.create)
      const titleInput = page.locator('input[name="title"]')
      await titleInput.fill('Test Post For Drawer')
      await saveDocAndAssert(page)

      // Go to list view
      await page.goto(postURL.list)

      // Click the hierarchy cell button
      const row = page.locator('tbody tr', { hasText: 'Test Post For Drawer' })
      const button = row.locator('.hierarchy-cell .btn')
      await button.click()

      // Verify drawer opens
      const drawer = page.locator('dialog')
      await expect(drawer).toBeVisible()
      await expect(drawer.getByRole('heading', { name: 'Folders' })).toBeVisible()
    })

    test('should update folder from list view via drawer', async () => {
      // Create a post
      await page.goto(postURL.create)
      const titleInput = page.locator('input[name="title"]')
      await titleInput.fill('Test Post For Update')
      await saveDocAndAssert(page)

      // Go to list view
      await page.goto(postURL.list)

      // Click the hierarchy cell button to open drawer
      const row = page.locator('tbody tr', { hasText: 'Test Post For Update' })
      const button = row.locator('.hierarchy-cell .btn')
      await button.click()

      // Select a folder in the drawer
      const drawer = page.locator('dialog')
      const archiveItem = drawer.locator('.hierarchy-column-item', { hasText: 'Archive' })
      const checkbox = archiveItem.locator('.hierarchy-column-item__checkbox input')
      await checkbox.click()
      await expect(archiveItem).toHaveClass(/--selected/)

      // Click Select to apply
      await drawer.locator('button', { hasText: 'Select' }).click()

      // Verify the cell now shows the folder name
      await expect(button).toHaveText('Archive')
    })

    test('should show folder name for document with assigned folder', async () => {
      // Create a post and assign to folder via doc controls
      await page.goto(postURL.create)
      const titleInput = page.locator('input[name="title"]')
      await titleInput.fill('Test Post With Folder')
      await saveDocAndAssert(page)

      // Assign folder via hierarchy button
      await page.locator('.doc-controls button', { hasText: 'None' }).click()
      const drawer = page.locator('dialog')
      const archiveItem = drawer.locator('.hierarchy-column-item', { hasText: 'Archive' })
      const checkbox = archiveItem.locator('.hierarchy-column-item__checkbox input')
      await checkbox.click()
      await expect(archiveItem).toHaveClass(/--selected/)
      await drawer.locator('button', { hasText: 'Select' }).click()
      await saveDocAndAssert(page)

      // Go to list view
      await page.goto(postURL.list)

      // Verify the hierarchy cell shows the folder name
      const row = page.locator('tbody tr', { hasText: 'Test Post With Folder' })
      const hierarchyCell = row.locator('.hierarchy-cell')
      await expect(hierarchyCell.locator('.btn')).toHaveText('Archive')
    })
  })
})
