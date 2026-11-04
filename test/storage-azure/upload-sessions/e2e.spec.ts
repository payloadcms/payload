import type { Browser, BrowserContext, Page } from '@playwright/test'

import { BlobServiceClient } from '@azure/storage-blob'
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
import { uploadSessionsContainerName } from './config.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

dotenv.config({ path: path.resolve(dirname, '../../plugin-cloud-storage/.env.emulated') })

const azureHost = new URL(process.env.AZURE_STORAGE_ACCOUNT_BASEURL!).host

// Above the 6 MiB test threshold, so it uses a session: three blocks of 5 + 5 + 1 MiB.
const FILE_SIZE = 11 * 1024 * 1024
const filePath = path.join(os.tmpdir(), `azure-upload-sessions-e2e-${process.pid}.mp4`)

type UploadLog = { blockPuts: number; sessionCalls: string[] }

test.describe('storage-azure upload sessions E2E', () => {
  let serverURL: string
  let videosURL: AdminUrlUtil

  test.beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    ;({ serverURL } = await initPayloadE2ENoConfig({ dirname }))
    videosURL = new AdminUrlUtil(serverURL, videosSlug)

    const blobService = BlobServiceClient.fromConnectionString(
      process.env.AZURE_STORAGE_CONNECTION_STRING!,
    )

    await blobService.setProperties({
      cors: [
        {
          allowedHeaders: '*',
          allowedMethods: 'GET,PUT,OPTIONS,HEAD',
          allowedOrigins: '*',
          exposedHeaders: '',
          maxAgeInSeconds: 3600,
        },
      ],
    })
    await blobService.getContainerClient(uploadSessionsContainerName).createIfNotExists()
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

  /**
   * Opens the create form in a fresh browser context with no leftover sessions. `blockDelay`
   * slows each Azure block upload so a test can act while the upload is still running.
   */
  const openCreateForm = async ({
    blockDelay = 0,
    browser,
  }: {
    blockDelay?: number
    browser: Browser
  }): Promise<{ context: BrowserContext; log: UploadLog; page: Page }> => {
    const context = await browser.newContext()
    const page = await context.newPage()
    const log: UploadLog = { blockPuts: 0, sessionCalls: [] }

    page.on('dialog', (dialog) => dialog.accept())
    page.on('request', (request) => {
      const url = new URL(request.url())

      if (url.pathname.startsWith('/api/payload-upload-sessions')) {
        log.sessionCalls.push(`${request.method()} ${url.pathname}`)
      }
    })

    await page.route(
      (url) => url.host === azureHost && url.searchParams.get('comp') === 'block',
      async (route) => {
        if (route.request().method() === 'PUT') {
          log.blockPuts++

          if (blockDelay) {
            await new Promise((resolve) => setTimeout(resolve, blockDelay))
          }
        }

        await route.continue()
      },
    )

    await page.goto(videosURL.create)
    await page.evaluate(async () => {
      const { docs } = await fetch('/api/payload-upload-sessions').then((res) => res.json())

      await Promise.all(
        docs.map(({ id }: { id: string }) =>
          fetch(`/api/payload-upload-sessions/${id}`, { method: 'DELETE' }),
        ),
      )
    })
    await gotoAndWaitForForm(page, videosURL.create)

    return { context, log, page }
  }

  const pickFile = (page: Page) =>
    page.locator('input[type="file"]').first().setInputFiles(filePath)

  const findVideo = async (title: string) => {
    const response = await fetch(
      `${serverURL}/api/${videosSlug}?where[title][equals]=${encodeURIComponent(title)}`,
    )

    return ((await response.json()) as { docs: { filesize: number; id: string }[] }).docs[0]
  }

  const expectVideo = async (title: string) => {
    await expect.poll(() => findVideo(title), { timeout: 60_000 }).toBeTruthy()

    return (await findVideo(title))!
  }

  test('should upload a large file to Azure in blocks and save the document', async ({
    browser,
  }) => {
    const { context, log, page } = await openCreateForm({ browser })
    const title = `Azure session ${Date.now()}`

    await pickFile(page)
    await page.getByLabel('Title').fill(title)
    await page.locator('#action-save').click()

    expect((await expectVideo(title)).filesize).toBe(FILE_SIZE)
    expect(log.blockPuts).toBe(3)
    expect(log.sessionCalls).toContain('POST /api/payload-upload-sessions')

    await context.close()
  })

  test('should resume after a reload once the file is selected again', async ({ browser }) => {
    const { context, log, page } = await openCreateForm({ blockDelay: 4000, browser })
    const title = `Azure recovered after reload ${Date.now()}`

    await pickFile(page)
    await page.getByLabel('Title').fill(title)
    await expect.poll(() => log.blockPuts).toBeGreaterThan(0)
    await page.locator('#action-save').click()
    await expect.poll(() => log.sessionCalls.some((call) => call.endsWith('/intent'))).toBe(true)
    await page.reload()

    const [chooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      // The form's dropzone has a button with the same label, so target the recovery toast.
      page.locator('[data-sonner-toast]').getByRole('button', { name: 'Select a file' }).click(),
    ])

    await chooser.setFiles(filePath)

    expect((await expectVideo(title)).filesize).toBe(FILE_SIZE)

    await context.close()
  })
})
