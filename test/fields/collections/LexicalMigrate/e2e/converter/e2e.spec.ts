import type { BrowserContext, Page } from '@playwright/test'
import type { SerializedEditorState } from 'lexical'

import { expect, test } from '@playwright/test'
import os from 'os'
import path from 'path'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../../../../../helpers/sdk/index.js'
import type { Config, LexicalMigrateField } from '../../../../payload-types.js'

import {
  ensureCompilationIsDone,
  initPageConsoleErrorCatch,
  saveDocAndAssert,
} from '../../../../../helpers.js'
import { AdminUrlUtil } from '../../../../../helpers/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../../../../../helpers/initPayloadE2ENoConfig.js'
import { reInitializeDB } from '../../../../../helpers/reInitializeDB.js'
import { RESTClient } from '../../../../../helpers/rest.js'
import { POLL_TOPASS_TIMEOUT, TEST_TIMEOUT_LONG } from '../../../../../playwright.config.js'
import { lexicalMigrateFieldsSlug } from '../../../../slugs.js'
import {
  getAlignIndentHTMLData,
  getAlignIndentLexicalData,
  lexicalMigrateDocData,
} from '../../data.js'

const filename = fileURLToPath(import.meta.url)
const currentFolder = path.dirname(filename)
const dirname = path.resolve(currentFolder, '../../../../')

const { beforeAll, beforeEach, describe } = test

let payload: PayloadTestSDK<Config>
let client: RESTClient
let page: Page
let context: BrowserContext
let serverURL: string

/**
 * Client-side navigation to the lexical editor from list view
 */
async function navigateToLexicalFields(navigateToListView: boolean = true) {
  if (navigateToListView) {
    const url: AdminUrlUtil = new AdminUrlUtil(serverURL, lexicalMigrateFieldsSlug)
    await page.goto(url.list)
  }

  const linkToDoc = page.locator('tbody tr:first-child .cell-title a').first()
  await expect(() => expect(linkToDoc).toBeTruthy()).toPass({ timeout: POLL_TOPASS_TIMEOUT })
  const linkDocHref = await linkToDoc.getAttribute('href')

  await linkToDoc.click()

  await page.waitForURL(`**${linkDocHref}`)
}
async function initClipboard(
  {
    context,
    page,
  }: {
    context: BrowserContext
    page: Page
  },
  // example: [['text/html', '<p>simple</p>'], ['text/plain', 'simple']]
  initialClipboardData?: Array<[string, string]>,
) {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.evaluate((initialClipboardData) => {
    const initClipboardData = (event: ClipboardEvent) => {
      event.preventDefault()
      for (const [type, value] of initialClipboardData) {
        event.clipboardData.setData(type, value)
      }
      document.removeEventListener('copy', initClipboardData)
    }
    document.addEventListener('copy', initClipboardData)
  }, initialClipboardData)
  const isMac = os.platform() === 'darwin'
  // For Mac, paste command is with Meta.
  const modifier = isMac ? 'Meta' : 'Control'
  await page.keyboard.press(`${modifier}+KeyC`)
}

describe('lexicalMigrateConverter', () => {
  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    process.env.SEED_IN_CONFIG_ONINIT = 'false' // Makes it so the payload config onInit seed is not run. Otherwise, the seed would be run unnecessarily twice for the initial test run - once for beforeEach and once for onInit
    ;({ payload, serverURL } = await initPayloadE2ENoConfig({ dirname }))

    context = await browser.newContext()
    page = await context.newPage()

    initPageConsoleErrorCatch(page)
    await reInitializeDB({
      serverURL,
      snapshotKey: 'fieldsLexicalMainTest',
      uploadsDir: path.resolve(dirname, './collections/Upload/uploads'),
    })
    await ensureCompilationIsDone({ page, serverURL })
  })
  beforeEach(async () => {
    /*await throttleTest({
      page,
      context,
      delay: 'Slow 4G',
    })*/
    await reInitializeDB({
      serverURL,
      snapshotKey: 'fieldsLexicalMigrateConverterTest',
      uploadsDir: [
        path.resolve(dirname, './collections/Upload/uploads'),
        path.resolve(dirname, './collections/Upload2/uploads2'),
      ],
    })

    if (client) {
      await client.logout()
    }
    client = new RESTClient(null, { defaultSlug: 'rich-text-fields', serverURL })
    await client.login()
  })

  test('should be replaced indent and align styles in text/html with lexical data', async ({
    context,
  }) => {
    await initClipboard(
      {
        context,
        page,
      },
      [['text/html', getAlignIndentHTMLData('styled')]],
    )
    await navigateToLexicalFields()
    // Fix lexicalWithSlateData data because of a LinkNode validate issue.
    const richTextField = page.locator('.rich-text-lexical').nth(1)
    await richTextField.scrollIntoViewIfNeeded()
    await expect(richTextField).toBeVisible()

    const editor = richTextField.locator('.editor')
    await editor.click()
    const isMac = os.platform() === 'darwin'
    // For Mac, paste command is with Meta.
    const modifier = isMac ? 'Meta' : 'Control'
    // Delete all lexical data for HTML paste test.
    await page.keyboard.press(`${modifier}+KeyA`)
    await page.keyboard.press('Backspace')
    await page.keyboard.press(`${modifier}+KeyV`)

    await saveDocAndAssert(page)
    await expect(async () => {
      const lexicalDoc: LexicalMigrateField = (
        await payload.find({
          collection: lexicalMigrateFieldsSlug,
          depth: 0,
          overrideAccess: true,
          where: {
            title: {
              equals: lexicalMigrateDocData.title,
            },
          },
        })
      ).docs[0] as never

      const lexicalField: SerializedEditorState = lexicalDoc.lexicalWithSlateData

      expect(lexicalField).toMatchObject(getAlignIndentLexicalData('styled'))
    }).toPass({
      timeout: POLL_TOPASS_TIMEOUT,
    })
  })
})
