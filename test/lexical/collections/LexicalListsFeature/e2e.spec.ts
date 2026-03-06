import { expect, test } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../../../__helpers/shared/sdk/index.js'
import type { Config } from '../../payload-types.js'

import { ensureCompilationIsDone } from '../../../__helpers/e2e/helpers.js'
import { AdminUrlUtil } from '../../../__helpers/shared/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../../../__helpers/shared/initPayloadE2ENoConfig.js'
import { TEST_TIMEOUT_LONG } from '../../../playwright.config.js'
import { lexicalListsFeatureSlug } from '../../slugs.js'
import { LexicalHelpers } from '../utils.js'

const filename = fileURLToPath(import.meta.url)
const currentFolder = path.dirname(filename)
const dirname = path.resolve(currentFolder, '../../')

let payload: PayloadTestSDK<Config>
let serverURL: string

const { beforeAll, beforeEach, describe } = test

// Unlike the other suites, this one runs in parallel, as they run on the `lexical-fully-featured/create` URL and are "pure" tests
// PLEASE do not reset the database or perform any operations that modify it in this file.
// TODO: Enable parallel mode again when ensureCompilationIsDone is extracted into a playwright hook. Otherwise,
// it runs multiple times in parallel, for each single test, which causes the tests to fail occasionally in CI.
// test.describe.configure({ mode: 'parallel' })

describe('Lexical Lists Features', () => {
  let lexical: LexicalHelpers
  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    process.env.SEED_IN_CONFIG_ONINIT = 'false' // Makes it so the payload config onInit seed is not run. Otherwise, the seed would be run unnecessarily twice for the initial test run - once for beforeEach and once for onInit
    ;({ payload, serverURL } = await initPayloadE2ENoConfig<Config>({ dirname }))

    const page = await browser.newPage()
    await ensureCompilationIsDone({ page, serverURL })
    await page.close()
  })
  beforeEach(async ({ page }) => {
    const url = new AdminUrlUtil(serverURL, lexicalListsFeatureSlug)
    lexical = new LexicalHelpers(page)
    await page.goto(url.create)
    await lexical.editor.first().focus()
  })
  test('Registering only ordered list should work', async ({ page }) => {
    await page.keyboard.type('- hello')
    await expect(lexical.editor.locator('li')).toBeHidden()
    await page.keyboard.press('Enter')
    await page.keyboard.type('1. hello')
    await expect(lexical.editor.locator('li')).toBeVisible()
  })
})
