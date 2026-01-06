import type { BrowserContext, Page } from '@playwright/test'

import { expect, test } from '@playwright/test'

import { initPageConsoleErrorCatch } from '../helpers.js'
import { BASE_PATH } from './shared.js'

process.env.NEXT_BASE_PATH = BASE_PATH

const { beforeAll, describe } = test

describe('General', () => {
  let page: Page
  let context: BrowserContext

  beforeAll(async ({ browser }) => {
    context = await browser.newContext()
    page = await context.newPage()
    initPageConsoleErrorCatch(page)
  })

  test('repro', async () => {
    for (let i = 0; i < 100; i++) {
      await page.goto('http://localhost:3000/test')
      expect(true).toBe(true)
    }
  })
})
