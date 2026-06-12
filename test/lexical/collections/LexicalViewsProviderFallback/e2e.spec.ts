import { expect, test } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../../../__helpers/shared/sdk/index.js'
import type { Config } from '../../payload-types.js'

import { ensureCompilationIsDone } from '../../../__helpers/e2e/helpers.js'
import { AdminUrlUtil } from '../../../__helpers/shared/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../../../__helpers/shared/initPayloadE2ENoConfig.js'
import { TEST_TIMEOUT_LONG } from '../../../playwright.config.js'
import { lexicalViewsProviderFallbackSlug } from '../../slugs.js'
import { LexicalHelpers } from '../utils.js'

const filename = fileURLToPath(import.meta.url)
const currentFolder = path.dirname(filename)
const dirname = path.resolve(currentFolder, '../../')

let _payload: PayloadTestSDK<Config>
let serverURL: string

const { beforeAll, beforeEach, describe } = test

describe('Lexical Views Provider Fallback', () => {
  let lexical: LexicalHelpers

  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    process.env.SEED_IN_CONFIG_ONINIT = 'false'
    ;({ payload: _payload, serverURL } = await initPayloadE2ENoConfig<Config>({ dirname }))

    const page = await browser.newPage()
    await ensureCompilationIsDone({ page, serverURL })
    await page.close()
  })

  describe('field falls back to default view config when inherited view does not exist', () => {
    beforeEach(async ({ page }) => {
      lexical = new LexicalHelpers(page)
      const url = new AdminUrlUtil(serverURL, lexicalViewsProviderFallbackSlug)
      await page.goto(url.create)
      await lexical.editor.first().waitFor({ state: 'visible' })
    })

    test('should apply hideGutter from default view when inherited "frontend" view does not exist', async ({
      page,
    }) => {
      // Parent provider forces currentView="frontend", but the child editor
      // only defines a "default" view with admin.hideGutter=true.
      //
      // This test expects the "default" view's hideGutter=true to be applied.
      const richTextDiv = page.locator('.rich-text-lexical').first()

      await expect(async () => {
        const classes = await richTextDiv.getAttribute('class')
        expect(classes).not.toContain('rich-text-lexical--show-gutter')
      }).toPass()
    })

    test('should apply default view createDOM overrides when inherited view does not exist', async ({
      page,
    }) => {
      // The default view's heading node has createDOM that sets data-fallback-view="true".
      // If the field correctly falls back to views.default, the node map includes this override
      // and headings should have the data attribute.
      await lexical.paragraph.first().click()
      await lexical.slashCommand('h1')
      await page.keyboard.type('Fallback heading')

      const heading = page.locator('.rich-text-lexical h1').first()
      await expect(heading).toBeVisible()
      await expect(heading).toHaveAttribute('data-fallback-view', 'true')
    })

    test('should not show view selector when view is inherited from parent provider', async ({
      page,
    }) => {
      // Parent forces currentView with inheritable=true, so ViewSelector should be hidden
      const viewSelector = page.locator('.lexical-view-selector')
      await expect(viewSelector).toHaveCount(0)
    })
  })
})
