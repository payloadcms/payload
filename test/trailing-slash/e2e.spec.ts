import type { Page, Request, Response } from '@playwright/test'

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
  const apiResponses: { method: string; status: number; url: string }[] = []
  const recordResponse = (response: Response) => {
    const request = response.request()
    if (response.url().includes('/api/')) {
      apiResponses.push({
        method: request.method(),
        status: response.status(),
        url: response.url(),
      })
    }
  }
  const recordRequest = (request: Request) => {
    if (request.url().includes('/api/')) {
      apiResponses.push({
        method: request.method(),
        status: 0,
        url: request.url(),
      })
    }
  }

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
    page.on('response', recordResponse)

    await ensureCompilationIsDone({
      noAutoLogin: true,
      page,
      readyURL: `${serverURL}/admin/login/**`,
      serverURL,
    })
  })

  test.beforeEach(() => {
    apiResponses.length = 0
  })

  test('should render forgot-password form action with trailing slash', async () => {
    await page.goto(`${url.admin}/forgot`)

    await expect(async () => {
      const formAction = await page.locator('form').getAttribute('action')
      expect(formAction).toContain('/api/users/forgot-password/')
    }).toPass()
  })

  test('should login without 308 redirect on /api/users/login', async () => {
    await login({ page, serverURL })

    await expect(() => {
      const loginRequest = apiResponses.find(
        (entry) => entry.method === 'POST' && entry.url.includes('/api/users/login'),
      )
      expect(loginRequest?.url).toMatch(/\/api\/users\/login\/(\?|$)/)
      expect(loginRequest?.status).toBeLessThan(300)
    }).toPass()
  })

  test('should navigate dashboard, list, edit and account without any /api 3xx', async () => {
    apiResponses.length = 0

    await page.goto(url.admin)
    await expect(page.locator('.dashboard')).toBeVisible()

    await page.goto(url.list)
    await expect(page.locator('.collection-list')).toBeVisible()

    await goToListDoc({
      cellClass: '.cell-title',
      page,
      textToMatch: 'First Post',
      urlUtil: url,
    })
    await expect(page.locator('#field-title')).toBeVisible()

    await page.goto(`${url.admin}/account`)
    await expect(page.locator('#field-email')).toBeVisible()

    await expect(() => {
      const redirected = apiResponses.filter((entry) => entry.status >= 300 && entry.status < 400)
      expect(redirected).toEqual([])
    }).toPass()
  })

  test('should save edits to existing doc with trailing-slash URL', async () => {
    apiResponses.length = 0
    page.on('request', recordRequest)

    await goToListDoc({
      cellClass: '.cell-title',
      page,
      textToMatch: 'First Post',
      urlUtil: url,
    })

    await page.locator('#field-title').fill('First Post Edited')
    await saveDocAndAssert(page)

    page.off('request', recordRequest)

    await expect(() => {
      const patchEntry = apiResponses.find(
        (entry) => entry.method === 'PATCH' && entry.url.includes('/api/posts/'),
      )
      expect(patchEntry?.url).toMatch(/\/api\/posts\/[^/?#]+\/(\?|$)/)
      expect(patchEntry?.status).toBeLessThan(300)
    }).toPass()
  })

  test('should create new doc and POST to trailing-slash URL', async () => {
    apiResponses.length = 0

    await page.goto(`${url.list}/create`)
    await page.locator('#field-title').fill('Created Under Trailing Slash')
    await saveDocAndAssert(page)

    await expect(page.locator('#field-title')).toHaveValue('Created Under Trailing Slash')

    await expect(() => {
      const createEntry = apiResponses.find(
        (entry) => entry.method === 'POST' && entry.url.includes('/api/posts/'),
      )
      expect(createEntry?.url).toMatch(/\/api\/posts\/(\?|$)/)
      expect(createEntry?.status).toBeLessThan(300)
    }).toPass()
  })
})
