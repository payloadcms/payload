import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import { openNav } from '__helpers/e2e/toggleNav.js'
import path from 'path'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../__helpers/shared/sdk/index.js'
import type { Config, Organization } from './payload-types.js'

import { ensureCompilationIsDone, initPageConsoleErrorCatch } from '../__helpers/e2e/helpers.js'
import { AdminUrlUtil } from '../__helpers/shared/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../__helpers/shared/initPayloadE2ENoConfig.js'
import { TEST_TIMEOUT_LONG } from '../playwright.config.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

let payload: PayloadTestSDK<Config>
let serverURL: string

test.describe('Hierarchy Sidebar', () => {
  let page: Page
  let organizationsURL: AdminUrlUtil

  // Track created documents for cleanup
  const createdOrgIds: (number | string)[] = []
  const createdDeptIds: (number | string)[] = []

  test.beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)

    const { payload: payloadFromInit, serverURL: serverFromInit } =
      await initPayloadE2ENoConfig<Config>({ dirname })

    payload = payloadFromInit
    serverURL = serverFromInit
    organizationsURL = new AdminUrlUtil(serverURL, 'organizations')

    const context = await browser.newContext()
    page = await context.newPage()
    initPageConsoleErrorCatch(page)
    await ensureCompilationIsDone({ page, serverURL })
  })

  test.afterAll(async () => {
    // Clean up created documents
    for (const id of createdOrgIds) {
      await payload.delete({ id, collection: 'organizations' }).catch(() => {})
    }
    for (const id of createdDeptIds) {
      await payload.delete({ id, collection: 'departments' }).catch(() => {})
    }
  })

  test.describe('Tree Display', () => {
    test('should display hierarchy tree in sidebar', async () => {
      await page.goto(organizationsURL.list)
      await openNav(page)

      // Click on the Organizations tab
      await page.getByRole('tab', { name: 'Organizations' }).click()

      // Should see the tree
      const tree = page.getByRole('tree')
      await expect(tree).toBeVisible()

      // Should show Acme Corp from seed data
      await expect(tree.getByText('Acme Corp')).toBeVisible()
    })

    test('should expand nodes to show children', async () => {
      await page.goto(organizationsURL.list)
      await openNav(page)

      await page.getByRole('tab', { name: 'Organizations' }).click()

      const tree = page.getByRole('tree')
      await expect(tree).toBeVisible()

      // Find Acme Corp treeitem
      const acmeNode = tree.getByRole('treeitem', { name: 'Acme Corp' })
      await expect(acmeNode).toBeVisible()

      // Check if already expanded, if so collapse first
      if ((await acmeNode.getAttribute('aria-expanded')) === 'true') {
        await acmeNode.getByRole('button', { name: 'Collapse' }).first().click()
        await expect(tree.getByText('Engineering Division')).toBeHidden()
      }

      // Expand the node
      await acmeNode.getByRole('button', { name: 'Expand' }).first().click()

      // Should now see Engineering Division (child of Acme Corp)
      await expect(tree.getByText('Engineering Division')).toBeVisible()
    })

    test('should collapse expanded nodes', async () => {
      await page.goto(organizationsURL.list)
      await openNav(page)

      await page.getByRole('tab', { name: 'Organizations' }).click()

      const tree = page.getByRole('tree')
      await expect(tree).toBeVisible()

      // Find Acme Corp treeitem
      const acmeNode = tree.getByRole('treeitem', { name: 'Acme Corp' })

      // Ensure node is expanded
      if ((await acmeNode.getAttribute('aria-expanded')) !== 'true') {
        await acmeNode.getByRole('button', { name: 'Expand' }).first().click()
      }

      // Verify child is visible
      await expect(tree.getByText('Engineering Division')).toBeVisible()

      // Collapse
      await acmeNode.getByRole('button', { name: 'Collapse' }).first().click()

      // Child should be hidden
      await expect(tree.getByText('Engineering Division')).toBeHidden()
    })
  })

  test.describe('Tab Isolation', () => {
    test('should maintain separate expanded state per tab', async () => {
      await page.goto(organizationsURL.list)
      await openNav(page)

      // Expand nodes in Organizations tab
      await page.getByRole('tab', { name: 'Organizations' }).click()
      const orgTree = page.getByRole('tree')
      await expect(orgTree).toBeVisible()

      // Ensure Acme Corp is expanded
      const acmeNode = orgTree.getByRole('treeitem', { name: 'Acme Corp' })
      if ((await acmeNode.getAttribute('aria-expanded')) !== 'true') {
        await acmeNode.getByRole('button', { name: 'Expand' }).first().click()
      }
      await expect(orgTree.getByText('Engineering Division')).toBeVisible()

      // Switch to Departments tab
      await page.getByRole('tab', { name: 'Departments' }).click()

      // Wait for departments tree to be visible
      const deptTree = page.getByRole('tree')
      await expect(deptTree).toBeVisible()

      // Departments tree should have its own state - HR should be visible
      const hrNode = deptTree.getByRole('treeitem', { name: 'Human Resources' })
      await expect(hrNode).toBeVisible()

      // Collapse HR if expanded, then verify Benefits is hidden
      if ((await hrNode.getAttribute('aria-expanded')) === 'true') {
        await hrNode.getByRole('button', { name: 'Collapse' }).first().click()
      }
      await expect(deptTree.getByText('Benefits')).toBeHidden()

      // Switch back to Organizations - should still be expanded (independent state)
      await page.getByRole('tab', { name: 'Organizations' }).click()
      await expect(page.getByRole('tree').getByText('Engineering Division')).toBeVisible()
    })
  })

  test.describe('Selection State', () => {
    let testOrg: Organization

    test.beforeAll(async () => {
      // Create a test organization for selection tests
      testOrg = await payload.create({
        collection: 'organizations',
        data: { title: 'Selection Test Org' },
      })
      createdOrgIds.push(testOrg.id)
    })

    test('should highlight selected node when filtering by parent', async () => {
      await page.goto(`${organizationsURL.list}?parent=${testOrg.id}`)
      await openNav(page)

      await page.getByRole('tab', { name: 'Organizations' }).click()

      const tree = page.getByRole('tree')

      // The node should be marked as selected via aria-selected
      const selectedNode = tree.getByRole('treeitem', { name: 'Selection Test Org' })
      await expect(selectedNode).toBeVisible()
      await expect(selectedNode).toHaveAttribute('aria-selected', 'true')
    })

    test('should not highlight nodes in other tabs when filtering', async () => {
      // Navigate to organizations with a parent filter
      await page.goto(`${organizationsURL.list}?parent=${testOrg.id}`)
      await openNav(page)

      // Check Organizations tab - node should be selected
      await page.getByRole('tab', { name: 'Organizations' }).click()
      const orgTree = page.getByRole('tree')
      const selectedOrgNode = orgTree.getByRole('treeitem', { name: 'Selection Test Org' })
      await expect(selectedOrgNode).toHaveAttribute('aria-selected', 'true')

      // Switch to Departments tab - no node should be selected
      await page.getByRole('tab', { name: 'Departments' }).click()
      const deptTree = page.getByRole('tree')
      await expect(deptTree).toBeVisible()

      // HR should be visible but NOT selected (filter doesn't apply to this tab)
      const hrNode = deptTree.getByRole('treeitem', { name: 'Human Resources' })
      await expect(hrNode).toBeVisible()
      await expect(hrNode).toHaveAttribute('aria-selected', 'false')
    })
  })

  test.describe('Navigation', () => {
    test('should navigate to children when clicking a tree node', async () => {
      await page.goto(organizationsURL.list)
      await openNav(page)

      await page.getByRole('tab', { name: 'Organizations' }).click()

      const tree = page.getByRole('tree')

      // Click on the Acme Corp text (not the expand button)
      await tree.getByText('Acme Corp').click()

      // URL should update with parent parameter
      await expect(page).toHaveURL(/parent=/)
    })
  })

  test.describe('Search', () => {
    test('should search within hierarchy', async () => {
      await page.goto(organizationsURL.list)
      await openNav(page)

      await page.getByRole('tab', { name: 'Organizations' }).click()

      // Find and use search input
      const searchInput = page.getByPlaceholder('Search Organizations')
      await searchInput.fill('Engineering')
      await searchInput.press('Enter')

      // Tree should be hidden during search
      await expect(page.getByRole('tree')).toBeHidden()

      // Search results should appear with matching item as a clickable button
      const resultButton = page.getByRole('button', { name: /Engineering Division/ })
      await expect(resultButton).toBeVisible()
    })

    test('should clear search and return to tree', async () => {
      await page.goto(organizationsURL.list)
      await openNav(page)

      await page.getByRole('tab', { name: 'Organizations' }).click()

      const searchInput = page.getByPlaceholder('Search Organizations')

      // Perform search
      await searchInput.fill('Engineering')
      await searchInput.press('Enter')

      // Wait for tree to be hidden
      await expect(page.getByRole('tree')).toBeHidden()

      // Clear search
      const clearButton = page.getByRole('button', { name: 'Clear search' })
      await clearButton.click()

      // Tree should be visible again
      await expect(page.getByRole('tree')).toBeVisible()
    })
  })

  test.describe('Collection Filter', () => {
    let foldersURL: AdminUrlUtil

    test.beforeAll(() => {
      foldersURL = new AdminUrlUtil(serverURL, 'folders')
    })

    test('should show filter button when collectionSpecific is configured', async () => {
      await page.goto(foldersURL.list)
      await openNav(page)

      await page.getByRole('tab', { name: 'Folders' }).click()

      // Filter button should be visible
      const filterButton = page.getByRole('button', { name: 'Filter by collection type' })
      await expect(filterButton).toBeVisible()
    })

    test('should show collection options in filter popup', async () => {
      await page.goto(foldersURL.list)
      await openNav(page)

      await page.getByRole('tab', { name: 'Folders' }).click()

      // Click filter button in sidebar (use tabpanel to scope to sidebar)
      const sidebar = page.getByRole('tabpanel')
      await sidebar.getByRole('button', { name: 'Filter by collection type' }).click()

      // Should show collection options (based on what collections reference folders)
      // Popup content is rendered in a portal, use role-based selectors
      await expect(page.getByRole('checkbox', { name: 'Organizations' })).toBeVisible()
      await expect(page.getByRole('checkbox', { name: 'Products' })).toBeVisible()
    })

    test('should filter tree by selected collection type', async () => {
      await page.goto(foldersURL.list)
      await openNav(page)

      await page.getByRole('tab', { name: 'Folders' }).click()

      const sidebar = page.getByRole('tabpanel')
      const tree = page.getByRole('tree')

      // Initially should see all folders
      await expect(tree.getByText('General')).toBeVisible()
      await expect(tree.getByText('Orgs Only')).toBeVisible()
      await expect(tree.getByText('Products Only')).toBeVisible()

      // Open filter and select Organizations
      await sidebar.getByRole('button', { name: 'Filter by collection type' }).click()

      // Wait for checkbox to be visible before clicking
      const orgCheckbox = page.getByRole('checkbox', { name: 'Organizations' })
      await expect(orgCheckbox).toBeVisible()
      await orgCheckbox.click()

      // Close popup by pressing Escape
      await page.keyboard.press('Escape')

      // Wait for Products Only to be hidden (filter applied)
      await expect(tree.getByText('Products Only')).toBeHidden({ timeout: 10000 })

      // Should show folders that accept Organizations
      await expect(tree.getByText('Orgs Only')).toBeVisible()
      await expect(tree.getByText('Orgs and Products')).toBeVisible()
    })

    test('should clear filter and show all folders', async () => {
      await page.goto(foldersURL.list)
      await openNav(page)

      await page.getByRole('tab', { name: 'Folders' }).click()

      const sidebar = page.getByRole('tabpanel')
      const tree = page.getByRole('tree')

      // Apply a filter first
      await sidebar.getByRole('button', { name: 'Filter by collection type' }).click()
      await page.getByRole('checkbox', { name: 'Products' }).click()
      await page.keyboard.press('Escape')

      // Verify filter is applied
      await expect(tree.getByText('Orgs Only')).toBeHidden()

      // Clear filter by deselecting
      await sidebar.getByRole('button', { name: 'Filter by collection type' }).click()
      await page.getByRole('checkbox', { name: 'Products' }).click()
      await page.keyboard.press('Escape')

      // All folders should be visible again
      await expect(tree.getByText('General')).toBeVisible()
      await expect(tree.getByText('Orgs Only')).toBeVisible()
      await expect(tree.getByText('Products Only')).toBeVisible()
    })
  })
})
