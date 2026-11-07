import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import { wait } from 'payload/shared'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../__helpers/shared/sdk/index.js'
import type { Autosave, Config } from './payload-types.js'

import { AdminUrlUtil } from '../__helpers/shared/adminUrlUtil.js'
import { reInitializeDB } from '../__helpers/shared/clearAndSeed/reInitializeDB.js'
import { initPayloadE2ENoConfig } from '../__helpers/shared/initPayloadE2ENoConfig.js'
import { initPage } from '../__setup/e2e/initPage.js'
import { TEST_TIMEOUT_LONG } from '../playwright.config.js'

const dirname = fileURLToPath(new URL('.', import.meta.url))
const { describe } = test
const lockedDocumentCollection = 'payload-locked-documents'

let page: Page
let autosaveUrl: AdminUrlUtil
let payload: PayloadTestSDK<Config>
let serverURL: string

test.describe('Autosave document locking', () => {
  test.beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    ;({ payload, serverURL } = await initPayloadE2ENoConfig<Config>({ dirname }))
    autosaveUrl = new AdminUrlUtil(serverURL, 'autosave')
    const context = await browser.newContext()
    ;({ page } = await initPage({ context, serverURL }))
  })

  test.beforeEach(async () => {
    await reInitializeDB({ serverURL })
  })

  describe('autosave document locking', () => {
    const findAutosaveLocks = (id: number | string) =>
      payload.find({
        collection: lockedDocumentCollection,
        overrideAccess: true,
        pagination: false,
        where: {
          and: [
            { 'document.relationTo': { equals: 'autosave' } },
            { 'document.value': { equals: id } },
          ],
        },
      })

    test('should keep a single lock across autosaves', async () => {
      const doc = (await payload.create({
        collection: 'autosave',
        data: { fieldA: 'start' },
        draft: true,
        overrideAccess: true,
      })) as unknown as Autosave

      await page.goto(autosaveUrl.edit(doc.id))
      await page.locator('#field-fieldA').fill('one')

      await expect
        .poll(async () => (await findAutosaveLocks(doc.id)).docs.length, { timeout: 10000 })
        .toBe(1)
      const lockID = (await findAutosaveLocks(doc.id)).docs[0]?.id

      await page.locator('#field-fieldA').fill('two')

      await expect
        .poll(
          async () => {
            const locks = await findAutosaveLocks(doc.id)
            return locks.docs.length === 1 && locks.docs[0]?.id === lockID
          },
          { timeout: 10000 },
        )
        .toBe(true)
    })

    test('should unlock an autosave document when navigating to the list', async () => {
      const doc = (await payload.create({
        collection: 'autosave',
        data: { fieldA: 'start' },
        draft: true,
        overrideAccess: true,
      })) as unknown as Autosave

      await page.goto(autosaveUrl.edit(doc.id))
      await page.locator('#field-fieldA').fill('leaving')

      await expect
        .poll(async () => (await findAutosaveLocks(doc.id)).docs.length, { timeout: 10000 })
        .toBe(1)

      await page.locator('header.app-header a[href="/admin/collections/autosave"]').click()
      await expect(page.locator('.payload__modal-container')).toBeHidden()
      await expect(page).toHaveURL(/\/admin\/collections\/autosave(\?|$)/)

      await expect
        .poll(async () => (await findAutosaveLocks(doc.id)).docs.length, { timeout: 5000 })
        .toBe(0)
    })

    test('should unlock when leaving immediately after a keystroke', async () => {
      const doc = (await payload.create({
        collection: 'autosave',
        data: { fieldA: 'start' },
        draft: true,
        overrideAccess: true,
      })) as unknown as Autosave

      await page.goto(autosaveUrl.edit(doc.id))
      await page.locator('#field-fieldA').fill('x')
      await page.locator('header.app-header a[href="/admin/collections/autosave"]').click()
      await expect(page).toHaveURL(/\/admin\/collections\/autosave(\?|$)/)

      await expect
        .poll(async () => (await findAutosaveLocks(doc.id)).docs.length, { timeout: 5000 })
        .toBe(0)

      await wait(500)
      expect((await findAutosaveLocks(doc.id)).docs.length).toBe(0)
    })

    test('should keep the lock when opening the API view', async () => {
      const doc = (await payload.create({
        collection: 'autosave',
        data: { fieldA: 'start' },
        draft: true,
        overrideAccess: true,
      })) as unknown as Autosave

      await page.goto(autosaveUrl.edit(doc.id))
      await page.locator('#field-fieldA').fill('api')

      await expect
        .poll(async () => (await findAutosaveLocks(doc.id)).docs.length, { timeout: 10000 })
        .toBe(1)

      await page.getByRole('link', { name: 'API', exact: true }).click()
      await expect(page.locator('.payload__modal-container')).toBeHidden()
      await expect(page).toHaveURL(/\/api/)

      await wait(500)
      expect((await findAutosaveLocks(doc.id)).docs.length).toBe(1)
    })

    test('should show the locked modal for an incoming user', async () => {
      const doc = (await payload.create({
        collection: 'autosave',
        data: { fieldA: 'locked' },
        draft: true,
        overrideAccess: true,
      })) as unknown as Autosave

      const user2 = await payload.create({
        collection: 'users',
        data: {
          email: 'autosave-user2@payloadcms.com',
          password: '1234',
          roles: ['is_user'],
        },
        overrideAccess: true,
      })

      await payload.create({
        collection: lockedDocumentCollection,
        data: {
          document: { relationTo: 'autosave', value: doc.id },
          globalSlug: undefined,
          user: { relationTo: 'users', value: user2.id },
        },
        overrideAccess: true,
      })

      await page.goto(autosaveUrl.edit(doc.id))
      await expect(page.locator('.payload__modal-container')).toBeVisible()
      await expect(page.locator('#document-locked-confirm')).toBeVisible()
    })

    test('should keep the lock after taking over an autosave document', async () => {
      const doc = (await payload.create({
        collection: 'autosave',
        data: { fieldA: 'takeover' },
        draft: true,
        overrideAccess: true,
      })) as unknown as Autosave

      const user2 = await payload.create({
        collection: 'users',
        data: {
          email: 'autosave-owner@payloadcms.com',
          password: '1234',
          roles: ['is_user'],
        },
        overrideAccess: true,
      })

      await payload.create({
        collection: lockedDocumentCollection,
        data: {
          document: { relationTo: 'autosave', value: doc.id },
          globalSlug: undefined,
          user: { relationTo: 'users', value: user2.id },
        },
        overrideAccess: true,
      })

      await page.goto(autosaveUrl.edit(doc.id))
      await expect(page.locator('.payload__modal-container')).toBeVisible()
      await page.locator('#document-locked-view-read-only').click()
      await page.locator('#take-over').click()

      await wait(1000)

      const locks = await findAutosaveLocks(doc.id)
      expect(locks.docs.length).toBe(1)

      const userEmail =
        // eslint-disable-next-line playwright/no-conditional-in-test
        locks.docs[0]?.user.value &&
        typeof locks.docs[0].user.value === 'object' &&
        'email' in locks.docs[0].user.value &&
        locks.docs[0].user.value.email

      expect(userEmail).toEqual('dev@payloadcms.com')
    })
  })
})
