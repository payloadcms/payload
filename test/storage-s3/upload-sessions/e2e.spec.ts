import type { BrowserContext, Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import dotenv from 'dotenv'
import { randomBytes } from 'node:crypto'
import { rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import * as path from 'path'
import { fileURLToPath } from 'url'

import { gotoAndWaitForForm } from '../../__helpers/e2e/helpers.js'
import { AdminUrlUtil } from '../../__helpers/shared/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../../__helpers/shared/initPayloadE2ENoConfig.js'
import { ensureCompilationIsDone } from '../../__setup/e2e/ensureCompilationIsDone.js'
import { TEST_TIMEOUT_LONG } from '../../playwright.config.js'
import { videosSlug } from '../shared.js'
import { createTestBucket } from '../test-utils.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

dotenv.config({ path: path.resolve(dirname, '../../plugin-cloud-storage/.env.emulated') })

const s3Host = new URL(process.env.S3_ENDPOINT!).host

// Above the 6 MiB test threshold, so it uses a session: three S3 parts of 5 + 5 + 1 MiB.
const FILE_SIZE = 11 * 1024 * 1024
const filePath = path.join(os.tmpdir(), `upload-sessions-e2e-${process.pid}.mp4`)

type UploadLog = {
  partPuts: number
  sessionBodies: Record<string, unknown>[]
  sessionCalls: string[]
}

test.describe('storage-s3 upload sessions E2E', () => {
  let serverURL: string
  let videosURL: AdminUrlUtil

  test.beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    ;({ serverURL } = await initPayloadE2ENoConfig({ dirname }))
    videosURL = new AdminUrlUtil(serverURL, videosSlug)

    await createTestBucket()
    await writeFile(filePath, randomBytes(FILE_SIZE))

    const page = await browser.newPage()
    await ensureCompilationIsDone({ page, serverURL })
    await page.close()
  })

  test.afterAll(async () => {
    await rm(filePath, { force: true })
  })

  test.beforeEach(() => {
    test.setTimeout(TEST_TIMEOUT_LONG)
  })

  /** Opens a fresh browser context that records upload session requests and S3 part uploads. */
  const openPage = async ({
    browser,
  }: {
    browser: import('@playwright/test').Browser
  }): Promise<{ context: BrowserContext; log: UploadLog; page: Page }> => {
    const context = await browser.newContext()
    const page = await context.newPage()
    const log: UploadLog = { partPuts: 0, sessionBodies: [], sessionCalls: [] }

    page.on('request', (request) => {
      const url = new URL(request.url())

      if (url.pathname.startsWith('/api/payload-upload-sessions')) {
        log.sessionCalls.push(`${request.method()} ${url.pathname}`)

        if (request.method() === 'POST' && url.pathname === '/api/payload-upload-sessions') {
          log.sessionBodies.push(request.postDataJSON() as Record<string, unknown>)
        }
      }

      if (url.host === s3Host && request.method() === 'PUT') {
        log.partPuts++
      }
    })

    return { context, log, page }
  }

  const pickFile = (page: Page) =>
    page.locator('input[type="file"]').first().setInputFiles(filePath)

  const findVideo = async (title: string) => {
    const response = await fetch(
      `${serverURL}/api/${videosSlug}?where[title][equals]=${encodeURIComponent(title)}`,
    )

    return (
      (await response.json()) as { docs: { filesize: number; id: string; updatedAt: string }[] }
    ).docs[0]
  }

  const expectVideo = async (title: string) => {
    await expect.poll(() => findVideo(title), { timeout: 60_000 }).toBeTruthy()

    return (await findVideo(title))!
  }

  test('should upload a large file through a session when saving', async ({ browser }) => {
    const { context, log, page } = await openPage({ browser })
    const title = `Session upload ${Date.now()}`

    await gotoAndWaitForForm(page, videosURL.create)
    await pickFile(page)
    await page.getByLabel('Title').fill(title)
    await page.locator('#action-save').click()

    const doc = await expectVideo(title)

    expect(doc.filesize).toBe(FILE_SIZE)
    expect(log.partPuts).toBe(3)
    expect(log.sessionCalls).toContain('POST /api/payload-upload-sessions')
    expect(log.sessionCalls.some((call) => call.endsWith('/storage'))).toBe(true)
    expect(log.sessionBodies[0]).toMatchObject({ operation: 'create' })

    await context.close()
  })

  test('should replace the file of an existing document through an update session', async ({
    browser,
  }) => {
    const { context, log, page } = await openPage({ browser })
    const title = `Session replace ${Date.now()}`

    await gotoAndWaitForForm(page, videosURL.create)
    await pickFile(page)
    await page.getByLabel('Title').fill(title)
    await page.locator('#action-save').click()

    const created = await expectVideo(title)

    await gotoAndWaitForForm(page, videosURL.edit(created.id))
    await page.locator('.file-toolbar__filename-btn').click()
    await page.locator('.popup-button-list__button', { hasText: 'Replace file' }).click()
    await page.setInputFiles('.file-manager input[type="file"]', filePath)
    await page.locator('#action-save').click()

    await expect.poll(() => log.sessionBodies.length, { timeout: 60_000 }).toBe(2)
    expect(log.sessionBodies[1]).toMatchObject({ operation: 'update', targetID: created.id })
    await expect.poll(() => log.partPuts, { timeout: 60_000 }).toBe(6)
    await expect
      .poll(async () => (await findVideo(title))?.updatedAt, { timeout: 60_000 })
      .not.toBe(created.updatedAt)

    await context.close()
  })
})
