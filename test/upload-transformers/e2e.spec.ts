import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import * as path from 'path'
import { fileURLToPath } from 'url'

import { saveDocAndAssert } from '../__helpers/e2e/helpers.js'
import { AdminUrlUtil } from '../__helpers/shared/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../__helpers/shared/initPayloadE2ENoConfig.js'
import { ensureCompilationIsDone } from '../__setup/e2e/ensureCompilationIsDone.js'
import { TEST_TIMEOUT_LONG } from '../playwright.config.js'
import { resizePreviewMediaSlug } from './shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

async function selectFile(page: Page, filePath: string) {
  await expect(async () => {
    await page.setInputFiles('input[type="file"]', filePath)
    await expect(page.locator('#field-filemanager-filename')).toBeVisible({ timeout: 2000 })
  }).toPass({ intervals: [1000], timeout: 15000 })
}

test.describe('Resize preview component', () => {
  let page: Page
  let resizePreviewMediaURL: AdminUrlUtil

  test.beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    const { serverURL } = await initPayloadE2ENoConfig({ dirname })
    resizePreviewMediaURL = new AdminUrlUtil(serverURL, resizePreviewMediaSlug)

    const context = await browser.newContext()
    page = await context.newPage()
    await ensureCompilationIsDone({ page, serverURL })
  })

  test('should generate a resize preview for the uploaded image', async () => {
    await page.goto(resizePreviewMediaURL.create)
    await selectFile(page, path.resolve(dirname, './image.png'))
    await saveDocAndAssert(page)

    await page.locator('.resize-preview__toggler').click()
    await expect(page.locator('#resize-preview-width')).toBeVisible()

    await page.locator('#resize-preview-width').fill('200')
    await page.locator('.resize-preview__generate').click()

    const preview = page.locator('.resize-preview__image')
    await expect(preview).toBeVisible()
    await expect(preview).toHaveAttribute('src', /^blob:/)
    await expect(page.locator('.resize-preview__download')).toBeVisible()
    await expect(page.locator('.resize-preview__error')).toBeHidden()

    const naturalWidth = await preview.evaluate((img: HTMLImageElement) => img.naturalWidth)
    expect(naturalWidth).toBe(200)
  })

  test('should show an error and no preview when the resize request is rejected', async () => {
    await page.goto(resizePreviewMediaURL.create)
    await selectFile(page, path.resolve(dirname, './image.png'))
    await saveDocAndAssert(page)

    await page.locator('.resize-preview__toggler').click()
    await expect(page.locator('#resize-preview-width')).toBeVisible()

    await page.locator('#resize-preview-width').fill('0')
    await page.locator('.resize-preview__generate').click()

    await expect(page.locator('.resize-preview__error')).toBeVisible()
    await expect(page.locator('.resize-preview__error')).toContainText('400')
    await expect(page.locator('.resize-preview__image')).toBeHidden()
  })
})
