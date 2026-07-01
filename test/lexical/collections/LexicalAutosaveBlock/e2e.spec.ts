import { expect, test } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../../../__helpers/shared/sdk/index.js'
import type { Config } from '../../payload-types.js'

import { ensureCompilationIsDone } from '../../../__helpers/e2e/helpers.js'
import { AdminUrlUtil } from '../../../__helpers/shared/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../../../__helpers/shared/initPayloadE2ENoConfig.js'
import { TEST_TIMEOUT_LONG } from '../../../playwright.config.js'
import { lexicalAutosaveBlockSlug } from '../../slugs.js'
import { LexicalHelpers } from '../utils.js'

const filename = fileURLToPath(import.meta.url)
const currentFolder = path.dirname(filename)
const dirname = path.resolve(currentFolder, '../../')

let payload: PayloadTestSDK<Config>
let serverURL: string

const { beforeAll, beforeEach, describe } = test

// Repro: when the parent collection has autosave enabled, every autosave
// re-renders the outer richText, which unmounts/remounts the block decorator
// containing the nested richText. The nested editor loses focus and any
// characters typed after the autosave fires are dropped on the floor.
describe('Lexical: nested richText loses focus on parent autosave', () => {
  let lexical: LexicalHelpers

  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    process.env.SEED_IN_CONFIG_ONINIT = 'false'
    ;({ payload, serverURL } = await initPayloadE2ENoConfig<Config>({ dirname }))

    const page = await browser.newPage()
    await ensureCompilationIsDone({ page, serverURL })
    await page.close()
  })

  beforeEach(async ({ page }) => {
    const url = new AdminUrlUtil(serverURL, lexicalAutosaveBlockSlug)
    lexical = new LexicalHelpers(page)
    await page.goto(url.create)
    await lexical.editor.first().focus()
  })

  test('typing in a nested richText keeps focus and retains characters across autosaves', async ({
    page,
  }) => {
    await lexical.slashCommand('blockwithrichtext', true, 'Block With Rich Text')

    await expect(lexical.editor).toHaveCount(2)

    const nestedEditor = lexical.editor.nth(1)
    await nestedEditor.click()

    // Per-key delay > autosave interval (100ms) so autosave is guaranteed to
    // fire between keystrokes. That is the timing that triggers the bug.
    const typed = 'abcdefghij'
    await page.keyboard.type(typed, { delay: 300 })

    // Allow any in-flight autosave to settle so the focus state has converged.
    await page.waitForTimeout(500)

    await expect(nestedEditor).toHaveText(typed)

    const isNestedFocused = await page.evaluate(() => {
      const editors = document.querySelectorAll('[data-lexical-editor="true"]')
      return document.activeElement === editors[1]
    })
    expect(isNestedFocused).toBe(true)
  })
})
