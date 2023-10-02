import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'

import { AdminUrlUtil } from '../helpers/adminUrlUtil'
import { initPayloadE2E } from '../helpers/configHelpers'
import { startLivePreviewDemo } from './startLivePreviewDemo'

const { beforeAll, describe } = test
let url: AdminUrlUtil

describe('Live Preview', () => {
  let page: Page

  beforeAll(async ({ browser }) => {
    const { serverURL, payload } = await initPayloadE2E(__dirname)
    url = new AdminUrlUtil(serverURL, 'posts')

    const context = await browser.newContext()
    page = await context.newPage()

    await startLivePreviewDemo({
      payload,
    })
  })

  test('example test', async () => {
    await page.goto(url.list)
    await expect(true).toBe(true)
  })
})
