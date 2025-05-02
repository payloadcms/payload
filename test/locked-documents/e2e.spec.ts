import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import * as path from 'path'
import { mapAsync } from 'payload'
import { wait } from 'payload/shared'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../helpers/sdk/index.js'
import type {
  Config,
  Page as PageType,
  PayloadLockedDocument,
  Post,
  Test,
  User,
} from './payload-types.js'

import {
  ensureCompilationIsDone,
  exactText,
  initPageConsoleErrorCatch,
  saveDocAndAssert,
} from '../helpers.js'
import { AdminUrlUtil } from '../helpers/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../helpers/initPayloadE2ENoConfig.js'
import { POLL_TOPASS_TIMEOUT, TEST_TIMEOUT_LONG } from '../playwright.config.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const { beforeAll, afterAll, describe } = test

const lockedDocumentCollection = 'payload-locked-documents'

let page: Page
let globalUrl: AdminUrlUtil
let postsUrl: AdminUrlUtil
let pagesUrl: AdminUrlUtil
let testsUrl: AdminUrlUtil
let payload: PayloadTestSDK<Config>
let serverURL: string

describe('Locked Documents', () => {
  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    ;({ payload, serverURL } = await initPayloadE2ENoConfig<Config>({ dirname }))

    globalUrl = new AdminUrlUtil(serverURL, 'menu')
    postsUrl = new AdminUrlUtil(serverURL, 'posts')
    pagesUrl = new AdminUrlUtil(serverURL, 'pages')
    testsUrl = new AdminUrlUtil(serverURL, 'tests')

    const context = await browser.newContext()
    page = await context.newPage()

    initPageConsoleErrorCatch(page)

    await ensureCompilationIsDone({ page, serverURL })
  })

  describe('disabled locking', () => {
    test('should prevent locking of documents if lockDocuments is false', async () => {
      const { id } = await createPageDoc({})

      await page.goto(pagesUrl.edit(id))

      const textInput = page.locator('#field-text')
      await textInput.fill('hello world')

      // eslint-disable-next-line payload/no-wait-function
      await wait(500)

      const lockedDocs = await payload.find({
        collection: lockedDocumentCollection,
        limit: 1,
        pagination: false,
        where: {
          'document.value': { equals: id },
        },
      })

      expect(lockedDocs.docs.length).toBe(0)
    })
  })

  describe('list view - collections', () => {
    let postDoc: Post
    let anotherPostDoc: Post
    let user2: User
    let lockedDoc: PayloadLockedDocument
    let testDoc: Test
    let testLockedDoc: PayloadLockedDocument

    beforeAll(async () => {
      postDoc = await createPostDoc({
        text: 'hello',
      })

      anotherPostDoc = await createPostDoc({
        text: 'another post',
      })

      testDoc = await createTestDoc({
        text: 'test doc',
      })

      user2 = await payload.create({
        collection: 'users',
        data: {
          email: 'user2@payloadcms.com',
          password: '1234',
          roles: ['is_user'],
        },
      })

      lockedDoc = await payload.create({
        collection: lockedDocumentCollection,
        data: {
          document: {
            relationTo: 'posts',
            value: postDoc.id,
          },
          globalSlug: undefined,
          user: {
            relationTo: 'users',
            value: user2.id,
          },
        },
      })

      testLockedDoc = await payload.create({
        collection: lockedDocumentCollection,
        data: {
          document: {
            relationTo: 'tests',
            value: testDoc.id,
          },
          globalSlug: undefined,
          user: {
            relationTo: 'users',
            value: user2.id,
          },
        },
      })
    })

    afterAll(async () => {
      await payload.delete({
        collection: 'users',
        id: user2.id,
      })

      await payload.delete({
        collection: lockedDocumentCollection,
        id: lockedDoc.id,
      })

      await payload.delete({
        collection: lockedDocumentCollection,
        id: testLockedDoc.id,
      })

      await payload.delete({
        collection: 'posts',
        id: postDoc.id,
      })

      await payload.delete({
        collection: 'posts',
        id: anotherPostDoc.id,
      })

      await payload.delete({
        collection: 'tests',
        id: testDoc.id,
      })
    })

    test('should show lock icon on document row if locked', async () => {
      await page.goto(postsUrl.list)

      await expect(page.locator('.table .row-2 .locked svg')).toBeVisible()
    })

    test('should not show lock icon on document row if unlocked', async () => {
      await page.goto(postsUrl.list)

      await expect(page.locator('.table .row-3 .checkbox-input__input')).toBeVisible()
    })

    test('should not show lock icon on document if expired', async () => {
      await page.goto(testsUrl.list)

      // Need to wait for lock duration to expire (lockDuration: 5 seconds)
      // eslint-disable-next-line payload/no-wait-function
      await wait(5000)

      await page.reload()

      await expect(page.locator('.table .row-1 .checkbox-input__input')).toBeVisible()
    })

    test('should not show lock icon on document row if locked by current user', async () => {
      await page.goto(postsUrl.edit(anotherPostDoc.id))

      const textInput = page.locator('#field-text')
      await textInput.fill('testing')

      await page.reload()

      await page.goto(postsUrl.list)

      await expect(page.locator('.table .row-1 .checkbox-input__input')).toBeVisible()
    })

    test('should only allow bulk delete on unlocked documents on current page', async () => {
      await page.goto(postsUrl.list)
      await page.locator('input#select-all').check()
      await page.locator('.delete-documents__toggle').click()
      await expect(page.locator('#delete-posts .confirmation-modal__content p')).toHaveText(
        'You are about to delete 2 Posts',
      )
    })

    test('should only allow bulk delete on unlocked documents on all pages', async () => {
      await mapAsync([...Array(9)], async () => {
        await createPostDoc({
          text: 'Ready for delete',
        })
      })

      await page.reload()

      await page.goto(postsUrl.list)

      await page.locator('input#select-all').check()
      await page.locator('.list-selection .list-selection__button').click()
      await page.locator('.delete-documents__toggle').click()
      await page.locator('#delete-posts #confirm-action').click()
      await expect(page.locator('.cell-_select')).toHaveCount(1)
    })

    test('should only allow bulk publish on unlocked documents on all pages', async () => {
      await mapAsync([...Array(10)], async () => {
        await createPostDoc({
          text: 'Ready for delete',
        })
      })

      await page.reload()

      await page.goto(postsUrl.list)

      await page.locator('input#select-all').check()
      await page.locator('.list-selection .list-selection__button').click()
      await page.locator('.publish-many__toggle').click()
      await page.locator('#publish-posts #confirm-action').click()

      const paginator = page.locator('.paginator')

      await paginator.locator('button').nth(1).click()
      await expect.poll(() => page.url(), { timeout: POLL_TOPASS_TIMEOUT }).toContain('page=2')
      await expect(page.locator('.row-1 .cell-_status')).toContainText('Draft')
    })

    test('should only allow bulk unpublish on unlocked documents on all pages', async () => {
      await page.goto(postsUrl.list)

      await page.locator('input#select-all').check()
      await page.locator('.list-selection .list-selection__button').click()
      await page.locator('.unpublish-many__toggle').click()
      await page.locator('#unpublish-posts #confirm-action').click()
      await expect(page.locator('.payload-toast-container .toast-success')).toHaveText(
        'Updated 10 Posts successfully.',
      )
    })

    test('should only allow bulk edit on unlocked documents on all pages', async () => {
      await page.goto(postsUrl.list)

      const bulkText = 'Bulk update title'

      await page.locator('input#select-all').check()
      await page.locator('.list-selection .list-selection__button').click()
      await page.locator('.edit-many__toggle').click()

      await page.locator('.field-select .rs__control').click()

      const textOption = page.locator('.field-select .rs__option', {
        hasText: exactText('Text'),
      })

      await expect(textOption).toBeVisible()

      await textOption.click()

      const textInput = page.locator('#field-text')

      await expect(textInput).toBeVisible()

      await textInput.fill(bulkText)

      await page.locator('.form-submit button[type="submit"].edit-many__publish').click()
      await expect(page.locator('.payload-toast-container .toast-error')).toContainText(
        'Unable to update 1 out of 11 Posts.',
      )

      await page.locator('.edit-many__header__close').click()

      await page.reload()

      await expect(page.locator('.row-1 .cell-text')).toContainText(bulkText)
      await expect(page.locator('.row-2 .cell-text')).toContainText(bulkText)

      const paginator = page.locator('.paginator')

      await paginator.locator('button').nth(1).click()
      await expect.poll(() => page.url(), { timeout: POLL_TOPASS_TIMEOUT }).toContain('page=2')
      await expect(page.locator('.row-1 .cell-text')).toContainText('hello')
    })
  })

  describe('document locking / unlocking - one user', () => {
    let postDoc: Post
    let postDocTwo: Post
    let expiredDocOne: Test
    let expiredLockedDocOne: PayloadLockedDocument
    let expiredDocTwo: Test
    let expiredLockedDocTwo: PayloadLockedDocument
    let testDoc: Test
    let user2: User

    beforeAll(async () => {
      postDoc = await createPostDoc({
        text: 'hello',
      })

      postDocTwo = await createPostDoc({
        text: 'post doc two',
      })

      user2 = await payload.create({
        collection: 'users',
        data: {
          email: 'user2@payloadcms.com',
          password: '1234',
          roles: ['is_user'],
        },
      })

      expiredDocOne = await createTestDoc({
        text: 'expired doc one',
      })

      expiredLockedDocOne = await payload.create({
        collection: lockedDocumentCollection,
        data: {
          document: {
            relationTo: 'tests',
            value: expiredDocOne.id,
          },
          globalSlug: undefined,
          user: {
            relationTo: 'users',
            value: user2.id,
          },
        },
      })

      expiredDocTwo = await createTestDoc({
        text: 'expired doc two',
      })

      expiredLockedDocTwo = await payload.create({
        collection: lockedDocumentCollection,
        data: {
          document: {
            relationTo: 'tests',
            value: expiredDocTwo.id,
          },
          globalSlug: undefined,
          user: {
            relationTo: 'users',
            value: user2.id,
          },
        },
      })

      testDoc = await createTestDoc({ text: 'hello' })
    })

    afterAll(async () => {
      await payload.delete({
        collection: 'users',
        id: user2.id,
      })

      await payload.delete({
        collection: lockedDocumentCollection,
        id: expiredLockedDocOne.id,
      })

      await payload.delete({
        collection: lockedDocumentCollection,
        id: expiredLockedDocTwo.id,
      })

      await payload.delete({
        collection: 'posts',
        id: postDoc.id,
      })

      await payload.delete({
        collection: 'posts',
        id: postDocTwo.id,
      })

      await payload.delete({
        collection: 'tests',
        id: expiredDocOne.id,
      })

      await payload.delete({
        collection: 'tests',
        id: expiredDocTwo.id,
      })

      await payload.delete({
        collection: 'tests',
        id: testDoc.id,
      })
    })

    test('should delete all expired locked documents upon initial editing of unlocked document', async () => {
      await page.goto(testsUrl.list)

      await expect(page.locator('.table .row-2 .locked svg')).toBeVisible()
      await expect(page.locator('.table .row-3 .locked svg')).toBeVisible()

      // eslint-disable-next-line payload/no-wait-function
      await wait(5000)

      await page.reload()

      await expect(page.locator('.table .row-2 .checkbox-input__input')).toBeVisible()
      await expect(page.locator('.table .row-3 .checkbox-input__input')).toBeVisible()

      const lockedTestDocs = await payload.find({
        collection: lockedDocumentCollection,
        pagination: false,
      })

      expect(lockedTestDocs.docs.length).toBe(2)

      await page.goto(testsUrl.edit(testDoc.id))

      const textInput = page.locator('#field-text')
      await textInput.fill('some test doc')

      // eslint-disable-next-line payload/no-wait-function
      await wait(500)

      const lockedDocs = await payload.find({
        collection: lockedDocumentCollection,
        pagination: false,
      })

      expect(lockedDocs.docs.length).toBe(1)
    })

    test('should lock document upon initial editing of unlocked document', async () => {
      await page.goto(postsUrl.edit(postDoc.id))

      const textInput = page.locator('#field-text')
      await textInput.fill('hello world')

      // eslint-disable-next-line payload/no-wait-function
      await wait(500)

      const lockedDocs = await payload.find({
        collection: lockedDocumentCollection,
        limit: 1,
        pagination: false,
        where: {
          'document.value': { equals: postDoc.id },
        },
      })

      expect(lockedDocs.docs.length).toBe(1)
    })

    test('should unlock document on save / publish', async () => {
      await page.goto(postsUrl.edit(postDoc.id))

      const textInput = page.locator('#field-text')
      await textInput.fill('hello world')

      // eslint-disable-next-line payload/no-wait-function
      await wait(500)

      const lockedDocs = await payload.find({
        collection: lockedDocumentCollection,
        limit: 1,
        pagination: false,
        where: {
          'document.value': { equals: postDoc.id },
        },
      })

      expect(lockedDocs.docs.length).toBe(1)

      await saveDocAndAssert(page)

      // eslint-disable-next-line payload/no-wait-function
      await wait(500)

      const unlockedDocs = await payload.find({
        collection: lockedDocumentCollection,
        limit: 1,
        pagination: false,
        where: {
          'document.value': { equals: postDoc.id },
        },
      })

      expect(unlockedDocs.docs.length).toBe(0)
    })

    test('should keep document locked when navigating to other tabs i.e. api', async () => {
      await page.goto(postsUrl.edit(postDoc.id))

      const textInput = page.locator('#field-text')
      await textInput.fill('testing tab navigation...')

      // eslint-disable-next-line payload/no-wait-function
      await wait(500)

      const lockedDocs = await payload.find({
        collection: lockedDocumentCollection,
        limit: 1,
        pagination: false,
        where: {
          'document.value': { equals: postDoc.id },
        },
      })

      expect(lockedDocs.docs.length).toBe(1)

      await page.locator('li[aria-label="API"] a').click()

      // Locate the modal container
      const modalContainer = page.locator('.payload__modal-container')
      await expect(modalContainer).toBeVisible()

      // Click the "Leave anyway" button
      await page
        .locator('#leave-without-saving .confirmation-modal__controls .btn--style-primary')
        .click()

      // eslint-disable-next-line payload/no-wait-function
      await wait(500)

      const unlockedDocs = await payload.find({
        collection: lockedDocumentCollection,
        limit: 1,
        pagination: false,
        where: {
          'document.value': { equals: postDoc.id },
        },
      })

      expect(unlockedDocs.docs.length).toBe(1)

      await payload.delete({
        collection: lockedDocumentCollection,
        where: {
          'document.value': { equals: postDoc.id },
        },
      })
    })

    test('should unlock document on navigate away', async () => {
      await page.goto(postsUrl.edit(postDocTwo.id))

      const textInput = page.locator('#field-text')
      await textInput.fill('hello world')

      // eslint-disable-next-line payload/no-wait-function
      await wait(1000)

      const lockedDocs = await payload.find({
        collection: lockedDocumentCollection,
        limit: 1,
        pagination: false,
        where: {
          'document.value': { equals: postDocTwo.id },
        },
      })

      expect(lockedDocs.docs.length).toBe(1)

      await page.locator('header.app-header a[href="/admin/collections/posts"]').click()

      // Locate the modal container
      const modalContainer = page.locator('.payload__modal-container')
      await expect(modalContainer).toBeVisible()

      // Click the "Leave anyway" button
      await page
        .locator('#leave-without-saving .confirmation-modal__controls .btn--style-primary')
        .click()

      // eslint-disable-next-line payload/no-wait-function
      await wait(500)

      expect(page.url()).toContain(postsUrl.list)

      const unlockedDocs = await payload.find({
        collection: lockedDocumentCollection,
        limit: 1,
        pagination: false,
        where: {
          'document.value': { equals: postDoc.id },
        },
      })

      expect(unlockedDocs.docs.length).toBe(0)
    })
  })

  describe('document locking - incoming user', () => {
    let postDoc: Post
    let user2: User
    let lockedDoc: PayloadLockedDocument
    let expiredTestDoc: Test
    let expiredTestLockedDoc: PayloadLockedDocument

    beforeAll(async () => {
      postDoc = await createPostDoc({
        text: 'new post doc',
      })

      expiredTestDoc = await createTestDoc({
        text: 'expired doc',
      })

      user2 = await payload.create({
        collection: 'users',
        data: {
          email: 'user2@payloadcms.com',
          password: '1234',
          roles: ['is_user'],
        },
      })

      lockedDoc = await payload.create({
        collection: lockedDocumentCollection,
        data: {
          document: {
            relationTo: 'posts',
            value: postDoc.id,
          },
          globalSlug: undefined,
          user: {
            relationTo: 'users',
            value: user2.id,
          },
        },
      })

      expiredTestLockedDoc = await payload.create({
        collection: lockedDocumentCollection,
        data: {
          document: {
            relationTo: 'tests',
            value: expiredTestDoc.id,
          },
          globalSlug: undefined,
          user: {
            relationTo: 'users',
            value: user2.id,
          },
        },
      })
    })

    afterAll(async () => {
      await payload.delete({
        collection: 'users',
        id: user2.id,
      })

      await payload.delete({
        collection: lockedDocumentCollection,
        id: lockedDoc.id,
      })

      await payload.delete({
        collection: lockedDocumentCollection,
        id: expiredTestLockedDoc.id,
      })

      await payload.delete({
        collection: 'posts',
        id: postDoc.id,
      })

      await payload.delete({
        collection: 'tests',
        id: expiredTestDoc.id,
      })
    })

    test('should show Document Locked modal for incoming user when entering locked document', async () => {
      await page.goto(postsUrl.list)

      // eslint-disable-next-line payload/no-wait-function
      await wait(500)

      await page.goto(postsUrl.edit(postDoc.id))

      const modalContainer = page.locator('.payload__modal-container')
      await expect(modalContainer).toBeVisible()

      await page.locator('#document-locked-go-back').click()

      // should go back to collection list view
      expect(page.url()).toContain(postsUrl.list)
    })

    test('should not show Document Locked modal for incoming user when entering expired locked document', async () => {
      await page.goto(testsUrl.list)

      // Need to wait for lock duration to expire (lockDuration: 5 seconds)
      // eslint-disable-next-line payload/no-wait-function
      await wait(5000)

      await page.reload()

      await page.goto(testsUrl.edit(expiredTestDoc.id))

      const modalContainer = page.locator('.payload__modal-container')
      await expect(modalContainer).toBeHidden()
    })

    test('should show fields in read-only if incoming user views locked doc in read-only mode', async () => {
      await page.goto(postsUrl.edit(postDoc.id))

      const modalContainer = page.locator('.payload__modal-container')
      await expect(modalContainer).toBeVisible()

      // Click read-only button to view doc in read-only mode
      await page.locator('#document-locked-view-read-only').click()

      // save buttons should be readOnly / disabled
      await expect(page.locator('#action-save-draft')).toBeDisabled()
      await expect(page.locator('#action-save')).toBeDisabled()
      await expect(page.locator('.doc-controls__dots')).toBeHidden()

      // fields should be readOnly / disabled
      await expect(page.locator('#field-text')).toBeDisabled()
    })
  })

  describe('document take over - modal - incoming user', () => {
    let postDoc: Post
    let user2: User
    let lockedDoc: PayloadLockedDocument

    beforeAll(async () => {
      postDoc = await createPostDoc({
        text: 'hello',
      })

      user2 = await payload.create({
        collection: 'users',
        data: {
          email: 'user2@payloadcms.com',
          password: '1234',
          roles: ['is_user'],
        },
      })

      lockedDoc = await payload.create({
        collection: lockedDocumentCollection,
        data: {
          document: {
            relationTo: 'posts',
            value: postDoc.id,
          },
          globalSlug: undefined,
          user: {
            relationTo: 'users',
            value: user2.id,
          },
        },
      })
    })

    afterAll(async () => {
      await payload.delete({
        collection: 'users',
        id: user2.id,
      })

      await payload.delete({
        collection: lockedDocumentCollection,
        id: lockedDoc.id,
      })

      await payload.delete({
        collection: 'posts',
        id: postDoc.id,
      })
    })

    test('should update user data if incoming user takes over from document modal', async () => {
      await page.goto(postsUrl.edit(postDoc.id))

      const modalContainer = page.locator('.payload__modal-container')
      await expect(modalContainer).toBeVisible()

      // Click take-over button to take over editing rights of locked doc
      await page.locator('#document-locked-take-over').click()

      // eslint-disable-next-line payload/no-wait-function
      await wait(1000)

      const lockedDoc = await payload.find({
        collection: lockedDocumentCollection,
        limit: 1,
        pagination: false,
        where: {
          'document.value': { equals: postDoc.id },
        },
      })

      // eslint-disable-next-line payload/no-wait-function
      await wait(500)

      expect(lockedDoc.docs.length).toBe(1)

      const userEmail =
        // eslint-disable-next-line playwright/no-conditional-in-test
        lockedDoc.docs[0]?.user.value &&
        typeof lockedDoc.docs[0].user.value === 'object' &&
        'email' in lockedDoc.docs[0].user.value &&
        lockedDoc.docs[0].user.value.email

      expect(userEmail).toEqual('dev@payloadcms.com')
    })
  })

  describe('document take over - doc - incoming user', () => {
    let postDoc: Post
    let user2: User
    let lockedDoc: PayloadLockedDocument

    beforeAll(async () => {
      postDoc = await createPostDoc({
        text: 'hello',
      })

      user2 = await payload.create({
        collection: 'users',
        data: {
          email: 'user2@payloadcms.com',
          password: '1234',
          roles: ['is_user'],
        },
      })

      lockedDoc = await payload.create({
        collection: lockedDocumentCollection,
        data: {
          document: {
            relationTo: 'posts',
            value: postDoc.id,
          },
          globalSlug: undefined,
          user: {
            relationTo: 'users',
            value: user2.id,
          },
        },
      })
    })

    afterAll(async () => {
      await payload.delete({
        collection: 'users',
        id: user2.id,
      })

      await payload.delete({
        collection: lockedDocumentCollection,
        id: lockedDoc.id,
      })

      await payload.delete({
        collection: 'posts',
        id: postDoc.id,
      })
    })

    test('should update user data if incoming user takes over from within document', async () => {
      await page.goto(postsUrl.edit(postDoc.id))

      const modalContainer = page.locator('.payload__modal-container')
      await expect(modalContainer).toBeVisible()

      // Click read-only button to view doc in read-only mode
      await page.locator('#document-locked-view-read-only').click()

      await page.locator('#take-over').click()

      // eslint-disable-next-line payload/no-wait-function
      await wait(500)

      const lockedDoc = await payload.find({
        collection: lockedDocumentCollection,
        limit: 1,
        pagination: false,
        where: {
          'document.value': { equals: postDoc.id },
        },
      })

      // eslint-disable-next-line payload/no-wait-function
      await wait(500)

      expect(lockedDoc.docs.length).toBe(1)

      const userEmail =
        // eslint-disable-next-line playwright/no-conditional-in-test
        lockedDoc.docs[0]?.user.value &&
        typeof lockedDoc.docs[0].user.value === 'object' &&
        'email' in lockedDoc.docs[0].user.value &&
        lockedDoc.docs[0].user.value.email

      expect(userEmail).toEqual('dev@payloadcms.com')
    })
  })

  describe('document locking - previous user', () => {
    let postDoc: Post
    let user2: User

    beforeAll(async () => {
      postDoc = await createPostDoc({
        text: 'hello',
      })

      user2 = await payload.create({
        collection: 'users',
        data: {
          email: 'user2@payloadcms.com',
          password: '1234',
          roles: ['is_user'],
        },
      })
    })

    afterAll(async () => {
      await payload.delete({
        collection: 'users',
        id: user2.id,
      })

      await payload.delete({
        collection: 'posts',
        id: postDoc.id,
      })
    })
    test('should show Document Take Over modal for previous user if taken over', async () => {
      await page.goto(postsUrl.edit(postDoc.id))

      const textInput = page.locator('#field-text')
      await textInput.fill('hello world')

      // eslint-disable-next-line payload/no-wait-function
      await wait(500)

      // Retrieve document id from payload locks collection
      const lockedDoc = await payload.find({
        collection: lockedDocumentCollection,
        limit: 1,
        pagination: false,
        where: {
          'document.value': { equals: postDoc.id },
        },
      })

      // eslint-disable-next-line payload/no-wait-function
      await wait(500)

      // Update payload-locks collection document with different user
      await payload.update({
        id: lockedDoc.docs[0]?.id as number | string,
        collection: lockedDocumentCollection,
        data: {
          user: {
            relationTo: 'users',
            value: user2.id,
          },
        },
      })

      // eslint-disable-next-line payload/no-wait-function
      await wait(1000)

      // Try to edit the document again as the "old" user
      await textInput.fill('goodbye')

      // Wait for Take Over modal to appear
      const modalContainer = page.locator('.payload__modal-container')
      await expect(modalContainer).toBeVisible()

      await payload.delete({
        collection: lockedDocumentCollection,
        id: lockedDoc.docs[0]?.id,
      })
    })

    test('should take previous user back to dashboard on dashboard button click', async () => {
      await page.goto(postsUrl.edit(postDoc.id))

      const textInput = page.locator('#field-text')
      await textInput.fill('hello world')

      // eslint-disable-next-line payload/no-wait-function
      await wait(500)

      // Retrieve document id from payload locks collection
      const lockedDoc = await payload.find({
        collection: lockedDocumentCollection,
        limit: 1,
        pagination: false,
        where: {
          'document.value': { equals: postDoc.id },
        },
      })

      // eslint-disable-next-line payload/no-wait-function
      await wait(500)

      // Update payload-locks collection document with different user
      await payload.update({
        id: lockedDoc.docs[0]?.id as number | string,
        collection: lockedDocumentCollection,
        data: {
          user: {
            relationTo: 'users',
            value: user2.id,
          },
        },
      })

      // eslint-disable-next-line payload/no-wait-function
      await wait(1000)

      // Try to edit the document again as the "old" user
      await textInput.fill('goodbye')

      // Wait for Take Over modal to appear
      const modalContainer = page.locator('.payload__modal-container')
      await expect(modalContainer).toBeVisible()

      // Click read-only button to view doc in read-only mode
      await page.locator('#document-take-over-back-to-dashboard').click()

      expect(page.url()).toContain(postsUrl.admin)

      await payload.delete({
        collection: lockedDocumentCollection,
        id: lockedDoc.docs[0]?.id,
      })
    })

    test('should show fields in read-only if previous user views doc in read-only mode', async () => {
      await page.goto(postsUrl.edit(postDoc.id))

      const textInput = page.locator('#field-text')
      await textInput.fill('hello world')

      // eslint-disable-next-line payload/no-wait-function
      await wait(500)

      // Retrieve document id from payload locks collection
      const lockedDoc = await payload.find({
        collection: lockedDocumentCollection,
        limit: 1,
        pagination: false,
        where: {
          'document.value': { equals: postDoc.id },
        },
      })

      // eslint-disable-next-line payload/no-wait-function
      await wait(500)

      // Update payload-locks collection document with different user
      await payload.update({
        id: lockedDoc.docs[0]?.id as number | string,
        collection: lockedDocumentCollection,
        data: {
          user: {
            relationTo: 'users',
            value: user2.id,
          },
        },
      })

      // eslint-disable-next-line payload/no-wait-function
      await wait(500)

      // Try to edit the document again as the "old" user
      await textInput.fill('goodbye')

      // Wait for Take Over modal to appear
      const modalContainer = page.locator('.payload__modal-container')
      await expect(modalContainer).toBeVisible()

      // Click read-only button to view doc in read-only mode
      await page.locator('#document-take-over-view-read-only').click()

      // save buttons should be readOnly / disabled
      await expect(page.locator('#action-save-draft')).toBeDisabled()
      await expect(page.locator('#action-save')).toBeDisabled()

      // fields should be readOnly / disabled
      await expect(page.locator('#field-text')).toBeDisabled()
    })
  })

  describe('dashboard - globals', () => {
    let user2: User
    let lockedMenuGlobal: PayloadLockedDocument
    let lockedAdminGlobal: PayloadLockedDocument

    beforeAll(async () => {
      user2 = await payload.create({
        collection: 'users',
        data: {
          email: 'user2@payloadcms.com',
          password: '1234',
          roles: ['is_user'],
        },
      })

      lockedAdminGlobal = await payload.create({
        collection: lockedDocumentCollection,
        data: {
          document: undefined,
          globalSlug: 'admin',
          user: {
            relationTo: 'users',
            value: user2.id,
          },
        },
      })

      lockedMenuGlobal = await payload.create({
        collection: lockedDocumentCollection,
        data: {
          document: undefined,
          globalSlug: 'menu',
          user: {
            relationTo: 'users',
            value: user2.id,
          },
        },
      })
    })

    afterAll(async () => {
      await payload.delete({
        collection: 'users',
        id: user2.id,
      })

      await payload.delete({
        collection: lockedDocumentCollection,
        id: lockedAdminGlobal.id,
      })

      await payload.delete({
        collection: lockedDocumentCollection,
        id: lockedMenuGlobal.id,
      })
    })

    test('should show lock on document card in dashboard view if locked', async () => {
      await page.goto(postsUrl.admin)

      await expect(page.locator('.dashboard__card-list #card-menu .locked svg')).toBeVisible()
    })

    test('should not show lock on document card in dashboard view if unlocked', async () => {
      await payload.delete({
        collection: lockedDocumentCollection,
        id: lockedMenuGlobal.id,
      })

      // eslint-disable-next-line payload/no-wait-function
      await wait(500)

      await page.goto(postsUrl.admin)

      await expect(page.locator('.dashboard__card-list #card-menu .locked')).toBeHidden()
    })

    test('should not show lock on document card in dashboard view if locked by current user', async () => {
      await page.goto(globalUrl.global('menu'))

      const textInput = page.locator('#field-globalText')
      await textInput.fill('this is a global menu text field')

      await page.reload()

      await page.goto(postsUrl.admin)

      await expect(page.locator('.dashboard__card-list #card-menu .locked')).toBeHidden()
    })

    test('should not show lock on document card in dashboard view if lock expired', async () => {
      await page.goto(postsUrl.admin)

      await expect(page.locator('.dashboard__card-list #card-admin .locked svg')).toBeVisible()

      // Need to wait for lock duration to expire (lockDuration: 10 seconds)
      // eslint-disable-next-line payload/no-wait-function
      await wait(10000)

      await page.reload()

      await expect(page.locator('.dashboard__card-list #card-admin .locked')).toBeHidden()

      await payload.delete({
        collection: lockedDocumentCollection,
        id: lockedAdminGlobal.id,
      })
    })

    test('should not show Document Locked modal when entering global with an expired lock', async () => {
      await payload.create({
        collection: lockedDocumentCollection,
        data: {
          document: undefined,
          globalSlug: 'admin',
          user: {
            relationTo: 'users',
            value: user2.id,
          },
        },
      })

      await page.goto(postsUrl.admin)

      await expect(page.locator('.dashboard__card-list #card-admin .locked svg')).toBeVisible()

      // Need to wait for lock duration to expire (lockDuration: 10 seconds)
      // eslint-disable-next-line payload/no-wait-function
      await wait(10000)

      await page.reload()

      await expect(page.locator('.dashboard__card-list #card-admin .locked')).toBeHidden()

      await page.locator('.card-admin a').click()

      const modalContainer = page.locator('.payload__modal-container')
      await expect(modalContainer).toBeHidden()
    })
  })
})

async function createPageDoc(data: Partial<PageType>): Promise<PageType> {
  return payload.create({
    collection: 'pages',
    data,
  }) as unknown as Promise<PageType>
}

async function createPostDoc(data: Partial<Post>): Promise<Post> {
  return payload.create({
    collection: 'posts',
    data,
  }) as unknown as Promise<Post>
}

async function createTestDoc(data: Partial<Test>): Promise<Test> {
  return payload.create({
    collection: 'tests',
    data,
  }) as unknown as Promise<Test>
}
