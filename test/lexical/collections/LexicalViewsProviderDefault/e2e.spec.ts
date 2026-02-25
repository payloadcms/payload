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

    test('should have data-lexical-view set to default', async ({ page }) => {
      // Parent provider explicitly sets currentView="default"
      const richTextDiv = page.locator('.rich-text-lexical').first()
      await expect(richTextDiv).toHaveAttribute('data-lexical-view', 'default')
    })
  })
})
