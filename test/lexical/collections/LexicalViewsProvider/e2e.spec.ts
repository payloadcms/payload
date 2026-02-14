import { expect, test } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../../../__helpers/shared/sdk/index.js'
import type { Config } from '../../payload-types.js'

import { ensureCompilationIsDone } from '../../../__helpers/e2e/helpers.js'
import { AdminUrlUtil } from '../../../__helpers/shared/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../../../__helpers/shared/initPayloadE2ENoConfig.js'
import { TEST_TIMEOUT_LONG } from '../../../playwright.config.js'
import { lexicalViewsProviderSlug } from '../../slugs.js'
import { LexicalHelpers } from '../utils.js'

const filename = fileURLToPath(import.meta.url)
const currentFolder = path.dirname(filename)
const dirname = path.resolve(currentFolder, '../../')

let _payload: PayloadTestSDK<Config>
let serverURL: string

const { beforeAll, beforeEach, describe } = test

describe('Lexical Views Provider', () => {
  let lexical: LexicalHelpers

  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    process.env.SEED_IN_CONFIG_ONINIT = 'false'
    ;({ payload: _payload, serverURL } = await initPayloadE2ENoConfig<Config>({ dirname }))

    const page = await browser.newPage()
    await ensureCompilationIsDone({ page, serverURL })
    await page.close()
  })

  describe('RichTextViewProvider inheritance - wrapping with currentView="frontend"', () => {
    beforeEach(async ({ page }) => {
      lexical = new LexicalHelpers(page)
      const url = new AdminUrlUtil(serverURL, lexicalViewsProviderSlug)
      await page.goto(url.create)
      await lexical.editor.first().waitFor({ state: 'visible' })
    })

    test('should not show the view selector when view is inherited from parent provider', async ({
      page,
    }) => {
      // The parent RichTextViewProvider sets inheritable={true} with explicit currentView="frontend",
      // so the inner field should see hasInheritedViews=true and hide the ViewSelector
      const viewSelector = page.locator('.lexical-view-selector')
      await expect(viewSelector).toHaveCount(0)
    })

    test('should have data-lexical-view set to frontend', async ({ page }) => {
      // The parent RichTextViewProvider sets currentView="frontend",
      // which should be inherited by the inner richtext field
      const richTextDiv = page.locator('.rich-text-lexical').first()
      await expect(richTextDiv).toHaveAttribute('data-lexical-view', 'frontend')
    })

    test('should apply the frontend view hideGutter admin config', async ({ page }) => {
      // The frontend view sets admin.hideGutter = true,
      // so the gutter class should NOT be present
      const richTextDiv = page.locator('.rich-text-lexical').first()
      await expect(async () => {
        const classes = await richTextDiv.getAttribute('class')
        expect(classes).not.toContain('rich-text-lexical--show-gutter')
      }).toPass()
    })

    test('should inherit currentView="frontend" into nested block richtext field', async ({
      page,
    }) => {
      // Add a block to the richtext field
      await lexical.paragraph.last().click()
      await lexical.slashCommand('contentblock', true, 'Content Block')

      // Wait for block to be added
      const block = page.locator('.LexicalEditorTheme__block').first()
      await expect(block).toBeVisible()

      // Fill in the title field
      const titleInput = block.locator('input[name*="title"]')
      await titleInput.fill('Test Block')

      // Find the nested richtext field inside the block
      const nestedRichText = block.locator('.rich-text-lexical').first()
      await expect(nestedRichText).toBeVisible()

      // CRITICAL TEST: The nested richtext field inherits currentView="frontend"
      // from the ancestor RichTextViewProvider wrapper (not from its direct parent field).
      // The nested field has its own views configured, but inherits the forced currentView.

      // The nested richtext should NOT have a view selector (hasInheritedViews=true)
      const nestedViewSelector = nestedRichText.locator('.lexical-view-selector')
      await expect(nestedViewSelector).toHaveCount(0)

      // The nested richtext should have data-lexical-view="frontend" (inherited currentView)
      await expect(nestedRichText).toHaveAttribute('data-lexical-view', 'frontend')

      // The nested richtext should have hideGutter applied (from its own "frontend" view config)
      // Note: The nested field uses its own views map (lexicalProviderViews) to resolve "frontend",
      // which sets admin.hideGutter=true
      await expect(async () => {
        const nestedClasses = await nestedRichText.getAttribute('class')
        expect(nestedClasses).not.toContain('rich-text-lexical--show-gutter')
      }).toPass()
    })
  })
})
