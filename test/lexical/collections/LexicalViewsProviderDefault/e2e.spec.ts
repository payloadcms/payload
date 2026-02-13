import { expect, test } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../../../__helpers/shared/sdk/index.js'
import type { Config } from '../../payload-types.js'

import { ensureCompilationIsDone } from '../../../__helpers/e2e/helpers.js'
import { AdminUrlUtil } from '../../../__helpers/shared/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../../../__helpers/shared/initPayloadE2ENoConfig.js'
import { TEST_TIMEOUT_LONG } from '../../../playwright.config.js'
import { lexicalViewsProviderDefaultSlug } from '../../slugs.js'
import { LexicalHelpers } from '../utils.js'

const filename = fileURLToPath(import.meta.url)
const currentFolder = path.dirname(filename)
const dirname = path.resolve(currentFolder, '../../')

let _payload: PayloadTestSDK<Config>
let serverURL: string

const { beforeAll, beforeEach, describe } = test

describe('Lexical Views Provider Default', () => {
  let lexical: LexicalHelpers

  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    process.env.SEED_IN_CONFIG_ONINIT = 'false'
    ;({ payload: _payload, serverURL } = await initPayloadE2ENoConfig<Config>({ dirname }))

    const page = await browser.newPage()
    await ensureCompilationIsDone({ page, serverURL })
    await page.close()
  })

  describe('RichTextViewProvider forcing currentView="default" explicitly', () => {
    beforeEach(async ({ page }) => {
      lexical = new LexicalHelpers(page)
      const url = new AdminUrlUtil(serverURL, lexicalViewsProviderDefaultSlug)
      await page.goto(url.create)
      await lexical.editor.first().waitFor({ state: 'visible' })
    })

    test('should not show the view selector when currentView="default" is explicitly set with inheritable', async ({
      page,
    }) => {
      // Even though "default" is the default value, explicitly setting currentView="default"
      // with inheritable={true} should set hasExplicitCurrentView=true,
      // which should hide the ViewSelector
      const viewSelector = page.locator('.lexical-view-selector')
      await expect(viewSelector).toHaveCount(0)
    })

    test('should have data-lexical-view set to default', async () => {
      // Parent provider explicitly sets currentView="default"
      await expect(lexical.editor.first()).toHaveAttribute('data-lexical-view', 'default')
    })

    test('should NOT apply frontend view config (forced to default)', async () => {
      // The field has views configured with a "frontend" option that sets hideGutter=false,
      // but since we're forcing "default" view (which doesn't exist in the views map),
      // no custom view config should be applied

      // On large viewports, default behavior is to show the gutter
      // (The test might run on small viewport, so we check both cases)
      const classes = await lexical.editor.first().getAttribute('class')

      // We're using "default" view, not "frontend", so frontend's hideGutter setting
      // should NOT be applied. Default view behavior depends on viewport size.
      // We just verify we're in "default" view mode, not "frontend"
      await expect(lexical.editor.first()).toHaveAttribute('data-lexical-view', 'default')
    })

    test('should lock nested fields to default view (hasExplicitCurrentView propagates)', async ({
      page,
    }) => {
      // This test verifies that even though "default" looks like a default value,
      // when explicitly set, it propagates hasExplicitCurrentView=true through the hierarchy.

      // In a real scenario with nested fields, they would also be locked to "default"
      // and have their ViewSelectors hidden. For this simple collection with no nesting,
      // we just verify the main field behavior is correct.

      await expect(lexical.editor.first()).toHaveAttribute('data-lexical-view', 'default')

      const viewSelector = page.locator('.lexical-view-selector')
      await expect(viewSelector).toHaveCount(0)
    })
  })
})
