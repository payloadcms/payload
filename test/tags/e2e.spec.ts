import type { Locator, Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../__helpers/shared/sdk/index.js'
import type { Config, Tag } from './payload-types.js'

import { ensureCompilationIsDone, initPageConsoleErrorCatch } from '../__helpers/e2e/helpers.js'
import { openNav } from '../__helpers/e2e/toggleNav.js'
import { AdminUrlUtil } from '../__helpers/shared/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../__helpers/shared/initPayloadE2ENoConfig.js'
import { TEST_TIMEOUT_LONG } from '../playwright.config.js'
import { tagsSlug } from './config.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

let payload: PayloadTestSDK<Config>
let serverURL: string

test.describe('Tags', () => {
  let page: Page
  let tagsURL: AdminUrlUtil

  const createdTagIds: Tag['id'][] = []

  /** Navigate to the tags list and return the sidebar tree. */
  const openTagsTree = async (): Promise<Locator> => {
    await page.goto(tagsURL.list)
    await openNav(page)
    await page.getByRole('tab', { name: 'Tags' }).click()
    const tree = page.getByRole('tree')
    await expect(tree).toBeVisible()
    return tree
  }

  /** Click a tree node name button (at any depth) to navigate into its children view. */
  const enterParent = async (tree: Locator, parentName: string): Promise<void> => {
    const node = tree.getByRole('treeitem', { name: new RegExp(parentName) })
    await expect(node).toBeVisible()
    const selectButton = node.getByRole('button', { name: parentName, exact: true })
    await expect(async () => {
      await selectButton.click()
      await expect(page).toHaveURL(/_h_tags=/, { timeout: 2000 })
    }).toPass()
  }

  /** Expand a tree node if it is not already expanded. */
  const expandNode = async (tree: Locator, name: string): Promise<void> => {
    const node = tree.getByRole('treeitem', { name: new RegExp(name) })
    await expect(node).toBeVisible()
    if ((await node.getAttribute('aria-expanded')) !== 'true') {
      await node.getByRole('button', { name: 'Open' }).first().click()
    }
    await expect(node).toHaveAttribute('aria-expanded', 'true')
  }

  /** Create a chain of nested tags via the API. Returns the created docs, root-first. */
  const createTagChain = async (names: string[]): Promise<Tag[]> => {
    const created: Tag[] = []
    let parentId: Tag['id'] | undefined

    for (const name of names) {
      const data: Record<string, unknown> = { name }
      if (parentId !== undefined) {
        data[`_h_${tagsSlug}`] = parentId
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- hierarchy `_h_*` field is not in the generated type
      const doc = await payload.create({ collection: tagsSlug, data: data as any })
      created.push(doc)
      createdTagIds.push(doc.id)
      parentId = doc.id
    }

    return created
  }

  const createChildTag = async (name: string): Promise<Tag> => {
    await page
      .locator('.hierarchy-list__controls')
      .getByRole('button', { name: 'Create New' })
      .first()
      .click()
    await page.getByRole('button', { name: 'Tag', exact: true }).click()

    const drawer = page.locator('.drawer__content')
    await expect(drawer).toBeVisible()
    await drawer.getByLabel('Name*').fill(name)
    await drawer.getByRole('button', { name: 'Save' }).click()
    await expect(drawer).toBeHidden()

    const { docs } = await payload.find({
      collection: tagsSlug,
      where: { name: { equals: name } },
    })
    const createdTag = docs[0] as Tag
    createdTagIds.push(createdTag.id)
    return createdTag
  }

  test.beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)

    const { payload: payloadFromInit, serverURL: serverFromInit } =
      await initPayloadE2ENoConfig<Config>({ dirname })

    payload = payloadFromInit
    serverURL = serverFromInit
    tagsURL = new AdminUrlUtil(serverURL, tagsSlug)

    const context = await browser.newContext()
    page = await context.newPage()
    initPageConsoleErrorCatch(page)
    await ensureCompilationIsDone({ page, serverURL })
  })

  test.afterAll(async () => {
    for (const id of createdTagIds) {
      await payload.delete({ id, collection: tagsSlug })
    }
  })

  test.afterEach(async () => {
    await page.unrouteAll()
  })

  test.describe('sidebar tree refresh', () => {
    test('should show a deeply nested newly created tag in the sidebar without navigating away', async () => {
      const suffix = Date.now()
      const rootName = `AAA Deep Root ${suffix}`
      const level1 = `AAA Deep L1 ${suffix}`
      const level2 = `AAA Deep L2 ${suffix}`
      const level3 = `AAA Deep L3 ${suffix}`
      const childName = `AAA Deep Child ${suffix}`

      await createTagChain([rootName, level1, level2, level3])

      // Simulate the debounce race deterministically: prevent the expanded-node
      // preference from ever being persisted. This mirrors creating the child before
      // the 500ms preference-save debounce fires — so the RSC reload's getInitialTreeData
      // reads a stale preference that omits the deep parent, and its children (including
      // the new child) are never fetched into the refreshed tree.
      await page.route('**/api/payload-preferences/hierarchy-tree-tags', async (route) => {
        if (route.request().method() === 'POST') {
          await route.fulfill({ body: '{}', contentType: 'application/json', status: 200 })
          return
        }
        await route.continue()
      })

      const tree = await openTagsTree()
      await expandNode(tree, rootName)
      await expandNode(tree, level1)
      await expandNode(tree, level2)
      await expandNode(tree, level3)

      await enterParent(tree, level3)

      await createChildTag(childName)

      await expect(tree.getByText(childName)).toBeVisible()
    })
  })
})
