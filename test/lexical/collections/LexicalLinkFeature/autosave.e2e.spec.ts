import { expect, test } from '@playwright/test'
import path from 'path'
import { formatAdminURL } from 'payload/shared'
import { fileURLToPath } from 'url'

import { waitForFormReady } from '../../../__helpers/e2e/helpers.js'
import { waitForAutoSaveToRunAndComplete } from '../../../__helpers/e2e/waitForAutoSaveToRunAndComplete.js'
import { AdminUrlUtil } from '../../../__helpers/shared/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../../../__helpers/shared/initPayloadE2ENoConfig.js'
import { ensureCompilationIsDone } from '../../../__setup/e2e/ensureCompilationIsDone.js'
import { TEST_TIMEOUT_LONG } from '../../../playwright.config.js'
import { lexicalLinkFeatureAutosaveSlug, lexicalLinkFeatureSlug } from '../../slugs.js'
import { LexicalHelpers } from '../utils.js'
import { openNestedUploadDrawer } from './utils.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.resolve(path.dirname(filename), '../../')
const { serverURL } = await initPayloadE2ENoConfig({ dirname })

// This spec owns and cleans up its persisted documents without resetting shared suite data.
test.describe('Lexical Link Feature Autosave', () => {
  const createdAutosaveDocIDs: Array<number | string> = []

  test.afterEach(async ({ page }) => {
    for (const id of createdAutosaveDocIDs) {
      const response = await page.request.delete(
        formatAdminURL({
          apiRoute: '/api',
          path: `/${lexicalLinkFeatureAutosaveSlug}/${id}`,
          serverURL,
        }),
      )

      await expect(response).toBeOK()
    }

    createdAutosaveDocIDs.length = 0
  })

  test.beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)

    await ensureCompilationIsDone({ browser, serverURL })
  })

  test.beforeEach(async ({ page }) => {
    const url = new AdminUrlUtil(serverURL, lexicalLinkFeatureSlug)
    const lexical = new LexicalHelpers(page)

    await page.goto(url.create)
    await waitForFormReady(page)
    await expect(lexical.editor.first()).toBeVisible()
    await lexical.editor.first().focus()
  })

  test('should preserve unsaved link fields and the nested upload drawer through parent autosave', async ({
    page,
  }) => {
    test.setTimeout(TEST_TIMEOUT_LONG)

    const collectionURL = formatAdminURL({
      apiRoute: '/api',
      path: `/${lexicalLinkFeatureAutosaveSlug}`,
      serverURL,
    })
    const createResponse = await page.request.post(collectionURL, {
      data: { _status: 'published' },
    })

    await expect(createResponse).toBeOK()

    const {
      doc: { id },
    } = await createResponse.json()
    const url = new AdminUrlUtil(serverURL, lexicalLinkFeatureAutosaveSlug)

    createdAutosaveDocIDs.push(id)

    let releaseAutosave: () => void = () => {}
    const autosaveReady = new Promise<void>((resolve) => {
      releaseAutosave = resolve
    })

    // Let autosave finish only after the nested drawer opens, regardless of setup timing.
    await page.route(`${collectionURL}/${id}?**`, async (route) => {
      if (new URL(route.request().url()).searchParams.get('autosave') === 'true') {
        await autosaveReady
      }

      await route.continue()
    })

    try {
      await page.goto(url.edit(id))
      await waitForFormReady(page)

      const finalizedURL = 'https://example.com/autosave-finalized'
      const { lexical, linkDrawer, assetLabelField, selectedFilename, uploadDocumentDrawer } =
        await openNestedUploadDrawer({ page, finalizedURL })

      releaseAutosave()
      await waitForAutoSaveToRunAndComplete(page)
      await expect(uploadDocumentDrawer).toBeVisible()
      await expect(assetLabelField).toHaveValue('Client asset')
      await expect(selectedFilename).toHaveText(/payload.*\.jpg/)

      await uploadDocumentDrawer.getByRole('button', { name: 'Close' }).first().click()
      await expect(uploadDocumentDrawer).toBeHidden()
      await linkDrawer.getByRole('button', { name: 'Save changes', exact: true }).click()
      await expect(lexical.editor.getByRole('link', { name: 'custom link' })).toHaveAttribute(
        'href',
        finalizedURL,
      )
    } finally {
      releaseAutosave()
      await page.unrouteAll({ behavior: 'wait' })
    }
  })
})
