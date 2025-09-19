import { expect, test } from '@playwright/test'
import { ensureCompilationIsDone } from 'helpers.js'
import { AdminUrlUtil } from 'helpers/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from 'helpers/initPayloadE2ENoConfig.js'
import { reInitializeDB } from 'helpers/reInitializeDB.js'
import path from 'path'
import { TEST_TIMEOUT_LONG } from 'playwright.config.js'
import { fileURLToPath } from 'url'

const filename = fileURLToPath(import.meta.url)
const currentFolder = path.dirname(filename)
const dirname = path.resolve(currentFolder, '../../')

const { beforeAll, beforeEach, describe } = test

// Unlike the other suites, this one runs in parallel, as they run on the `lexical-fully-featured/create` URL and are "pure" tests
test.describe.configure({ mode: 'parallel' })

const { serverURL } = await initPayloadE2ENoConfig({
  dirname,
})

const url = new AdminUrlUtil(serverURL, 'users')

describe('Dashboard', () => {
  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    process.env.SEED_IN_CONFIG_ONINIT = 'false' // Makes it so the payload config onInit seed is not run. Otherwise, the seed would be run unnecessarily twice for the initial test run - once for beforeEach and once for onInit
    const page = await browser.newPage()
    await ensureCompilationIsDone({ page, serverURL })
    await page.close()
  })
  beforeEach(async ({ page }) => {
    await reInitializeDB({
      serverURL,
      snapshotKey: 'lexicalTest',
      uploadsDir: [path.resolve(dirname, './collections/Upload/uploads')],
    })
    await page.goto(url.admin)
  })

  test('todo', async ({ page }) => {
    await page.goto(serverURL)
    expect(1).toBe(1)
  })
})
