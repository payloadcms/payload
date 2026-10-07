import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../__helpers/shared/sdk/index.js'
import type { Config, Organization } from './payload-types.js'

import { getSelectMenu } from '../__helpers/e2e/selectInput.js'
import { openNav } from '../__helpers/e2e/toggleNav.js'
import { AdminUrlUtil } from '../__helpers/shared/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../__helpers/shared/initPayloadE2ENoConfig.js'
import { initPage } from '../__setup/e2e/initPage.js'
import { TEST_TIMEOUT_LONG } from '../playwright.config.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

/**
 * Safely set a hierarchy filter option to checked or unchecked state.
 * Opens the filter dropdown, checks current state, only toggles if needed, then closes.
 */
async function setHierarchyFilter({
  checked,
  filterName,
  page,
  sidebar,
}: {
  checked: boolean
  filterName: string
  page: Page
  sidebar: ReturnType<Page['locator']>
}): Promise<void> {
  await sidebar.locator('.hierarchy-search__filter').click()
  const filterButton = page.locator('.popup__content .popup-button-list__button', {
    hasText: filterName,
  })
  await expect(filterButton).toBeVisible()

  const isCurrentlyChecked = await filterButton.evaluate((el) =>
    el.classList.contains('popup-button-list__button--selected'),
  )
  if (isCurrentlyChecked !== checked) {
    const preferenceUpdate = page.waitForResponse(
      (response) =>
        response.url().includes('/api/payload-preferences/hierarchy-tree-') &&
        response.request().method() === 'POST' &&
        response.ok(),
    )
    await filterButton.click()
    await preferenceUpdate
  }

  await page.keyboard.press('Escape')
}

async function openMoveModalFromAssignedHierarchy({
  button,
  page,
}: {
  button: ReturnType<Page['getByRole']>
  page: Page
}): Promise<void> {
  await button.click()

  const moveAction = page.getByRole('menuitem', { name: 'Move to...' })

  await expect(moveAction).toBeVisible()
  await moveAction.click()
}

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
    ;({ page } = await initPage({ context, serverURL }))
  })

  test.afterAll(async () => {
    // Clean up created documents
    for (const id of createdOrgIds) {
      await payload
        .delete({ id, collection: 'organizations', overrideAccess: true })
        .catch(() => {})
    }
    for (const id of createdDeptIds) {
      await payload.delete({ id, collection: 'departments', overrideAccess: true }).catch(() => {})
    }
  })

  test.describe('Document layouts', () => {
    test.afterEach(async () => {
      await page.goto(organizationsURL.hierarchy)
      const tableLayout = page.getByRole('radio', { name: 'Table' })

      if (!(await tableLayout.isChecked())) {
        const tablePreferenceSaved = page.waitForResponse(
          (response) =>
            response.url().includes('/api/payload-preferences/collection-organizations') &&
            response.request().method() === 'POST' &&
            response.ok(),
        )

        await tableLayout.click()
        await tablePreferenceSaved
      }

      await page.getByRole('button', { name: 'All Organizations' }).click()
    })

    test('should keep the grid layout across All and By Organization views and navigate from a card link', async () => {
      await page.goto(organizationsURL.hierarchy)

      const gridPreferenceSaved = page.waitForResponse(
        (response) =>
          response.url().includes('/api/payload-preferences/collection-organizations') &&
          response.request().method() === 'POST' &&
          response.ok(),
      )

      await page.getByRole('radio', { name: 'Grid' }).click()
      await gridPreferenceSaved
      await expect(page.getByRole('list', { name: 'Organizations' })).toBeVisible()
      await expect(page.locator('.table-section__header-inner .checkbox-input')).toHaveCount(0)

      await page.getByRole('button', { name: 'All Organizations' }).click()
      await expect(page).toHaveURL(/\/admin\/collections\/organizations\?view=all/)
      await expect(page.getByRole('radio', { name: 'Grid' })).toBeChecked()
      await expect(page.getByRole('list', { name: 'Organizations' })).toBeVisible()

      await page.getByRole('button', { name: 'By Organization' }).click()
      await expect(page).toHaveURL(/\/admin\/collections\/organizations\?view=hierarchy/)
      await expect(page.getByRole('radio', { name: 'Grid' })).toBeChecked()

      await page.goBack()
      await expect(page).toHaveURL(/\/admin\/collections\/organizations\?view=all/)
      await expect(page.getByRole('button', { name: 'All Organizations' })).toBeDisabled()

      await page.goForward()
      await expect(page).toHaveURL(/\/admin\/collections\/organizations\?view=hierarchy/)

      await page.goto(organizationsURL.list)
      await expect(page).toHaveURL(organizationsURL.list)
      await expect(page.getByRole('button', { name: 'By Organization' })).toBeDisabled()

      const acmeCard = page.locator('.document-card', { hasText: 'Acme Corp' })

      await acmeCard.click()
      await expect(acmeCard).toHaveAttribute('aria-pressed', 'true')

      await acmeCard.getByRole('link', { name: 'Acme Corp', exact: true }).press('Enter')
      await expect(page.getByRole('heading', { name: 'Acme Corp' })).toBeVisible()
      await expect(page.getByRole('list', { name: 'Organizations' })).toBeVisible()
    })

    test('should open a hierarchy item from the All view in table layout', async () => {
      await page.goto(`${organizationsURL.list}?view=all`)

      const acmeLink = page.getByRole('link', { name: 'Acme Corp', exact: true })

      await acmeLink.click()
      await expect(page).toHaveURL(/[?&]view=hierarchy(?:&|$)/)
      await expect(page).toHaveURL(/[?&]parent=[^&]+/)
      await expect(page.getByRole('heading', { name: 'Acme Corp' })).toBeVisible()
    })

    test('should open a hierarchy item from the All view in grid layout', async () => {
      await page.goto(`${organizationsURL.list}?view=all`)

      const gridPreferenceSaved = page.waitForResponse(
        (response) =>
          response.url().includes('/api/payload-preferences/collection-organizations') &&
          response.request().method() === 'POST' &&
          response.ok(),
      )

      await page.getByRole('radio', { name: 'Grid' }).click()
      await gridPreferenceSaved

      const acmeCard = page.locator('.document-card', { hasText: 'Acme Corp' })
      const acmeLink = acmeCard.getByRole('link', { name: 'Acme Corp', exact: true })

      await expect(acmeLink).toHaveAttribute('href', /[?&]view=hierarchy(?:&|$)/)
      await expect(acmeLink).toHaveAttribute('href', /[?&]parent=[^&]+/)
      await acmeCard.dblclick()
      await expect(page).toHaveURL(/[?&]view=hierarchy(?:&|$)/)
      await expect(page).toHaveURL(/[?&]parent=[^&]+/)
      await expect(page.getByRole('heading', { name: 'Acme Corp' })).toBeVisible()
    })

    test('should preserve the hierarchy view while navigating through hierarchy items', async () => {
      await page.goto(organizationsURL.hierarchy)

      const tableLayout = page.getByRole('radio', { name: 'Table' })

      if (!(await tableLayout.isChecked())) {
        const tablePreferenceSaved = page.waitForResponse(
          (response) =>
            response.url().includes('/api/payload-preferences/collection-organizations') &&
            response.request().method() === 'POST' &&
            response.ok(),
        )

        await tableLayout.click()
        await tablePreferenceSaved
      }

      const acmeLink = page.getByRole('link', { name: 'Acme Corp', exact: true })

      await expect(acmeLink).toHaveAttribute('href', /[?&]view=hierarchy(?:&|$)/)
      await acmeLink.click()
      await expect(page).toHaveURL(/[?&]view=hierarchy(?:&|$)/)
      await expect(page.getByRole('heading', { name: 'Acme Corp' })).toBeVisible()

      const gridLayout = page.getByRole('radio', { name: 'Grid' })

      if (!(await gridLayout.isChecked())) {
        const gridPreferenceSaved = page.waitForResponse(
          (response) =>
            response.url().includes('/api/payload-preferences/collection-organizations') &&
            response.request().method() === 'POST' &&
            response.ok(),
        )

        await gridLayout.click()
        await gridPreferenceSaved
      }

      const engineeringLink = page.getByRole('link', {
        name: 'Engineering Division',
        exact: true,
      })

      await expect(engineeringLink).toHaveAttribute('href', /[?&]view=hierarchy(?:&|$)/)
      await engineeringLink.press('Enter')
      await expect(page).toHaveURL(/[?&]view=hierarchy(?:&|$)/)
      await expect(page.getByRole('heading', { name: 'Engineering Division' })).toBeVisible()
    })
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

      // Find Acme Corp treeitem (name includes "Open" or "Collapse" prefix)
      const acmeNode = tree.getByRole('treeitem', { name: /Acme Corp/ })
      await expect(acmeNode).toBeVisible()

      // Check if already expanded, if so collapse first
      if ((await acmeNode.getAttribute('aria-expanded')) === 'true') {
        await acmeNode.getByRole('button', { name: 'Collapse' }).first().click()
        await expect(tree.getByText('Engineering Division')).toBeHidden()
      }

      // Expand the node
      await acmeNode.getByRole('button', { name: 'Open' }).first().click()

      // Should now see Engineering Division (child of Acme Corp)
      await expect(tree.getByText('Engineering Division')).toBeVisible()
    })

    test('should collapse expanded nodes', async () => {
      await page.goto(organizationsURL.list)
      await openNav(page)

      await page.getByRole('tab', { name: 'Organizations' }).click()

      const tree = page.getByRole('tree')
      await expect(tree).toBeVisible()

      // Find Acme Corp treeitem (name includes "Open" or "Collapse" prefix)
      const acmeNode = tree.getByRole('treeitem', { name: /Acme Corp/ })

      // Ensure node is expanded
      if ((await acmeNode.getAttribute('aria-expanded')) !== 'true') {
        await acmeNode.getByRole('button', { name: 'Open' }).first().click()
      }

      // Verify child is visible
      await expect(tree.getByText('Engineering Division')).toBeVisible()

      // Collapse
      await acmeNode.getByRole('button', { name: 'Collapse' }).first().click()

      // Child should be hidden
      await expect(tree.getByText('Engineering Division')).toBeHidden()
    })

    test('should navigate tree via keyboard and load more with Enter without navigation', async () => {
      const prefs = await payload.find({
        collection: 'payload-preferences',
        overrideAccess: true,
        where: { key: { equals: 'hierarchy-tree-divisions' } },
      })
      for (const pref of prefs.docs) {
        await payload.delete({
          id: pref.id,
          collection: 'payload-preferences',
          overrideAccess: true,
        })
      }

      await page.goto(`${serverURL}/admin`)
      await openNav(page)
      await page.getByRole('tab', { name: 'Divisions' }).click()

      const tree = page.getByRole('tree')
      await expect(tree).toBeVisible()

      const getActiveText = async () =>
        page.evaluate(() => (document.activeElement?.textContent || '').trim())

      const getActiveClass = async () =>
        page.evaluate(() => (document.activeElement?.className || '').toString())

      // Focus the first tree node, then close/open with arrows for deterministic keyboard flow
      const alphaNode = tree.locator('.tree-node').first()
      await expect(alphaNode).toBeVisible()
      await alphaNode.focus()
      await expect.poll(getActiveText).toContain('Alpha Division')
      await page.keyboard.press('ArrowLeft')
      await expect(alphaNode).toHaveAttribute('aria-expanded', 'false')

      // Open Alpha Division with ArrowRight, then navigate vertically through its children
      await page.keyboard.press('ArrowRight')
      await expect(alphaNode).toHaveAttribute('aria-expanded', 'true')
      await expect(tree.getByText('Alpha Child 1')).toBeVisible()
      await page.keyboard.press('ArrowDown')
      await expect.poll(getActiveText).toContain('Alpha Child 1')
      await page.keyboard.press('ArrowDown')
      await expect.poll(getActiveText).toContain('Alpha Child 2')
      await page.keyboard.press('ArrowDown')
      await expect.poll(getActiveText).toContain('Alpha Child 3')
      await page.keyboard.press('ArrowDown')
      await expect.poll(getActiveClass).toContain('tree__load-more-button')

      // Enter should load more children, not navigate
      const urlBefore = page.url()
      await page.keyboard.press('Enter')
      await expect(page).toHaveURL(urlBefore)
      await expect(tree.getByText('Alpha Child 4')).toBeVisible()
      await expect
        .poll(() => page.evaluate(() => document.activeElement?.getAttribute('aria-level')))
        .toBe('2')

      // Continue vertical navigation to the next root sibling after the newly loaded child
      await page.keyboard.press('ArrowDown')
      await expect.poll(getActiveText).toContain('Beta Division')
    })
  })

  test.describe('Sidebar Tab Visibility', () => {
    test('should not show tab for collections with injectSidebarTab: false', async () => {
      await page.goto(organizationsURL.list)
      await openNav(page)

      // These collections should have tabs (default injectSidebarTab: true)
      await expect(page.getByRole('tab', { name: 'Organizations' })).toBeVisible()
      await expect(page.getByRole('tab', { name: 'Departments' })).toBeVisible()
      await expect(page.getByRole('tab', { name: 'Folders' })).toBeVisible()
      await expect(page.getByRole('tab', { name: 'Products' })).toBeVisible()

      // Categories has injectSidebarTab: false, should NOT have a tab
      await expect(page.getByRole('tab', { name: 'Categories' })).toBeHidden()
    })

    test('should show collection with injectSidebarTab: false in nav', async () => {
      await page.goto(organizationsURL.list)
      await openNav(page)

      // Categories should appear in the default nav (injectSidebarTab: false means no sidebar tab, so appears in nav)
      const navTab = page.getByRole('tab', { name: 'Collections' })
      await navTab.click()

      // Should see Categories in the collections list (it has injectSidebarTab: false)
      await expect(page.getByRole('link', { name: 'Categories' })).toBeVisible()

      // Collections with sidebar tabs should NOT appear in nav (auto-hidden)
      await expect(page.getByRole('link', { name: 'Organizations' })).toBeHidden()
      await expect(page.getByRole('link', { name: 'Departments' })).toBeHidden()
      await expect(page.getByRole('link', { name: 'Products' })).toBeHidden()
      await expect(page.getByRole('link', { name: 'Folders' })).toBeHidden()
    })

    test('should show collection in both nav and sidebar tab when group is explicitly set', async () => {
      await page.goto(organizationsURL.list)
      await openNav(page)

      // Regions has explicit group: 'Geography', so it appears in nav
      const navTab = page.getByRole('tab', { name: 'Collections' })
      await navTab.click()

      // Should see Regions in the Geography group
      await expect(page.getByRole('link', { name: 'Regions' })).toBeVisible()

      // Regions should ALSO have a sidebar tab (injectSidebarTab defaults to true)
      await expect(page.getByRole('tab', { name: 'Regions' })).toBeVisible()
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

      // Ensure Acme Corp is expanded (treeitem name includes "Open" or "Collapse" prefix)
      const acmeNode = orgTree.getByRole('treeitem', { name: /Acme Corp/ })
      if ((await acmeNode.getAttribute('aria-expanded')) !== 'true') {
        await acmeNode.getByRole('button', { name: 'Open' }).first().click()
      }
      await expect(orgTree.getByText('Engineering Division')).toBeVisible()

      // Switch to Departments tab
      await page.getByRole('tab', { name: 'Departments' }).click()

      // Wait for departments tree to be visible
      const deptTree = page.getByRole('tree')
      await expect(deptTree).toBeVisible()

      // Departments tree should have its own state - HR should be visible
      const hrNode = deptTree.getByRole('treeitem', { name: /Human Resources/ })
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
        overrideAccess: true,
      })
      createdOrgIds.push(testOrg.id)
    })

    test('should highlight selected node when filtering by parent', async () => {
      await page.goto(`${organizationsURL.list}?parent=${testOrg.id}`)
      await openNav(page)

      await page.getByRole('tab', { name: 'Organizations' }).click()

      const tree = page.getByRole('tree')

      // The node should be marked as selected via aria-selected
      const selectedNode = tree.getByRole('treeitem', { name: /Selection Test Org/ })
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
      const selectedOrgNode = orgTree.getByRole('treeitem', { name: /Selection Test Org/ })
      await expect(selectedOrgNode).toHaveAttribute('aria-selected', 'true')

      // Switch to Departments tab - no node should be selected
      await page.getByRole('tab', { name: 'Departments' }).click()
      const deptTree = page.getByRole('tree')
      await expect(deptTree).toBeVisible()

      // HR should be visible but NOT selected (filter doesn't apply to this tab)
      const hrNode = deptTree.getByRole('treeitem', { name: /Human Resources/ })
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

      const preferenceUpdate = page.waitForResponse(
        (response) =>
          response.url().endsWith('/api/payload-preferences/nav-sidebar-active-tab') &&
          response.request().method() === 'POST' &&
          response.ok(),
      )
      await page.getByRole('tab', { name: 'Organizations' }).click()
      await preferenceUpdate

      // Find and use search input
      const searchInput = page.getByPlaceholder('Search Organizations')
      await searchInput.fill('Engineering')
      await searchInput.press('Enter')

      // Tree should be hidden during search
      await expect(page.getByRole('tree')).toBeHidden()

      // Search results should appear with matching item as a clickable button in sidebar
      const sidebar = page.getByRole('tabpanel')
      const resultButton = sidebar.getByRole('button', { name: /Engineering Division/ })
      await expect(resultButton).toBeVisible()
    })

    test('should clear search and return to tree', async () => {
      await page.goto(organizationsURL.list)
      await openNav(page)

      const preferenceUpdate = page.waitForResponse(
        (response) =>
          response.url().endsWith('/api/payload-preferences/nav-sidebar-active-tab') &&
          response.request().method() === 'POST' &&
          response.ok(),
      )
      await page.getByRole('tab', { name: 'Organizations' }).click()
      await preferenceUpdate

      const searchInput = page.getByPlaceholder('Search Organizations')
      const clearButton = page.getByRole('button', { name: 'Clear' })

      // Perform search
      await searchInput.fill('Engineering')
      await expect(clearButton).toBeVisible()
      await searchInput.press('Enter')

      // Wait for tree to be hidden
      await expect(page.getByRole('tree')).toBeHidden()

      // Clear search (aria-label is t('general:clear') = "Clear")
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

    test.beforeEach(async () => {
      // Clear folder tree preferences to ensure clean filter state
      const prefs = await payload.find({
        collection: 'payload-preferences',
        overrideAccess: true,
        where: { key: { equals: 'hierarchy-tree-folders' } },
      })
      for (const pref of prefs.docs) {
        await payload.delete({
          id: pref.id,
          collection: 'payload-preferences',
          overrideAccess: true,
        })
      }
    })

    test('should restrict hierarchy field dropdown options by document collection', async () => {
      await page.goto(organizationsURL.create)

      const field = page.locator('#field-restrictedFolder')

      await field.locator('.rs__control').click()

      const menu = getSelectMenu({ page })

      await expect(menu.getByRole('option', { name: 'General', exact: true })).toBeVisible()
      await expect(menu.getByRole('option', { name: 'Orgs Only', exact: true })).toBeVisible()
      await expect(
        menu.getByRole('option', { name: 'Orgs and Products', exact: true }),
      ).toBeVisible()
      await expect(menu.getByRole('option', { name: 'Products Only', exact: true })).toHaveCount(0)
    })

    test.describe('Autosave create drawer', () => {
      let organizationTitle: string

      test.afterEach(async () => {
        const createdOrganizations = await payload.find({
          collection: 'organizations',
          draft: true,
          overrideAccess: true,
          where: { title: { equals: organizationTitle } },
        })

        for (const organization of createdOrganizations.docs) {
          await payload.delete({
            id: organization.id,
            collection: 'organizations',
            overrideAccess: true,
          })
        }
      })

      test('should keep autosave drawer open when creating an allowed document in a folder hierarchy', async () => {
        test.setTimeout(TEST_TIMEOUT_LONG)
        organizationTitle = `Autosave Organization ${Date.now()}`

        const multiTypeFolders = await payload.find({
          collection: 'folders',
          limit: 1,
          overrideAccess: true,
          where: { name: { equals: 'Orgs and Products' } },
        })
        const multiTypeFolder = multiTypeFolders.docs[0]

        await page.goto(organizationsURL.list)
        await page.goto(`${foldersURL.hierarchy}&parentFolder=${multiTypeFolder.id}`)

        const listControls = page.locator('.hierarchy-list__controls')
        const createButton = listControls.getByRole('button', { name: 'Create New' }).first()

        await createButton.click()
        await expect(createButton).toHaveClass(/btn--selected/)

        await expect(
          page.getByRole('menuitem', { name: 'Organization', exact: true }),
        ).toBeVisible()
        await expect(page.getByRole('menuitem', { name: 'Product', exact: true })).toBeVisible()
        await page.getByRole('menuitem', { name: 'Organization', exact: true }).click()

        const drawer = page.locator('#hierarchy-create-folders')
        const titleInput = drawer.locator('#field-title')

        await expect(drawer).toBeVisible()
        await titleInput.fill(organizationTitle)

        await expect
          .poll(async () => {
            const autosavedOrganizations = await payload.find({
              collection: 'organizations',
              depth: 0,
              draft: true,
              overrideAccess: true,
              where: { title: { equals: organizationTitle } },
            })

            return autosavedOrganizations.docs[0]?.parentFolder
          })
          .toBe(multiTypeFolder.id)

        await expect(drawer).toBeVisible()
        await expect(titleInput).toHaveValue(organizationTitle)
        await drawer.locator('.doc-drawer__header-close').click()
        await expect(drawer).toBeHidden()
      })
    })

    test('should show filter button when collectionSpecific is configured', async () => {
      await page.goto(foldersURL.list)
      await openNav(page)

      await page.getByRole('tab', { name: 'Folders' }).click()

      // Filter button should be visible (it's a div with aria-label="Filter")
      const filterButton = page.locator('.hierarchy-search__filter')
      await expect(filterButton).toBeVisible()
    })

    test('should show collection options in filter popup', async () => {
      await page.goto(foldersURL.list)
      await openNav(page)

      await page.getByRole('tab', { name: 'Folders' }).click()

      // Click filter button in sidebar
      const sidebar = page.getByRole('tabpanel')
      await sidebar.locator('.hierarchy-search__filter').click()

      // Should show collection options (based on what collections reference folders)
      // Popup content is rendered in a portal, use class-based selectors for PopupList.Button
      await expect(
        page.locator('.popup__content .popup-button-list__button', { hasText: 'Organizations' }),
      ).toBeVisible()
      await expect(
        page.locator('.popup__content .popup-button-list__button', { hasText: 'Products' }),
      ).toBeVisible()
    })

    test('should translate the allowed types field label', async () => {
      await page.goto(`${serverURL}/admin/account`)

      const languageField = page.locator('.payload-settings__language .react-select')

      await languageField.click()
      await page.locator('.rs__option', { hasText: 'Español' }).click()
      await page.waitForTimeout(500)

      try {
        await page.goto(foldersURL.create)

        await expect(
          page.getByRole('combobox', { name: 'Tipos permitidos', exact: true }),
        ).toBeVisible()
      } finally {
        await page.goto(`${serverURL}/admin/account`)
        await languageField.click()
        await page.locator('.rs__option', { hasText: 'English' }).click()
        await page.waitForTimeout(500)
      }
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
      await expect(tree.getByText('Products Only', { exact: true })).toBeVisible()

      // Open filter and select Organizations
      await setHierarchyFilter({ checked: true, filterName: 'Organizations', page, sidebar })

      // Wait for Products Only to be hidden (filter applied)
      await expect(tree.getByText('Products Only', { exact: true })).toBeHidden()

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
      await setHierarchyFilter({ checked: true, filterName: 'Products', page, sidebar })

      // Verify filter is applied
      await expect(tree.getByText('Orgs Only')).toBeHidden()

      // Clear filter by deselecting
      await setHierarchyFilter({ checked: false, filterName: 'Products', page, sidebar })

      // All folders should be visible again
      await expect(tree.getByText('General')).toBeVisible()
      await expect(tree.getByText('Orgs Only')).toBeVisible()
      await expect(tree.getByText('Products Only', { exact: true })).toBeVisible()
    })

    test('should show incompatible move destinations as disabled', async () => {
      await page.goto(foldersURL.hierarchy)

      const selectedFolderRow = page.locator('tr', { hasText: 'Orgs and Products' })

      await selectedFolderRow.getByRole('checkbox').click()
      await page.getByRole('button', { name: 'Move', exact: true }).click()

      const modal = page.locator('.hierarchy-modal')
      const generalFolder = modal.locator('.hierarchy-column-item', { hasText: 'General' })
      const organizationsFolder = modal.locator('.hierarchy-column-item', {
        hasText: 'Orgs Only',
      })
      const productsFolder = modal.locator('.hierarchy-column-item', {
        hasText: 'Products Only',
      })
      const selectedFolder = modal.locator('.hierarchy-column-item', {
        hasText: 'Orgs and Products',
      })

      await expect(modal).toBeVisible()
      await expect(generalFolder).toBeVisible()
      await expect(organizationsFolder).toBeVisible()
      await expect(productsFolder).toBeVisible()
      await expect(selectedFolder).toBeVisible()
      await expect(generalFolder.getByRole('checkbox')).toBeEnabled()
      await expect(organizationsFolder.getByRole('checkbox')).toBeDisabled()
      await expect(productsFolder.getByRole('checkbox')).toBeDisabled()
      await expect(selectedFolder.getByRole('checkbox')).toBeDisabled()
      await expect(generalFolder).not.toHaveAttribute('aria-disabled')
      await expect(organizationsFolder).toHaveAttribute('aria-disabled', 'true')
      await expect(productsFolder).toHaveAttribute('aria-disabled', 'true')
      await expect(selectedFolder).toHaveAttribute('aria-disabled', 'true')

      await organizationsFolder.press('Enter')
      await expect(modal.locator('.hierarchy-column')).toHaveCount(1)
    })

    test('should disable scoped destinations when moving an unrestricted folder', async () => {
      await page.goto(foldersURL.hierarchy)

      const selectedFolderRow = page.locator('tr', { hasText: 'General' })

      await selectedFolderRow.getByRole('checkbox').click()
      await page.getByRole('button', { name: 'Move', exact: true }).click()

      const modal = page.locator('.hierarchy-modal')
      const generalFolder = modal.locator('.hierarchy-column-item', { hasText: 'General' })
      const organizationsFolder = modal.locator('.hierarchy-column-item', {
        hasText: 'Orgs Only',
      })
      const organizationsAndProductsFolder = modal.locator('.hierarchy-column-item', {
        hasText: 'Orgs and Products',
      })
      const productsFolder = modal.locator('.hierarchy-column-item', {
        hasText: 'Products Only',
      })

      await expect(modal).toBeVisible()
      await expect(generalFolder.getByRole('checkbox')).toBeDisabled()
      await expect(organizationsFolder.getByRole('checkbox')).toBeDisabled()
      await expect(organizationsAndProductsFolder.getByRole('checkbox')).toBeDisabled()
      await expect(productsFolder.getByRole('checkbox')).toBeDisabled()
      await expect(generalFolder).toHaveAttribute('aria-disabled', 'true')
      await expect(organizationsFolder).toHaveAttribute('aria-disabled', 'true')
      await expect(organizationsAndProductsFolder).toHaveAttribute('aria-disabled', 'true')
      await expect(productsFolder).toHaveAttribute('aria-disabled', 'true')

      await organizationsFolder.press('Enter')
      await expect(modal.locator('.hierarchy-column')).toHaveCount(1)
    })

    test('should allow an unrestricted folder beneath a destination that allows every collection type', async () => {
      const allTypesFolder = await payload.create({
        collection: 'folders',
        data: {
          name: 'All Types',
          allowedTypes: ['folder-tag-documents', 'organizations', 'products'],
        },
        overrideAccess: true,
      })

      try {
        await page.goto(foldersURL.hierarchy)

        await page.locator('tr', { hasText: 'General' }).getByRole('checkbox').click()
        await page.getByRole('button', { name: 'Move', exact: true }).click()

        const modal = page.locator('.hierarchy-modal')
        const allTypesDestination = modal.locator('.hierarchy-column-item', {
          hasText: 'All Types',
        })

        await expect(modal).toBeVisible()
        await expect(allTypesDestination.getByRole('checkbox')).toBeEnabled()
        await expect(allTypesDestination).not.toHaveAttribute('aria-disabled')
      } finally {
        await payload.delete({
          id: allTypesFolder.id,
          collection: 'folders',
          overrideAccess: true,
        })
      }
    })

    test('should require an unrestricted destination when any moved folder is unrestricted', async () => {
      await page.goto(foldersURL.hierarchy)

      await page.locator('tr', { hasText: 'General' }).getByRole('checkbox').click()
      await page.locator('tr', { hasText: 'Orgs Only' }).getByRole('checkbox').click()
      await page.getByRole('button', { name: 'Move', exact: true }).click()

      const modal = page.locator('.hierarchy-modal')
      const organizationsAndProductsFolder = modal.locator('.hierarchy-column-item', {
        hasText: 'Orgs and Products',
      })
      const productsFolder = modal.locator('.hierarchy-column-item', {
        hasText: 'Products Only',
      })

      await expect(modal).toBeVisible()
      await expect(organizationsAndProductsFolder.getByRole('checkbox')).toBeDisabled()
      await expect(productsFolder.getByRole('checkbox')).toBeDisabled()
    })

    test('should show newly created folder in filtered tree when it matches filter', async () => {
      await page.goto(foldersURL.hierarchy)
      await openNav(page)

      await page.getByRole('tab', { name: 'Folders' }).click()

      const sidebar = page.getByRole('tabpanel')
      const tree = page.getByRole('tree')
      await expect(tree).toBeVisible()

      // Verify all folders are visible (preferences cleared in beforeEach)
      await expect(tree.getByText('Products Only', { exact: true })).toBeVisible()
      await expect(tree.getByText('Orgs Only')).toBeVisible()

      // Apply Organizations filter
      await setHierarchyFilter({ checked: true, filterName: 'Organizations', page, sidebar })

      // Wait for filter to apply - Products Only should be hidden
      await expect(tree.getByText('Products Only', { exact: true })).toBeHidden()

      // Create a new folder via the Create New button in the list controls
      const uniqueSuffix = Date.now()
      const newFolderName = `Filter Test Folder ${uniqueSuffix}`

      // Click Create New button in the list controls
      const listControls = page.locator('.hierarchy-list__controls')
      await listControls.getByRole('button', { name: 'Create New' }).first().click()

      // Select "Folder" from the popup menu
      await page.getByRole('menuitem', { name: 'Folder', exact: true }).click()

      // Wait for drawer to open
      const drawer = page.locator('.drawer__content')
      await expect(drawer).toBeVisible()

      // Fill in the folder name
      await drawer.getByLabel('Name*').fill(newFolderName)

      // Set allowedTypes to include Organizations
      // The field is a hasMany select rendered with ReactSelect
      const allowedTypesField = drawer.locator('.field-type.select')
      await allowedTypesField.locator('.rs__control').click()
      await page.getByRole('option', { name: 'Organizations' }).click()

      // Save the document
      await drawer.getByRole('button', { name: 'Save' }).click()

      // Wait for drawer to close (save complete)
      await expect(drawer).toBeHidden()

      // The new folder should appear in the filtered tree
      await expect(tree.getByText(newFolderName)).toBeVisible()

      // Clean up - delete the created folder
      const createdFolder = await payload.find({
        collection: 'folders',
        overrideAccess: true,
        where: { name: { equals: newFolderName } },
      })
      if (createdFolder.docs[0]) {
        await payload.delete({
          id: createdFolder.docs[0].id,
          collection: 'folders',
          overrideAccess: true,
        })
      }
    })

    test('should not show newly created folder in filtered tree when it does not match filter', async () => {
      // Full page reload to ensure clean state after preference clear
      await page.goto(foldersURL.hierarchy)
      await page.reload()
      await openNav(page)

      await page.getByRole('tab', { name: 'Folders' }).click()

      const sidebar = page.getByRole('tabpanel')
      const tree = page.getByRole('tree')
      await expect(tree).toBeVisible()

      // Verify all folders are visible (preferences cleared in beforeEach)
      await expect(tree.getByText('Products Only', { exact: true })).toBeVisible()

      // Apply Organizations filter
      await setHierarchyFilter({ checked: true, filterName: 'Organizations', page, sidebar })

      // Wait for filter to apply
      await expect(tree.getByText('Products Only', { exact: true })).toBeHidden()

      // Create a new folder with Products only (does NOT match Organizations filter)
      const uniqueSuffix = Date.now()
      const newFolderName = `Products Only Folder ${uniqueSuffix}`

      const listControls = page.locator('.hierarchy-list__controls')
      await listControls.getByRole('button', { name: 'Create New' }).first().click()
      await page.getByRole('menuitem', { name: 'Folder', exact: true }).click()

      const drawer = page.locator('.drawer__content')
      await expect(drawer).toBeVisible()

      await drawer.getByLabel('Name*').fill(newFolderName)

      // Set allowedTypes to Products only (does NOT include Organizations)
      const allowedTypesField = drawer.locator('.field-type.select')
      await allowedTypesField.locator('.rs__control').click()
      await page.getByRole('option', { name: 'Products' }).click()

      await drawer.getByRole('button', { name: 'Save' }).click()
      await expect(drawer).toBeHidden()

      // The new folder should NOT appear in the filtered tree (filter is Organizations)
      await expect(tree.getByText(newFolderName)).toBeHidden({ timeout: 5000 })

      // Clean up
      const createdFolder = await payload.find({
        collection: 'folders',
        overrideAccess: true,
        where: { name: { equals: newFolderName } },
      })
      if (createdFolder.docs[0]) {
        await payload.delete({
          id: createdFolder.docs[0].id,
          collection: 'folders',
          overrideAccess: true,
        })
      }
    })
  })

  test.describe('Column Modal', () => {
    let foldersURL: AdminUrlUtil
    let productsURL: AdminUrlUtil
    let parentFolder: { id: number | string }
    let childFolder: { id: number | string }
    let productWithFolder: { id: number | string }
    let productWithFolderName: string
    let parentFolderName: string
    let childFolderName: string

    test.beforeAll(async () => {
      foldersURL = new AdminUrlUtil(serverURL, 'folders')
      productsURL = new AdminUrlUtil(serverURL, 'products')

      // Use unique names to avoid collisions with leftover data from previous runs
      const uniqueSuffix = Date.now()
      parentFolderName = `Drawer Test Parent ${uniqueSuffix}`
      childFolderName = `Drawer Test Child ${uniqueSuffix}`
      productWithFolderName = `Product In Child Folder ${uniqueSuffix}`

      // Create our own test data - don't rely on seed data
      parentFolder = await payload.create({
        collection: 'folders',
        data: { name: parentFolderName },
        overrideAccess: true,
      })

      childFolder = await payload.create({
        collection: 'folders',
        data: { name: childFolderName, parentFolder: parentFolder.id },
        overrideAccess: true,
      })

      // Create a product with the child folder selected
      // Field is 'parentFolder' because Folders collection overrides parentFieldName
      productWithFolder = await payload.create({
        collection: 'products',
        data: {
          name: productWithFolderName,
          parentFolder: childFolder.id as number,
        },
        overrideAccess: true,
      })
    })

    test.afterAll(async () => {
      // Clean up in reverse order of dependencies
      if (productWithFolder?.id) {
        await payload
          .delete({ id: productWithFolder.id, collection: 'products', overrideAccess: true })
          .catch(() => {})
      }
      if (childFolder?.id) {
        await payload
          .delete({ id: childFolder.id, collection: 'folders', overrideAccess: true })
          .catch(() => {})
      }
      if (parentFolder?.id) {
        await payload
          .delete({ id: parentFolder.id, collection: 'folders', overrideAccess: true })
          .catch(() => {})
      }
    })

    test('should expand column modal to show currently selected folder', async () => {
      // Navigate to the product edit page
      await page.goto(productsURL.edit(String(productWithFolder.id)))

      // Wait for the page to load
      await expect(page.locator('.doc-header__title')).toBeVisible()

      // The folder button in the header should show the child folder (the current selection)
      // Wait for the button to be visible (it loads async after the document)
      const folderButton = page.getByRole('button', { name: childFolderName })
      await expect(folderButton).toBeVisible()
      await folderButton.focus()
      await folderButton.press('Enter')

      await expect(folderButton).toHaveAttribute('aria-expanded', 'true')
      await expect(page.getByRole('menuitem', { name: 'Move to...' })).toBeFocused()
      await expect(page.getByRole('menuitem', { name: 'Remove from Folder' })).toBeVisible()
      await expect(page.getByRole('menuitem', { name: `Go to "${childFolderName}"` })).toBeVisible()
      await page.getByRole('menuitem', { name: 'Move to...' }).click()

      // The modal should open and show columns expanded to the current selection:
      // Column 1 (root): Parent folder visible
      // Column 2 (Parent's children): Child folder visible (and selected)
      const modal = page.locator('.hierarchy-modal')
      await expect(modal).toBeVisible()

      const footer = modal.locator('.dialog__footer')

      await expect(footer).toContainText(childFolderName)
      await expect(footer).toContainText('Select Folder')
      await expect(footer.getByRole('button', { name: 'Confirm' })).toBeDisabled()

      // Both folders should be visible in their respective columns
      await expect(modal.getByRole('button', { name: parentFolderName, exact: true })).toBeVisible()
      await expect(modal.getByRole('button', { name: childFolderName, exact: true })).toBeVisible()

      await modal
        .locator('.hierarchy-column-item', { hasText: parentFolderName })
        .getByRole('checkbox')
        .click()

      await expect(footer).toContainText(parentFolderName)
      await expect(footer.getByRole('button', { name: 'Confirm' })).toBeEnabled()

      await page.keyboard.press('Escape')
      await expect(modal).toBeHidden()
      await expect(folderButton).toBeFocused()
    })

    test('should open the hierarchy modal directly when the document has no assigned folder', async () => {
      await page.goto(productsURL.create)

      const folderButton = page.locator('.hierarchy-button')

      await expect(folderButton).toBeVisible()
      await folderButton.click()

      await expect(page.locator('.hierarchy-modal')).toBeVisible()
      await expect(page.getByRole('menuitem', { name: 'Move to...' })).toBeHidden()
    })

    test('should offer move and remove actions for a selection inside a folder', async () => {
      await page.goto(`${foldersURL.hierarchy}&parentFolder=${parentFolder.id}`)

      const childFolderRow = page.locator('tr', { hasText: childFolderName })

      await childFolderRow.getByRole('checkbox').click()
      await page.getByRole('button', { name: 'Move', exact: true }).click()

      await expect(page.getByRole('menuitem', { name: 'Move to...' })).toBeVisible()
      await expect(page.getByRole('menuitem', { name: 'Remove from Folder' })).toBeVisible()

      await page.getByRole('menuitem', { name: 'Move to...' }).click()
      await expect(page.locator('.hierarchy-modal')).toBeVisible()
    })

    test('should translate hierarchy action accessible names', async () => {
      await page.goto(`${serverURL}/admin/account`)

      const languageField = page.locator('.payload-settings__language .react-select')

      await languageField.click()
      await page.locator('.rs__option', { hasText: 'Español' }).click()
      await page.waitForTimeout(500)

      try {
        await page.goto(productsURL.edit(String(productWithFolder.id)))

        const folderButton = page.getByRole('button', { name: childFolderName })

        await expect(folderButton).toBeVisible()
        await folderButton.click()

        await expect(page.getByRole('menuitem', { name: 'Mover a...' })).toBeVisible()
        await expect(page.getByRole('menuitem', { name: 'Eliminar de Folder' })).toBeVisible()
        await expect(
          page.getByRole('menuitem', { name: `Ir a "${childFolderName}"` }),
        ).toBeVisible()

        await page.keyboard.press('Escape')
        await page.goto(productsURL.list)

        const productRow = page.locator('tr', { hasText: productWithFolderName })

        await productRow.locator('.hierarchy-cell__button').click()

        await expect(page.getByRole('menuitem', { name: 'Mover a...' })).toBeVisible()
        await expect(page.getByRole('menuitem', { name: 'Eliminar de Folder' })).toBeVisible()
        await expect(
          page.getByRole('menuitem', { name: `Ir a "${childFolderName}"` }),
        ).toBeVisible()

        await page.keyboard.press('Escape')
        await page.goto(`${foldersURL.hierarchy}&parentFolder=${parentFolder.id}`)

        const childFolderRow = page.locator('tr', { hasText: childFolderName })

        await childFolderRow.getByRole('checkbox').click()
        await page.locator('.move-many__toggle').click()

        await expect(page.getByRole('menuitem', { name: 'Mover a...' })).toBeVisible()
        await expect(page.getByRole('menuitem', { name: 'Eliminar de Folder' })).toBeVisible()
      } finally {
        await page.goto(`${serverURL}/admin/account`)
        await languageField.click()
        await page.locator('.rs__option', { hasText: 'English' }).click()
        await page.waitForTimeout(500)
      }
    })

    test('should reset transient selections after canceling and reopening the modal', async () => {
      await page.goto(productsURL.edit(String(productWithFolder.id)))

      const folderButton = page.getByRole('button', { name: childFolderName })
      await expect(folderButton).toBeVisible()

      await openMoveModalFromAssignedHierarchy({ button: folderButton, page })
      const modal = page.locator('.hierarchy-modal')
      await expect(modal).toBeVisible()

      const parentFolderItem = modal
        .locator('.hierarchy-column-item', { hasText: parentFolderName })
        .first()
      await parentFolderItem.locator('.hierarchy-column-item__checkbox').click()

      await expect(
        modal.locator('.hierarchy-column-item--selected .hierarchy-column-item__title', {
          hasText: parentFolderName,
        }),
      ).toBeVisible()

      await modal.getByRole('button', { name: 'Close' }).click()
      await expect(modal).toBeHidden()

      await openMoveModalFromAssignedHierarchy({ button: folderButton, page })
      await expect(modal).toBeVisible()

      await expect(
        modal.locator('.hierarchy-column-item--selected .hierarchy-column-item__title', {
          hasText: childFolderName,
        }),
      ).toBeVisible()
      await expect(
        modal.locator('.hierarchy-column-item--selected .hierarchy-column-item__title', {
          hasText: parentFolderName,
        }),
      ).toBeHidden()
    })

    test('should reset transient expanded location after canceling and reopening the modal', async () => {
      await page.goto(productsURL.edit(String(productWithFolder.id)))

      const folderButton = page.getByRole('button', { name: childFolderName })
      await expect(folderButton).toBeVisible()

      await openMoveModalFromAssignedHierarchy({ button: folderButton, page })
      const modal = page.locator('.hierarchy-modal')
      await expect(modal).toBeVisible()

      await expect(modal.locator('.hierarchy-column')).toHaveCount(2)

      await modal.locator('.hierarchy-column-item', { hasText: childFolderName }).first().click()

      await expect(modal.locator('.hierarchy-column')).toHaveCount(3)

      await modal.getByRole('button', { name: 'Close' }).click()
      await expect(modal).toBeHidden()

      await openMoveModalFromAssignedHierarchy({ button: folderButton, page })
      await expect(modal).toBeVisible()

      await expect(modal.locator('.hierarchy-column')).toHaveCount(2)
    })

    test('should put multi-select status and actions in the modal footer', async () => {
      const tagDocumentsURL = new AdminUrlUtil(serverURL, 'folder-tag-documents')

      await page.goto(tagDocumentsURL.create)
      await page.locator('.hierarchy-field__browse-button').click()

      const modal = page.locator('.hierarchy-modal')
      const firstEnabledOption = modal
        .getByRole('checkbox')
        .and(page.locator(':not(:disabled)'))
        .first()

      await expect(modal).toBeVisible()
      await firstEnabledOption.click()

      const footer = modal.locator('.dialog__footer')

      await expect(footer).toContainText('1 Folder selected')

      await expect(footer.getByRole('button', { name: 'Clear' })).toBeVisible()
      await expect(footer.getByRole('button', { name: 'Confirm' })).toBeEnabled()
    })
  })

  test.describe('Move destination restrictions', () => {
    let allTypesFolder: { id: number | string }
    let foldersURL: AdminUrlUtil
    let product: { id: number | string }
    let productsOnlyFolder: { id: number | string }
    let productsOnlyFolderName: string
    let productsURL: AdminUrlUtil
    let unrestrictedFolder: { id: number | string }

    test.beforeAll(async () => {
      foldersURL = new AdminUrlUtil(serverURL, 'folders')
      productsURL = new AdminUrlUtil(serverURL, 'products')

      const uniqueSuffix = Date.now()

      allTypesFolder = await payload.create({
        collection: 'folders',
        data: {
          name: `All Types Destination ${uniqueSuffix}`,
          allowedTypes: ['folder-tag-documents', 'organizations', 'products'],
        },
        overrideAccess: true,
      })

      unrestrictedFolder = await payload.create({
        collection: 'folders',
        data: { name: `Unrestricted Folder ${uniqueSuffix}` },
        overrideAccess: true,
      })

      productsOnlyFolderName = `Products Only Folder ${uniqueSuffix}`

      productsOnlyFolder = await payload.create({
        collection: 'folders',
        data: { name: productsOnlyFolderName, allowedTypes: ['products'] },
        overrideAccess: true,
      })

      product = await payload.create({
        collection: 'products',
        data: { name: `List Cell Product ${uniqueSuffix}` },
        overrideAccess: true,
      })
    })

    test.afterAll(async () => {
      await payload
        .delete({ id: product.id, collection: 'products', overrideAccess: true })
        .catch(() => {})

      await payload
        .delete({ id: unrestrictedFolder.id, collection: 'folders', overrideAccess: true })
        .catch(() => {})

      await payload
        .delete({ id: productsOnlyFolder.id, collection: 'folders', overrideAccess: true })
        .catch(() => {})

      await payload
        .delete({ id: allTypesFolder.id, collection: 'folders', overrideAccess: true })
        .catch(() => {})
    })

    test('should restrict folder destinations from the document header', async () => {
      await page.goto(foldersURL.edit(String(productsOnlyFolder.id)))

      const hierarchyButton = page.locator('.hierarchy-button')

      await expect(hierarchyButton).toBeVisible()
      await hierarchyButton.click()

      const modal = page.locator('.hierarchy-modal')
      const allTypesDestination = modal.locator('.hierarchy-column-item', {
        hasText: 'All Types Destination',
      })
      const organizationsDestination = modal.locator('.hierarchy-column-item', {
        hasText: 'Orgs Only',
      })
      const organizationsAndProductsDestination = modal.locator('.hierarchy-column-item', {
        hasText: 'Orgs and Products',
      })
      const selfDestination = modal.locator('.hierarchy-column-item', {
        hasText: productsOnlyFolderName,
      })

      await expect(modal).toBeVisible()
      await expect(allTypesDestination.getByRole('checkbox')).toBeEnabled()
      await expect(organizationsDestination.getByRole('checkbox')).toBeDisabled()
      await expect(organizationsAndProductsDestination.getByRole('checkbox')).toBeEnabled()
      await expect(selfDestination.getByRole('checkbox')).toBeDisabled()
      await expect(selfDestination).toHaveAttribute('aria-disabled', 'true')
    })

    test('should restrict folder destinations from the hierarchy list cell', async () => {
      await page.goto(foldersURL.list)

      const folderRow = page.locator('tr', { hasText: productsOnlyFolderName })

      await folderRow.locator('.hierarchy-cell__button').click()

      const modal = page.locator('.hierarchy-modal')
      const organizationsDestination = modal.locator('.hierarchy-column-item', {
        hasText: 'Orgs Only',
      })
      const organizationsAndProductsDestination = modal.locator('.hierarchy-column-item', {
        hasText: 'Orgs and Products',
      })
      const selfDestination = modal.locator('.hierarchy-column-item', {
        hasText: productsOnlyFolderName,
      })

      await expect(modal).toBeVisible()
      await expect(organizationsDestination.getByRole('checkbox')).toBeDisabled()
      await expect(organizationsAndProductsDestination.getByRole('checkbox')).toBeEnabled()
      await expect(selfDestination.getByRole('checkbox')).toBeDisabled()
      await expect(selfDestination).toHaveAttribute('aria-disabled', 'true')
    })

    test('should restrict folder destinations from the list cell', async () => {
      await page.goto(productsURL.list)

      const productRow = page.locator('tr', { hasText: 'List Cell Product' })
      const hierarchyButton = productRow.locator('.hierarchy-cell__button')

      await expect(hierarchyButton).toBeVisible()
      await hierarchyButton.click()

      const modal = page.locator('.hierarchy-modal')
      const organizationsDestination = modal.locator('.hierarchy-column-item', {
        hasText: 'Orgs Only',
      })
      const productsDestination = modal.getByRole('checkbox', {
        name: 'Products Only',
        exact: true,
      })

      await expect(modal).toBeVisible()
      await expect(organizationsDestination.getByRole('checkbox')).toBeDisabled()
      await expect(productsDestination).toBeEnabled()
    })

    test('should show list-cell move errors without closing the destination picker', async () => {
      await page.route(`**/api/products/${product.id}`, async (route) => {
        if (route.request().method() === 'PATCH') {
          await route.fulfill({
            body: JSON.stringify({ errors: [{ message: 'Move rejected' }] }),
            contentType: 'application/json',
            status: 400,
          })

          return
        }

        await route.fallback()
      })

      await page.goto(productsURL.list)

      const productRow = page.locator('tr', { hasText: 'List Cell Product' })

      await productRow.locator('.hierarchy-cell__button').click()

      const modal = page.locator('.hierarchy-modal')
      const productsDestination = modal.getByRole('checkbox', {
        name: 'Products Only',
        exact: true,
      })

      await productsDestination.click()
      await modal.getByRole('button', { name: 'Confirm' }).click()

      await expect(page.getByText('Move rejected')).toBeVisible()
      await expect(modal).toBeVisible()
      await page.unroute(`**/api/products/${product.id}`)
    })
  })
})
