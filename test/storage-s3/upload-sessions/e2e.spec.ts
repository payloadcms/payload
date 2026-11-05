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

  // Several tests slow S3 part uploads on purpose so they can act mid-upload.
  test.beforeEach(() => {
    test.setTimeout(TEST_TIMEOUT_LONG)
  })

  /**
   * Opens the create form in a fresh browser context with no leftover sessions. `partDelay`
   * slows each S3 part upload so a test can act while the upload is still running.
   */
  const openCreateForm = async ({
    browser,
    partDelay = 0,
  }: {
    browser: import('@playwright/test').Browser
    partDelay?: number
  }): Promise<{ context: BrowserContext; log: UploadLog; page: Page }> => {
    const context = await browser.newContext()
    const page = await context.newPage()
    const log: UploadLog = { partPuts: 0, sessionBodies: [], sessionCalls: [] }

    page.on('dialog', (dialog) => dialog.accept())
    page.on('request', (request) => {
      const url = new URL(request.url())

      if (url.pathname.startsWith('/api/payload-upload-sessions')) {
        log.sessionCalls.push(`${request.method()} ${url.pathname}`)

        if (request.method() === 'POST' && url.pathname === '/api/payload-upload-sessions') {
          log.sessionBodies.push(request.postDataJSON() as Record<string, unknown>)
        }
      }
    })

    await page.route(
      (url) => url.host === s3Host,
      async (route) => {
        if (route.request().method() === 'PUT') {
          log.partPuts++

          if (partDelay) {
            await new Promise((resolve) => setTimeout(resolve, partDelay))
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

    return (
      (await response.json()) as {
        docs: { filename: string; filesize: number; id: string; updatedAt: string }[]
      }
    ).docs[0]
  }

  const expectVideo = async (title: string) => {
    await expect.poll(() => findVideo(title), { timeout: 60_000 }).toBeTruthy()

    return (await findVideo(title))!
  }

  test('should start uploading when the file is picked', async ({ browser }) => {
    const { context, log, page } = await openCreateForm({ browser })

    await pickFile(page)

    await expect.poll(() => log.partPuts).toBe(3)
    expect(log.sessionCalls).toContain('POST /api/payload-upload-sessions')

    await context.close()
  })

  test('should save a document after the upload finished', async ({ browser }) => {
    const { context, log, page } = await openCreateForm({ browser })
    const title = `Saved after upload ${Date.now()}`

    await pickFile(page)
    await expect.poll(() => log.partPuts).toBe(3)
    await page.getByLabel('Title').fill(title)
    await page.locator('#action-save').click()

    expect((await expectVideo(title)).filesize).toBe(FILE_SIZE)

    await context.close()
  })

  test('should wait for a running upload when saving, then save through the form', async ({
    browser,
  }) => {
    const { context, log, page } = await openCreateForm({ browser, partDelay: 3000 })
    const title = `Saved mid-upload ${Date.now()}`

    await pickFile(page)
    await page.getByLabel('Title').fill(title)
    await expect.poll(() => log.partPuts).toBeGreaterThan(0)
    await page.locator('#action-save').click()

    const doc = await expectVideo(title)

    await expect(page).toHaveURL(new RegExp(`/${videosSlug}/${doc.id}`))
    expect(log.sessionCalls.some((call) => call.endsWith('/intent'))).toBe(true)
    expect(log.sessionCalls.some((call) => call.endsWith('/complete'))).toBe(false)

    await context.close()
  })

  test('should report invalid fields on Save without waiting for the upload', async ({
    browser,
  }) => {
    const { context, log, page } = await openCreateForm({ browser, partDelay: 4000 })

    await pickFile(page)
    await expect.poll(() => log.partPuts).toBeGreaterThan(0)
    // Title is required; Save must fail now, not after the upload finishes.
    await page.locator('#action-save').click()

    await expect(page.locator('.field-error')).toBeVisible({ timeout: 2000 })
    expect(log.sessionCalls.some((call) => call.endsWith('/intent'))).toBe(false)

    // The upload keeps running, so fixing the field and saving again still works.
    const title = `Fixed after validation ${Date.now()}`

    await page.getByLabel('Title').fill(title)
    await page.locator('#action-save').click()

    expect((await expectVideo(title)).filesize).toBe(FILE_SIZE)

    await context.close()
  })

  test('should finish the save in the background after navigating away', async ({ browser }) => {
    const { context, log, page } = await openCreateForm({ browser, partDelay: 3000 })
    const title = `Saved in background ${Date.now()}`

    await pickFile(page)
    await page.getByLabel('Title').fill(title)
    await expect.poll(() => log.partPuts).toBeGreaterThan(0)
    await page.locator('#action-save').click()
    await expect.poll(() => log.sessionCalls.some((call) => call.endsWith('/intent'))).toBe(true)

    // Client-side navigation keeps the upload coordinator mounted.
    await page.getByRole('link', { name: 'Users' }).first().click()

    await expectVideo(title)
    await expect(page.getByText('Upload finished and the document was saved.')).toBeVisible()
    expect(log.sessionCalls.some((call) => call.endsWith('/complete'))).toBe(true)

    await context.close()
  })

  test('should offer to finish saving an upload that was never saved', async ({ browser }) => {
    const { context, log, page } = await openCreateForm({ browser })
    const title = `Finished from link ${Date.now()}`

    await pickFile(page)
    await expect.poll(() => log.partPuts).toBe(3)
    await page.getByRole('link', { name: 'Users' }).first().click()
    await page.getByRole('button', { name: 'Leave anyway' }).click()
    await page.getByRole('button', { name: 'Finish saving' }).click()
    await expect(page).toHaveURL(/uploadSession=/)
    // The attached upload shows in the form, so it can be renamed or removed before saving.
    await expect(page.locator('#field-filemanager-filename')).toHaveValue(/\.mp4$/)

    const partPutsBeforeSaving = log.partPuts

    await page.getByLabel('Title').fill(title)
    await page.locator('#action-save').click()

    expect((await expectVideo(title)).filesize).toBe(FILE_SIZE)
    expect(log.partPuts).toBe(partPutsBeforeSaving)

    await context.close()
  })

  test('should finish saving from the link again after leaving it once', async ({ browser }) => {
    const { context, log, page } = await openCreateForm({ browser })
    const title = `Finished from link twice ${Date.now()}`

    await pickFile(page)
    await expect.poll(() => log.partPuts).toBe(3)

    for (let visit = 0; visit < 2; visit++) {
      await page.getByRole('link', { name: 'Users' }).first().click()
      await page.getByRole('button', { name: 'Leave anyway' }).click()
      await page.getByRole('button', { name: 'Finish saving' }).click()
      await expect(page).toHaveURL(/uploadSession=/)
      await expect(page.locator('#field-filemanager-filename')).toBeVisible()
    }

    await page.getByLabel('Title').fill(title)
    await page.locator('#action-save').click()

    expect((await expectVideo(title)).filesize).toBe(FILE_SIZE)

    await context.close()
  })

  test('should keep a file picked while an attached upload is still loading', async ({
    browser,
  }) => {
    const { context, log, page } = await openCreateForm({ browser })

    await pickFile(page)
    await expect.poll(() => log.partPuts).toBe(3)
    await page.getByRole('link', { name: 'Users' }).first().click()
    await page.getByRole('button', { name: 'Leave anyway' }).click()

    // Hold the attached upload's lookup until the user has picked another file.
    let releaseLookup = () => {}
    const lookupHeld = new Promise<void>((resolve) => {
      releaseLookup = resolve
    })

    await page.route(/\/api\/payload-upload-sessions\/[^/]+$/, async (route) => {
      if (route.request().method() === 'GET') {
        await lookupHeld
      }

      await route.fallback()
    })
    await page.getByRole('button', { name: 'Finish saving' }).click()
    await expect(page).toHaveURL(/uploadSession=/)
    await page
      .locator('input[type="file"]')
      .first()
      .setInputFiles({
        name: 'picked-meanwhile.mp4',
        buffer: randomBytes(1024),
        mimeType: 'video/mp4',
      })
    await expect(page.locator('#field-filemanager-filename')).toHaveValue('picked-meanwhile.mp4')

    await expect(page.getByRole('button', { name: 'Finish saving' })).toBeHidden()

    releaseLookup()

    // The attached upload is set aside, and stays available to finish later.
    await expect(page.getByRole('button', { name: 'Finish saving' })).toBeVisible()
    await expect(page.locator('#field-filemanager-filename')).toHaveValue('picked-meanwhile.mp4')

    await context.close()
  })

  test('should finish the save in the background for a file renamed while uploading', async ({
    browser,
  }) => {
    const { context, log, page } = await openCreateForm({ browser, partDelay: 3000 })
    const title = `Renamed mid-upload ${Date.now()}`

    await pickFile(page)
    await expect.poll(() => log.partPuts).toBeGreaterThan(0)
    await page.locator('#field-filemanager-filename').fill('renamed-mid-upload.mp4')
    await page.getByLabel('Title').fill(title)
    await page.locator('#action-save').click()
    await expect.poll(() => log.sessionCalls.some((call) => call.endsWith('/intent'))).toBe(true)
    await page.getByRole('link', { name: 'Users' }).first().click()

    // The coordinator still tracks the restarted upload: no leave prompt, and the save finishes here.
    await expect(page).toHaveURL(/\/users/)
    await expect(page.getByText('Upload finished and the document was saved.')).toBeVisible({
      timeout: 60_000,
    })
    expect((await expectVideo(title)).filename).toBe('renamed-mid-upload.mp4')

    await context.close()
  })

  test('should resume after a reload once the file is selected again', async ({ browser }) => {
    const { context, log, page } = await openCreateForm({ browser, partDelay: 4000 })
    const title = `Recovered after reload ${Date.now()}`

    await pickFile(page)
    await page.getByLabel('Title').fill(title)
    await expect.poll(() => log.partPuts).toBeGreaterThan(0)
    await page.locator('#action-save').click()
    await expect.poll(() => log.sessionCalls.some((call) => call.endsWith('/intent'))).toBe(true)
    await page.reload()

    const [chooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      // The form's dropzone has a button with the same label, so target the recovery toast.
      page.locator('[data-sonner-toast]').getByRole('button', { name: 'Select a file' }).click(),
    ])

    await chooser.setFiles(filePath)

    await expectVideo(title)

    await context.close()
  })

  test('should save a file renamed after its upload started under the new name', async ({
    browser,
  }) => {
    const { context, log, page } = await openCreateForm({ browser })
    const title = `Renamed ${Date.now()}`

    await pickFile(page)
    await expect.poll(() => log.partPuts).toBe(3)
    await page.locator('#field-filemanager-filename').fill('renamed.mp4')
    await page.getByLabel('Title').fill(title)
    await page.locator('#action-save').click()

    const doc = await expectVideo(title)

    expect(doc.filename).toMatch(/^renamed/)
    expect(doc.filesize).toBe(FILE_SIZE)

    await context.close()
  })

  test('should still warn about unsaved changes elsewhere while a save continues in the background', async ({
    browser,
  }) => {
    const { context, log, page } = await openCreateForm({ browser, partDelay: 4000 })

    await pickFile(page)
    await page.getByLabel('Title').fill(`Background ${Date.now()}`)
    await expect.poll(() => log.partPuts).toBeGreaterThan(0)
    await page.locator('#action-save').click()
    await expect.poll(() => log.sessionCalls.some((call) => call.endsWith('/intent'))).toBe(true)

    // Leaving the saving form needs no prompt; the coordinator finishes its save.
    await page.getByRole('link', { name: 'Users' }).first().click()
    await expect(page.getByRole('button', { name: 'Leave anyway' })).toBeHidden()
    // Client-side navigation keeps the background save running.
    await page.locator('a[href$="/collections/users/create"]').first().click()
    await page.locator('#field-email').fill(`unsaved-${Date.now()}@payloadcms.com`)

    // Another form with unsaved changes must still prompt while that save runs.
    await page.getByRole('link', { name: 'Videos' }).first().click()
    await expect(page.getByRole('button', { name: 'Leave anyway' })).toBeVisible()

    await context.close()
  })

  test('should cancel a session that was still being created when the file was removed', async ({
    browser,
  }) => {
    const { context, log, page } = await openCreateForm({ browser })

    // The server creates the session, but its response reaches the browser only after removal.
    await page.route('**/api/payload-upload-sessions', async (route) => {
      if (route.request().method() !== 'POST') {
        return route.fallback()
      }

      const response = await route.fetch()

      await new Promise((resolve) => setTimeout(resolve, 2000))
      await route.fulfill({ response }).catch(() => {})
    })

    await pickFile(page)
    await expect
      .poll(() => log.sessionCalls.includes('POST /api/payload-upload-sessions'))
      .toBe(true)
    await page.getByRole('button', { name: 'Cancel', exact: true }).first().click()

    await expect
      .poll(() => log.sessionCalls.some((call) => call.startsWith('DELETE ')), { timeout: 10_000 })
      .toBe(true)

    await expect
      .poll(async () => {
        const { docs } = await page.evaluate(() =>
          fetch('/api/payload-upload-sessions').then((res) => res.json()),
        )

        return docs.length
      })
      .toBe(0)

    await context.close()
  })

  test('should not offer to recover an upload another tab is still sending', async ({
    browser,
  }) => {
    const { context, log, page } = await openCreateForm({ browser, partDelay: 3000 })

    await pickFile(page)
    await expect.poll(() => log.partPuts).toBeGreaterThan(0)

    const otherTab = await context.newPage()

    await otherTab.goto(videosURL.list)
    // Recovery waits briefly for other tabs to answer before showing anything.
    await otherTab.waitForTimeout(2000)

    await expect(otherTab.getByText(/was interrupted/)).toHaveCount(0)

    await context.close()
  })

  test('should replace the file of an existing document through an update session', async ({
    browser,
  }) => {
    const { context, log, page } = await openCreateForm({ browser })
    const title = `Session replace ${Date.now()}`

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

  test('should cancel the session when the file is removed', async ({ browser }) => {
    const { context, log, page } = await openCreateForm({ browser, partDelay: 3000 })

    await pickFile(page)
    await expect
      .poll(() => log.sessionCalls.includes('POST /api/payload-upload-sessions'))
      .toBe(true)
    await page.getByRole('button', { name: 'Cancel', exact: true }).first().click()

    await expect.poll(() => log.sessionCalls.some((call) => call.startsWith('DELETE '))).toBe(true)

    await context.close()
  })
})
