import { buildDefaultEditorState, buildEditorState } from '@payloadcms/richtext-lexical'
import { expect, test } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../../../__helpers/shared/sdk/index.js'
import type { Config } from '../../payload-types.js'
import type { LexicalViewsFrontendNodes } from './index.js'

import { ensureCompilationIsDone } from '../../../__helpers/e2e/helpers.js'
import { AdminUrlUtil } from '../../../__helpers/shared/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../../../__helpers/shared/initPayloadE2ENoConfig.js'
import { TEST_TIMEOUT_LONG } from '../../../playwright.config.js'
import { lexicalViewsFrontendSlug, lexicalViewsSlug } from '../../slugs.js'

const filename = fileURLToPath(import.meta.url)
const currentFolder = path.dirname(filename)
const dirname = path.resolve(currentFolder, '../../')

let _payload: PayloadTestSDK<Config>
let serverURL: string

const { beforeAll, beforeEach, describe } = test

// Unlike the other suites, this one runs in parallel, as they run on create URLs and are "pure" tests
// PLEASE do not reset the database or perform any operations that modify it in this file.
// TODO: Enable parallel mode again when ensureCompilationIsDone is extracted into a playwright hook. Otherwise,
// it runs multiple times in parallel, for each single test, which causes the tests to fail occasionally in CI.
// test.describe.configure({ mode: 'parallel' })

describe('Lexical Views', () => {
  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    process.env.SEED_IN_CONFIG_ONINIT = 'false' // Makes it so the payload config onInit seed is not run. Otherwise, the seed would be run unnecessarily twice for the initial test run - once for beforeEach and once for onInit
    ;({ payload: _payload, serverURL } = await initPayloadE2ENoConfig<Config>({ dirname }))

    const page = await browser.newPage()
    await ensureCompilationIsDone({ page, serverURL })
    await page.close()
  })

  describe('LexicalViewsFrontend - view selector with frontend view', () => {
    beforeEach(async ({ page }) => {
      const url = new AdminUrlUtil(serverURL, lexicalViewsFrontendSlug)
      await page.goto(url.create)
      // Wait for the rich text field to be visible
      await page.locator('.rich-text-lexical').first().waitFor({ state: 'visible' })
    })

    test('should show the view selector when a non-default view is configured', async ({
      page,
    }) => {
      const viewSelector = page.locator('.lexical-view-selector')
      await expect(viewSelector).toBeVisible()
    })

    test('should display Default as the initial view label', async ({ page }) => {
      const viewLabel = page.locator('.lexical-view-selector__label')
      await expect(viewLabel).toHaveText('Default')
    })

    test('should show Default and Frontend options in the view toggler popup', async ({ page }) => {
      // Open the view selector popup
      await page.locator('.lexical-view-selector__button').click()

      // The popup renders inside .lexical-view-selector and contains .popup-button-list items
      const viewSelectorPopup = page.locator(
        '.popup__content .popup-button-list .popup-button-list__button',
      )
      await expect(viewSelectorPopup).toHaveCount(2)
      await expect(viewSelectorPopup.nth(0)).toHaveText('Default')
      await expect(viewSelectorPopup.nth(1)).toHaveText('Frontend')
    })

    test('should switch to Frontend view when clicking the Frontend option', async ({ page }) => {
      await page.locator('.lexical-view-selector__button').click()

      // Click the Frontend option (it's the non-disabled button in the popup)
      await page
        .locator('.popup__content .popup-button-list .popup-button-list__button')
        .filter({ hasText: 'Frontend' })
        .click()

      // Verify label updated
      await expect(page.locator('.lexical-view-selector__label')).toHaveText('Frontend')
    })

    test('should switch back to Default view after selecting Frontend', async ({ page }) => {
      // Switch to Frontend
      await page.locator('.lexical-view-selector__button').click()
      await page
        .locator('.popup__content .popup-button-list .popup-button-list__button')
        .filter({ hasText: 'Frontend' })
        .click()
      await expect(page.locator('.lexical-view-selector__label')).toHaveText('Frontend')

      // Switch back to Default
      await page.locator('.lexical-view-selector__button').click()
      await page
        .locator('.popup__content .popup-button-list .popup-button-list__button')
        .filter({ hasText: 'Default' })
        .click()
      await expect(page.locator('.lexical-view-selector__label')).toHaveText('Default')
    })

    test('nested richtext editor should inherit view from parent, if both have views configured', async ({
      page,
    }) => {
      const url = new AdminUrlUtil(serverURL, lexicalViewsFrontendSlug)

      const doc = await _payload.create({
        collection: lexicalViewsFrontendSlug,
        data: {
          customFrontendViews: buildEditorState<LexicalViewsFrontendNodes>({
            nodes: [
              {
                type: 'block',
                fields: {
                  id: 'e2e-banner-normal-1',
                  type: 'normal',
                  blockName: '',
                  blockType: 'banner',
                  content: buildDefaultEditorState({ text: 'Normal banner content' }),
                  title: 'Normal Banner',
                },
                format: '',
                version: 2,
              },
            ],
          }),
        },
        depth: 0,
      })

      try {
        await page.goto(url.edit(doc.id))
        const editor = page.locator('.rich-text-lexical').first()
        await expect(editor).toBeVisible()
        await expect(editor.getByText('Normal banner content').first()).toBeVisible()

        const viewSelectors = page.locator('.lexical-view-selector')
        // Block view selector should not be visible since parent has one
        await expect(viewSelectors).toHaveCount(1)

        const parentViewSelector = page.locator(
          ':not(.LexicalEditorTheme__block-Code) > .lexical-view-selector',
        )

        await expect(editor).toHaveAttribute('data-lexical-view', 'default')
        await expect(
          editor.locator('.LexicalEditorTheme__block .rich-text-lexical'),
        ).toHaveAttribute('data-lexical-view', 'default')

        await parentViewSelector.click()
        await page
          .locator('.popup__content .popup-button-list .popup-button-list__button')
          .filter({ hasText: 'Frontend' })
          .click()

        await expect(page.locator('.lexical-view-selector__label').first()).toHaveText('Frontend')

        await expect(editor).toHaveAttribute('data-lexical-view', 'frontend')
        await expect(
          editor.locator('.LexicalEditorTheme__block .rich-text-lexical'),
        ).toHaveAttribute('data-lexical-view', 'frontend')
      } finally {
        await _payload.delete({
          collection: lexicalViewsFrontendSlug,
          id: doc.id,
        })
      }
    })
  })

  describe('LexicalViews - only default view configured', () => {
    beforeEach(async ({ page }) => {
      const url = new AdminUrlUtil(serverURL, lexicalViewsSlug)
      await page.goto(url.create)
      await page.locator('.rich-text-lexical').first().waitFor({ state: 'visible' })
    })

    test('should not show the view selector when only the default view exists', async ({
      page,
    }) => {
      // LexicalViews only has a "default" view, so the selector should be hidden
      const viewSelector = page.locator('.lexical-view-selector')
      await expect(viewSelector).toHaveCount(0)
    })
  })
})
