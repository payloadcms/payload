import { expect, test } from '@playwright/test'
import { AdminUrlUtil } from '../../../__helpers/shared/adminUrlUtil.js'
import { lexicalHeadingFeatureDisabledSlug } from 'lexical/slugs.js'
import path from 'path'
import { fileURLToPath } from 'url'

import { ensureCompilationIsDone } from '../../../__helpers/e2e/helpers.js'
import { initPayloadE2ENoConfig } from '../../../__helpers/shared/initPayloadE2ENoConfig.js'
import { TEST_TIMEOUT_LONG } from '../../../playwright.config.js'
import { LexicalHelpers } from '../utils.js'
const filename = fileURLToPath(import.meta.url)
const currentFolder = path.dirname(filename)
const dirname = path.resolve(currentFolder, '../../')

const { beforeAll, beforeEach, describe } = test

describe('Lexical Heading Feature - All Headings Disabled', () => {
  let lexical: LexicalHelpers
  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    process.env.SEED_IN_CONFIG_ONINIT = 'false'
    const page = await browser.newPage()
    await ensureCompilationIsDone({ page, serverURL })
    await page.close()
  })
  beforeEach(async ({ page }) => {
    const url = new AdminUrlUtil(serverURL, lexicalHeadingFeatureDisabledSlug)
    lexical = new LexicalHelpers(page)
    await page.goto(url.create)
    await lexical.editor.first().focus()
  })

  test('markdown shortcut should not create h0 when all headings disabled', async () => {
    // This tests the bug where pressing space after # creates invalid h0 heading
    // Issue: #15899
    await lexical.paste('markdown', '# Test Heading')
    
    // Should not create h0 heading - should remain as paragraph
    await expect(lexical.editor.locator('p')).toHaveCount(1)
    await expect(lexical.editor.locator('h0')).toHaveCount(0)
    await expect(lexical.editor.locator('h1')).toHaveCount(0)
  })

  test('multiple hash marks should not create invalid headings', async () => {
    // Test that ##, ###, etc. also don't create invalid headings
    await lexical.paste('markdown', '## Test H2')
    await expect(lexical.editor.locator('h0')).toHaveCount(0)
    await expect(lexical.editor.locator('h2')).toHaveCount(0)
    await expect(lexical.editor.locator('p')).toHaveCount(1)

    await lexical.paste('markdown', '### Test H3')
    await expect(lexical.editor.locator('h0')).toHaveCount(0)
    await expect(lexical.editor.locator('h3')).toHaveCount(0)
  })
})
