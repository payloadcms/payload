import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'

import { initPageConsoleErrorCatch } from '../helpers'
import { AdminUrlUtil } from '../helpers/adminUrlUtil'
import { initPayloadE2E } from '../helpers/configHelpers'

const { beforeAll, describe } = test

describe('Globals', () => {
  let page: Page
  let url: AdminUrlUtil

  beforeAll(async ({ browser }) => {
    const { serverURL } = await initPayloadE2E(__dirname)
    url = new AdminUrlUtil(serverURL, 'media')

    const context = await browser.newContext()
    page = await context.newPage()
    initPageConsoleErrorCatch(page)
  })

  test('can edit media from field', async () => {
    await page.goto(url.create)

    // const textCell = page.locator('.row-1 .cell-text')
  })
})
