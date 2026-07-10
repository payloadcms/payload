import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

import type { Config } from '../../payload-types.js'

import {
  ensureCompilationIsDone,
  initPageConsoleErrorCatch,
} from '../../../__helpers/e2e/helpers.js'
import { AdminUrlUtil } from '../../../__helpers/shared/adminUrlUtil.js'
import { reInitializeDB } from '../../../__helpers/shared/clearAndSeed/reInitializeDB.js'
import { initPayloadE2ENoConfig } from '../../../__helpers/shared/initPayloadE2ENoConfig.js'
import { RESTClient } from '../../../__helpers/shared/rest.js'
import { TEST_TIMEOUT_LONG } from '../../../playwright.config.js'
import { codeFieldsSlug } from '../../slugs.js'

const filename = fileURLToPath(import.meta.url)
const currentFolder = path.dirname(filename)
const dirname = path.resolve(currentFolder, '../../')

let client: RESTClient
let page: Page
let serverURL: string
let url: AdminUrlUtil

test.describe('Code', () => {
  test.beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    process.env.SEED_IN_CONFIG_ONINIT = 'false'
    ;({ serverURL } = await initPayloadE2ENoConfig<Config>({
      dirname,
    }))

    url = new AdminUrlUtil(serverURL, codeFieldsSlug)

    const context = await browser.newContext()
    page = await context.newPage()
    initPageConsoleErrorCatch(page)

    await ensureCompilationIsDone({ page, serverURL })
  })

  test.beforeEach(async () => {
    await reInitializeDB({
      serverURL,
      snapshotKey: 'fieldsTest',
      uploadsDir: path.resolve(dirname, './collections/Upload/uploads'),
    })

    if (client) {
      await client.logout()
    }

    client = new RESTClient({ defaultSlug: 'users', serverURL })
    await client.login()
    await ensureCompilationIsDone({ page, serverURL })
  })

  test('should show Monaco suggestions outside of the editor bounds', async () => {
    await page.goto(url.create)

    const htmlCodeEditor = page.locator('#field-html')
    const monacoEditor = htmlCodeEditor.locator('.monaco-editor')

    await expect(htmlCodeEditor).toBeVisible()
    await expect(monacoEditor).toBeVisible()

    await monacoEditor.click({ position: { x: 80, y: 12 } })
    await expect(monacoEditor).toHaveClass(/focused/)
    await page.keyboard.type('<')

    const suggestion = page.locator('.suggest-widget.visible .monaco-list-row').nth(4)
    await expect(suggestion).toBeVisible()

    const editorBox = await htmlCodeEditor.boundingBox()
    const suggestionBox = await suggestion.boundingBox()

    expect(editorBox).not.toBeNull()
    expect(suggestionBox).not.toBeNull()
    expect(suggestionBox!.y + suggestionBox!.height).toBeGreaterThan(
      editorBox!.y + editorBox!.height,
    )

    const isSuggestionHitTestable = await suggestion.evaluate((element) => {
      const { height, left, top, width } = element.getBoundingClientRect()
      const hitElement = document.elementFromPoint(left + width / 2, top + height / 2)

      return Boolean(hitElement && element.contains(hitElement))
    })

    expect(isSuggestionHitTestable).toBe(true)
  })
})
