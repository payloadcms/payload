import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import * as path from 'path'
import { fileURLToPath } from 'url'

import type { Config, Media } from './payload-types.js'

import { ensureCompilationIsDone, saveDocAndAssert } from '../helpers.js'
import { AdminUrlUtil } from '../helpers/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../helpers/initPayloadE2ENoConfig.js'
import { RESTClient } from '../helpers/rest.js'
import { TEST_TIMEOUT_LONG } from '../playwright.config.js'
import { mediaSlug } from './shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

test.describe('Cloud Storage Plugin', () => {
  let page: Page
  let client: RESTClient
  let serverURL: string
  let mediaURL: AdminUrlUtil

  test.beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    ;({ serverURL } = await initPayloadE2ENoConfig<Config>({ dirname }))
    mediaURL = new AdminUrlUtil(serverURL, mediaSlug)

    const context = await browser.newContext()
    page = await context.newPage()
    await ensureCompilationIsDone({ page, serverURL })
  })

  test.beforeEach(async () => {
    if (client) {
      await client.logout()
    }
    client = new RESTClient({ defaultSlug: 'users', serverURL })
    await client.login()
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

  test('should preserve image sizes when changing focal point', async () => {
    await page.goto(mediaURL.create)
    await page.setInputFiles('input[type="file"]', path.resolve(dirname, './image.png'))
    await expect(page.locator('.file-field__filename')).toHaveValue('image.png')
    await saveDocAndAssert(page)

    const mediaId = page.url().split('/').pop() as string

    const uploadedMedia = await client.findByID<Media & Record<string, unknown>>({
      id: mediaId,
      slug: mediaSlug,
      auth: true,
    })

    // eslint-disable-next-line payload/no-flaky-assertions
    const stringExpectation = expect.any(String)
    // eslint-disable-next-line payload/no-flaky-assertions
    const numberExpectation = expect.any(Number)

    // eslint-disable-next-line payload/no-flaky-assertions
    const sizeExpectation = expect.objectContaining({
      url: stringExpectation,
      mimeType: stringExpectation,
      filename: stringExpectation,
      width: numberExpectation,
      height: numberExpectation,
      filesize: numberExpectation,
    })

    // eslint-disable-next-line payload/no-flaky-assertions
    const sizesExpectation = expect.objectContaining({
      square: sizeExpectation,
      sixteenByNineMedium: sizeExpectation,
    })

    await expect
      .poll(() => uploadedMedia.doc)
      .toEqual(
        expect.objectContaining({
          focalX: 50,
          focalY: 50,
          sizes: sizesExpectation,
        }),
      )

    await page.locator('.file-field__edit').click()

    // set focal point
    const newFocalX = 12
    const newFocalY = 20
    await page.locator('.edit-upload__input input[name="X %"]').fill(newFocalX.toString()) // left focal point
    await page.locator('.edit-upload__input input[name="Y %"]').fill(newFocalY.toString()) // top focal point

    // apply focal point
    await page.locator('button:has-text("Apply Changes")').click()
    await saveDocAndAssert(page)

    const updatedMedia = await client.findByID<Media & Record<string, unknown>>({
      id: mediaId,
      slug: mediaSlug,
      auth: true,
    })

    await expect
      .poll(() => updatedMedia.doc)
      .toEqual(
        expect.objectContaining({
          focalX: newFocalX,
          focalY: newFocalY,
          sizes: sizesExpectation,
        }),
      )
  })
})
