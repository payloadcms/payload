import type { Page } from '@playwright/test'

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
import { openNestedUploadDrawer, openUploadListDrawer } from './utils.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.resolve(path.dirname(filename), '../../')
const { serverURL } = await initPayloadE2ENoConfig({ dirname })

// This spec owns and cleans up its persisted documents without resetting shared suite data.
test.describe('Lexical Link Feature Autosave', () => {
  const createdAutosaveDocIDs: Array<number | string> = []
  const collectionURL = formatAdminURL({
    apiRoute: '/api',
    path: `/${lexicalLinkFeatureAutosaveSlug}`,
    serverURL,
  })

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

  test('should preserve the media picker search and focus through parent autosave (#17676)', async ({
    page,
  }) => {
    test.setTimeout(TEST_TIMEOUT_LONG)

    const { id, editURL } = await createAutosaveDoc({ page })

    let releaseAutosave: () => void = () => {}
    const autosaveReady = new Promise<void>((resolve) => {
      releaseAutosave = resolve
    })

    await page.route(`${collectionURL}/${id}?**`, async (route) => {
      if (new URL(route.request().url()).searchParams.get('autosave') === 'true') {
        await autosaveReady
      }

      await route.continue()
    })

    try {
      await page.goto(editURL)
      await waitForFormReady(page)

      const { uploadListDrawer } = await openUploadListDrawer({
        finalizedURL: 'https://example.com/media-picker',
        page,
      })
      const search = uploadListDrawer.getByRole('textbox', { name: 'Search', exact: true })

      await search.fill('payload')
      await expect(uploadListDrawer.getByText('payload.jpg', { exact: true })).toBeVisible()
      await search.focus()

      const originalSearch = await search.elementHandle()

      releaseAutosave()
      await waitForAutoSaveToRunAndComplete(page)

      await expect(uploadListDrawer).toBeVisible()
      await expect.poll(() => originalSearch!.evaluate((element) => element.isConnected)).toBe(true)
      await expect(search).toHaveValue('payload')
      await expect(search).toBeFocused()
      await uploadListDrawer.getByText('payload.jpg', { exact: true }).click()
      await expect(uploadListDrawer).toBeHidden()
      await expect(page.locator('.upload-relationship-details__filename')).toHaveText('payload.jpg')
    } finally {
      releaseAutosave()
      await page.unrouteAll({ behavior: 'wait' })
    }
  })

  test('should preserve unsaved link fields and the nested upload drawer through parent autosave', async ({
    page,
  }) => {
    test.setTimeout(TEST_TIMEOUT_LONG)

    const { id, editURL } = await createAutosaveDoc({ page })

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
      await page.goto(editURL)
      await waitForFormReady(page)

      const finalizedURL = 'https://example.com/autosave-finalized'
      const { lexical, linkDrawer, assetLabelField, selectedFilename, uploadDocumentDrawer } =
        await openNestedUploadDrawer({ page, finalizedURL })
      const uploadTextField = uploadDocumentDrawer.getByRole('textbox', {
        name: 'Text',
        exact: true,
      })

      await uploadTextField.focus()

      releaseAutosave()
      await waitForAutoSaveToRunAndComplete(page)
      await expect(uploadDocumentDrawer).toBeVisible()
      await expect(uploadTextField).toBeFocused()
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

  async function createAutosaveDoc({ page }: { page: Page }) {
    const response = await page.request.post(collectionURL, { data: { _status: 'published' } })

    await expect(response).toBeOK()

    const {
      doc: { id },
    } = await response.json()

    createdAutosaveDocIDs.push(id)

    return { id, editURL: new AdminUrlUtil(serverURL, lexicalLinkFeatureAutosaveSlug).edit(id) }
  }
})
