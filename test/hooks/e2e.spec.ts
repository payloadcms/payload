import type { Page } from '@playwright/test'
import type { CollectionSlug } from 'payload'

import { expect, test } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../helpers/sdk/index.js'
import type { Config } from './payload-types.js'

import { ensureCompilationIsDone, initPageConsoleErrorCatch, saveDocAndAssert } from '../helpers.js'
import { AdminUrlUtil } from '../helpers/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../helpers/initPayloadE2ENoConfig.js'
import { TEST_TIMEOUT_LONG } from '../playwright.config.js'
import { beforeValidateSlug } from './shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const { beforeAll, beforeEach, describe } = test

let payload: PayloadTestSDK<Config>

describe('Hooks', () => {
  let url: AdminUrlUtil
  let beforeChangeURL: AdminUrlUtil
  let beforeDeleteURL: AdminUrlUtil
  let beforeDelete2URL: AdminUrlUtil
  let page: Page
  let serverURL: string

  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    ;({ payload, serverURL } = await initPayloadE2ENoConfig<Config>({ dirname }))

    url = new AdminUrlUtil(serverURL, 'before-validate')
    beforeChangeURL = new AdminUrlUtil(serverURL, 'before-change-hooks')
    beforeDeleteURL = new AdminUrlUtil(serverURL, 'before-delete-hooks')
    beforeDelete2URL = new AdminUrlUtil(serverURL, 'before-delete-2-hooks')
    const context = await browser.newContext()
    page = await context.newPage()

    initPageConsoleErrorCatch(page)
    await ensureCompilationIsDone({ page, serverURL })
  })

  beforeEach(async () => {
    await ensureCompilationIsDone({ page, serverURL })

    await clearAllDocs()
  })

  test('should replace value with before validate response', async () => {
    await page.goto(url.create)
    await page.locator('#field-title').fill('should replace value with before validate response')
    await saveDocAndAssert(page)

    await expect(page.locator('#field-title')).toHaveValue('reset in beforeValidate')
    await page
      .locator('#field-title')
      .fill('should replace value with before validate response again')
    await saveDocAndAssert(page)

    await expect(page.locator('#field-title')).toHaveValue('reset in beforeValidate')
  })

  test('should reflect changes made in beforeChange collection hooks within ui after save', async () => {
    await page.goto(beforeChangeURL.create)
    await page.locator('#field-title').fill('should replace value with before change response')
    await saveDocAndAssert(page)

    await expect(page.locator('#field-title')).toHaveValue('hi from hook')
    await page.locator('#field-title').fill('helllooooooooo')
    await saveDocAndAssert(page)

    await expect(page.locator('#field-title')).toHaveValue('hi from hook')
  })

  describe('beforeDelete errors', () => {
    test('ensure document with erroring beforeDelete hook cannot be deleted from list view while public 401 error is shown in toast', async () => {
      const doc = await payload.create({
        collection: 'before-delete-hooks',
        data: {
          title: 'some title',
        },
      })

      await page.goto(beforeDeleteURL.list)

      const tr = page.locator(`tr[data-id="${doc.id}"]`)
      await expect(tr).toBeVisible()
      await tr.locator('.checkbox-input__input input').check()

      const deleteBtn = page.locator('.list-selection__button.delete-documents__toggle')
      await deleteBtn.click()

      await page.locator('#confirm-action').click()

      await expect(page.locator('.payload-toast-container')).toContainText(
        `Test error: cannot delete document with ID ${doc.id}`,
      )

      // Ensure the document is still in the db
      await expect
        .poll(
          async () => {
            const docs = await payload.find({
              collection: 'before-delete-hooks',
              where: {
                id: { equals: doc.id },
              },
            })
            return docs.totalDocs
          },
          { timeout: TEST_TIMEOUT_LONG },
        )
        .toBe(1)

      await payload.delete({
        collection: 'before-delete-hooks',
        id: doc.id,
      })
    })

    test('ensure document with erroring beforeDelete hook cannot be deleted from edit view while public 401 error is shown in toast', async () => {
      const doc = await payload.create({
        collection: 'before-delete-hooks',
        data: {
          title: 'some title',
        },
      })

      await page.goto(beforeDeleteURL.edit(doc.id))

      await page.locator('.doc-controls__popup .popup-button').click()
      await page.locator('#action-delete').click()

      await page.locator('#confirm-action').click()

      await expect(page.locator('.payload-toast-container')).toContainText(
        `Test error: cannot delete document with ID ${doc.id}`,
      )

      // Ensure the document is still in the db
      await expect
        .poll(
          async () => {
            const docs = await payload.find({
              collection: 'before-delete-hooks',
              where: {
                id: { equals: doc.id },
              },
            })
            return docs.totalDocs
          },
          { timeout: TEST_TIMEOUT_LONG },
        )
        .toBe(1)

      await payload.delete({
        collection: 'before-delete-hooks',
        id: doc.id,
      })
    })

    test('ensure private 500 error is not shown when deleting document with erroring beforeDelete hook from list view', async () => {
      const doc = await payload.create({
        collection: 'before-delete-2-hooks',
        data: {
          title: 'some title',
        },
      })

      await page.goto(beforeDelete2URL.list)

      const tr = page.locator(`tr[data-id="${doc.id}"]`)
      await expect(tr).toBeVisible()
      await tr.locator('.checkbox-input__input input').check()

      const deleteBtn = page.locator('.list-selection__button.delete-documents__toggle')
      await deleteBtn.click()

      await page.locator('#confirm-action').click()

      await expect(page.locator('.payload-toast-container')).toContainText('Something went wrong.')
      await expect(page.locator('.payload-toast-container')).not.toContainText(
        `Test error: cannot delete document with ID ${doc.id}`,
      )

      await payload.delete({
        collection: 'before-delete-2-hooks',
        id: doc.id,
      })
    })

    test('ensure private 500 error is not shown when deleting document with erroring beforeDelete hook from edit view', async () => {
      const doc = await payload.create({
        collection: 'before-delete-2-hooks',
        data: {
          title: 'some title',
        },
      })

      await page.goto(beforeDelete2URL.edit(doc.id))

      await page.locator('.doc-controls__popup .popup-button').click()
      await page.locator('#action-delete').click()

      await page.locator('#confirm-action').click()

      await expect(page.locator('.payload-toast-container')).toContainText('Something went wrong.')
      await expect(page.locator('.payload-toast-container')).not.toContainText(
        `Test error: cannot delete document with ID ${doc.id}`,
      )

      await payload.delete({
        collection: 'before-delete-2-hooks',
        id: doc.id,
      })
    })
  })
})

async function clearAllDocs(): Promise<void> {
  await clearCollectionDocs(beforeValidateSlug)
}

async function clearCollectionDocs(collectionSlug: CollectionSlug): Promise<void> {
  await payload.delete({
    collection: collectionSlug,
    where: {
      id: { exists: true },
    },
  })
}
