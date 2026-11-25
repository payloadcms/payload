import type { Locator, Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import path from 'path'
import { DEFAULT_HIERARCHY_LIST_LIMIT } from 'payload/shared'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../__helpers/shared/sdk/index.js'
import type { Config, Post, Tag } from './payload-types.js'

import { saveDocAndAssert } from '../__helpers/e2e/helpers.js'
import { openNav } from '../__helpers/e2e/toggleNav.js'
import { AdminUrlUtil } from '../__helpers/shared/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../__helpers/shared/initPayloadE2ENoConfig.js'
import { initPage } from '../__setup/e2e/initPage.js'
import { TEST_TIMEOUT_LONG } from '../playwright.config.js'
import { postsSlug, tagsSlug } from './config.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

let payload: PayloadTestSDK<Config>
let serverURL: string

test.describe('Tags', () => {
  let page: Page
  let postsURL: AdminUrlUtil
  let tagsURL: AdminUrlUtil

  const createdTagIds: Tag['id'][] = []
  const createdPostIds: Post['id'][] = []

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

      const doc = await payload.create({
        collection: tagsSlug,
        data: data as any,
        overrideAccess: true,
      })
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
    await page.getByRole('menuitem', { name: 'Tag', exact: true }).click()

    const drawer = page.locator('.drawer__content')
    await expect(drawer).toBeVisible()
    await drawer.getByLabel('Name*').fill(name)
    await drawer.getByRole('button', { name: 'Save' }).click()
    await expect(drawer).toBeHidden()

    const { docs } = await payload.find({
      collection: tagsSlug,
      overrideAccess: true,
      where: { name: { equals: name } },
    })
    const createdTag = docs[0] as Tag
    createdTagIds.push(createdTag.id)
    return createdTag
  }

  const createPostWithTags = async (title: string) => {
    const { docs: tags } = await payload.find({
      collection: tagsSlug,
      overrideAccess: true,
      where: { name: { in: ['Italian', 'Dinner'] } },
    })
    const italian = tags.find((tag) => tag.name === 'Italian')!
    const dinner = tags.find((tag) => tag.name === 'Dinner')!
    const post = await payload.create({
      collection: postsSlug,
      data: { title, [`_h_${tagsSlug}`]: [italian.id, dinner.id] },
      overrideAccess: true,
    })

    createdPostIds.push(post.id)

    return { dinner, italian, post }
  }

  test.beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)

    const { payload: payloadFromInit, serverURL: serverFromInit } =
      await initPayloadE2ENoConfig<Config>({ dirname })

    payload = payloadFromInit
    serverURL = serverFromInit
    postsURL = new AdminUrlUtil(serverURL, postsSlug)
    tagsURL = new AdminUrlUtil(serverURL, tagsSlug)

    const context = await browser.newContext()
    ;({ page } = await initPage({ context, serverURL }))
  })

  test.afterAll(async () => {
    for (const id of createdPostIds) {
      await payload.delete({ id, collection: postsSlug, overrideAccess: true })
    }
    for (const id of createdTagIds.toReversed()) {
      await payload.delete({ id, collection: tagsSlug, overrideAccess: true })
    }
  })

  test.afterEach(async () => {
    await page.unrouteAll()
  })

  test('should reuse cards for mixed tag members shown in a shared table and separate grids', async () => {
    const { docs: italianTags } = await payload.find({
      collection: tagsSlug,
      overrideAccess: true,
      where: { name: { equals: 'Italian' } },
    })
    const childTag = await payload.create({
      collection: tagsSlug,
      data: { name: 'Italian Grid Subtag', [`_h_${tagsSlug}`]: italianTags[0].id },
      overrideAccess: true,
    })
    createdTagIds.push(childTag.id)

    const tree = await openTagsTree()

    await expandNode(tree, 'Cuisines')
    await enterParent(tree, 'Italian')

    const table = page.locator('.hierarchy-tables table')
    await expect(table).toHaveCount(1)
    await expect(table.getByRole('columnheader', { name: 'Collection' })).toBeVisible()
    await expect(
      table.getByRole('checkbox', { name: 'Select Posts: Traditional Tiramisu' }),
    ).toBeVisible()
    const tagName = table
      .getByRole('link', { name: 'Italian Grid Subtag', exact: true })
      .getByText('Italian Grid Subtag')
    const postName = table
      .getByRole('link', { name: 'Traditional Tiramisu', exact: true })
      .getByText('Traditional Tiramisu')

    await expect(tagName).toBeVisible()
    await expect(postName).toBeVisible()
    await expect
      .poll(async () => {
        const [tagBox, postBox] = await Promise.all([tagName.boundingBox(), postName.boundingBox()])
        return tagBox && postBox ? tagBox.x - postBox.x : undefined
      })
      .toBeCloseTo(0)
    await expect(page.getByRole('group', { name: 'Tags', exact: true })).toHaveCount(0)
    await expect(page.getByRole('group', { name: 'Documents', exact: true })).toHaveCount(0)
    await page.getByRole('radio', { name: 'Grid' }).click()

    const hierarchyGrid = page.getByRole('list', { name: 'Tags' })
    const documentGrid = page.getByRole('list', { name: 'Documents' })

    await expect(hierarchyGrid).toHaveCount(1)
    await expect(documentGrid).toHaveCount(1)
    await expect(
      hierarchyGrid.getByRole('link', { name: 'Italian Grid Subtag', exact: true }),
    ).toBeVisible()
    await expect(hierarchyGrid.locator('.card-grid__item')).toHaveCount(1)
    await expect(documentGrid.getByRole('link', { name: 'Traditional Tiramisu' })).toBeVisible()
    await expect(documentGrid.getByRole('link', { name: 'Guide to Italian Cuisine' })).toBeVisible()
    await expect(documentGrid.getByRole('link', { name: /mushroom-risotto.png/ })).toBeVisible()
    await expect(
      documentGrid.locator('.document-card', { hasText: 'mushroom-risotto.png' }).locator('img'),
    ).toHaveAttribute('src', /mushroom-risotto/)

    await expect(page.getByRole('group', { name: 'Tags', exact: true })).toHaveCount(0)
    await expect(page.getByRole('group', { name: 'Documents', exact: true })).toHaveCount(0)

    const postCard = documentGrid.locator('.document-card', { hasText: 'Traditional Tiramisu' })

    await postCard.click()
    await expect(postCard).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByRole('button', { name: 'Move', exact: true })).toHaveCount(0)

    await page.getByRole('radio', { name: 'Table' }).click()
    await expect(page.locator('.hierarchy-tables table')).toHaveCount(1)
  })

  test('should load all child tags and only paginate documents', async () => {
    const [archive] = await createTagChain(['Recipe archive'])
    const total = DEFAULT_HIERARCHY_LIST_LIMIT + 1

    for (let index = 1; index <= total; index++) {
      const tag = await payload.create({
        collection: tagsSlug,
        data: { name: `Recipe archive subtag ${index}`, [`_h_${tagsSlug}`]: archive.id },
        overrideAccess: true,
      })
      createdTagIds.push(tag.id)

      const post = await payload.create({
        collection: postsSlug,
        data: { title: `Recipe archive note ${index}`, [`_h_${tagsSlug}`]: [archive.id] },
        overrideAccess: true,
      })
      createdPostIds.push(post.id)
    }

    const tree = await openTagsTree()
    await enterParent(tree, archive.name)

    const documents = page.getByRole('region', { name: 'Documents', exact: true })
    const pager = documents.getByRole('group', { name: 'Documents', exact: true })
    const loadMore = pager.getByRole('button', { name: 'Load more' })

    await expect(documents.getByRole('row', { name: /Recipe archive subtag/ })).toHaveCount(total)
    await expect(documents.getByRole('group', { name: 'Tags', exact: true })).toHaveCount(0)
    await expect(loadMore).toBeVisible()
    await expect(pager.getByRole('status')).toHaveClass('sr-only')
    await expect(pager.getByRole('status')).toHaveText(
      `${DEFAULT_HIERARCHY_LIST_LIMIT} of ${total}`,
    )
    await loadMore.focus()
    await page.keyboard.press('Enter')

    await expect(documents.getByRole('row', { name: /Recipe archive note/ })).toHaveCount(total)
    await expect(pager).toHaveCount(0)
    await expect(documents).toBeFocused()
  })

  test('should add a tag without replacing existing document tags', async () => {
    const { dinner, italian, post } = await createPostWithTags('Tag membership add')
    const tree = await openTagsTree()

    await expandNode(tree, 'Cuisines')
    await enterParent(tree, 'Italian')

    await page
      .locator('.hierarchy-tables table')
      .getByRole('row', { name: /Tag membership add/ })
      .getByRole('checkbox')
      .check()
    await page.getByRole('button', { name: 'Add Tag' }).press('Enter')

    const modal = page.locator('.hierarchy-modal:visible')

    await expect(modal).toBeVisible()
    await modal.getByRole('button', { name: 'Seasons', exact: true }).click()
    await modal.getByRole('checkbox', { name: 'Spring' }).check()
    await modal.getByRole('button', { name: 'Confirm' }).click()
    await expect(modal).toBeHidden()

    const { docs: springTags } = await payload.find({
      collection: tagsSlug,
      overrideAccess: true,
      where: { name: { equals: 'Spring' } },
    })

    await expect
      .poll(async () => {
        const { docs } = await payload.find({
          collection: postsSlug,
          depth: 0,
          overrideAccess: true,
          where: { id: { equals: post.id } },
        })

        return docs[0]?.[`_h_${tagsSlug}`]
      })
      .toEqual(expect.arrayContaining([italian.id, dinner.id, springTags[0]!.id]))
  })

  test('should remove only the current tag from a document', async () => {
    const { dinner, post } = await createPostWithTags('Tag membership remove')
    const tree = await openTagsTree()

    await expandNode(tree, 'Cuisines')
    await enterParent(tree, 'Italian')

    await page
      .locator('.hierarchy-tables table')
      .getByRole('row', { name: /Tag membership remove/ })
      .getByRole('checkbox')
      .check()
    await page.getByRole('button', { name: 'Remove from Italian' }).click()

    await expect
      .poll(async () => {
        const { docs } = await payload.find({
          collection: postsSlug,
          depth: 0,
          overrideAccess: true,
          where: { id: { equals: post.id } },
        })

        return docs[0]?.[`_h_${tagsSlug}`]
      })
      .toEqual([dinner.id])
    await expect(page.getByRole('row', { name: /Tag membership remove/ })).toHaveCount(0)
  })

  test('should reparent a selected tag', async () => {
    const { docs: parents } = await payload.find({
      collection: tagsSlug,
      overrideAccess: true,
      where: { name: { in: ['Italian', 'Seasons'] } },
    })
    const italian = parents.find((tag) => tag.name === 'Italian')!
    const seasons = parents.find((tag) => tag.name === 'Seasons')!
    const childTag = await payload.create({
      collection: tagsSlug,
      data: { name: 'Tag Reparent Child', [`_h_${tagsSlug}`]: italian.id },
      overrideAccess: true,
    })
    createdTagIds.push(childTag.id)

    const tree = await openTagsTree()

    await expandNode(tree, 'Cuisines')
    await enterParent(tree, 'Italian')

    await page
      .locator('.hierarchy-tables table')
      .getByRole('row', { name: /Tag Reparent Child/ })
      .getByRole('checkbox')
      .check()
    await page.getByRole('button', { name: 'Move', exact: true }).click()
    await page.getByRole('menuitem', { name: 'Move to...' }).click()

    const modal = page.locator('.hierarchy-modal:visible')

    await modal.getByRole('checkbox', { name: 'Seasons' }).check()
    await modal.getByRole('button', { name: 'Confirm' }).click()

    await expect
      .poll(async () => {
        const { docs } = await payload.find({
          collection: tagsSlug,
          depth: 0,
          overrideAccess: true,
          where: { id: { equals: childTag.id } },
        })

        return docs[0]?.[`_h_${tagsSlug}`]
      })
      .toBe(seasons.id)
  })

  test.describe('hierarchy relationship field', () => {
    test('should apply, cancel, reopen, and clear Tags field selections', async () => {
      const post = await payload.create({
        collection: postsSlug,
        data: { title: 'Hierarchy field E2E' },
        overrideAccess: true,
      })
      createdPostIds.push(post.id)

      await page.goto(postsURL.edit(post.id))

      const tagsField = page.locator('#field-_h_tags')
      const browseButton = page.getByRole('button', { name: 'Select Tags' })
      const modal = page.locator('.hierarchy-modal:visible')

      await expect(tagsField).toBeVisible()
      await browseButton.click()
      await expect(modal).toBeVisible()
      await expect(modal.getByRole('button', { name: 'Close' })).toBeVisible()
      await expect(modal.getByRole('button', { name: 'Confirm' })).toBeVisible()

      await modal.getByRole('button', { name: 'Seasons', exact: true }).click()
      await modal.getByRole('checkbox', { name: 'Spring' }).check()
      await modal.getByRole('button', { name: 'Confirm' }).click()
      await expect(modal).toBeHidden()
      await expect(tagsField.locator('.relationship--multi-value-label__text')).toHaveText([
        'Spring',
      ])
      await saveDocAndAssert(page)
      await page.reload()

      await browseButton.click()
      await expect(modal.getByRole('checkbox', { name: 'Spring' })).toBeChecked()
      await modal.getByRole('checkbox', { name: 'Seasons' }).check()
      await modal.getByRole('button', { name: 'Close' }).click()
      await expect(modal).toBeHidden()
      await expect(tagsField.locator('.relationship--multi-value-label__text')).toHaveText([
        'Spring',
      ])

      await browseButton.click()
      await expect(modal.getByRole('checkbox', { name: 'Spring' })).toBeChecked()
      await modal.getByRole('button', { name: 'Clear' }).click()
      await modal.getByRole('button', { name: 'Confirm' }).click()
      await expect(modal).toBeHidden()
      await expect(tagsField.locator('.relationship--multi-value-label__text')).toHaveCount(0)
    })

    test('should show ancestor paths when searching Tags field options', async () => {
      const post = await payload.create({
        collection: postsSlug,
        data: { title: 'Hierarchy option label E2E' },
        overrideAccess: true,
      })
      createdPostIds.push(post.id)

      await page.goto(postsURL.edit(post.id))

      const tagsField = page.locator('#field-_h_tags')
      await tagsField.locator('.rs__input').click()
      await tagsField.locator('.rs__input').fill('Spring')

      await expect(page.locator('.rs__option')).toContainText('Seasons / Spring')
    })
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
