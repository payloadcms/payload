import type { BrowserContext, Locator, Page } from '@playwright/test'
import type { PayloadTestSDK } from 'helpers/sdk/index.js'

import { expect, test } from '@playwright/test'
import * as path from 'path'
import { fileURLToPath } from 'url'

import type { Config, Post } from './payload-types.js'

import {
  ensureCompilationIsDone,
  exactText,
  findTableCell,
  initPageConsoleErrorCatch,
  selectTableRow,
  // throttleTest,
} from '../helpers.js'
import { AdminUrlUtil } from '../helpers/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../helpers/initPayloadE2ENoConfig.js'
import { TEST_TIMEOUT_LONG } from '../playwright.config.js'
import { postsSlug } from './shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

let context: BrowserContext
let payload: PayloadTestSDK<Config>
let serverURL: string

test.describe('Bulk Edit', () => {
  let page: Page
  let postsUrl: AdminUrlUtil

  test.beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    ;({ payload, serverURL } = await initPayloadE2ENoConfig({ dirname }))
    postsUrl = new AdminUrlUtil(serverURL, postsSlug)

    context = await browser.newContext()
    page = await context.newPage()
    initPageConsoleErrorCatch(page)
    await ensureCompilationIsDone({ page, serverURL })
  })

  test.beforeEach(async () => {
    // await throttleTest({ page, context, delay: 'Fast 3G' })
  })

  test('should not show "select all across pages" button if already selected all', async () => {
    await deleteAllPosts()
    await createPost({ title: 'Post 1' })
    await page.goto(postsUrl.list)
    await page.locator('input#select-all').check()
    await expect(page.locator('button#select-all-across-pages')).toBeHidden()
  })

  test('should update selection state after deselecting item following select all', async () => {
    await deleteAllPosts()

    Array.from({ length: 6 }).forEach(async (_, i) => {
      await createPost({ title: `Post ${i + 1}` })
    })

    await page.goto(postsUrl.list)
    await page.locator('input#select-all').check()
    await page.locator('button#select-all-across-pages').click()

    // Deselect the first row
    await page.locator('.row-1 input').click()

    // eslint-disable-next-line jest-dom/prefer-checked
    await expect(page.locator('input#select-all')).not.toHaveAttribute('checked', '')
  })

  test('should delete many', async () => {
    await deleteAllPosts()

    const titleOfPostToDelete1 = 'Post to delete (published)'
    const titleOfPostToDelete2 = 'Post to delete (draft)'

    await Promise.all([
      createPost({ title: titleOfPostToDelete1 }),
      createPost({ title: titleOfPostToDelete2 }, { draft: true }),
    ])

    await page.goto(postsUrl.list)

    await expect(page.locator(`tbody tr:has-text("${titleOfPostToDelete1}")`)).toBeVisible()
    await expect(page.locator(`tbody tr:has-text("${titleOfPostToDelete2}")`)).toBeVisible()

    await selectTableRow(page, titleOfPostToDelete1)
    await selectTableRow(page, titleOfPostToDelete2)

    await page.locator('.delete-documents__toggle').click()
    await page.locator('#delete-posts #confirm-action').click()

    await expect(page.locator('.payload-toast-container .toast-success')).toContainText(
      'Deleted 2 Posts successfully.',
    )

    await expect(page.locator(`tbody tr:has-text("${titleOfPostToDelete1}")`)).toBeHidden()
    await expect(page.locator(`tbody tr:has-text("${titleOfPostToDelete2}")`)).toBeHidden()
  })

  test('should publish many', async () => {
    await deleteAllPosts()

    const titleOfPostToPublish1 = 'Post to publish (already published)'
    const titleOfPostToPublish2 = 'Post to publish (draft)'

    await Promise.all([
      createPost({ title: titleOfPostToPublish1 }),
      createPost({ title: titleOfPostToPublish2 }, { draft: true }),
    ])

    await page.goto(postsUrl.list)

    await expect(page.locator(`tbody tr:has-text("${titleOfPostToPublish1}")`)).toBeVisible()
    await expect(page.locator(`tbody tr:has-text("${titleOfPostToPublish2}")`)).toBeVisible()

    await selectTableRow(page, titleOfPostToPublish1)
    await selectTableRow(page, titleOfPostToPublish2)

    await page.locator('.publish-many__toggle').click()
    await page.locator('#publish-posts #confirm-action').click()

    await expect(page.locator('.payload-toast-container .toast-success')).toContainText(
      'Updated 2 Posts successfully.',
    )

    await expect(findTableCell(page, '_status', titleOfPostToPublish1)).toContainText('Published')
    await expect(findTableCell(page, '_status', titleOfPostToPublish2)).toContainText('Published')
  })

  test('should unpublish many', async () => {
    await deleteAllPosts()

    const titleOfPostToUnpublish1 = 'Post to unpublish (published)'
    const titleOfPostToUnpublish2 = 'Post to unpublish (already draft)'

    await Promise.all([
      createPost({ title: titleOfPostToUnpublish1 }),
      createPost({ title: titleOfPostToUnpublish2 }, { draft: true }),
    ])

    await page.goto(postsUrl.list)

    await expect(page.locator(`tbody tr:has-text("${titleOfPostToUnpublish1}")`)).toBeVisible()
    await expect(page.locator(`tbody tr:has-text("${titleOfPostToUnpublish2}")`)).toBeVisible()

    await selectTableRow(page, titleOfPostToUnpublish1)
    await selectTableRow(page, titleOfPostToUnpublish2)

    await page.locator('.unpublish-many__toggle').click()
    await page.locator('#unpublish-posts #confirm-action').click()

    await expect(findTableCell(page, '_status', titleOfPostToUnpublish1)).toContainText('Draft')
    await expect(findTableCell(page, '_status', titleOfPostToUnpublish2)).toContainText('Draft')
  })

  test('should update many', async () => {
    await deleteAllPosts()

    const updatedPostTitle = 'Post (Updated)'

    Array.from({ length: 3 }).forEach(async (_, i) => {
      await createPost({ title: `Post ${i + 1}` })
    })

    await page.goto(postsUrl.list)

    for (let i = 1; i <= 3; i++) {
      const invertedIndex = 4 - i
      await expect(page.locator(`.row-${invertedIndex} .cell-title`)).toContainText(`Post ${i}`)
    }

    await page.locator('input#select-all').check()
    await page.locator('.edit-many__toggle').click()

    const { field, modal } = await selectFieldToEdit(page, {
      fieldLabel: 'Title',
      fieldID: 'title',
    })

    await field.fill(updatedPostTitle)
    await modal.locator('.form-submit button[type="submit"].edit-many__publish').click()

    await expect(page.locator('.payload-toast-container .toast-success')).toContainText(
      'Updated 3 Posts successfully.',
    )

    for (let i = 1; i <= 3; i++) {
      const invertedIndex = 4 - i
      await expect(page.locator(`.row-${invertedIndex} .cell-title`)).toContainText(
        updatedPostTitle,
      )
    }
  })

  test('should publish many from drawer', async () => {
    await deleteAllPosts()

    const titleOfPostToPublish1 = 'Post to unpublish (published)'
    const titleOfPostToPublish2 = 'Post to publish (already draft)'

    await Promise.all([
      createPost({ title: titleOfPostToPublish1 }),
      createPost({ title: titleOfPostToPublish2 }, { draft: true }),
    ])

    const description = 'published document'

    await page.goto(postsUrl.list)

    await expect(page.locator(`tbody tr:has-text("${titleOfPostToPublish1}")`)).toBeVisible()
    await expect(page.locator(`tbody tr:has-text("${titleOfPostToPublish2}")`)).toBeVisible()

    await selectTableRow(page, titleOfPostToPublish1)
    await selectTableRow(page, titleOfPostToPublish2)

    await page.locator('.edit-many__toggle').click()

    const { field, modal } = await selectFieldToEdit(page, {
      fieldLabel: 'Description',
      fieldID: 'description',
    })

    await field.fill(description)

    // Bulk edit the selected rows to `published` status
    await modal.locator('.form-submit .edit-many__publish').click()

    await expect(page.locator('.payload-toast-container .toast-success')).toContainText(
      'Updated 2 Posts successfully.',
    )

    await expect(findTableCell(page, '_status', titleOfPostToPublish1)).toContainText('Published')
    await expect(findTableCell(page, '_status', titleOfPostToPublish2)).toContainText('Published')
  })

  test('should draft many from drawer', async () => {
    await deleteAllPosts()

    const titleOfPostToDraft1 = 'Post to draft (published)'
    const titleOfPostToDraft2 = 'Post to draft (draft)'

    await Promise.all([
      createPost({ title: titleOfPostToDraft1 }),
      createPost({ title: titleOfPostToDraft2 }, { draft: true }),
    ])

    const description = 'draft document'

    await page.goto(postsUrl.list)

    await selectTableRow(page, titleOfPostToDraft1)
    await selectTableRow(page, titleOfPostToDraft2)

    await page.locator('.edit-many__toggle').click()

    const { field, modal } = await selectFieldToEdit(page, {
      fieldLabel: 'Description',
      fieldID: 'description',
    })

    await field.fill(description)

    // Bulk edit the selected rows to `draft` status
    await modal.locator('.form-submit .edit-many__draft').click()

    await expect(page.locator('.payload-toast-container .toast-success')).toContainText(
      'Updated 2 Posts successfully.',
    )

    await expect(findTableCell(page, '_status', titleOfPostToDraft1)).toContainText('Draft')
    await expect(findTableCell(page, '_status', titleOfPostToDraft2)).toContainText('Draft')
  })

  test('should delete all on page', async () => {
    await deleteAllPosts()

    Array.from({ length: 3 }).forEach(async (_, i) => {
      await createPost({ title: `Post ${i + 1}` })
    })

    await page.goto(postsUrl.list)
    await expect(page.locator('.table table > tbody > tr')).toHaveCount(3)

    await page.locator('input#select-all').check()
    await page.locator('.delete-documents__toggle').click()
    await page.locator('#delete-posts #confirm-action').click()

    await expect(page.locator('.payload-toast-container .toast-success')).toHaveText(
      'Deleted 3 Posts successfully.',
    )

    await page.locator('.collection-list__no-results').isVisible()
  })

  test('should delete all with filters and across pages', async () => {
    await deleteAllPosts()

    Array.from({ length: 6 }).forEach(async (_, i) => {
      await createPost({ title: `Post ${i + 1}` })
    })

    await page.goto(postsUrl.list)

    await expect(page.locator('.collection-list__page-info')).toContainText('1-5 of 6')

    await page.locator('#search-filter-input').fill('Post')
    await page.waitForURL(/search=Post/)
    await expect(page.locator('.table table > tbody > tr')).toHaveCount(5)
    await page.locator('input#select-all').check()
    await page.locator('button#select-all-across-pages').click()
    await page.locator('.delete-documents__toggle').click()
    await page.locator('#delete-posts #confirm-action').click()

    await expect(page.locator('.payload-toast-container .toast-success')).toHaveText(
      'Deleted 6 Posts successfully.',
    )

    await page.locator('.collection-list__no-results').isVisible()
  })

  test('should update all with filters and across pages', async () => {
    await deleteAllPosts()

    Array.from({ length: 6 }).forEach(async (_, i) => {
      await createPost({ title: `Post ${i + 1}` })
    })

    await page.goto(postsUrl.list)
    await page.locator('#search-filter-input').fill('Post')
    await page.waitForURL(/search=Post/)
    await expect(page.locator('.table table > tbody > tr')).toHaveCount(5)

    await page.locator('input#select-all').check()
    await page.locator('button#select-all-across-pages').click()

    await page.locator('.edit-many__toggle').click()

    const { field } = await selectFieldToEdit(page, {
      fieldLabel: 'Title',
      fieldID: 'title',
    })

    const updatedTitle = 'Post (Updated)'
    await field.fill(updatedTitle)

    await page.locator('.form-submit button[type="submit"].edit-many__publish').click()
    await expect(page.locator('.payload-toast-container .toast-success')).toContainText(
      'Updated 6 Posts successfully.',
    )

    await expect(page.locator('.table table > tbody > tr')).toHaveCount(5)
    await expect(page.locator('.row-1 .cell-title')).toContainText(updatedTitle)
  })

  test('should not override un-edited values if it has a defaultValue', async () => {
    await deleteAllPosts()

    const postData = {
      title: 'Post 1',
      array: [
        {
          optional: 'some optional array field',
          innerArrayOfFields: [
            {
              innerOptional: 'some inner optional array field',
            },
          ],
        },
      ],
      group: {
        defaultValueField: 'This is NOT the default value',
        title: 'some title',
      },
      blocks: [
        {
          textFieldForBlock: 'some text for block text',
          blockType: 'textBlock',
        },
      ],
      defaultValueField: 'This is NOT the default value',
    }

    const updatedPostTitle = 'Post 1 (Updated)'

    const { id: postID } = await createPost(postData)

    await page.goto(postsUrl.list)

    const { modal } = await selectAllAndEditMany(page)

    const { field } = await selectFieldToEdit(page, {
      fieldLabel: 'Title',
      fieldID: 'title',
    })

    await field.fill(updatedPostTitle)
    await modal.locator('.form-submit button[type="submit"].edit-many__publish').click()

    await expect(page.locator('.payload-toast-container .toast-success')).toContainText(
      'Updated 1 Post successfully.',
    )

    const updatedPost = await payload.find({
      collection: postsSlug,
      limit: 1,
      depth: 0,
      where: {
        id: {
          equals: postID,
        },
      },
    })

    expect(updatedPost.docs[0]).toMatchObject({
      ...postData,
      title: updatedPostTitle,
    })
  })

  test('should bulk edit fields with subfields', async () => {
    await deleteAllPosts()

    await createPost()

    await page.goto(postsUrl.list)

    await selectAllAndEditMany(page)

    const { modal, field } = await selectFieldToEdit(page, {
      fieldLabel: 'Group > Title',
      fieldID: 'group__title',
    })

    await field.fill('New Group Title')
    await modal.locator('.form-submit button[type="submit"].edit-many__publish').click()

    await expect(page.locator('.payload-toast-container .toast-success')).toContainText(
      'Updated 1 Post successfully.',
    )

    const updatedPost = await payload
      .find({
        collection: 'posts',
        limit: 1,
      })
      ?.then((res) => res.docs[0])

    expect(updatedPost?.group?.title).toBe('New Group Title')
  })

  test('should not display fields options lacking read and update permissions', async () => {
    await deleteAllPosts()

    await createPost()

    await page.goto(postsUrl.list)

    const { modal } = await selectAllAndEditMany(page)

    await expect(
      modal.locator('.field-select .rs__option', { hasText: exactText('No Read') }),
    ).toBeHidden()

    await expect(
      modal.locator('.field-select .rs__option', { hasText: exactText('No Update') }),
    ).toBeHidden()
  })

  test('should thread field permissions through subfields', async () => {
    await deleteAllPosts()

    await createPost()

    await page.goto(postsUrl.list)

    await selectAllAndEditMany(page)

    const { field } = await selectFieldToEdit(page, { fieldLabel: 'Array', fieldID: 'array' })

    await field.locator('button.array-field__add-row').click()

    await expect(field.locator('#field-array__0__optional')).toBeVisible()
    await expect(field.locator('#field-array__0__noRead')).toBeHidden()
    await expect(field.locator('#field-array__0__noUpdate')).toBeDisabled()
  })
})

async function selectFieldToEdit(
  page: Page,
  {
    fieldLabel,
    fieldID,
  }: {
    fieldID: string
    fieldLabel: string
  },
): Promise<{ field: Locator; modal: Locator }> {
  // ensure modal is open, open if needed
  const isModalOpen = await page.locator('#edit-posts').isVisible()

  if (!isModalOpen) {
    await page.locator('.edit-many__toggle').click()
  }

  const modal = page.locator('#edit-posts')
  await expect(modal).toBeVisible()

  await modal.locator('.field-select .rs__control').click()
  await modal.locator('.field-select .rs__option', { hasText: exactText(fieldLabel) }).click()

  const field = modal.locator(`#field-${fieldID}`)
  await expect(field).toBeVisible()

  return { modal, field }
}

async function selectAllAndEditMany(page: Page): Promise<{ modal: Locator }> {
  await page.locator('input#select-all').check()
  await page.locator('.edit-many__toggle').click()
  const modal = page.locator('#edit-posts')
  await expect(modal).toBeVisible()
  return { modal }
}

async function deleteAllPosts() {
  await payload.delete({ collection: postsSlug, where: { id: { exists: true } } })
}

async function createPost(
  dataOverrides?: Partial<Post>,
  overrides?: Record<string, unknown>,
): Promise<Post> {
  return payload.create({
    collection: postsSlug,
    ...(overrides || {}),
    data: {
      title: 'Post Title',
      ...(dataOverrides || {}),
    },
  }) as unknown as Promise<Post>
}
