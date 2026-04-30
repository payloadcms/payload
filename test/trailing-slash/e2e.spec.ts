import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

import { login } from '../__helpers/e2e/auth/login.js'
import { goToListDoc } from '../__helpers/e2e/goToListDoc.js'
import {
  ensureCompilationIsDone,
  initPageConsoleErrorCatch,
  saveDocAndAssert,
} from '../__helpers/e2e/helpers.js'
import { AdminUrlUtil } from '../__helpers/shared/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../__helpers/shared/initPayloadE2ENoConfig.js'
import { TEST_TIMEOUT_LONG } from '../playwright.config.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

process.env.NEXT_TRAILING_SLASH = 'true'

test.describe('Trailing Slash', () => {
  let page: Page
  let url: AdminUrlUtil
  let serverURL: string

  test.beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)

    const { payload } = await initPayloadE2ENoConfig({
      dirname,
    })
    serverURL = payload.serverURL
    url = new AdminUrlUtil(serverURL, 'posts')

    const context = await browser.newContext()
    page = await context.newPage()
    initPageConsoleErrorCatch(page)

    await ensureCompilationIsDone({
      noAutoLogin: true,
      page,
      serverURL,
    })
  })

  test('should render forgot-password form action with trailing slash', async () => {
    await page.goto(`${url.admin}/forgot`)

    await expect(async () => {
      const formAction = await page.locator('form').getAttribute('action')
      expect(formAction).toContain('/api/users/forgot-password/')
    }).toPass()
  })

  test('should save edits to existing doc without 308 redirect loop', async () => {
    await login({ page, serverURL })

    await goToListDoc({
      cellClass: '.cell-title',
      page,
      textToMatch: 'First Post',
      urlUtil: url,
    })

    const apiRequests: string[] = []
    page.on('request', (request) => {
      if (request.url().includes('/api/posts/')) {
        apiRequests.push(`${request.method()} ${request.url()}`)
      }
    })

    await page.locator('#field-title').fill('First Post Edited')
    await saveDocAndAssert(page)

    await expect(() => {
      const patchURL = apiRequests.find((line) => line.startsWith('PATCH '))?.split(' ')[1]
      expect(patchURL).toMatch(/\/api\/posts\/[^/?#]+\/(\?|$)/)
    }).toPass()
  })

  test('should create new doc without 308 redirect loop', async () => {
    await page.goto(`${url.list}/create`)

    await page.locator('#field-title').fill('Created Under Trailing Slash')
    await saveDocAndAssert(page)

    await expect(page.locator('#field-title')).toHaveValue('Created Under Trailing Slash')
  })
})
