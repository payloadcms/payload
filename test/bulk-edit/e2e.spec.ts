import type { BrowserContext, Locator, Page } from '@playwright/test'
import type { PayloadTestSDK } from 'helpers/sdk/index.js'
import type { RequiredDataFromCollectionSlug } from 'payload'

import { expect, test } from '@playwright/test'
import { addArrayRow } from 'helpers/e2e/fields/array/index.js'
import { addListFilter } from 'helpers/e2e/filters/index.js'
import { selectInput } from 'helpers/e2e/selectInput.js'
import { toggleBlockOrArrayRow } from 'helpers/e2e/toggleCollapsible.js'
import * as path from 'path'
import { wait } from 'payload/shared'
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
import { AdminUrlUtil } from '@tools/test-utils/e2e'
import { initPayloadE2ENoConfig } from '@tools/test-utils/e2e'
import { reInitializeDB } from '@tools/test-utils/int'
import { POLL_TOPASS_TIMEOUT, TEST_TIMEOUT_LONG } from '../playwright.config.js'
import { postsSlug, tabsSlug } from './shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

let context: BrowserContext
let payload: PayloadTestSDK<Config>
let serverURL: string

test.describe('Bulk Edit', () => {
  let page: Page
  let postsUrl: AdminUrlUtil
  let tabsUrl: AdminUrlUtil

  test.beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    ;({ payload, serverURL } = await initPayloadE2ENoConfig<Config>({ dirname }))
    postsUrl = new AdminUrlUtil(serverURL, postsSlug)
    tabsUrl = new AdminUrlUtil(serverURL, tabsSlug)

    context = await browser.newContext()
    page = await context.newPage()
    initPageConsoleErrorCatch(page)
    await ensureCompilationIsDone({ page, serverURL })
  })

  test.beforeEach(async () => {
    // await throttleTest({ page, context, delay: 'Fast 3G' })
    await reInitializeDB({
      serverURL,
      snapshotKey: 'bulkEdit',
    })
    await page.goto(postsUrl.admin)
  })

  test('should not show "select all across pages" button if already selected all', async () => {
    await deleteAllPosts()
    await createPost({ title: 'Post 1' })
    await page.goto(postsUrl.list)
    // Wait until page has limit in the url, to ensure it is fully loaded
    await expect.poll(() => page.url(), { timeout: POLL_TOPASS_TIMEOUT }).toContain('limit=')
    await page.locator('input#select-all').check()
    await expect(page.locator('button#select-all-across-pages')).toBeHidden()
  })

  test('should update selection state after deselecting item following select all', async () => {
    await deleteAllPosts()

    for (let i = 1; i <= 6; i++) {
      await createPost({ title: `Post ${i}` })
      // Wait 50ms to ensure the createdAt date is different enough to ensure posts are in the correct order
      await wait(50)
    }

    await page.goto(postsUrl.list)
    // Wait until page has limit in the url, to ensure it is fully loaded
    await expect.poll(() => page.url(), { timeout: POLL_TOPASS_TIMEOUT }).toContain('limit=')

    await page.locator('input#select-all').check()
    await page.locator('button#select-all-across-pages').click()

    // Deselect the first row
    await page.locator('.row-1 input').click()

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
    // Wait until page has limit in the url, to ensure it is fully loaded
    await expect.poll(() => page.url(), { timeout: POLL_TOPASS_TIMEOUT }).toContain('limit=')

    await expect(page.locator(`tbody tr:has-text("${titleOfPostToDelete1}")`)).toBeVisible()
    await expect(page.locator(`tbody tr:has-text("${titleOfPostToDelete2}")`)).toBeVisible()

    await selectTableRow(page, titleOfPostToDelete1)
    await selectTableRow(page, titleOfPostToDelete2)

    await page.locator('.delete-documents__toggle').click()
    await page.locator('#confirm-delete-many-docs #confirm-action').click()

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
    // Wait until page has limit in the url, to ensure it is fully loaded
    await expect.poll(() => page.url(), { timeout: POLL_TOPASS_TIMEOUT }).toContain('limit=')

    await expect(page.locator(`tbody tr:has-text("${titleOfPostToPublish1}")`)).toBeVisible()
    await expect(page.locator(`tbody tr:has-text("${titleOfPostToPublish2}")`)).toBeVisible()

    await selectTableRow(page, titleOfPostToPublish1)
    await selectTableRow(page, titleOfPostToPublish2)

    await page.locator('.list-selection__button[aria-label="Publish"]').click()
    await page.locator('#publish-posts #confirm-action').click()

    await expect(page.locator('.payload-toast-container .toast-success')).toContainText(
      'Updated 2 Posts successfully.',
    )

    await expect(await findTableCell(page, '_status', titleOfPostToPublish1)).toContainText(
      'Published',
    )
    await expect(await findTableCell(page, '_status', titleOfPostToPublish2)).toContainText(
      'Published',
    )
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
    // Wait until page has limit in the url, to ensure it is fully loaded
    await expect.poll(() => page.url(), { timeout: POLL_TOPASS_TIMEOUT }).toContain('limit=')

    await expect(page.locator(`tbody tr:has-text("${titleOfPostToUnpublish1}")`)).toBeVisible()
    await expect(page.locator(`tbody tr:has-text("${titleOfPostToUnpublish2}")`)).toBeVisible()

    await selectTableRow(page, titleOfPostToUnpublish1)
    await selectTableRow(page, titleOfPostToUnpublish2)

    await page.locator('.list-selection__button[aria-label="Unpublish"]').click()
    await page.locator('#unpublish-posts #confirm-action').click()

    await expect(await findTableCell(page, '_status', titleOfPostToUnpublish1)).toContainText(
      'Draft',
    )
    await expect(await findTableCell(page, '_status', titleOfPostToUnpublish2)).toContainText(
      'Draft',
    )
  })

  test('should update many', async () => {
    await deleteAllPosts()

    const updatedPostTitle = 'Post (Updated)'

    for (let i = 1; i <= 3; i++) {
      await createPost({ title: `Post ${i}` })
      // Wait 50ms to ensure the createdAt date is different enough to ensure posts are in the correct order
      await wait(50)
    }

    await page.goto(postsUrl.list)
    // Wait until page has limit in the url, to ensure it is fully loaded
    await expect.poll(() => page.url(), { timeout: POLL_TOPASS_TIMEOUT }).toContain('limit=')

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
    // Wait until page has limit in the url, to ensure it is fully loaded
    await expect.poll(() => page.url(), { timeout: POLL_TOPASS_TIMEOUT }).toContain('limit=')

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

    await expect(await findTableCell(page, '_status', titleOfPostToPublish1)).toContainText(
      'Published',
    )
    await expect(await findTableCell(page, '_status', titleOfPostToPublish2)).toContainText(
      'Published',
    )
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
    // Wait until page has limit in the url, to ensure it is fully loaded
    await expect.poll(() => page.url(), { timeout: POLL_TOPASS_TIMEOUT }).toContain('limit=')

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

    await expect(await findTableCell(page, '_status', titleOfPostToDraft1)).toContainText('Draft')
    await expect(await findTableCell(page, '_status', titleOfPostToDraft2)).toContainText('Draft')
  })

  test('should delete all on page', async () => {
    await deleteAllPosts()

    for (let i = 1; i <= 3; i++) {
      await createPost({ title: `Post ${i}` })
      // Wait 50ms to ensure the createdAt date is different enough to ensure posts are in the correct order
      await wait(50)
    }

    await page.goto(postsUrl.list)
    // Wait until page has limit in the url, to ensure it is fully loaded
    await expect.poll(() => page.url(), { timeout: POLL_TOPASS_TIMEOUT }).toContain('limit=')
    await expect(page.locator('.table table > tbody > tr')).toHaveCount(3)

    await page.locator('input#select-all').check()
    await page.locator('.list-selection__button[aria-label="Delete"]').click()
    await page.locator('#confirm-delete-many-docs #confirm-action').click()

    await expect(page.locator('.payload-toast-container .toast-success')).toHaveText(
      'Deleted 3 Posts successfully.',
    )

    await page.locator('.collection-list__no-results').isVisible()
  })

  test('should delete all with filters and across pages', async () => {
    await deleteAllPosts()

    for (let i = 1; i <= 6; i++) {
      await createPost({ title: `Post ${i}` })
      // Wait 50ms to ensure the createdAt date is different enough to ensure posts are in the correct order
      await wait(50)
    }

    await page.goto(postsUrl.list)
    // Wait until page has limit in the url, to ensure it is fully loaded
    await expect.poll(() => page.url(), { timeout: POLL_TOPASS_TIMEOUT }).toContain('limit=')

    await expect(page.locator('.page-controls__page-info')).toContainText('1-5 of 6')

    await page.locator('#search-filter-input').fill('Post')
    await page.waitForURL(/search=Post/)
    await expect(page.locator('.table table > tbody > tr')).toHaveCount(5)
    await page.locator('input#select-all').check()
    await page.locator('button#select-all-across-pages').click()
    await page.locator('.list-selection__button[aria-label="Delete"]').click()
    await page.locator('#confirm-delete-many-docs #confirm-action').click()

    await expect(page.locator('.payload-toast-container .toast-success')).toHaveText(
      'Deleted 6 Posts successfully.',
    )

    await page.locator('.collection-list__no-results').isVisible()
  })

  test('should update all with filters and across pages', async () => {
    await deleteAllPosts()

    for (let i = 1; i <= 6; i++) {
      await createPost({ title: `Post ${i}` })
      // Wait 50ms to ensure the createdAt date is different enough to ensure posts are in the correct order
      await wait(50)
    }

    await page.goto(postsUrl.list)
    // Wait until page has limit in the url, to ensure it is fully loaded
    await expect.poll(() => page.url(), { timeout: POLL_TOPASS_TIMEOUT }).toContain('limit=')
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

    const postData: RequiredDataFromCollectionSlug<'posts'> = {
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
    // Wait until page has limit in the url, to ensure it is fully loaded
    await expect.poll(() => page.url(), { timeout: POLL_TOPASS_TIMEOUT }).toContain('limit=')

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
    // Wait until page has limit in the url, to ensure it is fully loaded
    await expect.poll(() => page.url(), { timeout: POLL_TOPASS_TIMEOUT }).toContain('limit=')

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
    // Wait until page has limit in the url, to ensure it is fully loaded
    await expect.poll(() => page.url(), { timeout: POLL_TOPASS_TIMEOUT }).toContain('limit=')

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
    // Wait until page has limit in the url, to ensure it is fully loaded
    await expect.poll(() => page.url(), { timeout: POLL_TOPASS_TIMEOUT }).toContain('limit=')

    await selectAllAndEditMany(page)

    const { field } = await selectFieldToEdit(page, { fieldLabel: 'Array', fieldID: 'array' })

    await wait(500)

    await addArrayRow(page, { fieldName: 'array' })

    const row = page.locator(`#array-row-0`)
    const toggler = row.locator('button.collapsible__toggle')

    await expect(toggler).toHaveClass(/collapsible__toggle--collapsed/)
    await expect(page.locator(`#field-array__0__optional`)).toBeHidden()

    await toggleBlockOrArrayRow({
      page,
      targetState: 'open',
      rowIndex: 0,
      fieldName: 'array',
    })

    await expect(field.locator('#field-array__0__optional')).toBeVisible()
    await expect(field.locator('#field-array__0__noRead')).toBeHidden()
    await expect(field.locator('#field-array__0__noUpdate')).toBeDisabled()
  })

  test('should toggle list selections off on successful publish', async () => {
    await deleteAllPosts()

    const postCount = 3
    for (let i = 1; i <= postCount; i++) {
      await createPost({ title: `Post ${i}` }, { draft: true })
      // Wait 50ms to ensure the createdAt date is different enough to ensure posts are in the correct order
      await wait(50)
    }

    await page.goto(postsUrl.list)
    // Wait until page has limit in the url, to ensure it is fully loaded
    await expect.poll(() => page.url(), { timeout: POLL_TOPASS_TIMEOUT }).toContain('limit=')
    await page.locator('input#select-all').check()

    await page.locator('.list-selection__button[aria-label="Publish"]').click()
    await page.locator('#publish-posts #confirm-action').click()

    await expect(page.locator('.payload-toast-container .toast-success')).toContainText(
      `Updated ${postCount} Posts successfully.`,
    )

    await expect(page.locator('.table input#select-all[checked]')).toBeHidden()

    for (let i = 1; i < postCount + 1; i++) {
      await expect(
        page.locator(`table tbody tr .row-${i} input[type="checkbox"][checked]`),
      ).toBeHidden()
    }
  })

  test('should toggle list selections off on successful unpublish', async () => {
    await deleteAllPosts()

    const postCount = 3
    for (let i = 1; i <= postCount; i++) {
      await createPost({ title: `Post ${i}`, _status: 'published' })
      // Wait 50ms to ensure the createdAt date is different enough to ensure posts are in the correct order
      await wait(50)
    }

    await page.goto(postsUrl.list)
    // Wait until page has limit in the url, to ensure it is fully loaded
    await expect.poll(() => page.url(), { timeout: POLL_TOPASS_TIMEOUT }).toContain('limit=')
    await page.locator('input#select-all').check()

    await page.locator('.list-selection__button[aria-label="Unpublish"]').click()
    await page.locator('#unpublish-posts #confirm-action').click()

    await expect(page.locator('.payload-toast-container .toast-success')).toContainText(
      `Updated ${postCount} Posts successfully.`,
    )

    await expect(page.locator('.table input#select-all[checked]')).toBeHidden()

    for (let i = 1; i < postCount + 1; i++) {
      await expect(
        page.locator(`table tbody tr .row-${i} input[type="checkbox"][checked]`),
      ).toBeHidden()
    }
  })

  test('should toggle list selections off on successful edit', async () => {
    await deleteAllPosts()
    const bulkEditValue = 'test'

    const postCount = 3
    for (let i = 1; i <= postCount; i++) {
      await createPost({ title: `Post ${i}` })
      // Wait 50ms to ensure the createdAt date is different enough to ensure posts are in the correct order
      await wait(50)
    }

    await page.goto(postsUrl.list)
    // Wait until page has limit in the url, to ensure it is fully loaded
    await expect.poll(() => page.url(), { timeout: POLL_TOPASS_TIMEOUT }).toContain('limit=')
    await page.locator('input#select-all').check()

    await page.locator('.list-selection__button[aria-label="Edit"]').click()

    const editDrawer = page.locator('dialog#edit-posts')
    await expect(editDrawer).toBeVisible()

    const fieldSelect = editDrawer.locator('.field-select')
    await expect(fieldSelect).toBeVisible()

    const fieldSelectControl = fieldSelect.locator('.rs__control')
    await expect(fieldSelectControl).toBeVisible()
    await fieldSelectControl.click()

    const titleOption = fieldSelect.locator('.rs__option:has-text("Title")').first()
    await titleOption.click()

    await editDrawer.locator('input#field-title').fill(bulkEditValue)

    await editDrawer.locator('button[type="submit"]:has-text("Publish changes")').click()

    await expect(page.locator('.payload-toast-container .toast-success')).toContainText(
      `Updated ${postCount} Posts successfully.`,
    )

    await expect(page.locator('.table input#select-all[checked]')).toBeHidden()

    for (let i = 1; i < postCount + 1; i++) {
      await expect(
        page.locator(`table tbody tr .row-${i} input[type="checkbox"][checked]`),
      ).toBeHidden()
    }
  })

  test('should not delete nested un-named tab array data', async () => {
    const originalDoc = await payload.create({
      collection: tabsSlug,
      data: {
        title: 'Tab Title',
        tabTab: {
          tabTabArray: [
            {
              tabTabArrayText: 'nestedText',
            },
          ],
        },
      },
    })

    await page.goto(tabsUrl.list)
    // Wait until page has limit in the url, to ensure it is fully loaded
    await expect.poll(() => page.url(), { timeout: POLL_TOPASS_TIMEOUT }).toContain('limit=')
    await addListFilter({
      page,
      fieldLabel: 'ID',
      operatorLabel: 'equals',
      value: originalDoc.id,
    })

    // select first item
    await page.locator('table tbody tr.row-1 input[type="checkbox"]').check()
    // open bulk edit drawer
    await page
      .locator('.list-selection__actions .btn', {
        hasText: 'Edit',
      })
      .click()

    const bulkEditForm = page.locator('form.edit-many__form')
    await expect(bulkEditForm).toBeVisible()

    await selectInput({
      selectLocator: bulkEditForm.locator('.react-select'),
      options: ['Title'],
      multiSelect: true,
    })

    await bulkEditForm.locator('#field-title').fill('Updated Tab Title')
    await bulkEditForm.locator('button[type="submit"]').click()

    await expect(bulkEditForm).toBeHidden()

    const updatedDocQuery = await payload.find({
      collection: tabsSlug,
      where: {
        id: {
          equals: originalDoc.id,
        },
      },
    })
    const updatedDoc = updatedDocQuery.docs[0]
    await expect.poll(() => updatedDoc?.title).toEqual('Updated Tab Title')
    await expect.poll(() => updatedDoc?.tabTab?.tabTabArray?.length).toBe(1)

    await expect
      .poll(() => updatedDoc?.tabTab?.tabTabArray?.[0]?.tabTabArrayText)
      .toEqual('nestedText')
  })

  test('should preserve beforeInput components when selecting multiple fields', async () => {
    await deleteAllPosts()
    await createPost({ title: 'Post 1' })

    await page.goto(postsUrl.list)
    // Wait until page has limit in the url, to ensure it is fully loaded
    await expect.poll(() => page.url(), { timeout: POLL_TOPASS_TIMEOUT }).toContain('limit=')

    const { modal } = await selectAllAndEditMany(page)

    // Select multiple fields with beforeInput components
    await selectInput({
      selectLocator: modal.locator('.field-select'),
      options: [
        'Field With Before Input A1',
        'Field With Before Input A2',
        'Field With Before Input B',
      ],
      multiSelect: true,
    })

    // All fields should be visible
    await expect(modal.locator('#field-fieldWithBeforeInputA1')).toBeVisible()
    await expect(modal.locator('#field-fieldWithBeforeInputA2')).toBeVisible()
    await expect(modal.locator('#field-fieldWithBeforeInputB')).toBeVisible()

    // All beforeInput components should be visible (2 of type A, 1 of type B)
    const beforeInputsA = modal.locator('[data-testid="before-input-a"]')
    await expect(beforeInputsA).toHaveCount(2)

    const beforeInputB = modal.locator('[data-testid="before-input-b"]')
    await expect(beforeInputB).toHaveCount(1)
    await expect(beforeInputB).toBeVisible()
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
  dataOverrides?: RequiredDataFromCollectionSlug<'posts'>,
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
