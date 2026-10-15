import { expect, test } from '@playwright/test'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import type { PayloadTestSDK } from '../__helpers/shared/sdk/index.js'
import type { Config } from './payload-types.js'

import { saveDocAndAssert, waitForFormReady } from '../__helpers/e2e/helpers.js'
import { AdminUrlUtil } from '../__helpers/shared/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../__helpers/shared/initPayloadE2ENoConfig.js'
import { initPage } from '../__setup/e2e/initPage.js'
import { draftPostsSlug } from './collections/Autosave/index.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))

test.describe('Document permission refresh', () => {
  let payload: PayloadTestSDK<Config>
  let serverURL: string

  test.beforeAll(async () => {
    ;({ payload, serverURL } = await initPayloadE2ENoConfig<Config>({ dirname }))
  })

  test('should apply saved field permissions after an unrelated edit', async ({ page }) => {
    const doc = await payload.create({
      collection: draftPostsSlug,
      data: { content: 'Initial content', title: 'ok Initial permissions' },
      draft: true,
      overrideAccess: true,
    })
    const release = Promise.withResolvers<void>()
    const captured = Promise.withResolvers<void>()

    try {
      await initPage({ page, serverURL })
      await page.goto(new AdminUrlUtil(serverURL, draftPostsSlug).edit(doc.id))
      await waitForFormReady(page)

      let isFirstPermission = true

      await page.route(`**/api/${draftPostsSlug}/access/${doc.id}**`, async (route) => {
        const response = await route.fetch()

        if (!isFirstPermission) {
          return route.fulfill({ response })
        }

        isFirstPermission = false
        const json = await response.json()

        json.fields.title = { ...json.fields.title, read: true, update: false }
        captured.resolve()
        await release.promise
        await route.fulfill({ json, response })
      })

      await page.locator('#field-title').fill('ok Saved permissions')
      await saveDocAndAssert(page, '#action-save-draft')
      await captured.promise
      await expect(page.locator('#field-content')).toBeEditable()
      await page.locator('#field-content').fill('Edited while permissions load')
      release.resolve()

      await expect(page.locator('#field-title')).not.toBeEditable()
      await expect(page.locator('#field-title')).toHaveValue('ok Saved permissions')
      await expect(page.locator('#field-content')).toHaveValue('Edited while permissions load')
      await expect(page.locator('#action-save-draft')).toBeEnabled()
    } finally {
      release.resolve()
      await page.unrouteAll({ behavior: 'ignoreErrors' })
      await payload.delete({ id: doc.id, collection: draftPostsSlug })
    }
  })
})
