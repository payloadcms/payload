import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import { openNav } from '__helpers/e2e/toggleNav.js'
import path from 'path'
import { fileURLToPath } from 'url'

import { ensureCompilationIsDone, initPageConsoleErrorCatch } from '../__helpers/e2e/helpers.js'
import { AdminUrlUtil } from '../__helpers/shared/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../__helpers/shared/initPayloadE2ENoConfig.js'

const TEST_TIMEOUT_LONG = 120000

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const { beforeAll, describe } = test

let page: Page
let serverURL: string
let adminUrl: AdminUrlUtil

describe('Taxonomy Tree', () => {
  beforeAll(async ({ browser }, testInfo) => {
    const prebuild = false
    testInfo.setTimeout(TEST_TIMEOUT_LONG)

    const config = await initPayloadE2ENoConfig({ dirname, prebuild })
    serverURL = config.serverURL

    adminUrl = new AdminUrlUtil(serverURL, 'tags')

    const context = await browser.newContext()
    page = await context.newPage()

    initPageConsoleErrorCatch(page)
    await ensureCompilationIsDone({ page, serverURL })
  })

  describe('Sidebar Display', () => {
    test('should display taxonomy tree in sidebar for tags collection', async () => {
      await page.goto(adminUrl.list)
      await page.waitForURL('**/tags')

      await openNav(page)

      const taxonomySidebar = page.locator('.taxonomy-sidebar-tab')
      await expect(taxonomySidebar.locator('.taxonomy-tree')).toBeVisible()
    })

    test('should show tree nodes from seed data', async () => {
      await page.goto(adminUrl.list)
      await page.waitForURL('**/tags')

      await openNav(page)

      const tree = page.locator('.taxonomy-tree')
      await expect(tree).toBeVisible()

      const nodes = tree.locator('.taxonomy-tree-node')
      await expect(nodes.first()).toBeVisible({ timeout: 10000 })
    })
  })

  describe('Tree Interaction', () => {
    test('should expand nodes to show children', async () => {
      await page.goto(adminUrl.list)
      await page.waitForURL('**/tags')

      await openNav(page)

      const tree = page.locator('.taxonomy-tree')
      const firstChevron = tree.locator('.taxonomy-tree-node__toggle').first()

      await expect(firstChevron).toBeVisible({ timeout: 10000 })
      await firstChevron.click()

      const childrenContainer = tree.locator('.taxonomy-tree-node__children').first()
      await expect(childrenContainer).toBeVisible({ timeout: 5000 })
    })

    test('should support arrow key navigation', async () => {
      await page.goto(adminUrl.list)
      await page.waitForURL('**/tags')

      await openNav(page)

      const tree = page.locator('.taxonomy-tree')
      await expect(tree).toBeVisible()

      await tree.focus()
      await page.keyboard.press('ArrowDown')

      const focusedElement = page.locator(':focus')
      await expect(focusedElement).toBeVisible()
    })
  })

  describe('Custom Configuration', () => {
    test('should work with custom parent field name for categories', async () => {
      await page.goto(adminUrl.collection('categories'))
      await page.waitForURL('**/categories')

      await openNav(page)

      const tree = page.locator('.taxonomy-tree')
      await expect(tree).toBeVisible()

      const content = tree.locator(
        '.taxonomy-tree-node, .taxonomy-tree__empty, .taxonomy-tree__loading',
      )
      await expect(content.first()).toBeVisible({ timeout: 10000 })
    })
  })
})
