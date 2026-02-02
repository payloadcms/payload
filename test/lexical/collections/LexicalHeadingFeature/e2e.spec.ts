import { expect, test } from '@playwright/test'
import { AdminUrlUtil } from '../../../helpers/shared/adminUrlUtil.js'
import { lexicalHeadingFeatureSlug } from 'lexical/slugs.js'
import path from 'path'
import { fileURLToPath } from 'url'

import { ensureCompilationIsDone } from '../../../helpers/e2e/helpers.js'
import { initPayloadE2ENoConfig } from '../../../helpers/shared/initPayloadE2ENoConfig.js'
import { TEST_TIMEOUT_LONG } from '../../../playwright.config.js'
import { LexicalHelpers } from '../utils.js'
const filename = fileURLToPath(import.meta.url)
const currentFolder = path.dirname(filename)
const dirname = path.resolve(currentFolder, '../../')

const { beforeAll, beforeEach, describe } = test

// Unlike the other suites, this one runs in parallel, as they run on the `lexical-fully-featured/create` URL and are "pure" tests
// PLEASE do not reset the database or perform any operations that modify it in this file.

// TODO: Enable parallel mode again when ensureCompilationIsDone is extracted into a playwright hook. Otherwise,
// it runs multiple times in parallel, for each single test, which causes the tests to fail occasionally in CI.
// test.describe.configure({ mode: 'parallel' })

const { serverURL } = await initPayloadE2ENoConfig({
  dirname,
})

describe('Lexical Heading Feature', () => {
  let lexical: LexicalHelpers
  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    process.env.SEED_IN_CONFIG_ONINIT = 'false' // Makes it so the payload config onInit seed is not run. Otherwise, the seed would be run unnecessarily twice for the initial test run - once for beforeEach and once for onInit
    const page = await browser.newPage()
    await ensureCompilationIsDone({ page, serverURL })
    await page.close()
  })
  beforeEach(async ({ page }) => {
    const url = new AdminUrlUtil(serverURL, lexicalHeadingFeatureSlug)
    lexical = new LexicalHelpers(page)
    await page.goto(url.create)
    await lexical.editor.first().focus()
  })

  test('unallowed headings should be converted when pasting', async () => {
    await lexical.paste(
      'html',
      '<h1>Hello1</h1><h2>Hello2</h2><h3>Hello3</h3><h4>Hello4</h4><h5>Hello5</h5><h6>Hello6</h6>',
    )
    await expect(lexical.editor.locator('h1')).toHaveCount(0)
    await expect(lexical.editor.locator('h2')).toHaveCount(1)
    await expect(lexical.editor.locator('h3')).toHaveCount(0)
    await expect(lexical.editor.locator('h4')).toHaveCount(5)
    await expect(lexical.editor.locator('h5')).toHaveCount(0)
    await expect(lexical.editor.locator('h6')).toHaveCount(0)
  })
})
