import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import * as path from 'path'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../__helpers/shared/sdk/index.js'
import type { Config } from './payload-types.js'

import {
  ensureCompilationIsDone,
  initPageConsoleErrorCatch,
  saveDocAndAssert,
} from '../__helpers/e2e/helpers.js'
import { AdminUrlUtil } from '../__helpers/shared/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../__helpers/shared/initPayloadE2ENoConfig.js'
import { TEST_TIMEOUT_LONG } from '../playwright.config.js'
import { draftPostsSlug, postsSlug } from './slugs.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

test.describe('Authorship', () => {
  let page: Page
  let serverURL: string
  let payload: PayloadTestSDK<Config>

  test.beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    ;({ payload, serverURL } = await initPayloadE2ENoConfig<Config>({ dirname }))

    const context = await browser.newContext()
    page = await context.newPage()
    initPageConsoleErrorCatch(page)
    await ensureCompilationIsDone({ page, serverURL })
  })

  test('renders createdBy and updatedBy labels in the version compare view', async () => {
    const doc = await payload.create({
      collection: draftPostsSlug,
      data: { title: 'version one' },
      depth: 0,
    })

    await payload.update({
      id: doc.id,
      collection: draftPostsSlug,
      data: { title: 'version two' },
      depth: 0,
      draft: true,
    })

    const versions = await payload.findVersions({
      collection: draftPostsSlug,
      depth: 0,
      limit: 1,
      where: {
        parent: { equals: doc.id },
      },
    })

    const versionID = versions.docs[0]?.id

    // `modifiedOnly=false` forces every field to render, so the authorship fields
    // are shown regardless of whether their value changed between versions.
    await page.goto(
      `${serverURL}/admin/collections/${draftPostsSlug}/${doc.id}/versions/${versionID}?modifiedOnly=false`,
    )

    await expect(page.locator('.render-field-diffs').first()).toBeVisible()

    await expect(page.locator('.field-diff-label', { hasText: 'Created By' }).first()).toBeVisible()
    await expect(page.locator('.field-diff-label', { hasText: 'Updated By' }).first()).toBeVisible()
  })

  test('exposes createdBy and updatedBy in the API view JSON', async () => {
    const url = new AdminUrlUtil(serverURL, postsSlug)

    // Create the document through the UI so the authorship fields are populated
    // from the logged-in user rather than being null.
    await page.goto(url.create)
    await page.locator('#field-title').fill('api tab post')
    await saveDocAndAssert(page)

    await page.getByRole('link', { name: 'API' }).click()

    const results = page.locator('.query-inspector__results')
    await expect(results).toBeVisible()
    await expect(results).toContainText('createdBy')
    await expect(results).toContainText('updatedBy')
  })
})
