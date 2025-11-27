/* eslint-disable playwright/expect-expect */
import { expect, test } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

import { ensureCompilationIsDone } from '../helpers.js'
import { AdminUrlUtil } from '../helpers/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../helpers/initPayloadE2ENoConfig.js'
import { reInitializeDB } from '../helpers/reInitializeDB.js'
import { TEST_TIMEOUT_LONG } from '../playwright.config.js'
import { DashboardHelper } from './utils.js'

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

  test('initial dashboard', async ({ page }) => {
    const d = new DashboardHelper(page)
    await expect(d.widgets).toHaveCount(7)

    await d.assertIsEditing(false)
    await d.assertWidget(1, 'collections', 'full')
    await d.assertWidget(2, 'count', 'x-small')
    await d.assertWidget(3, 'count', 'x-small')
    await d.assertWidget(4, 'count', 'x-small')
    await d.assertWidget(5, 'count', 'x-small')
    await d.assertWidget(6, 'revenue', 'full')
    await d.assertWidget(7, 'private', 'full')
  })

  test('add widget', async ({ page }) => {
    const d = new DashboardHelper(page)
    await d.setEditing()
    await d.addWidget('revenue')
    await d.assertWidget(8, 'revenue', 'medium')
    await d.saveChanges()
    await page.reload()
    await d.assertWidget(8, 'revenue', 'medium')
  })

  test('resize widget', async ({ page }) => {})

  // add widget
  // resize widget
  // delete widget
  // cancel editing
  // reset layout
  // reorder widget positions 1, 2, last and before last

  // widgets should take the height of the highest widget in the row
})
