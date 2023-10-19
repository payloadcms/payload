import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'

import { exactText, saveDocAndAssert } from '../helpers'
import { AdminUrlUtil } from '../helpers/adminUrlUtil'
import { initPayloadE2E } from '../helpers/configHelpers'
import { startLivePreviewDemo } from './startLivePreviewDemo'

const { beforeAll, describe } = test
let url: AdminUrlUtil

describe('Live Preview', () => {
  let page: Page

  beforeAll(async ({ browser }) => {
    const { serverURL, payload } = await initPayloadE2E(__dirname)
    url = new AdminUrlUtil(serverURL, 'pages')

    const context = await browser.newContext()
    page = await context.newPage()

    await startLivePreviewDemo({
      payload,
    })
  })

  test('collection - has tab', async () => {
    await page.goto(url.create)

    const livePreviewTab = page.locator('.doc-tab', {
      hasText: exactText('Live Preview'),
    })

    expect(livePreviewTab).toBeTruthy()
  })

  test('collection - has route', async () => {
    await page.goto(url.create)
    await page.locator('#field-title').fill('Title')
    await page.locator('#field-slug').fill('slug')

    await saveDocAndAssert(page)
    const docURL = page.url()

    const livePreviewTab = page.locator('.doc-tab', {
      hasText: exactText('Live Preview'),
    })

    expect(livePreviewTab).toBeTruthy()
    await livePreviewTab.click()
    expect(page.url()).toBe(`${docURL}/preview`)
  })
})
