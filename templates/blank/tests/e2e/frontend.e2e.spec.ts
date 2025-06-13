import { test, expect, Page } from '@playwright/test'

import { getPayload, Payload } from 'payload'
import config from '@/payload.config'

test.describe('Frontend', () => {
  let payload: Payload
  let page: Page

  test.beforeAll(async ({ browser }, testInfo) => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })

    const context = await browser.newContext()
    page = await context.newPage()
  })

  test('can go on homepage', async ({ page }) => {
    await page.goto('http://localhost:3000')

    await expect(page).toHaveTitle(/Payload Blank Template/)

    const headging = page.locator('h1').first()

    await expect(headging).toHaveText('Welcome to your new project.')
  })
})
