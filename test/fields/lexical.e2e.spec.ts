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

  test.skip('todo', async () => {
    await navigateToRichTextFields()

    await page.locator('todo').first().click()
  })
})
