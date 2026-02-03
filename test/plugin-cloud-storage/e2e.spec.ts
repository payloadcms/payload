import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import * as path from 'path'
import { fileURLToPath } from 'url'

import { ensureCompilationIsDone, saveDocAndAssert } from '../helpers.js'
import { AdminUrlUtil } from '@tools/test-utils/e2e'
import { initPayloadE2ENoConfig } from '@tools/test-utils/e2e'
import { TEST_TIMEOUT_LONG } from '../playwright.config.js'
import { mediaSlug } from './shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

test.describe('Cloud Storage Plugin', () => {
  let page: Page
  let mediaURL: AdminUrlUtil

  test.beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    const { serverURL } = await initPayloadE2ENoConfig({ dirname })
    mediaURL = new AdminUrlUtil(serverURL, mediaSlug)

    const context = await browser.newContext()
    page = await context.newPage()
    await ensureCompilationIsDone({ page, serverURL })
  })

  test('should create file upload', async () => {
    await page.goto(mediaURL.create)
    await page.setInputFiles('input[type="file"]', path.resolve(dirname, './image.png'))

    const filename = page.locator('.file-field__filename')

    await expect(filename).toHaveValue('image.png')

    await saveDocAndAssert(page)
  })

  test('should update an existing upload', async () => {
    await page.goto(mediaURL.create)
    await page.setInputFiles('input[type="file"]', path.resolve(dirname, './image.png'))

    const filename = page.locator('.file-field__filename')

    await expect(filename).toHaveValue('image.png')

    await saveDocAndAssert(page)

    // Update alt text
    await page.locator('#field-alt').fill('updated text')

    // Save again
    await saveDocAndAssert(page)
  })

  test('should not cause infinite loop after cropping image', async () => {
    let updateRequestCount = 0
    page.on('request', (request) => {
      if (request.url().includes('/api/media/') && request.method() === 'PATCH') {
        updateRequestCount++
      }
    })

    await page.goto(mediaURL.create)
    await page.setInputFiles('input[type="file"]', path.resolve(dirname, './image.png'))
    await expect(page.locator('.file-field__filename')).toHaveValue('image.png')
    await saveDocAndAssert(page)

    await page.locator('button').filter({ hasText: 'Edit' }).click()
    await page.locator('.drawer[id*="edit-upload"]').waitFor({ state: 'visible', timeout: 10000 })

    const focalPointArea = page.locator('.edit-upload__focalPoint')
    await focalPointArea.waitFor({ state: 'visible' })
    const box = await focalPointArea.boundingBox()
    await expect.poll(() => box).not.toBeNull()
    await page.mouse.click(box!.x + box!.width * 0.3, box!.y + box!.height * 0.7)

    await page
      .locator('.drawer[id*="edit-upload"] button')
      .filter({ hasText: 'Apply changes' })
      .click()
    await page.locator('.drawer[id*="edit-upload"]').waitFor({ state: 'hidden', timeout: 10000 })

    await page.locator('#action-save').click()
    await expect(page.locator('.payload-toast-container .toast-success')).toBeVisible({
      timeout: 30000,
    })
    await expect.poll(() => updateRequestCount).toBeLessThanOrEqual(2)
  })
})
