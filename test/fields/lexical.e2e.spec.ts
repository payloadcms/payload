import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'

import payload from '../../packages/payload/src'
import { AdminUrlUtil } from '../helpers/adminUrlUtil'
import { initPayloadE2E } from '../helpers/configHelpers'
import { RESTClient } from '../helpers/rest'
import { clearAndSeedEverything } from './seed'

const { beforeAll, describe, beforeEach } = test

let client: RESTClient
let page: Page
let serverURL: string

async function navigateToRichTextFields() {
  const url: AdminUrlUtil = new AdminUrlUtil(serverURL, 'rich-text-fields')
  await page.goto(url.list)
  await page.locator('.row-1 .cell-title a').click()
}
async function navigateToLexicalFields() {
  const url: AdminUrlUtil = new AdminUrlUtil(serverURL, 'lexical-fields')
  await page.goto(url.list)
  await page.locator('.row-1 .cell-title a').click()
}

describe('lexical', () => {
  beforeAll(async ({ browser }) => {
    const config = await initPayloadE2E(__dirname)
    serverURL = config.serverURL
    client = new RESTClient(null, { serverURL, defaultSlug: 'rich-text-fields' })
    await client.login()

    const context = await browser.newContext()
    page = await context.newPage()
  })
  beforeEach(async () => {
    await clearAndSeedEverything(payload)
    await client.logout()
    client = new RESTClient(null, { serverURL, defaultSlug: 'rich-text-fields' })
    await client.login()
  })

  test('should not warn about unsaved changes when navigating to lexical editor with blocks node and then leaving the page without actually changing anything', async () => {
    // This used to be an issue in the past, due to the node.setFields function in the blocks node being called unnecessarily when it's initialized after opening the document
    // Other than the annoying unsaved changed prompt, this can also cause unnecessary auto-saves, when drafts & autosave is enabled

    await navigateToLexicalFields()

    await expect(
      page.locator('.rich-text-lexical').nth(1).locator('.lexical-block').first(),
    ).toBeVisible()

    // Navigate to some different page, away from the current document
    await page.locator('.app-header__step-nav').first().locator('a').first().click()

    // Make sure .leave-without-saving__content (the "Leave without saving") is not visible
    await expect(page.locator('.leave-without-saving__content').first()).not.toBeVisible()
  })
})
