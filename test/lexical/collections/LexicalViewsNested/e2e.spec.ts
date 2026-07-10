import { expect, test } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../../../__helpers/shared/sdk/index.js'
import type { Config } from '../../payload-types.js'

import { ensureCompilationIsDone } from '../../../__helpers/e2e/helpers.js'
import { AdminUrlUtil } from '../../../__helpers/shared/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../../../__helpers/shared/initPayloadE2ENoConfig.js'
import { TEST_TIMEOUT_LONG } from '../../../playwright.config.js'
import { lexicalViewsNestedSlug } from '../../slugs.js'
import { LexicalHelpers } from '../utils.js'

const filename = fileURLToPath(import.meta.url)
const currentFolder = path.dirname(filename)
const dirname = path.resolve(currentFolder, '../../')

let _payload: PayloadTestSDK<Config>
let serverURL: string

const { beforeAll, beforeEach, describe } = test

describe('Lexical Views Nested', () => {
  let lexical: LexicalHelpers

  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    process.env.SEED_IN_CONFIG_ONINIT = 'false'
    ;({ payload: _payload, serverURL } = await initPayloadE2ENoConfig<Config>({ dirname }))

    const page = await browser.newPage()
    await ensureCompilationIsDone({ page, serverURL })
    await page.close()
  })

  describe('Nested richtext with views when parent has no views', () => {
    beforeEach(async ({ page }) => {
      lexical = new LexicalHelpers(page)
      const url = new AdminUrlUtil(serverURL, lexicalViewsNestedSlug)
      await page.goto(url.create)
      await lexical.editor.first().waitFor({ state: 'visible' })
    })

    test('parent richtext should not have a view selector (no views configured)', async ({
      page,
    }) => {
      // Parent has no views, so no selector should be shown
      const parentViewSelector = page.locator('.lexical-view-selector').first()
      await expect(parentViewSelector).toHaveCount(0)
    })

    test('nested richtext in block should show view selector (has views, parent has none)', async ({
      page,
    }) => {
      // Add a block to the parent richtext field
      await lexical.paragraph.last().click()
      await lexical.slashCommand('nestedcontent', true, 'Nested Content')

      // Wait for block to be added
      const block = page.locator('.LexicalEditorTheme__block').first()
      await expect(block).toBeVisible()

      // Fill in the label field
      const labelInput = block.locator('input[name*="label"]')
      await labelInput.fill('Test Nested Block')

      // Find the nested richtext field inside the block
      const nestedRichText = block.locator('.rich-text-lexical').first()
      await expect(nestedRichText).toBeVisible()

      // The view selector SHOULD be visible.
      const nestedViewSelector = nestedRichText.locator('.lexical-view-selector')
      await expect(nestedViewSelector).toBeVisible()

      // The nested richtext should start with "Default" view
      await expect(nestedRichText).toHaveAttribute('data-lexical-view', 'default')

      // Should show "Default" label
      const viewLabel = nestedViewSelector.locator('.lexical-view-selector__label')
      await expect(viewLabel).toHaveText('Default')
    })

    test('nested richtext view selector should work (can switch to Frontend view)', async ({
      page,
    }) => {
      // Add a block
      await lexical.paragraph.last().click()
      await lexical.slashCommand('nestedcontent')

      const block = page.locator('.LexicalEditorTheme__block').first()
      await expect(block).toBeVisible()

      // Find the nested richtext
      const nestedRichText = block.locator('.rich-text-lexical').first()
      await expect(nestedRichText).toBeVisible()

      // Click the view selector button
      const viewSelectorButton = nestedRichText.locator('.lexical-view-selector__button')
      await viewSelectorButton.click()

      // Click the "Frontend" option
      const frontendOption = page
        .locator('.popup__content .popup-button-list .popup-button-list__button')
        .filter({ hasText: 'Frontend' })
      await frontendOption.click()

      // Verify the view switched
      await expect(nestedRichText).toHaveAttribute('data-lexical-view', 'frontend')
      const viewLabel = nestedRichText.locator('.lexical-view-selector__label')
      await expect(viewLabel).toHaveText('Frontend')

      // Verify hideGutter is applied (frontend view config)
      await expect(async () => {
        const nestedClasses = await nestedRichText.getAttribute('class')
        expect(nestedClasses).not.toContain('rich-text-lexical--show-gutter')
      }).toPass()
    })
  })
})
