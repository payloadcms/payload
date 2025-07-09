import type { Page } from '@playwright/test'
import type { Config } from 'payload-types.js'

import { expect, test } from '@playwright/test'
import path from 'path'
import { wait } from 'payload/shared'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../helpers/sdk/index.js'

import { devUser } from '../credentials.js'
import { ensureCompilationIsDone, initPageConsoleErrorCatch, saveDocAndAssert } from '../helpers.js'
import { AdminUrlUtil } from '../helpers/adminUrlUtil.js'
import { navigateToDoc } from '../helpers/e2e/navigateToDoc.js'
import { deletePreferences } from '../helpers/e2e/preferences.js'
import { initPayloadE2ENoConfig } from '../helpers/initPayloadE2ENoConfig.js'
import { reInitializeDB } from '../helpers/reInitializeDB.js'
import { waitForAutoSaveToRunAndComplete } from '../helpers/waitForAutoSaveToRunAndComplete.js'
import { POLL_TOPASS_TIMEOUT, TEST_TIMEOUT_LONG } from '../playwright.config.js'
import {
  ensureDeviceIsCentered,
  ensureDeviceIsLeftAligned,
  goToCollectionLivePreview,
  goToGlobalLivePreview,
  selectLivePreviewBreakpoint,
  selectLivePreviewZoom,
  toggleLivePreview,
} from './helpers.js'
import {
  collectionLevelConfigSlug,
  desktopBreakpoint,
  mobileBreakpoint,
  pagesSlug,
  renderedPageTitleID,
  ssrAutosavePagesSlug,
  ssrPagesSlug,
} from './shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const { beforeAll, beforeEach, describe } = test

describe('Live Preview', () => {
  let page: Page
  let serverURL: string

  let pagesURLUtil: AdminUrlUtil
  let ssrPagesURLUtil: AdminUrlUtil
  let ssrAutosavePostsURLUtil: AdminUrlUtil
  let payload: PayloadTestSDK<Config>
  let user: any

  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    ;({ serverURL, payload } = await initPayloadE2ENoConfig<Config>({ dirname }))

    pagesURLUtil = new AdminUrlUtil(serverURL, pagesSlug)
    ssrPagesURLUtil = new AdminUrlUtil(serverURL, ssrPagesSlug)
    ssrAutosavePostsURLUtil = new AdminUrlUtil(serverURL, ssrAutosavePagesSlug)

    const context = await browser.newContext()
    page = await context.newPage()

    user = await payload
      .login({
        collection: 'users',
        data: {
          email: devUser.email,
          password: devUser.password,
        },
      })
      ?.then((res) => res.user) // TODO: this type is wrong

    initPageConsoleErrorCatch(page)

    await ensureCompilationIsDone({ page, serverURL })
  })

  beforeEach(async () => {
    await reInitializeDB({
      serverURL,
      snapshotKey: 'livePreviewTest',
    })

    await ensureCompilationIsDone({ page, serverURL })
  })

  test('collection — renders toggler', async () => {
    await navigateToDoc(page, pagesURLUtil)

    const livePreviewToggler = page.locator('button#live-preview-toggler')

    await expect(() => expect(livePreviewToggler).toBeTruthy()).toPass({
      timeout: POLL_TOPASS_TIMEOUT,
    })
  })

  test('collection — does not render live preview when creating a new doc', async () => {
    await page.goto(pagesURLUtil.create)
    await expect(page.locator('button#live-preview-toggler')).toBeHidden()
    await expect(page.locator('iframe.live-preview-iframe')).toBeHidden()
  })

  test('collection - does not enable live preview is collections that are not configured', async () => {
    const usersURL = new AdminUrlUtil(serverURL, 'users')
    await navigateToDoc(page, usersURL)
    const toggler = page.locator('#live-preview-toggler')
    await expect(toggler).toBeHidden()
  })

  test('collection - respect collection-level live preview config', async () => {
    const collURL = new AdminUrlUtil(serverURL, collectionLevelConfigSlug)
    await page.goto(collURL.create)
    await page.locator('#field-title').fill('Collection Level Config')
    await saveDocAndAssert(page)
    await toggleLivePreview(page)
    await expect(page.locator('iframe.live-preview-iframe')).toBeVisible()
  })

  test('saves live preview state to preferences and loads it on next visit', async () => {
    await deletePreferences({
      payload,
      user,
      key: `collection-${pagesSlug}`,
    })

    await navigateToDoc(page, pagesURLUtil)

    const toggler = page.locator('button#live-preview-toggler')
    await expect(toggler).toBeVisible()

    await expect(toggler).not.toHaveClass(/live-preview-toggler--active/)
    await expect(page.locator('iframe.live-preview-iframe')).toBeHidden()

    await toggleLivePreview(page, {
      targetState: 'on',
    })

    await page.reload()

    await expect(toggler).toHaveClass(/live-preview-toggler--active/)
    await expect(page.locator('iframe.live-preview-iframe')).toBeVisible()

    await toggleLivePreview(page, {
      targetState: 'off',
    })

    await page.reload()

    await expect(toggler).not.toHaveClass(/live-preview-toggler--active/)
    await expect(page.locator('iframe.live-preview-iframe')).toBeHidden()
  })

  test('collection — renders iframe', async () => {
    await goToCollectionLivePreview(page, pagesURLUtil)
    const iframe = page.locator('iframe.live-preview-iframe')
    await expect(iframe).toBeVisible()
  })

  test('collection csr — re-renders iframe client-side when form state changes', async () => {
    await goToCollectionLivePreview(page, pagesURLUtil)

    const titleField = page.locator('#field-title')
    const frame = page.frameLocator('iframe.live-preview-iframe').first()

    await expect(titleField).toBeEnabled()

    const renderedPageTitleLocator = `#${renderedPageTitleID}`

    // Forces the test to wait for the Next.js route to render before we try editing a field
    await expect(() => expect(frame.locator(renderedPageTitleLocator)).toBeVisible()).toPass({
      timeout: POLL_TOPASS_TIMEOUT,
    })

    await expect(frame.locator(renderedPageTitleLocator)).toHaveText('For Testing: Home')

    const newTitleValue = 'Home (Edited)'

    await titleField.fill(newTitleValue)

    await expect(() =>
      expect(frame.locator(renderedPageTitleLocator)).toHaveText(`For Testing: ${newTitleValue}`),
    ).toPass({
      timeout: POLL_TOPASS_TIMEOUT,
    })

    await saveDocAndAssert(page)
  })

  test('collection csr — retains live preview connection after toggling off and on', async () => {
    await goToCollectionLivePreview(page, pagesURLUtil)

    const titleField = page.locator('#field-title')
    const frame = page.frameLocator('iframe.live-preview-iframe').first()

    await expect(titleField).toBeEnabled()

    const renderedPageTitleLocator = `#${renderedPageTitleID}`

    // Forces the test to wait for the Next.js route to render before we try editing a field
    await expect(() => expect(frame.locator(renderedPageTitleLocator)).toBeVisible()).toPass({
      timeout: POLL_TOPASS_TIMEOUT,
    })

    await expect(frame.locator(renderedPageTitleLocator)).toHaveText('For Testing: Home')

    const newTitleValue = 'Home (Edited)'

    await titleField.fill(newTitleValue)

    await expect(() =>
      expect(frame.locator(renderedPageTitleLocator)).toHaveText(`For Testing: ${newTitleValue}`),
    ).toPass({
      timeout: POLL_TOPASS_TIMEOUT,
    })

    await toggleLivePreview(page, {
      targetState: 'off',
    })

    await toggleLivePreview(page, {
      targetState: 'on',
    })

    // The iframe should still be showing the updated title
    await expect(frame.locator(renderedPageTitleLocator)).toHaveText(
      `For Testing: ${newTitleValue}`,
    )

    // make new changes and ensure they continue to be reflected in the iframe
    const newTitleValue2 = 'Home (Edited Again)'
    await titleField.fill(newTitleValue2)

    await expect(() =>
      expect(frame.locator(renderedPageTitleLocator)).toHaveText(`For Testing: ${newTitleValue2}`),
    ).toPass({
      timeout: POLL_TOPASS_TIMEOUT,
    })
  })

  test('collection ssr — re-render iframe when save is made', async () => {
    await goToCollectionLivePreview(page, ssrPagesURLUtil)

    const titleField = page.locator('#field-title')
    const frame = page.frameLocator('iframe.live-preview-iframe').first()

    await expect(titleField).toBeVisible()

    const renderedPageTitleLocator = `#${renderedPageTitleID}`

    // Forces the test to wait for the Next.js route to render before we try editing a field
    await expect(() => expect(frame.locator(renderedPageTitleLocator)).toBeVisible()).toPass({
      timeout: POLL_TOPASS_TIMEOUT,
    })

    await expect(frame.locator(renderedPageTitleLocator)).toHaveText('For Testing: SSR Home')

    const newTitleValue = 'SSR Home (Edited)'

    await titleField.fill(newTitleValue)

    await saveDocAndAssert(page)

    await expect(() =>
      expect(frame.locator(renderedPageTitleLocator)).toHaveText(`For Testing: ${newTitleValue}`),
    ).toPass({
      timeout: POLL_TOPASS_TIMEOUT,
    })
  })

  test('collection ssr — retains live preview connection after toggling off and on', async () => {
    await goToCollectionLivePreview(page, ssrPagesURLUtil)

    const titleField = page.locator('#field-title')
    const frame = page.frameLocator('iframe.live-preview-iframe').first()

    await expect(titleField).toBeEnabled()

    const renderedPageTitleLocator = `#${renderedPageTitleID}`

    // Forces the test to wait for the Next.js route to render before we try editing a field
    await expect(() => expect(frame.locator(renderedPageTitleLocator)).toBeVisible()).toPass({
      timeout: POLL_TOPASS_TIMEOUT,
    })

    await expect(frame.locator(renderedPageTitleLocator)).toHaveText('For Testing: SSR Home')

    const newTitleValue = 'SSR Home (Edited)'

    await titleField.fill(newTitleValue)

    await saveDocAndAssert(page)

    await expect(() =>
      expect(frame.locator(renderedPageTitleLocator)).toHaveText(`For Testing: ${newTitleValue}`),
    ).toPass({
      timeout: POLL_TOPASS_TIMEOUT,
    })

    await toggleLivePreview(page, {
      targetState: 'off',
    })

    await toggleLivePreview(page, {
      targetState: 'on',
    })

    // The iframe should still be showing the updated title
    await expect(frame.locator(renderedPageTitleLocator)).toHaveText(
      `For Testing: ${newTitleValue}`,
    )

    // make new changes and ensure they continue to be reflected in the iframe
    const newTitleValue2 = 'SSR Home (Edited Again)'
    await titleField.fill(newTitleValue2)
    await saveDocAndAssert(page)

    await expect(() =>
      expect(frame.locator(renderedPageTitleLocator)).toHaveText(`For Testing: ${newTitleValue2}`),
    ).toPass({
      timeout: POLL_TOPASS_TIMEOUT,
    })
  })

  test('collection ssr — re-render iframe when autosave is made', async () => {
    await goToCollectionLivePreview(page, ssrAutosavePostsURLUtil)

    const titleField = page.locator('#field-title')
    const frame = page.frameLocator('iframe.live-preview-iframe').first()

    await expect(titleField).toBeEnabled()

    const renderedPageTitleLocator = `#${renderedPageTitleID}`

    // Forces the test to wait for the Next.js route to render before we try editing a field
    await expect(() => expect(frame.locator(renderedPageTitleLocator)).toBeVisible()).toPass({
      timeout: POLL_TOPASS_TIMEOUT,
    })

    await expect(frame.locator(renderedPageTitleLocator)).toHaveText('For Testing: SSR Home')

    const newTitleValue = 'SSR Home (Edited)'
    // eslint-disable-next-line payload/no-wait-function
    await wait(1000)

    await titleField.clear()
    await titleField.pressSequentially(newTitleValue)

    // eslint-disable-next-line payload/no-wait-function
    await wait(1000)

    await waitForAutoSaveToRunAndComplete(page)

    await expect(() =>
      expect(frame.locator(renderedPageTitleLocator)).toHaveText(`For Testing: ${newTitleValue}`),
    ).toPass({
      timeout: POLL_TOPASS_TIMEOUT,
    })

    await saveDocAndAssert(page)
  })

  test('global — renders toggler', async () => {
    const global = new AdminUrlUtil(serverURL, 'header')
    await page.goto(global.global('header'))

    const livePreviewToggler = page.locator('button#live-preview-toggler')

    await expect(() => expect(livePreviewToggler).toBeTruthy()).toPass({
      timeout: POLL_TOPASS_TIMEOUT,
    })
  })

  test('global — renders iframe', async () => {
    await goToGlobalLivePreview(page, 'header', serverURL)
    const iframe = page.locator('iframe.live-preview-iframe')
    await expect(iframe).toBeVisible()
  })

  test('global — can edit fields', async () => {
    await goToGlobalLivePreview(page, 'header', serverURL)
    const field = page.locator('input#field-navItems__0__link__newTab') //field-navItems__0__link__newTab
    await expect(field).toBeVisible()
    await expect(field).toBeEnabled()
    await field.check()
    await saveDocAndAssert(page)
  })

  test('device — properly measures size', async () => {
    await page.goto(pagesURLUtil.create)
    await page.locator('#field-title').fill('Title 3')
    await page.locator('#field-slug').fill('slug-3')

    await saveDocAndAssert(page)
    await goToCollectionLivePreview(page, pagesURLUtil)

    const iframe = page.locator('iframe')

    // Measure the actual iframe size and compare it with the inputs rendered in the toolbar

    const iframeSize = await iframe.boundingBox()
    const iframeWidthInPx = iframeSize?.width
    const iframeHeightInPx = iframeSize?.height

    const widthInput = page.locator('.live-preview-toolbar input[name="live-preview-width"]')

    await expect(() => expect(widthInput).toBeTruthy()).toPass({ timeout: POLL_TOPASS_TIMEOUT })
    const heightInput = page.locator('.live-preview-toolbar input[name="live-preview-height"]')

    await expect(() => expect(heightInput).toBeTruthy()).toPass({ timeout: POLL_TOPASS_TIMEOUT })

    const widthInputValue = await widthInput.getAttribute('value')
    const width = parseInt(widthInputValue ?? '0')
    const heightInputValue = await heightInput.getAttribute('value')
    const height = parseInt(heightInputValue ?? '0')

    // Allow a tolerance of a couple of pixels
    const tolerance = 2

    await expect(() => expect(iframeWidthInPx).toBeLessThanOrEqual(width + tolerance)).toPass({
      timeout: POLL_TOPASS_TIMEOUT,
    })

    await expect(() => expect(iframeWidthInPx).toBeGreaterThanOrEqual(width - tolerance)).toPass({
      timeout: POLL_TOPASS_TIMEOUT,
    })

    await expect(() => expect(iframeHeightInPx).toBeLessThanOrEqual(height + tolerance)).toPass({
      timeout: POLL_TOPASS_TIMEOUT,
    })

    await expect(() => expect(iframeHeightInPx).toBeGreaterThanOrEqual(height - tolerance)).toPass({
      timeout: POLL_TOPASS_TIMEOUT,
    })
  })

  test('device — resizes to specified breakpoint', async () => {
    await page.goto(pagesURLUtil.create)
    await page.locator('#field-title').fill('Title 4')
    await page.locator('#field-slug').fill('slug-4')

    await saveDocAndAssert(page)
    await goToCollectionLivePreview(page, pagesURLUtil)

    await selectLivePreviewBreakpoint(page, mobileBreakpoint.label)

    // Measure the size of the iframe against the specified breakpoint
    const iframe = page.locator('iframe')

    await expect(() => expect(iframe).toBeTruthy()).toPass({
      timeout: POLL_TOPASS_TIMEOUT,
    })
    const iframeSize = await iframe.boundingBox()
    const iframeWidthInPx = iframeSize?.width
    const iframeHeightInPx = iframeSize?.height
    const tolerance = 2

    await expect(() =>
      expect(iframeWidthInPx).toBeLessThanOrEqual(mobileBreakpoint.width + tolerance),
    ).toPass({
      timeout: POLL_TOPASS_TIMEOUT,
    })

    await expect(() =>
      expect(iframeWidthInPx).toBeGreaterThanOrEqual(mobileBreakpoint.width - tolerance),
    ).toPass({
      timeout: POLL_TOPASS_TIMEOUT,
    })

    await expect(() =>
      expect(iframeHeightInPx).toBeLessThanOrEqual(mobileBreakpoint.height + tolerance),
    ).toPass({
      timeout: POLL_TOPASS_TIMEOUT,
    })

    await expect(() =>
      expect(iframeHeightInPx).toBeGreaterThanOrEqual(mobileBreakpoint.height - tolerance),
    ).toPass({
      timeout: POLL_TOPASS_TIMEOUT,
    })

    // Check that the inputs have been updated to reflect the new size
    const widthInput = page.locator('.live-preview-toolbar input[name="live-preview-width"]')

    await expect(() => expect(widthInput).toBeTruthy()).toPass({
      timeout: POLL_TOPASS_TIMEOUT,
    })

    const heightInput = page.locator('.live-preview-toolbar input[name="live-preview-height"]')

    await expect(() => expect(heightInput).toBeTruthy()).toPass({
      timeout: POLL_TOPASS_TIMEOUT,
    })

    const widthInputValue = await widthInput.getAttribute('value')
    const width = parseInt(widthInputValue ?? '0')

    await expect(() => expect(width).toBe(mobileBreakpoint.width)).toPass({
      timeout: POLL_TOPASS_TIMEOUT,
    })

    const heightInputValue = await heightInput.getAttribute('value')
    const height = parseInt(heightInputValue ?? '0')

    await expect(() => expect(height).toBe(mobileBreakpoint.height)).toPass({
      timeout: POLL_TOPASS_TIMEOUT,
    })
  })

  test('device — centers device when smaller than frame despite zoom', async () => {
    await goToCollectionLivePreview(page, pagesURLUtil)
    await selectLivePreviewBreakpoint(page, mobileBreakpoint.label)
    await ensureDeviceIsCentered(page)
    await selectLivePreviewZoom(page, '75%')
    await ensureDeviceIsCentered(page)
    await selectLivePreviewZoom(page, '50%')
    await ensureDeviceIsCentered(page)
    await selectLivePreviewZoom(page, '125%')
    await ensureDeviceIsCentered(page)
    await selectLivePreviewZoom(page, '200%')
    await ensureDeviceIsCentered(page)
    expect(true).toBeTruthy()
  })

  test('device — left-aligns device when larger than frame despite zoom', async () => {
    await goToCollectionLivePreview(page, pagesURLUtil)
    await selectLivePreviewBreakpoint(page, desktopBreakpoint.label)
    await ensureDeviceIsLeftAligned(page)
    await selectLivePreviewZoom(page, '75%')
    await ensureDeviceIsLeftAligned(page)
    await selectLivePreviewZoom(page, '50%')
    await ensureDeviceIsLeftAligned(page)
    await selectLivePreviewZoom(page, '125%')
    await ensureDeviceIsLeftAligned(page)
    await selectLivePreviewZoom(page, '200%')
    await ensureDeviceIsLeftAligned(page)
    expect(true).toBeTruthy()
  })
})
