import type { BrowserContext, Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import dotenv from 'dotenv'
import { randomBytes } from 'node:crypto'
import { rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import * as path from 'path'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { gotoAndWaitForForm } from '../../__helpers/e2e/helpers.js'
import { isFormStateRequest } from '../../__helpers/e2e/isFormStateRequest.js'
import { AdminUrlUtil } from '../../__helpers/shared/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../../__helpers/shared/initPayloadE2ENoConfig.js'
import { ensureCompilationIsDone } from '../../__setup/e2e/ensureCompilationIsDone.js'
import { TEST_TIMEOUT_LONG } from '../../playwright.config.js'
import { imagesTransformedSlug, videosSlug, videosWithDraftsSlug } from '../shared.js'
import { createTestBucket } from '../test-utils.js'
import { draftOnlyTitlePrefix } from './collections/VideosWithDrafts.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

dotenv.config({ path: path.resolve(dirname, '../../plugin-cloud-storage/.env.emulated') })

const s3Host = new URL(process.env.S3_ENDPOINT!).host

// Above the 6 MiB test threshold, so it uses a session: three S3 parts of 5 + 5 + 1 MiB.
const FILE_SIZE = 11 * 1024 * 1024
const filePath = path.join(os.tmpdir(), `upload-sessions-e2e-${process.pid}.mp4`)
const imagePath = path.join(os.tmpdir(), `upload-sessions-e2e-${process.pid}.png`)

type UploadLog = {
  intentBodies: Record<string, unknown>[]
  /** Set once storage confirms all parts. A counted part PUT can still be sending. */
  isStorageComplete: boolean
  partPuts: number
  sessionBodies: Record<string, unknown>[]
  sessionCalls: string[]
}

test.describe('storage-s3 upload sessions E2E', () => {
  let serverURL: string
  let videosURL: AdminUrlUtil
  let videosWithDraftsURL: AdminUrlUtil
  let imagesURL: AdminUrlUtil

  test.beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    ;({ serverURL } = await initPayloadE2ENoConfig({ dirname }))
    videosURL = new AdminUrlUtil(serverURL, videosSlug)
    videosWithDraftsURL = new AdminUrlUtil(serverURL, videosWithDraftsSlug)
    imagesURL = new AdminUrlUtil(serverURL, imagesTransformedSlug)

    await createTestBucket()
    await writeFile(filePath, randomBytes(FILE_SIZE))
    // Noise does not compress, so this PNG is above the 6 MiB session threshold.
    await writeFile(
      imagePath,
      await sharp({
        create: {
          background: '#000',
          channels: 3,
          height: 2000,
          noise: { type: 'gaussian', mean: 128, sigma: 60 },
          width: 2000,
        },
      })
        .png({ compressionLevel: 0 })
        .toBuffer(),
    )

    const page = await browser.newPage()
    await ensureCompilationIsDone({ page, serverURL })
    await page.close()
  })

  test.afterAll(async () => {
    await rm(filePath, { force: true })
    await rm(imagePath, { force: true })
  })

  // Several tests hold S3 part uploads on purpose so they can act mid-upload.
  test.beforeEach(() => {
    test.setTimeout(TEST_TIMEOUT_LONG)
  })

  /**
   * Opens the create form in a fresh browser context with no leftover sessions. `holdParts`
   * stops every S3 part upload until the test calls `releaseParts`, so the upload is certain to
   * be running when the test acts.
   */
  const openCreateForm = async ({
    browser,
    holdParts = false,
    url = videosURL.create,
  }: {
    browser: import('@playwright/test').Browser
    holdParts?: boolean
    url?: string
  }): Promise<{
    context: BrowserContext
    log: UploadLog
    page: Page
    releaseParts: () => void
  }> => {
    const context = await browser.newContext()
    const page = await context.newPage()
    const log: UploadLog = {
      intentBodies: [],
      isStorageComplete: false,
      partPuts: 0,
      sessionBodies: [],
      sessionCalls: [],
    }
    let releaseParts = () => {}
    const partsReleased = holdParts
      ? new Promise<void>((resolve) => {
          releaseParts = resolve
        })
      : Promise.resolve()

    page.on('dialog', (dialog) => dialog.accept())
    page.on('request', (request) => {
      const url = new URL(request.url())

      if (url.pathname.startsWith('/api/payload-upload-sessions')) {
        log.sessionCalls.push(`${request.method()} ${url.pathname}`)

        if (request.method() === 'POST' && url.pathname === '/api/payload-upload-sessions') {
          log.sessionBodies.push(request.postDataJSON() as Record<string, unknown>)
        }

        if (request.method() === 'POST' && url.pathname.endsWith('/intent')) {
          log.intentBodies.push(request.postDataJSON() as Record<string, unknown>)
        }
      }
    })
    page.on('response', (response) => {
      const { pathname } = new URL(response.url())

      if (
        response.request().method() === 'POST' &&
        pathname.startsWith('/api/payload-upload-sessions') &&
        pathname.endsWith('/storage') &&
        response.ok()
      ) {
        log.isStorageComplete = true
      }
    })

    await page.route(
      (url) => url.host === s3Host,
      async (route) => {
        if (route.request().method() === 'PUT') {
          log.partPuts++
          await partsReleased
        }

        await route.continue()
      },
    )

    // The form shows only after auto-login, so the auth cookie is set for the cleanup requests.
    await gotoAndWaitForForm(page, videosURL.create)
    await deleteLeftoverSessions(context)
    await gotoAndWaitForForm(page, url)

    return { context, log, page, releaseParts }
  }

  /** Uses the context's request client, so the deletions stay out of the page's request log. */
  const deleteLeftoverSessions = async (context: BrowserContext) => {
    const sessionsURL = `${serverURL}/api/payload-upload-sessions`
    const response = await context.request.get(sessionsURL)

    expect(response.ok()).toBe(true)

    const { docs } = (await response.json()) as { docs: { id: string }[] }

    await Promise.all(docs.map(({ id }) => context.request.delete(`${sessionsURL}/${id}`)))
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
    await expect.poll(() => log.isStorageComplete).toBe(true)
    await page.getByLabel('Title').fill(title)
    await page.locator('#action-save').click()

    expect((await expectVideo(title)).filesize).toBe(FILE_SIZE)

    await context.close()
  })

  test('should wait for a running upload when saving, then save through the form', async ({
    browser,
  }) => {
    const { context, log, page, releaseParts } = await openCreateForm({ browser, holdParts: true })
    const title = `Saved mid-upload ${Date.now()}`

    await pickFile(page)
    await page.getByLabel('Title').fill(title)
    await expect.poll(() => log.partPuts).toBeGreaterThan(0)
    await page.locator('#action-save').click()
    await expect.poll(() => log.sessionCalls.some((call) => call.endsWith('/intent'))).toBe(true)
    releaseParts()

    const doc = await expectVideo(title)

    await expect(page).toHaveURL(new RegExp(`/${videosSlug}/${doc.id}`))
    expect(log.sessionCalls.some((call) => call.endsWith('/intent'))).toBe(true)
    expect(log.sessionCalls.some((call) => call.endsWith('/complete'))).toBe(false)

    await context.close()
  })

  test('should report invalid fields on Save without waiting for the upload', async ({
    browser,
  }) => {
    const { context, log, page, releaseParts } = await openCreateForm({ browser, holdParts: true })

    await pickFile(page)
    await expect.poll(() => log.partPuts).toBeGreaterThan(0)
    // Title is required; Save must fail now, not after the upload finishes.
    await page.locator('#action-save').click()

    await expect(page.locator('.field-error')).toBeVisible({ timeout: 2000 })
    expect(log.sessionCalls.some((call) => call.endsWith('/intent'))).toBe(false)
    releaseParts()

    // The upload keeps running, so fixing the field and saving again still works.
    const title = `Fixed after validation ${Date.now()}`

    await page.getByLabel('Title').fill(title)
    await page.locator('#action-save').click()

    expect((await expectVideo(title)).filesize).toBe(FILE_SIZE)

    await context.close()
  })

  test('should check the published status on Publish without waiting for the upload', async ({
    browser,
  }) => {
    const { context, log, page, releaseParts } = await openCreateForm({
      browser,
      holdParts: true,
      url: videosWithDraftsURL.create,
    })

    // Valid as a draft, invalid once published.
    const title = `${draftOnlyTitlePrefix} ${Date.now()}`

    // A background refresh validates the title as a draft, so one sent after Publish would clear
    // the error. Only the early check sends the `published` status that Publish adds.
    let refreshCount = 0
    const pageURL = page.url()

    page.on('request', (request) => {
      if (
        isFormStateRequest({ pageURL, request }) &&
        !(request.postData() ?? '').includes('"published"')
      ) {
        refreshCount += 1
      }
    })

    await pickFile(page)
    await expect.poll(() => log.partPuts).toBeGreaterThan(0)

    await page.getByLabel('Title').fill(title)
    await page.locator('#action-save').click()

    await expect(page.getByText('Please correct invalid fields.')).toBeVisible()
    await expect(page.locator('#field-error-title')).toBeVisible()
    expect(log.sessionCalls.some((call) => call.endsWith('/intent'))).toBe(false)

    // The onChange refresh starts 250 ms after a change. This counts requests sent, so a slow
    // reply cannot make the check pass early.
    const refreshCountWithErrors = refreshCount

    await page.waitForTimeout(1000)
    expect(refreshCount).toBe(refreshCountWithErrors)
    await expect(page.locator('#field-error-title')).toBeVisible()

    releaseParts()
    await context.close()
  })

  test('should finish the save in the background after navigating away', async ({ browser }) => {
    const { context, log, page, releaseParts } = await openCreateForm({ browser, holdParts: true })
    const title = `Saved in background ${Date.now()}`

    await pickFile(page)
    await page.getByLabel('Title').fill(title)
    await expect.poll(() => log.partPuts).toBeGreaterThan(0)
    await page.locator('#action-save').click()
    await expect.poll(() => log.sessionCalls.some((call) => call.endsWith('/intent'))).toBe(true)

    // Client-side navigation keeps the upload coordinator mounted.
    await page.getByRole('link', { name: 'Users' }).first().click()
    releaseParts()

    await expectVideo(title)
    await expect(page.getByText('Upload finished and the document was saved.')).toBeVisible()
    expect(log.sessionCalls.some((call) => call.endsWith('/complete'))).toBe(true)

    await context.close()
  })

  test('should offer to finish saving an upload that was never saved', async ({ browser }) => {
    const { context, log, page } = await openCreateForm({ browser })
    const title = `Finished from link ${Date.now()}`

    await pickFile(page)
    await expect.poll(() => log.isStorageComplete).toBe(true)
    await page.getByRole('link', { name: 'Users' }).first().click()
    await page.getByRole('button', { name: 'Leave anyway' }).click()
    await page.getByRole('button', { name: 'Finish saving' }).click()
    await expect(page).toHaveURL(/uploadSession=/)
    // The attached upload shows in the form, so it can be removed before saving.
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
    await expect.poll(() => log.isStorageComplete).toBe(true)

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
    await expect.poll(() => log.isStorageComplete).toBe(true)
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

  test('should lock the file name while the file uploads through a session', async ({
    browser,
  }) => {
    const { context, log, page } = await openCreateForm({ browser, holdParts: true })

    await pickFile(page)
    await expect.poll(() => log.partPuts).toBeGreaterThan(0)
    await expect(page.locator('#field-filemanager-filename')).toBeDisabled()

    await context.close()
  })

  test('should resume after a reload once the file is selected again', async ({ browser }) => {
    const { context, log, page, releaseParts } = await openCreateForm({ browser, holdParts: true })
    const title = `Recovered after reload ${Date.now()}`

    await pickFile(page)
    await page.getByLabel('Title').fill(title)
    await expect.poll(() => log.partPuts).toBeGreaterThan(0)
    await page.locator('#action-save').click()
    await expect.poll(() => log.sessionCalls.some((call) => call.endsWith('/intent'))).toBe(true)
    await page.reload()
    // Routes outlive the reload, so the resumed upload goes through the same gate.
    releaseParts()

    const [chooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      // The form's dropzone has a button with the same label, so target the recovery toast.
      page.locator('[data-sonner-toast]').getByRole('button', { name: 'Select a file' }).click(),
    ])

    await chooser.setFiles(filePath)

    await expectVideo(title)

    await context.close()
  })

  test('should still warn about unsaved changes elsewhere while a save continues in the background', async ({
    browser,
  }) => {
    const { context, log, page } = await openCreateForm({ browser, holdParts: true })

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
    let isSessionCreated = false
    let releaseCreation = () => {}
    const creationReleased = new Promise<void>((resolve) => {
      releaseCreation = resolve
    })

    await page.route('**/api/payload-upload-sessions', async (route) => {
      if (route.request().method() !== 'POST') {
        return route.fallback()
      }

      const response = await route.fetch()

      isSessionCreated = true
      await creationReleased
      await route.fulfill({ response }).catch(() => {})
    })

    await pickFile(page)
    await expect.poll(() => isSessionCreated).toBe(true)
    await page.getByRole('button', { name: 'Cancel', exact: true }).first().click()
    releaseCreation()

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
    const { context, log, page } = await openCreateForm({ browser, holdParts: true })

    await pickFile(page)
    await expect.poll(() => log.partPuts).toBeGreaterThan(0)

    const otherTab = await context.newPage()
    const sessionsListed = otherTab.waitForResponse(
      (response) =>
        response.request().method() === 'GET' &&
        new URL(response.url()).pathname === '/api/payload-upload-sessions',
    )

    await otherTab.goto(videosURL.list)
    await sessionsListed
    // After listing, recovery gives other tabs 300 ms to answer before it offers anything.
    await otherTab.waitForTimeout(1000)

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

  test('should save a background-finished upload in the locale it was edited in', async ({
    browser,
  }) => {
    const { context, log, page, releaseParts } = await openCreateForm({
      browser,
      holdParts: true,
      url: `${imagesURL.create}?locale=de`,
    })
    const caption = `Hallo ${Date.now()}`

    await page.locator('input[type="file"]').first().setInputFiles(imagePath)
    await page.getByLabel('Caption').fill(caption)
    await expect.poll(() => log.partPuts).toBeGreaterThan(0)
    await page.locator('#action-save').click()
    await expect.poll(() => log.sessionCalls.some((call) => call.endsWith('/intent'))).toBe(true)
    await page.getByRole('link', { name: 'Users' }).first().click()
    releaseParts()

    await expect(page.getByText('Upload finished and the document was saved.')).toBeVisible({
      timeout: 60_000,
    })
    expect(log.intentBodies.at(-1)).toMatchObject({ options: { locale: 'de' } })

    const findImage = async (locale: string) => {
      const response = await fetch(
        `${serverURL}/api/${imagesTransformedSlug}?locale=${locale}&fallback-locale=null&sort=-createdAt&limit=1`,
      )

      return ((await response.json()) as { docs: { caption?: string }[] }).docs[0]
    }

    expect((await findImage('de'))?.caption).toBe(caption)
    expect((await findImage('en'))?.caption).toBeUndefined()

    await context.close()
  })

  test('should resume a failed upload on Save instead of starting another session', async ({
    browser,
  }) => {
    const { context, log, page } = await openCreateForm({ browser })
    const title = `Resumed after failure ${Date.now()}`
    let isStorageDown = true

    // Registered after the logging route, so it runs first and can fail part uploads.
    await page.route(
      (url) => url.host === s3Host,
      (route) =>
        isStorageDown && route.request().method() === 'PUT'
          ? route.abort('internetdisconnected')
          : route.fallback(),
    )

    await pickFile(page)
    await expect(page.getByText('was interrupted')).toBeVisible({ timeout: 90_000 })

    isStorageDown = false
    await page.getByLabel('Title').fill(title)
    await page.locator('#action-save').click()

    expect((await expectVideo(title)).filesize).toBe(FILE_SIZE)
    expect(
      log.sessionCalls.filter((call) => call === 'POST /api/payload-upload-sessions'),
    ).toHaveLength(1)

    const unfinished = await page.evaluate(async () =>
      fetch('/api/payload-upload-sessions')
        .then((res) => res.json())
        .then(({ docs }) => docs.length),
    )

    expect(unfinished).toBe(0)

    await context.close()
  })

  test('should offer to finish saving after a failed save instead of saving it on its own later', async ({
    browser,
  }) => {
    const { context, log, page, releaseParts } = await openCreateForm({ browser, holdParts: true })
    const title = `Failed save ${Date.now()}`

    const isVideosCollectionURL = (url: URL) => url.pathname === `/api/${videosSlug}`

    await page.route(isVideosCollectionURL, (route) =>
      route.request().method() === 'POST'
        ? route.fulfill({ json: { errors: [{ message: 'Server unavailable' }] }, status: 500 })
        : route.fallback(),
    )

    await pickFile(page)
    await page.getByLabel('Title').fill(title)
    await expect.poll(() => log.partPuts).toBeGreaterThan(0)
    await page.locator('#action-save').click()
    await expect.poll(() => log.sessionCalls.some((call) => call.endsWith('/intent'))).toBe(true)
    releaseParts()

    // The upload finishes while the form is open, so the form saves and that save fails.
    await expect(page.getByText('Server unavailable')).toBeVisible({ timeout: 60_000 })
    expect(
      log.sessionCalls.some((call) => call.startsWith('DELETE ') && call.endsWith('/intent')),
    ).toBe(true)

    await page.unroute(isVideosCollectionURL)
    await page.getByRole('link', { name: 'Users' }).first().click()
    await page.getByRole('button', { name: 'Leave anyway' }).click()
    await expect(page.getByRole('button', { name: 'Finish saving' })).toBeVisible()

    // A new Admin load offers the same instead of saving the abandoned data.
    await page.goto(`${serverURL}/admin`)
    await expect(page.getByRole('button', { name: 'Finish saving' })).toBeVisible()
    expect(await findVideo(title)).toBeUndefined()

    await context.close()
  })

  test('should cancel the session when the file is removed', async ({ browser }) => {
    const { context, log, page } = await openCreateForm({ browser, holdParts: true })

    await pickFile(page)
    await expect
      .poll(() => log.sessionCalls.includes('POST /api/payload-upload-sessions'))
      .toBe(true)
    await page.getByRole('button', { name: 'Cancel', exact: true }).first().click()

    await expect.poll(() => log.sessionCalls.some((call) => call.startsWith('DELETE '))).toBe(true)

    await context.close()
  })
})
