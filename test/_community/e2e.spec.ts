import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import * as path from 'path'
import { fileURLToPath } from 'url'

import { initPageConsoleErrorCatch } from '../helpers.js'
import { AdminUrlUtil } from '../helpers/adminUrlUtil.js'
import { initPayloadE2E } from '../helpers/configHelpers.js'
import config from './config.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const { beforeAll, describe } = test

describe('Admin Panel', () => {
  let page: Page
  let url: AdminUrlUtil

  beforeAll(async ({ browser }) => {
    const { serverURL } = await initPayloadE2E({ config, dirname })
    url = new AdminUrlUtil(serverURL, 'posts')

    const context = await browser.newContext()
    page = await context.newPage()
    initPageConsoleErrorCatch(page)
  })

  test('example test', async () => {
    await page.goto(url.list)

    const textCell = page.locator('.row-1 .cell-text')
    await expect(textCell).toHaveText('example post')
  })
})
