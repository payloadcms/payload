import { expect, test } from '@playwright/test'
import { addListFilter } from '__helpers/e2e/filters/index.js'
import { reInitializeDB } from '__helpers/shared/clearAndSeed/reInitializeDB.js'
import * as path from 'path'
import { mapAsync, type RequiredDataFromCollectionSlug } from 'payload'
import { wait } from 'payload/shared'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../__helpers/shared/sdk/index.js'
import type { Config, Post } from './payload-types.js'

import {
  closeAllToasts,
  ensureCompilationIsDone,
  initPageConsoleErrorCatch,
  throttleTest,
} from '../__helpers/e2e/helpers.js'
import { AdminUrlUtil } from '../__helpers/shared/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../__helpers/shared/initPayloadE2ENoConfig.js'
import { TEST_TIMEOUT_LONG } from '../playwright.config.js'
import { pagesSlug } from './collections/Pages/index.js'
import { postsSlug } from './collections/Posts/index.js'
import { usersSlug } from './collections/Users/index.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const { beforeAll, beforeEach, describe } = test

let postsUrl: AdminUrlUtil
let pagesUrl: AdminUrlUtil
let payload: PayloadTestSDK<Config>
let serverURL: string
let usersUrl: AdminUrlUtil

let pagesDocOneID: number | string
let postsDocOneID: number | string
let postsDocTwoID: number | string
let devUserID: number | string

describe('Trash', () => {
  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    ;({ payload, serverURL } = await initPayloadE2ENoConfig<Config>({ dirname }))
    postsUrl = new AdminUrlUtil(serverURL, postsSlug)
    pagesUrl = new AdminUrlUtil(serverURL, pagesSlug)
    usersUrl = new AdminUrlUtil(serverURL, usersSlug)

    await ensureCompilationIsDone({ browser, serverURL })
  })

  beforeEach(async ({ page, context }) => {
    await reInitializeDB({
      serverURL,
      snapshotKey: 'trash',
    })
    pagesDocOneID = (
      await payload.find({
        collection: 'pages',
        limit: 1,
        depth: 0,
        pagination: false,
      })
    ).docs[0]!.id
    postsDocOneID = (
      await payload.find({
        collection: 'posts',
        limit: 1,
        depth: 0,
        pagination: false,
        where: {
          title: {
            equals: 'Post 1',
          },
        },
      })
    ).docs[0]!.id
    postsDocTwoID = (
      await payload.find({
        collection: 'posts',
        limit: 1,
        depth: 0,
        pagination: false,
        where: {
          title: {
            equals: 'Post 2',
          },
        },
      })
    ).docs[0]!.id
    initPageConsoleErrorCatch(page)
    //await throttleTest({ page, context, delay: 'Slow 4G' })

    await ensureCompilationIsDone({ page, serverURL })
  })

  describe('Collection view', () => {
    describe('List view', () => {
      test('should not show trash tab in the list view of a colleciton without trash enabled', async ({
        page,
      }) => {
        await page.goto(pagesUrl.list)

        await expect(page.locator('#trash-view-pill')).toBeHidden()
      })

      test('should show trash tab in the list view of a colleciton with trash enabled', async ({
        page,
      }) => {
        await page.goto(postsUrl.list)

        await expect(page.locator('#trash-view-pill')).toBeVisible()
      })

      test('should show all posts tab in list view of a collection with trash enabled', async ({
        page,
      }) => {
        await page.goto(postsUrl.list)

        await expect(page.locator('#all-posts')).toBeVisible()
      })

      test('Should not show checkbox to delete permanently bulk delete modal in trash disabled collection', async ({
        page,
      }) => {
        await page.goto(pagesUrl.list)

        await page.locator('.row-1 .cell-_select input').check()

        await page.locator('.list-selection__button[aria-label="Delete"]').click()
        await expect(page.locator('#delete-forever')).toBeHidden()
      })

      test('Should show checkbox to delete permanently in bulk delete modal in trash enabled collection', async ({
        page,
      }) => {
        await page.goto(postsUrl.list)

        await page.locator('.row-1 .cell-_select input').check()

        await page.locator('.list-selection__button[aria-label="Delete"]').click()
        await expect(page.locator('#delete-forever')).toBeVisible()
      })

      test('Bulk delete toast message should properly correspond to trash / perma delete', async ({
        page,
      }) => {
        await page.goto(postsUrl.list)

        await page.locator('.row-1 .cell-_select input').check()

        await page.locator('.list-selection__button[aria-label="Delete"]').click()
        // Check the checkbox to delete permanently
        await page.locator('#delete-forever').check()

        await page.locator('#confirm-delete-many-docs #confirm-action').click()

        await expect(page.locator('.payload-toast-container .toast-success')).toHaveText(
          'Permanently deleted 1 Post successfully.',
        )

        await page.reload()

        await page.locator('.row-1 .cell-_select input').check()

        await page.locator('.list-selection__button[aria-label="Delete"]').click()

        // Skip the checkbox to delete permanently and default to trashing

        await page.locator('#confirm-delete-many-docs #confirm-action').click()
        await expect(page.locator('.payload-toast-container .toast-success')).toHaveText(
          '1 Post moved to trash.',
        )
      })
    })

    describe('Edit view', () => {
      test('Should not show checkbox to delete permanently doc controls delete modal in trash disabled collection', async ({
        page,
      }) => {
        await page.goto(pagesUrl.edit(pagesDocOneID))

        const threeDotMenu = page.locator('.doc-controls__popup')
        await expect(threeDotMenu).toBeVisible()
        await threeDotMenu.click()

        await page.locator('.popup__content #action-delete').click()
        await expect(page.locator('#delete-forever')).toBeHidden()
      })

      test('Should show checkbox to delete permanently doc controls delete modal in trash enabled collection', async ({
        page,
      }) => {
        await page.goto(postsUrl.edit(postsDocOneID))

        const threeDotMenu = page.locator('.doc-controls__popup')
        await expect(threeDotMenu).toBeVisible()
        await threeDotMenu.click()

        await page.locator('.popup__content #action-delete').click()
        await expect(page.locator('#delete-forever')).toBeVisible()
      })

      test('Doc view delete toast message should properly correspond to trash / perma delete', async ({
        page,
      }) => {
        await page.goto(postsUrl.edit(postsDocOneID))

        const threeDotMenuOne = page.locator('.doc-controls__popup')
        await expect(threeDotMenuOne).toBeVisible()
        await threeDotMenuOne.click()

        await page.locator('.popup__content #action-delete').click()

        // Check the checkbox to delete permanently
        await page.locator('#delete-forever').check()

        await page.locator('.delete-document #confirm-action').click()

        await expect(page.locator('.payload-toast-container .toast-success')).toHaveText(
          'Post "Post 1" successfully deleted.',
        )

        await page.goto(postsUrl.edit(postsDocTwoID))

        const threeDotMenuTwo = page.locator('.doc-controls__popup')
        await expect(threeDotMenuTwo).toBeVisible()
        await threeDotMenuTwo.click()

        await page.locator('.popup__content #action-delete').click()

        // Skip the checkbox to delete permanently and default to trashing

        await page.locator('.delete-document #confirm-action').click()

        await expect(page.locator('.payload-toast-container .toast-success')).toHaveText(
          'Post "Post 2" moved to trash.',
        )
      })
    })
  })

  describe('Trash view', () => {
    describe('List view', () => {
      test('Should show `Empty trash` button', async ({ page }) => {
        await page.goto(postsUrl.trash)

        await expect(page.locator('#empty-trash-button')).toBeVisible()
      })

      test('Should disable Empty trash button when there are no trashed docs', async ({ page }) => {
        await page.goto(postsUrl.trash)

        await expect(page.locator('#empty-trash-button')).toBeDisabled()
      })

      test('Should successfully trash a doc from the list view and show it in the trash view', async ({
        page,
      }) => {
        await page.goto(postsUrl.list)
        const post1Row = page.locator('.table tr:has-text("Post 1")')
        await post1Row.locator('.cell-_select input').check()
        await page.locator('.list-selection__button[aria-label="Delete"]').click()

        // Skip the checkbox to delete permanently and default to trashing

        await page.locator('#confirm-delete-many-docs #confirm-action').click()
        await expect(page.locator('.payload-toast-container .toast-success')).toHaveText(
          '1 Post moved to trash.',
        )
        // Navigate to the trash view
        await page.locator('#trash-view-pill').click()
        await expect(page.locator('.row-1 .cell-title')).toHaveText('Post 1')
      })

      test('Should show `trash` breadcrumb', async ({ page }) => {
        await page.goto(postsUrl.trash)

        await expect(page.locator('.step-nav.app-header__step-nav .step-nav__last')).toContainText(
          'Trash',
        )
      })

      test('Should show `restore` and `delete` buttons', async ({ page }) => {
        const trashedDoc = await createTrashedPostDoc({
          title: 'Trashed Post',
        })

        await page.goto(postsUrl.list)

        await page.locator('#trash-view-pill').click()

        await expect(page.locator('.step-nav.app-header__step-nav .step-nav__last')).toContainText(
          'Trash',
        )

        const selectAll = page.locator('input#select-all')

        // Ensure checkbox is visible and attached
        await expect(selectAll).toBeAttached()
        await expect(selectAll).toBeVisible()
        await expect(selectAll).toBeEnabled()

        // Wait until the row actually exists to be selectable
        await expect(page.locator('.row-1')).toBeVisible()

        // eslint-disable-next-line playwright/no-force-option
        await selectAll.check({ force: true })

        await expect(page.locator('.list-selection__button[aria-label="Restore"]')).toBeVisible()
        await expect(page.locator('.list-selection__button[aria-label="Delete"]')).toBeVisible()

        await payload.delete({
          collection: postsSlug,
          id: trashedDoc.id,
          trash: true,
        })
      })

      test('Should successfully perma delete all trashed docs with empty trash button', async ({
        page,
      }) => {
        await mapAsync([...Array(3)], async () => {
          await createTrashedPostDoc({
            title: 'Ready for delete',
          })
        })

        await page.goto(postsUrl.trash)
        // Wait until hydration is complete
        await wait(1000)

        await page.locator('#empty-trash-button').click()

        await expect(page.locator('#confirm-empty-trash')).toBeVisible()
        await expect(
          page.locator('#confirm-empty-trash .confirmation-modal__content'),
        ).toContainText('You are about to permanently delete 3 Posts from the trash. Are you sure?')

        await page.locator('#confirm-empty-trash #confirm-action').click()

        await expect(page.locator('.payload-toast-container .toast-success')).toHaveText(
          'Permanently deleted 3 Posts successfully.',
        )
      })

      test('Should successfully restore all trashed docs with restore button as draft by default', async ({
        page,
      }) => {
        await mapAsync([...Array(2)], async () => {
          await createTrashedPostDoc({
            title: 'Ready for restore',
          })
        })

        await page.goto(postsUrl.trash)

        await expect(page.locator('.cell-title', { hasText: 'Ready for restore' })).toHaveCount(2)

        await page.locator('input#select-all').check()

        await page.locator('.list-selection__button[aria-label="Restore"]').click()

        await expect(page.locator('#confirm-restore-many-docs')).toBeVisible()

        await expect(
          page.locator('#confirm-restore-many-docs .confirmation-modal__content'),
        ).toContainText('You are about to restore 2 Posts as draft')

        await page.locator('#confirm-restore-many-docs #confirm-action').click()

        await expect(page.locator('.payload-toast-container .toast-success')).toHaveText(
          'Restored 2 Posts successfully.',
        )
        // Verify that the posts are no longer in the trash view
        await expect(page.locator('.cell-title', { hasText: 'Ready for restore' })).toHaveCount(0)

        // Navigate back to the list view
        await page.goto(postsUrl.list)

        // Verify that the posts have been restored and exist in the list view
        await expect(page.locator('.row-1 .cell-title')).toHaveText('Ready for restore')
        await expect(page.locator('.row-2 .cell-title')).toHaveText('Ready for restore')

        // Check that restored docs have `_status = "draft"`
        await expect
          .poll(async () => {
            const { docs } = await payload.find({
              collection: postsSlug,
              where: {
                title: { equals: 'Ready for restore' },
              },
            })
            return docs.length
          })
          .toBe(2)

        await expect
          .poll(async () => {
            const { docs } = await payload.find({
              collection: postsSlug,
              where: {
                title: { equals: 'Ready for restore' },
              },
            })
            return docs.every((doc) => doc._status === 'draft')
          })
          .toBe(true)

        await payload.delete({
          collection: postsSlug,
          where: {
            title: {
              equals: 'Ready for restore',
            },
          },
        })
      })

      test('Should successfully restore all trashed docs with restore button as published', async ({
        page,
      }) => {
        await mapAsync([...Array(2)], async () => {
          await createTrashedPostDoc({
            title: 'Ready for restore',
          })
        })

        await page.goto(postsUrl.trash)

        await expect(page.locator('.cell-title', { hasText: 'Ready for restore' })).toHaveCount(2)

        await page.locator('input#select-all').check()

        await page.locator('.list-selection__button[aria-label="Restore"]').click()

        await expect(page.locator('#confirm-restore-many-docs')).toBeVisible()

        await expect(
          page.locator('#confirm-restore-many-docs .confirmation-modal__content'),
        ).toContainText('You are about to restore 2 Posts as draft')

        await page.locator('#restore-as-published-many').check()

        await page.locator('#confirm-restore-many-docs #confirm-action').click()

        await expect(page.locator('.payload-toast-container .toast-success')).toHaveText(
          'Restored 2 Posts successfully.',
        )
        // Verify that the posts are no longer in the trash view
        await expect(page.locator('.cell-title', { hasText: 'Ready for restore' })).toHaveCount(0)

        // Navigate back to the list view
        await page.goto(postsUrl.list)

        // Verify that the posts have been restored and exist in the list view
        await expect(page.locator('.row-1 .cell-title')).toHaveText('Ready for restore')
        await expect(page.locator('.row-2 .cell-title')).toHaveText('Ready for restore')

        // Check that restored docs have `_status = "draft"`
        await expect
          .poll(async () => {
            const { docs } = await payload.find({
              collection: postsSlug,
              where: {
                title: { equals: 'Ready for restore' },
              },
            })
            return docs.length
          })
          .toBe(2)

        await expect
          .poll(async () => {
            const { docs } = await payload.find({
              collection: postsSlug,
              where: {
                title: { equals: 'Ready for restore' },
              },
            })
            return docs.every((doc) => doc._status === 'published')
          })
          .toBe(true)

        await payload.delete({
          collection: postsSlug,
          where: {
            title: {
              equals: 'Ready for restore',
            },
          },
        })
      })

      test('Should successfully delete permanently all selected trashed docs with delete button', async ({
        page,
      }) => {
        await mapAsync([...Array(2)], async () => {
          await createTrashedPostDoc({
            title: 'Ready for delete from delete button',
          })
        })

        await page.goto(postsUrl.trash)

        await expect(
          page.locator('.cell-title', { hasText: 'Ready for delete from delete button' }),
        ).toHaveCount(2)

        await page.locator('input#select-all').check()

        await page.locator('.list-selection__button[aria-label="Delete"]').click()

        await expect(page.locator('#confirm-delete-many-docs')).toBeVisible()

        await expect(
          page.locator('#confirm-delete-many-docs .confirmation-modal__content'),
        ).toContainText('You are about to permanently delete 2 Posts from the trash. Are you sure?')

        await page.locator('#confirm-delete-many-docs #confirm-action').click()

        await expect(page.locator('.payload-toast-container .toast-success')).toHaveText(
          'Permanently deleted 2 Posts successfully.',
        )

        // Verify that the posts are no longer in the trash view
        await expect(
          page.locator('.cell-title', { hasText: 'Ready for delete from delete button' }),
        ).toHaveCount(0)

        // Verify that the posts have been permanently deleted
        await expect
          .poll(async () => {
            const deletedPosts = await payload.find({
              collection: postsSlug,
              trash: true,
              where: {
                and: [
                  {
                    deletedAt: {
                      exists: true,
                    },
                  },
                  {
                    title: {
                      equals: 'Ready for delete from delete button',
                    },
                  },
                ],
              },
            })
            return deletedPosts.docs.length
          })
          .toBe(0)
      })

      test('Should properly filter trashed docs through where query builder', async ({ page }) => {
        const createdDocs: Post[] = []

        // Create 2 "Test Post" docs
        await mapAsync([...Array(2)], async (item, index) => {
          const doc = await createTrashedPostDoc({
            title: `Test Post ${index + 1}`,
          })
          createdDocs.push(doc)
        })

        // Create 2 "Some Post" docs
        await mapAsync([...Array(2)], async (item, index) => {
          const doc = await createTrashedPostDoc({
            title: `Some Post ${index + 1}`,
          })
          createdDocs.push(doc)
        })

        await page.goto(postsUrl.trash)

        await addListFilter({
          page,
          fieldLabel: 'Title',
          operatorLabel: 'is like',
          value: 'Test',
        })

        await expect(page.locator('.cell-title', { hasText: 'Test Post' })).toHaveCount(2)
        await expect(page.locator('.cell-title', { hasText: 'Some Post' })).toHaveCount(0)

        // Cleanup: permanently delete the created docs
        await mapAsync(createdDocs, async (doc) => {
          await payload.delete({
            collection: postsSlug,
            id: doc.id,
            trash: true, // Force permanent delete
          })
        })
      })
    })

    describe('Edit view', () => {
      let trashedPostDocOne: Post

      beforeEach(async () => {
        trashedPostDocOne = await createTrashedPostDoc({
          title: 'Trashed Post',
        })
      })

      test('Should show `trash` and doc name in breadcrumbs', async ({ page }) => {
        await page.goto(postsUrl.trashEdit(trashedPostDocOne.id))

        await expect(page.locator('.step-nav.app-header__step-nav a').nth(2)).toContainText('Trash')
        await expect(page.locator('.step-nav.app-header__step-nav .step-nav__last')).toContainText(
          'Trashed Post',
        )
      })

      test('should show trash banner in the edit view', async ({ page }) => {
        await page.goto(postsUrl.trashEdit(trashedPostDocOne.id))

        await expect(page.locator('.trash-banner')).toBeVisible()
      })

      test('Should navigate back to the trash view using the `trash` breadcrumb', async ({
        page,
      }) => {
        await page.goto(postsUrl.trashEdit(trashedPostDocOne.id))

        await page.locator('.step-nav.app-header__step-nav a').nth(2).click()

        await expect(page).toHaveURL(/\/admin\/collections\/posts\/trash/)
      })

      test('Should not render dot menu popup', async ({ page }) => {
        await page.goto(postsUrl.trashEdit(trashedPostDocOne.id))

        const threeDotMenu = page.locator('.doc-controls__popup')
        await expect(threeDotMenu).toBeHidden()
      })

      test('Should render status block with correct status', async ({ page }) => {
        await page.goto(postsUrl.trashEdit(trashedPostDocOne.id))

        const statusBlock = page.locator('.doc-controls__status')
        await expect(statusBlock).toBeVisible()
        await expect(statusBlock).toContainText('Previously Published')
      })

      test('Should render Permanently Delete and Restore buttons in doc controls', async ({
        page,
      }) => {
        await page.goto(postsUrl.trashEdit(trashedPostDocOne.id))

        const permanentlyDeleteButton = page.locator(
          '.doc-controls__controls #action-permanently-delete',
        )
        await expect(permanentlyDeleteButton).toBeVisible()

        const restoreButton = page.locator('.doc-controls__controls #action-restore')
        await expect(restoreButton).toBeVisible()
      })

      test('should successfully permanently delete a trashed doc with Permanently Delete button', async ({
        page,
      }) => {
        await page.goto(postsUrl.trashEdit(trashedPostDocOne.id))

        const permanentlyDeleteButton = page.locator(
          '.doc-controls__controls #action-permanently-delete',
        )
        await expect(permanentlyDeleteButton).toBeVisible()

        await permanentlyDeleteButton.click()

        await expect(page.locator(`#perma-delete-${trashedPostDocOne.id}`)).toBeVisible()
        await expect(
          page.locator(`#perma-delete-${trashedPostDocOne.id} .confirmation-modal__content`),
        ).toContainText('You are about to permanently delete the Post')

        await page.locator(`#perma-delete-${trashedPostDocOne.id} #confirm-action`).click()

        await expect(page.locator('.payload-toast-container .toast-success')).toHaveText(
          'Post "Trashed Post" successfully deleted.',
        )

        // Verify that the post has been permanently deleted
        await expect
          .poll(async () => {
            const deletedPost = await payload.find({
              collection: postsSlug,
              trash: true,
              where: {
                and: [
                  {
                    deletedAt: {
                      exists: true,
                    },
                  },
                  {
                    id: {
                      equals: trashedPostDocOne.id,
                    },
                  },
                ],
              },
            })
            return deletedPost.docs.length
          })
          .toBe(0)
      })

      test('should successfully restore a trashed doc with Restore button', async ({ page }) => {
        await page.goto(postsUrl.trashEdit(trashedPostDocOne.id))

        const restoreButton = page.locator('.doc-controls__controls #action-restore')
        await expect(restoreButton).toBeVisible()

        await restoreButton.click()

        await expect(page.locator(`#restore-${trashedPostDocOne.id}`)).toBeVisible()
        await expect(
          page.locator(`#restore-${trashedPostDocOne.id} .confirmation-modal__content`),
        ).toContainText('You are about to restore the Post Trashed Post as a draft. Are you sure?')

        await page.locator(`#restore-${trashedPostDocOne.id} #confirm-action`).click()

        await expect(page.locator('.payload-toast-container .toast-success')).toHaveText(
          'Post "Trashed Post" successfully restored.',
        )

        // Check that restored doc has `_status = "draft"`
        await expect
          .poll(async () => {
            const { docs } = await payload.find({
              collection: postsSlug,
              where: {
                id: { equals: trashedPostDocOne.id },
              },
            })
            return docs.length
          })
          .toBe(1)

        await expect
          .poll(async () => {
            const { docs } = await payload.find({
              collection: postsSlug,
              where: {
                id: { equals: trashedPostDocOne.id },
              },
            })
            return docs[0]?._status === 'draft'
          })
          .toBe(true)
      })

      test('Should render fields as read-only', async ({ page }) => {
        await page.goto(postsUrl.trashEdit(trashedPostDocOne.id))

        // Check that the title field is read-only
        const titleField = page.locator('#field-title')
        await expect(titleField).toBeDisabled()
      })

      test('Should allow viewing of the Versions tab view from trash edit view', async ({
        page,
      }) => {
        const incomingTrashedDoc = await createPostDoc({
          title: 'Post 1',
          _status: 'published',
        })

        await page.goto(postsUrl.list)
        await page.locator('.row-1 .cell-_select input').check()
        await page.locator('.list-selection__button[aria-label="Delete"]').click()

        // Skip the checkbox to delete permanently and default to trashing

        await page.locator('#confirm-delete-many-docs #confirm-action').click()
        await expect(page.locator('.payload-toast-container .toast-success')).toHaveText(
          '1 Post moved to trash.',
        )
        await closeAllToasts(page)

        // Navigate to the trash view
        await page.locator('#trash-view-pill').click()

        // Assert the URL is /posts/trash
        await expect(page).toHaveURL(/\/posts\/trash(\?|$)/)

        await expect(page.locator('table')).toBeVisible()

        await expect(page.locator('.row-1 .cell-title')).toHaveText('Post 1')

        // Click on the first row to go to the trashed doc edit view
        await page.locator('.row-1 .cell-title').click()

        await page.waitForURL(/\/posts\/trash\//)
        await page.getByRole('link', { name: 'Versions' }).waitFor({ state: 'visible' })

        await page.getByRole('link', { name: 'Versions' }).click()

        await expect(page.locator('.step-nav.app-header__step-nav a').nth(2)).toContainText('Trash')
        await expect(page.locator('.step-nav.app-header__step-nav .step-nav__last')).toContainText(
          'Versions',
        )

        await payload.delete({
          collection: postsSlug,
          id: incomingTrashedDoc.id,
          trash: true,
        })
      })

      test('Should navigate back to the trashed doc view using the post name breadcrumb from the Versions tab view', async ({
        page,
      }) => {
        const incomingTrashedDoc = await createPostDoc({
          title: 'Post 1',
          _status: 'published',
        })

        await page.goto(postsUrl.list)
        await page.locator('.row-1 .cell-_select input').check()
        await page.locator('.list-selection__button[aria-label="Delete"]').click()

        // Skip the checkbox to delete permanently and default to trashing

        await page.locator('#confirm-delete-many-docs #confirm-action').click()
        await expect(page.locator('.payload-toast-container .toast-success')).toHaveText(
          '1 Post moved to trash.',
        )
        await closeAllToasts(page)
        // Navigate to the trash view
        await page.locator('#trash-view-pill').click()

        // Assert the URL is /posts/trash
        await expect(page).toHaveURL(/\/posts\/trash(\?|$)/)

        await expect(page.locator('table')).toBeVisible()

        await expect(page.locator('.row-1 .cell-title')).toHaveText('Post 1')

        // Click on the first row to go to the trashed doc edit view
        await page.locator('.row-1 .cell-title').click()

        await page.waitForURL(/\/posts\/trash\//)
        await page.getByRole('link', { name: 'Versions' }).waitFor({ state: 'visible' })

        await page.getByRole('link', { name: 'Versions' }).click()

        await expect(page.locator('.step-nav.app-header__step-nav a').nth(2)).toContainText('Trash')
        await expect(page.locator('.step-nav.app-header__step-nav .step-nav__last')).toContainText(
          'Versions',
        )

        await page.locator('.step-nav.app-header__step-nav a').nth(3).click()

        await expect(page.locator('.step-nav.app-header__step-nav .step-nav__last')).toContainText(
          'Post 1',
        )

        await payload.delete({
          collection: postsSlug,
          id: incomingTrashedDoc.id,
          trash: true,
        })
      })

      test('Should allow viewing of a specific version from the versions tab in the trash document view', async ({
        page,
      }) => {
        const incomingTrashedDoc = await createPostDoc({
          title: 'Post 1',
          _status: 'published',
        })

        await page.goto(postsUrl.list)
        await page.locator('.row-1 .cell-_select input').check()
        await page.locator('.list-selection__button[aria-label="Delete"]').click()

        // Skip the checkbox to delete permanently and default to trashing

        await page.locator('#confirm-delete-many-docs #confirm-action').click()
        await expect(page.locator('.payload-toast-container .toast-success')).toHaveText(
          '1 Post moved to trash.',
        )
        await closeAllToasts(page)
        // Navigate to the trash view
        await page.locator('#trash-view-pill').click()

        // Assert the URL is /posts/trash
        await expect(page).toHaveURL(/\/posts\/trash(\?|$)/)

        await expect(page.locator('table')).toBeVisible()

        await expect(page.locator('.row-1 .cell-title')).toHaveText('Post 1')

        // Click on the first row to go to the trashed doc edit view
        await page.locator('.row-1 .cell-title').click()

        await page.waitForURL(/\/posts\/trash\//)
        await page.getByRole('link', { name: 'Versions' }).waitFor({ state: 'visible' })

        await page.getByRole('link', { name: 'Versions' }).click()

        // Click on the first version link
        await page.locator('.versions table tbody tr td.cell-updatedAt a').first().click()

        await expect(page.locator('.step-nav.app-header__step-nav a').nth(2)).toContainText('Trash')
        await expect
          .poll(async () => {
            const text = await page
              .locator('.step-nav.app-header__step-nav .step-nav__last')
              .innerText()
            return text
          })
          .toMatch(/\w+ \d{1,2}(st|nd|rd|th) \d{4}, \d{1,2}:\d{2} [AP]M/)

        await payload.delete({
          collection: postsSlug,
          id: incomingTrashedDoc.id,
          trash: true,
        })
      })

      test('Should allow viewing of the API tab view from trash edit view', async ({ page }) => {
        const incomingTrashedDoc = await createPostDoc({
          title: 'Post 1',
          _status: 'published',
        })

        await page.goto(postsUrl.list)
        await page.locator('.row-1 .cell-_select input').check()
        await page.locator('.list-selection__button[aria-label="Delete"]').click()

        // Skip the checkbox to delete permanently and default to trashing

        await page.locator('#confirm-delete-many-docs #confirm-action').click()
        await expect(page.locator('.payload-toast-container .toast-success')).toHaveText(
          '1 Post moved to trash.',
        )
        await closeAllToasts(page)
        // Navigate to the trash view
        await page.locator('#trash-view-pill').click()

        // Assert the URL is /posts/trash
        await expect(page).toHaveURL(/\/posts\/trash(\?|$)/)

        await expect(page.locator('table')).toBeVisible()

        await expect(page.locator('.row-1 .cell-title')).toHaveText('Post 1')

        // Click on the first row to go to the trashed doc edit view
        await page.locator('.row-1 .cell-title').click()

        await page.waitForURL(/\/posts\/trash\//)
        await page.getByRole('link', { name: 'API' }).waitFor({ state: 'visible' })

        await page.getByRole('link', { name: 'API' }).click()

        await expect(page.locator('.step-nav.app-header__step-nav a').nth(2)).toContainText('Trash')
        await expect(page.locator('.step-nav.app-header__step-nav .step-nav__last')).toContainText(
          'API',
        )

        await payload.delete({
          collection: postsSlug,
          id: incomingTrashedDoc.id,
          trash: true,
        })
      })

      test('Should navigate back to the trashed doc view using the post name breadcrumb from the API tab view', async ({
        page,
      }) => {
        const incomingTrashedDoc = await createPostDoc({
          title: 'Post 1',
          _status: 'published',
        })

        await page.goto(postsUrl.list)
        await page.locator('.row-1 .cell-_select input').check()
        await page.locator('.list-selection__button[aria-label="Delete"]').click()

        // Skip the checkbox to delete permanently and default to trashing

        await page.locator('#confirm-delete-many-docs #confirm-action').click()
        await expect(page.locator('.payload-toast-container .toast-success')).toHaveText(
          '1 Post moved to trash.',
        )
        await closeAllToasts(page)
        // Navigate to the trash view
        await page.locator('#trash-view-pill').click()

        // Assert the URL is /posts/trash
        await expect(page).toHaveURL(/\/posts\/trash(\?|$)/)

        await expect(page.locator('table')).toBeVisible()

        await expect(page.locator('.row-1 .cell-title')).toHaveText('Post 1')

        // Click on the first row to go to the trashed doc edit view
        await page.locator('.row-1 .cell-title').click()

        await page.waitForURL(/\/posts\/trash\//)
        await page.getByRole('link', { name: 'API' }).waitFor({ state: 'visible' })
        await page.getByRole('link', { name: 'API' }).click()

        await expect(page.locator('.step-nav.app-header__step-nav a').nth(2)).toContainText('Trash')
        await expect(page.locator('.step-nav.app-header__step-nav .step-nav__last')).toContainText(
          'API',
        )

        await page.locator('.step-nav.app-header__step-nav a').nth(3).click()

        await expect(page.locator('.step-nav.app-header__step-nav .step-nav__last')).toContainText(
          'Post 1',
        )

        await payload.delete({
          collection: postsSlug,
          id: incomingTrashedDoc.id,
          trash: true,
        })
      })
    })
  })
  describe('Auth enabled collection', () => {
    beforeEach(async () => {
      // Ensure Dev user exists and store its ID
      const { docs } = await payload.find({
        collection: usersSlug,
        limit: 1,
        where: { name: { equals: 'Dev' } },
        trash: true,
        depth: 0,
        pagination: false,
      })
      if (docs.length === 0) {
        throw new Error('Dev user not found! Ensure test seed data includes a Dev user.')
      }
      devUserID = docs[0]?.id as number | string
    })

    async function ensureDevUserTrashed() {
      const { docs } = await payload.find({
        collection: usersSlug,
        where: {
          and: [{ name: { equals: 'Dev' } }, { deletedAt: { exists: true } }],
        },
        limit: 1,
        trash: true,
      })

      if (docs.length === 0) {
        // Trash the user if it's not already trashed
        await payload.update({
          collection: usersSlug,
          id: devUserID,
          data: { deletedAt: new Date().toISOString() },
        })
      }
    }

    test('Should show trash tab in the list view of a collection with auth enabled', async ({
      page,
    }) => {
      await page.goto(usersUrl.list)

      await expect(page.locator('#trash-view-pill')).toBeVisible()
    })

    test('Should successfully trash a user from the list view and show it in the trash view', async ({
      page,
    }) => {
      await page.goto(usersUrl.list)

      await page.locator('.row-1 .cell-_select input').check()
      await page.locator('.list-selection__button[aria-label="Delete"]').click()

      // Skip the checkbox to delete permanently and default to trashing
      await page.locator('#confirm-delete-many-docs #confirm-action').click()
      await expect(page.locator('.payload-toast-container .toast-success')).toHaveText(
        '1 User moved to trash.',
      )
      // Navigate to the trash view
      await page.locator('#trash-view-pill').click()
      await expect(page.locator('.row-1 .cell-name')).toHaveText('Dev')
    })

    test('Should be able to access trashed doc edit view from the trash view', async ({ page }) => {
      await ensureDevUserTrashed()

      await page.goto(usersUrl.trash)

      await expect(page.locator('.row-1 .cell-name')).toHaveText('Dev')
      const nameLink = page.locator('.row-1 .cell-name a')
      await expect(nameLink).toBeVisible()
      await nameLink.click()

      await page.waitForURL(/\/users\/trash\/[a-f0-9]{24}/)
      await page.locator('input[name="email"]').waitFor({ state: 'visible' })

      await expect(page).toHaveURL(/\/users\/trash\/[a-f0-9]{24}/)
    })

    test('Should properly disable auth fields in the trashed user edit view', async ({ page }) => {
      await ensureDevUserTrashed()

      await page.goto(usersUrl.trash)

      await expect(page.locator('.row-1 .cell-name')).toHaveText('Dev')
      await page.locator('.row-1 .cell-name').click()

      await page.waitForURL(/\/users\/trash\/[a-f0-9]{24}/)
      await page.locator('input[name="email"]').waitFor({ state: 'visible' })

      await expect(page).toHaveURL(/\/users\/trash\/[a-f0-9]{24}/)

      await expect(page.locator('input[name="email"]')).toBeDisabled()
      await expect(page.locator('#change-password')).toBeDisabled()

      await expect(page.locator('#field-name')).toBeDisabled()
      await expect(page.locator('#field-roles .rs__input')).toBeDisabled()
    })

    test('Should properly restore trashed user as draft', async ({ page }) => {
      await ensureDevUserTrashed()

      await page.goto(usersUrl.trash)

      await expect(page.locator('.row-1 .cell-name')).toHaveText('Dev')
      const nameLink = page.locator('.row-1 .cell-name a')
      await expect(nameLink).toBeVisible()
      await nameLink.click()

      await page.waitForURL(/\/users\/trash\/[a-f0-9]{24}/)
      await page.locator('.doc-controls__controls #action-restore').waitFor({ state: 'visible' })

      await expect(page).toHaveURL(/\/users\/trash\/[a-f0-9]{24}/)

      await page.locator('.doc-controls__controls #action-restore').click()

      await expect(page.locator(`#restore-${devUserID} #confirm-action`)).toBeVisible()
      await expect(
        page.locator(`#restore-${devUserID} .confirmation-modal__content`),
      ).toContainText('You are about to restore the User')

      await page.locator(`#restore-${devUserID} #confirm-action`).click()

      await expect(page.locator('.payload-toast-container .toast-success')).toHaveText(
        'User "Dev" successfully restored.',
      )
    })
  })
})

async function createPostDoc(data: RequiredDataFromCollectionSlug<'posts'>): Promise<Post> {
  return payload.create({
    collection: postsSlug,
    data,
  }) as unknown as Promise<Post>
}

async function createTrashedPostDoc(data: RequiredDataFromCollectionSlug<'posts'>): Promise<Post> {
  return payload.create({
    collection: postsSlug,
    data: {
      ...data,
      _status: 'published',
      deletedAt: new Date().toISOString(), // Set the post as trashed
    },
  }) as unknown as Promise<Post>
}
