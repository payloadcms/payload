import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import { openNav } from '__helpers/e2e/toggleNav.js'
import * as path from 'path'
import { fileURLToPath } from 'url'

import {
  ensureCompilationIsDone,
  getRoutes,
  initPageConsoleErrorCatch,
  saveDocAndAssert,
} from '../__helpers/e2e/helpers.js'
import { AdminUrlUtil } from '../__helpers/shared/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../__helpers/shared/initPayloadE2ENoConfig.js'
import { TEST_TIMEOUT_LONG } from '../playwright.config.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const postsSlug = 'hierarchy-posts'
const foldersSlug = 'hierarchy-folders'
const tagsSlug = 'hierarchy-tags'

test.describe('Hierarchy', () => {
  let page: Page
  let postURL: AdminUrlUtil
  let tagsURL: AdminUrlUtil
  let serverURL: string

  test.beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)

    const { serverURL: serverFromInit } = await initPayloadE2ENoConfig({ dirname })
    serverURL = serverFromInit
    postURL = new AdminUrlUtil(serverURL, postsSlug)
    tagsURL = new AdminUrlUtil(serverURL, tagsSlug)

    getRoutes({})

    const context = await browser.newContext()
    page = await context.newPage()
    initPageConsoleErrorCatch(page)
    await ensureCompilationIsDone({ page, serverURL })
  })

  test.describe('Folder Field - Single Select', () => {
    test('should show hierarchy button in doc controls', async () => {
      await page.goto(postURL.create)
      const hierarchyButton = page.locator('.doc-controls button').filter({ hasText: 'None' })
      await expect(hierarchyButton).toBeVisible()
    })

    test('should open Miller columns drawer when clicking hierarchy button', async () => {
      await page.goto(postURL.create)
      await page.locator('.doc-controls button', { hasText: 'None' }).click()

      const drawer = page.locator('dialog')
      await expect(drawer).toBeVisible()
      await expect(drawer.getByRole('heading', { name: 'Select a value' })).toBeVisible()
    })

    test('should show existing folders in Miller columns', async () => {
      await page.goto(postURL.create)
      await page.locator('.doc-controls button', { hasText: 'None' }).click()

      const drawer = page.locator('dialog')
      // From seed data
      await expect(drawer.getByRole('button', { name: 'Root Folder' })).toBeVisible()
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

      await page.locator('.doc-controls button', { hasText: 'None' }).click()
      const drawer = page.locator('dialog')

      const folderItem = drawer.locator('.hierarchy-column-item', { hasText: 'Root Folder' })
      const checkbox = folderItem.locator('.hierarchy-column-item__checkbox input')
      await checkbox.click()

      await expect(folderItem).toHaveClass(/--selected/)

      await drawer.locator('button', { hasText: 'Select' }).click()

      await expect(page.locator('.doc-controls button', { hasText: 'Root Folder' })).toBeVisible()
    })

    test('should cancel folder selection without changes', async () => {
      await page.goto(postURL.create)
      await page.locator('.doc-controls button', { hasText: 'None' }).click()

      const drawer = page.locator('dialog')

      await drawer.getByRole('button', { name: 'Root Folder' }).click()

      await drawer.getByRole('button', { name: 'Cancel' }).click()

      await expect(drawer).toBeHidden()

      await expect(page.locator('.doc-controls button', { hasText: 'None' })).toBeVisible()
    })

    test('should close drawer with close button', async () => {
      await page.goto(postURL.create)
      await page.locator('.doc-controls button', { hasText: 'None' }).click()

      const drawer = page.locator('dialog')
      await expect(drawer).toBeVisible()

      await drawer.getByRole('button', { name: 'Close' }).click()

      await expect(drawer).toBeHidden()
    })
  })

  test.describe('Collection Scoping', () => {
    test('should only show folders that accept the current collection type', async () => {
      await page.goto(postURL.create)
      await page.locator('.doc-controls button', { hasText: 'None' }).click()

      const drawer = page.locator('dialog')
      await expect(drawer).toBeVisible()

      // From seed: Posts Only Folder should be visible
      await expect(drawer.getByRole('button', { name: 'Posts Only Folder' })).toBeVisible()
    })

    test('should filter child folders by collection type', async () => {
      await page.goto(postURL.create)
      await page.locator('.doc-controls button', { hasText: 'None' }).click()

      const drawer = page.locator('dialog')

      // Expand Root Folder to see children
      await drawer.getByRole('button', { name: 'Root Folder' }).click()

      // Child Folder should be visible
      await expect(drawer.getByRole('button', { name: 'Child Folder' })).toBeVisible()
    })
  })

  test.describe('List View - Hierarchy Cell', () => {
    test('should show hierarchy cell with "None" for document without folder', async () => {
      await page.goto(postURL.create)
      const titleInput = page.locator('input[name="title"]')
      await titleInput.fill('Test Post Without Folder')
      await saveDocAndAssert(page)

      await page.goto(postURL.list)

      const row = page.locator('tbody tr', { hasText: 'Test Post Without Folder' })
      const folderCell = row.locator('.hierarchy-cell').first()
      await expect(folderCell).toBeVisible()
      await expect(folderCell.locator('.btn')).toHaveText('None')
    })

    test('should open drawer when clicking hierarchy cell button', async () => {
      await page.goto(postURL.create)
      const titleInput = page.locator('input[name="title"]')
      await titleInput.fill('Test Post For Drawer')
      await saveDocAndAssert(page)

      await page.goto(postURL.list)

      const row = page.locator('tbody tr', { hasText: 'Test Post For Drawer' })
      const button = row.locator('.hierarchy-cell').first().locator('.btn')
      await button.click()

      const drawer = page.locator('dialog')
      await expect(drawer).toBeVisible()
    })

    test('should update folder from list view via drawer', async () => {
      await page.goto(postURL.create)
      const titleInput = page.locator('input[name="title"]')
      await titleInput.fill('Test Post For Update')
      await saveDocAndAssert(page)

      await page.goto(postURL.list)

      const row = page.locator('tbody tr', { hasText: 'Test Post For Update' })
      const button = row.locator('.hierarchy-cell').first().locator('.btn')
      await button.click()

      const drawer = page.locator('dialog')
      const folderItem = drawer.locator('.hierarchy-column-item', { hasText: 'Root Folder' })
      const checkbox = folderItem.locator('.hierarchy-column-item__checkbox input')
      await checkbox.click()
      await expect(folderItem).toHaveClass(/--selected/)

      await drawer.locator('button', { hasText: 'Select' }).click()

      await expect(button).toHaveText('Root Folder')
    })
  })

  test.describe('Tree Sidebar', () => {
    test('should display taxonomy tree in sidebar for tags collection', async () => {
      await page.goto(tagsURL.list)
      await page.waitForURL(`**/${tagsSlug}`)

      await openNav(page)

      const taxonomySidebar = page.locator('.hierarchy-sidebar-tab')
      await expect(taxonomySidebar.locator('.tree')).toBeVisible()
    })

    test('should show tree nodes from seed data', async () => {
      await page.goto(tagsURL.list)
      await page.waitForURL(`**/${tagsSlug}`)

      await openNav(page)

      const tree = page.locator('.hierarchy-sidebar-tab .tree')
      await expect(tree).toBeVisible()

      const nodes = tree.locator('.tree-node')
      await expect(nodes.first()).toBeVisible({ timeout: 10000 })
    })

    test('should expand nodes to show children', async () => {
      await page.goto(tagsURL.list)
      await page.waitForURL(`**/${tagsSlug}`)

      await openNav(page)

      const tree = page.locator('.hierarchy-sidebar-tab .tree')
      const firstChevron = tree.locator('.tree-node__toggle').first()

      await expect(firstChevron).toBeVisible({ timeout: 10000 })
      await firstChevron.click()

      const childrenContainer = tree.locator('.tree-node__children').first()
      await expect(childrenContainer).toBeVisible({ timeout: 5000 })
    })

    test('should support arrow key navigation', async () => {
      await page.goto(tagsURL.list)
      await page.waitForURL(`**/${tagsSlug}`)

      await openNav(page)

      const tree = page.locator('.hierarchy-sidebar-tab .tree')
      await expect(tree).toBeVisible()

      await tree.focus()
      await page.keyboard.press('ArrowDown')

      const focusedElement = page.locator(':focus')
      await expect(focusedElement).toBeVisible()
    })
  })
})
