import type { Page } from '@playwright/test'
import type { TypeWithID } from 'payload'

import { expect, test } from '@playwright/test'
import * as path from 'path'
import { wait } from 'payload/shared'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../helpers/sdk/index.js'
import type { Config } from './payload-types.js'

import { ensureCompilationIsDone, initPageConsoleErrorCatch, saveDocAndAssert } from '../helpers.js'
import { AdminUrlUtil } from '../helpers/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../helpers/initPayloadE2ENoConfig.js'
import { TEST_TIMEOUT } from '../playwright.config.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const { beforeAll, afterAll, describe } = test

const lockedDocumentCollection = 'payload-locked-documents'

let page: Page
let globalUrl: AdminUrlUtil
let postsUrl: AdminUrlUtil
let pagesUrl: AdminUrlUtil
let payload: PayloadTestSDK<Config>
let serverURL: string

describe('locked documents', () => {
  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT)
    ;({ payload, serverURL } = await initPayloadE2ENoConfig({ dirname }))

    globalUrl = new AdminUrlUtil(serverURL, 'menu')
    postsUrl = new AdminUrlUtil(serverURL, 'posts')
    pagesUrl = new AdminUrlUtil(serverURL, 'pages')

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
    let postDoc
    let anotherPostDoc
    let user2
    let lockedDoc

    beforeAll(async () => {
      postDoc = await createPostDoc({
        text: 'hello',
      })

      anotherPostDoc = await createPostDoc({
        text: 'another post',
      })

      user2 = await payload.create({
        collection: 'users',
        data: {
          email: 'user2@payloadcms.com',
          password: '1234',
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
        collection: lockedDocumentCollection,
        id: lockedDoc.id,
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
        collection: 'users',
        id: user2.id,
      })
    })

    test('should show lock icon on document row if locked', async () => {
      await page.goto(postsUrl.list)
      await page.waitForURL(postsUrl.list)

      await expect(page.locator('.table .row-2 .locked svg')).toBeVisible()
    })

    test('should not show lock icon on document row if unlocked', async () => {
      await page.goto(postsUrl.list)
      await page.waitForURL(postsUrl.list)

      await expect(page.locator('.table .row-3 .checkbox-input__input')).toBeVisible()
    })

    test('should not show lock icon on document row if locked by current user', async () => {
      await page.goto(postsUrl.edit(anotherPostDoc.id))
      await page.waitForURL(postsUrl.edit(anotherPostDoc.id))

      const textInput = page.locator('#field-text')
      await textInput.fill('testing')

      await page.reload()

      await page.goto(postsUrl.list)
      await page.waitForURL(postsUrl.list)

      await expect(page.locator('.table .row-1 .checkbox-input__input')).toBeVisible()
    })

    test('should only allow bulk delete on unlocked documents', async () => {
      await page.goto(postsUrl.list)
      await page.locator('input#select-all').check()
      await page.locator('.delete-documents__toggle').click()
      await expect(page.locator('.delete-documents__content p')).toHaveText(
        'You are about to delete 2 Posts',
      )
    })
  })

  describe('document locking / unlocking - one user', () => {
    let postDoc

    beforeAll(async () => {
      postDoc = await createPostDoc({
        text: 'hello',
      })
    })

    afterAll(async () => {
      await payload.delete({
        collection: 'posts',
        id: postDoc.id,
      })
    })

    test('should lock document upon initial editing of unlocked document', async () => {
      await page.goto(postsUrl.edit(postDoc.id))
      await page.waitForURL(postsUrl.edit(postDoc.id))

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

    test('should unlock document on navigate away', async () => {
      await page.goto(postsUrl.edit(postDoc.id))
      await page.waitForURL(postsUrl.edit(postDoc.id))

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

      await page.locator('header.app-header a[href="/admin/collections/posts"]').click()

      // Locate the modal container
      const modalContainer = page.locator('.payload__modal-container')
      await expect(modalContainer).toBeVisible()

      // Click the "Leave anyway" button
      await page.locator('.leave-without-saving__controls .btn--style-primary').click()

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

    test('should unlock document on save / publish', async () => {
      await page.goto(postsUrl.edit(postDoc.id))
      await page.waitForURL(postsUrl.edit(postDoc.id))

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
      await page.waitForURL(postsUrl.edit(postDoc.id))

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
      await page.locator('.leave-without-saving__controls .btn--style-primary').click()

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
    })
  })

  describe('document locking - incoming user', () => {
    let postDoc
    let user2
    let lockedDoc

    beforeAll(async () => {
      postDoc = await createPostDoc({
        text: 'hello',
      })

      user2 = await payload.create({
        collection: 'users',
        data: {
          email: 'user2@payloadcms.com',
          password: '1234',
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

    test('should show Document Locked modal for incoming user when entering locked document', async () => {
      const lockedDoc = await payload.find({
        collection: lockedDocumentCollection,
        limit: 1,
        pagination: false,
        where: {
          'document.value': { equals: postDoc.id },
        },
      })

      expect(lockedDoc.docs.length).toBe(1)

      // eslint-disable-next-line payload/no-wait-function
      await wait(500)

      await page.goto(postsUrl.list)
      await page.waitForURL(postsUrl.list)

      // eslint-disable-next-line payload/no-wait-function
      await wait(500)

      await page.goto(postsUrl.edit(postDoc.id))
      await page.waitForURL(postsUrl.edit(postDoc.id))

      const modalContainer = page.locator('.payload__modal-container')
      await expect(modalContainer).toBeVisible()

      await page.locator('#document-locked-go-back').click()

      // should go back to collection list view
      expect(page.url()).toContain(postsUrl.list)
    })

    test('should show fields in read-only if incoming user views locked doc in read-only mode', async () => {
      await page.goto(postsUrl.edit(postDoc.id))
      await page.waitForURL(postsUrl.edit(postDoc.id))

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
    let postDoc
    let user2
    let lockedDoc

    beforeAll(async () => {
      postDoc = await createPostDoc({
        text: 'hello',
      })

      user2 = await payload.create({
        collection: 'users',
        data: {
          email: 'user2@payloadcms.com',
          password: '1234',
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
      await page.waitForURL(postsUrl.edit(postDoc.id))

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
        lockedDoc.docs[0].user.value &&
        typeof lockedDoc.docs[0].user.value === 'object' &&
        'email' in lockedDoc.docs[0].user.value &&
        lockedDoc.docs[0].user.value.email

      expect(userEmail).toEqual('dev@payloadcms.com')
    })
  })

  describe('document take over - doc - incoming user', () => {
    let postDoc
    let user2
    let lockedDoc

    beforeAll(async () => {
      postDoc = await createPostDoc({
        text: 'hello',
      })

      user2 = await payload.create({
        collection: 'users',
        data: {
          email: 'user2@payloadcms.com',
          password: '1234',
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
      await page.waitForURL(postsUrl.edit(postDoc.id))

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
        lockedDoc.docs[0].user.value &&
        typeof lockedDoc.docs[0].user.value === 'object' &&
        'email' in lockedDoc.docs[0].user.value &&
        lockedDoc.docs[0].user.value.email

      expect(userEmail).toEqual('dev@payloadcms.com')
    })
  })

  describe('document locking - previous user', () => {
    let postDoc
    let user2

    beforeAll(async () => {
      postDoc = await createPostDoc({
        text: 'hello',
      })

      user2 = await payload.create({
        collection: 'users',
        data: {
          email: 'user2@payloadcms.com',
          password: '1234',
        },
      })
    })

    afterAll(async () => {
      await payload.delete({
        collection: 'users',
        id: user2.id,
      })
    })
    test('should show Document Take Over modal for previous user if taken over', async () => {
      await page.goto(postsUrl.edit(postDoc.id))
      await page.waitForURL(postsUrl.edit(postDoc.id))

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
        id: lockedDoc.docs[0].id,
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
        id: lockedDoc.docs[0].id,
      })
    })

    test('should take previous user back to dashboard on dashboard button click', async () => {
      await page.goto(postsUrl.edit(postDoc.id))
      await page.waitForURL(postsUrl.edit(postDoc.id))

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
        id: lockedDoc.docs[0].id,
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
        id: lockedDoc.docs[0].id,
      })
    })

    test('should show fields in read-only if previous user views doc in read-only mode', async () => {
      await page.goto(postsUrl.edit(postDoc.id))
      await page.waitForURL(postsUrl.edit(postDoc.id))

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
        id: lockedDoc.docs[0].id,
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
    let user2
    let lockedGlobal

    beforeAll(async () => {
      user2 = await payload.create({
        collection: 'users',
        data: {
          email: 'user2@payloadcms.com',
          password: '1234',
        },
      })

      lockedGlobal = await payload.create({
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
    })

    test('should show lock on document card in dashboard view if locked', async () => {
      await page.goto(postsUrl.admin)
      await page.waitForURL(postsUrl.admin)

      const globalCardList = page.locator('.dashboard__group').nth(1)
      await expect(globalCardList.locator('#card-menu .locked svg')).toBeVisible()
    })

    test('should not show lock on document card in dashboard view if unlocked', async () => {
      await payload.delete({
        collection: lockedDocumentCollection,
        id: lockedGlobal.id,
      })

      // eslint-disable-next-line payload/no-wait-function
      await wait(500)

      await page.goto(postsUrl.admin)
      await page.waitForURL(postsUrl.admin)

      const globalCardList = page.locator('.dashboard__group').nth(1)
      await expect(globalCardList.locator('#card-menu .locked')).toBeHidden()
    })

    test('should not show lock on document card in dashboard view if locked by current user', async () => {
      await page.goto(globalUrl.global('menu'))
      await page.waitForURL(globalUrl.global('menu'))

      const textInput = page.locator('#field-globalText')
      await textInput.fill('this is a global menu text field')

      await page.reload()

      await page.goto(postsUrl.admin)
      await page.waitForURL(postsUrl.admin)

      const globalCardList = page.locator('.dashboard__group').nth(1)
      await expect(globalCardList.locator('#card-menu .locked')).toBeHidden()
    })
  })
})

async function createPostDoc(data: any): Promise<Record<string, unknown> & TypeWithID> {
  return payload.create({
    collection: 'posts',
    data,
  }) as unknown as Promise<Record<string, unknown> & TypeWithID>
}

async function createPageDoc(data: any): Promise<Record<string, unknown> & TypeWithID> {
  return payload.create({
    collection: 'pages',
    data,
  }) as unknown as Promise<Record<string, unknown> & TypeWithID>
}
