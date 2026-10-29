import { expect, test } from '@playwright/test'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import type { PayloadTestSDK } from '../__helpers/shared/sdk/index.js'
import type { Config } from './payload-types.js'

import { waitForFormReady } from '../__helpers/e2e/helpers.js'
import { AdminUrlUtil } from '../__helpers/shared/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../__helpers/shared/initPayloadE2ENoConfig.js'
import { initPage } from '../__setup/e2e/initPage.js'
import { autosavePostsSlug } from './collections/Autosave/index.js'

const dirname = path.dirname(fileURLToPath(import.meta.url))

test.describe('Shared queue autosave lifecycle', () => {
  let payload: PayloadTestSDK<Config>
  let serverURL: string
  const createdIDs = new Set<Config['collections']['autosave-posts']['id']>()
  const releases = new Set<() => void>()

  test.beforeAll(async () => {
    ;({ payload, serverURL } = await initPayloadE2ENoConfig<Config>({ dirname }))
  })

  test.afterEach(async ({ page }) => {
    releases.forEach((release) => release())
    releases.clear()
    await page.unrouteAll({ behavior: 'ignoreErrors' })
    for (const id of createdIDs) {
      await payload.delete({ id, collection: autosavePostsSlug, overrideAccess: true })
    }
    createdIDs.clear()
  })

  test('should clear the saving indicator when an explicit save supersedes a pending autosave', async ({
    page,
  }) => {
    const doc = await payload.create({
      collection: autosavePostsSlug,
      data: { title: 'Initial value' },
      draft: true,
      overrideAccess: true,
    })
    const captured = Promise.withResolvers<void>()
    const released = Promise.withResolvers<void>()
    const explicitSaved = Promise.withResolvers<void>()
    let didHoldAutosave = false

    createdIDs.add(doc.id)
    releases.add(released.resolve)
    await page.clock.install()
    await initPage({ page, serverURL })
    await page.route(`**/api/${autosavePostsSlug}/${doc.id}**`, async (route) => {
      if (route.request().method() !== 'PATCH') {
        return route.continue()
      }
      const isAutosave = new URL(route.request().url()).searchParams.get('autosave') === 'true'
      if (isAutosave && !didHoldAutosave) {
        didHoldAutosave = true
        captured.resolve()
        await released.promise
      }
      const response = await route.fetch()
      await route.fulfill({ response })
      if (!isAutosave) {
        explicitSaved.resolve()
      }
    })
    await page.goto(new AdminUrlUtil(serverURL, autosavePostsSlug).edit(doc.id))
    await waitForFormReady(page)
    await page.locator('#field-title').fill('First autosave')
    await page.clock.runFor(200)
    await captured.promise
    await page.locator('#field-title').fill('Pending autosave')
    await page.clock.runFor(1000)
    await page.waitForTimeout(100)
    await expect(page.locator('.autosave')).toBeVisible()
    await page.locator('form.collection-edit__form').evaluate((form) => {
      form.dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }))
    })
    released.resolve()
    await explicitSaved.promise
    await expect(page.locator('.collection-edit__form')).toHaveAttribute('data-form-ready', 'true')
    await page.clock.runFor(2000)
    await expect(page.locator('.autosave')).toBeHidden()
  })
})
