import { expect, test } from '@playwright/test'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { formatAdminURL } from 'payload/shared'

import type { PayloadTestSDK } from '../__helpers/shared/sdk/index.js'
import type { Config } from './payload-types.js'

import { waitForFormReady } from '../__helpers/e2e/helpers.js'
import { AdminUrlUtil } from '../__helpers/shared/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../__helpers/shared/initPayloadE2ENoConfig.js'
import { initPage } from '../__setup/e2e/initPage.js'
import { autosavePostsSlug } from './collections/Autosave/index.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))

test.describe('Authoritative autosave rows', () => {
  let payload: PayloadTestSDK<Config>
  let serverURL: string

  test.beforeAll(async () => {
    ;({ payload, serverURL } = await initPayloadE2ENoConfig<Config>({ dirname }))
  })

  test('should keep server-filtered rows removed on the next autosave', async ({ page }) => {
    const doc = await payload.create({
      collection: autosavePostsSlug,
      data: {
        blocks: [
          { blockType: 'text', text: 'First block' },
          { blockType: 'text', text: 'Keep this block' },
        ],
        title: 'ok Server-filtered blocks',
      },
      draft: true,
      overrideAccess: true,
    })

    try {
      await initPage({ page, serverURL })
      await page.goto(new AdminUrlUtil(serverURL, autosavePostsSlug).edit(doc.id))
      await waitForFormReady(page)
      await page.locator('#field-blocks__0__text').fill('Remove on server')
      await expect(page.locator('#field-blocks__0__text')).toHaveValue('Keep this block')
      await expect(page.locator('#field-blocks__1__text')).toHaveCount(0)

      const saved = page.waitForResponse(
        (response) =>
          response.request().method() === 'PATCH' &&
          response.url().includes(`/api/${autosavePostsSlug}/${doc.id}`) &&
          Boolean(response.request().postData()?.includes('Trigger the next autosave')),
      )

      await page.locator('#field-content').fill('Trigger the next autosave')
      await saved
      await expect
        .poll(async () => {
          const response = await page.request.get(
            formatAdminURL({
              apiRoute: '/api',
              path: `/${autosavePostsSlug}/${doc.id}`,
              serverURL,
            }),
            { params: { depth: 0, draft: true } },
          )
          const document = await response.json()

          return document.blocks?.map(({ id, text }: { id: string; text: string }) => ({
            id,
            text,
          }))
        })
        .toEqual([{ id: doc.blocks![1]!.id, text: 'Keep this block' }])
      await page.reload()
      await waitForFormReady(page)
      await expect(page.locator('#field-blocks__0__text')).toHaveValue('Keep this block')
      await expect(page.locator('#field-blocks__1__text')).toHaveCount(0)
    } finally {
      await payload.delete({ id: doc.id, collection: autosavePostsSlug })
    }
  })
})
