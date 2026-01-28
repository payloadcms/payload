import type { Page } from '@playwright/test'
import type { Config } from 'payload-types.js'

import { expect, test } from '@playwright/test'
import path from 'path'
import { wait } from 'payload/shared'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../helpers/sdk/index.js'

import { devUser } from '../credentials.js'
import {
  ensureCompilationIsDone,
  initPageConsoleErrorCatch,
  saveDocAndAssert,
  // throttleTest,
} from '../helpers.js'
import { AdminUrlUtil } from '../helpers/adminUrlUtil.js'
import {
  selectLivePreviewBreakpoint,
  selectLivePreviewZoom,
  toggleLivePreview,
} from '../helpers/e2e/live-preview/index.js'
import { navigateToDoc, navigateToTrashedDoc } from '../helpers/e2e/navigateToDoc.js'
import { deletePreferences } from '../helpers/e2e/preferences.js'
import { runAxeScan } from '../helpers/e2e/runAxeScan.js'
import { waitForAutoSaveToRunAndComplete } from '../helpers/e2e/waitForAutoSaveToRunAndComplete.js'
import { initPayloadE2ENoConfig } from '../helpers/initPayloadE2ENoConfig.js'
import { reInitializeDB } from '../helpers/reInitializeDB.js'
import { POLL_TOPASS_TIMEOUT, TEST_TIMEOUT_LONG } from '../playwright.config.js'
import {
  ensureDeviceIsCentered,
  ensureDeviceIsLeftAligned,
  goToCollectionLivePreview,
  goToGlobalLivePreview,
  goToTrashedLivePreview,
} from './helpers.js'
import {
  collectionLevelConfigSlug,
  customLivePreviewSlug,
  customTogglerSlug,
  desktopBreakpoint,
  mobileBreakpoint,
  pagesSlug,
  postsSlug,
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
  let postsURLUtil: AdminUrlUtil
  let ssrPagesURLUtil: AdminUrlUtil
  let ssrAutosavePagesURLUtil: AdminUrlUtil
  let customLivePreviewURLUtil: AdminUrlUtil
  let customTogglerURLUtil: AdminUrlUtil
  let payload: PayloadTestSDK<Config>
  let user: any
  let context: any

  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    ;({ serverURL, payload } = await initPayloadE2ENoConfig<Config>({ dirname }))

    pagesURLUtil = new AdminUrlUtil(serverURL, pagesSlug)
    postsURLUtil = new AdminUrlUtil(serverURL, postsSlug)
    ssrPagesURLUtil = new AdminUrlUtil(serverURL, ssrPagesSlug)
    customLivePreviewURLUtil = new AdminUrlUtil(serverURL, customLivePreviewSlug)
    customTogglerURLUtil = new AdminUrlUtil(serverURL, customTogglerSlug)
    ssrAutosavePagesURLUtil = new AdminUrlUtil(serverURL, ssrAutosavePagesSlug)

    context = await browser.newContext()
    page = await context.newPage()

    initPageConsoleErrorCatch(page)
    await ensureCompilationIsDone({ page, serverURL })

    user = await payload
      .login({
        collection: 'users',
        data: {
          email: devUser.email,
          password: devUser.password,
        },
      })
      ?.then((res) => res.user) // TODO: this type is wrong
  })

  beforeEach(async () => {
    // await throttleTest({
    //   page,
    //   context,
    //   delay: 'Fast 4G',
    // })

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

  test('collection - does not enable live preview in collections that are not configured', async () => {
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
    await expect.poll(async () => iframe.getAttribute('src')).toMatch(/\/live-preview/)
  })

  test('collection — does not render live preview when url is null', async () => {
    const noURL = new AdminUrlUtil(serverURL, 'conditional-url')
    await page.goto(noURL.create)
    await page.locator('#field-title').fill('No URL')
    await saveDocAndAssert(page)

    // No toggler should render
    const toggler = page.locator('button#live-preview-toggler')
    await expect(toggler).toBeHidden()
    await expect(page.locator('iframe.live-preview-iframe')).toBeHidden()

    // Check the `enabled` field
    const enabledCheckbox = page.locator('#field-enabled')
    await enabledCheckbox.check()
    await saveDocAndAssert(page)

    // Toggler is present but not iframe
    await expect(toggler).toBeVisible()
    await expect(page.locator('iframe.live-preview-iframe')).toBeHidden()

    // Toggle the iframe back on, which will save to prefs
    // We need to explicitly test for this, as we don't want live preview to suddenly appear
    await toggleLivePreview(page, {
      targetState: 'on',
    })

    // Uncheck the `enabled` field
    await enabledCheckbox.uncheck()
    await saveDocAndAssert(page)

    // Toggler and iframe are gone
    await expect(toggler).toBeHidden()
    await expect(page.locator('iframe.live-preview-iframe')).toBeHidden()

    // Check the `enabled` field
    await enabledCheckbox.check()
    await saveDocAndAssert(page)

    // Toggler is present but still not iframe
    await expect(toggler).toBeVisible()
    await expect(page.locator('iframe.live-preview-iframe')).toBeHidden()
  })

  test('collection — does not render preview button when url is null', async () => {
    const noURL = new AdminUrlUtil(serverURL, 'conditional-url')
    await page.goto(noURL.create)
    await page.locator('#field-title').fill('No URL')
    await saveDocAndAssert(page)

    // No button should render
    const previewButton = page.locator('#preview-button')
    await expect(previewButton).toBeHidden()

    // Check the `enabled` field
    const enabledCheckbox = page.locator('#field-enabled')
    await enabledCheckbox.check()
    await saveDocAndAssert(page)

    // Button is present
    await expect(previewButton).toBeVisible()

    // Uncheck the `enabled` field
    await enabledCheckbox.uncheck()
    await saveDocAndAssert(page)

    // Button is gone
    await expect(previewButton).toBeHidden()
  })

  test('collection — retains static URL across edits', async () => {
    const util = new AdminUrlUtil(serverURL, 'static-url')
    await page.goto(util.create)
    await saveDocAndAssert(page)
    await toggleLivePreview(page, { targetState: 'on' })

    const iframe = page.locator('iframe.live-preview-iframe')
    await expect.poll(async () => iframe.getAttribute('src')).toMatch(/\/live-preview\/static/)

    const titleField = page.locator('#field-title')
    await titleField.fill('New Title')
    await saveDocAndAssert(page)
    await expect.poll(async () => iframe.getAttribute('src')).toMatch(/\/live-preview\/static/)
  })

  test('collection csr — iframe reflects form state on change', async () => {
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

  test('collection csr — retains live preview connection after iframe src has changed', async () => {
    const initialTitle = 'This is a test'

    const testDoc = await payload.create({
      collection: pagesSlug,
      data: {
        title: initialTitle,
        slug: 'csr-test',
        hero: {
          type: 'none',
        },
      },
    })

    await page.goto(pagesURLUtil.edit(testDoc.id))

    await toggleLivePreview(page, {
      targetState: 'on',
    })

    const titleField = page.locator('#field-title')
    const iframe = page.locator('iframe.live-preview-iframe')

    await expect(iframe).toBeVisible()
    const pattern1 = new RegExp(`/live-preview/${testDoc.slug}`)
    await expect.poll(async () => iframe.getAttribute('src')).toMatch(pattern1)

    const slugField = page.locator('#field-slug')
    const newSlug = `${testDoc.slug}-2`
    await slugField.fill(newSlug)
    await saveDocAndAssert(page)

    // expect the iframe to have a new src that reflects the updated slug
    await expect(iframe).toBeVisible()
    const pattern2 = new RegExp(`/live-preview/${newSlug}`)
    await expect.poll(async () => iframe.getAttribute('src')).toMatch(pattern2)

    const frame = page.frameLocator('iframe.live-preview-iframe').first()

    const renderedPageTitleLocator = `#${renderedPageTitleID}`

    await expect(() =>
      expect(frame.locator(renderedPageTitleLocator)).toHaveText(`For Testing: ${initialTitle}`),
    ).toPass({
      timeout: POLL_TOPASS_TIMEOUT,
    })

    // edit the title and check the iframe updates
    const newTitle = `${initialTitle} (Edited)`
    await titleField.fill(newTitle)

    await expect(() =>
      expect(frame.locator(renderedPageTitleLocator)).toHaveText(`For Testing: ${newTitle}`),
    ).toPass({
      timeout: POLL_TOPASS_TIMEOUT,
    })
  })

  test('collection ssr — iframe reflects form state on save', async () => {
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

    await toggleLivePreview(page)

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

  test('collection ssr — retains live preview connection after iframe src has changed', async () => {
    const initialTitle = 'This is a test'

    const testDoc = await payload.create({
      collection: ssrAutosavePagesSlug,
      data: {
        title: initialTitle,
        slug: 'ssr-test',
        hero: {
          type: 'none',
        },
      },
    })

    await page.goto(ssrAutosavePagesURLUtil.edit(testDoc.id))

    await toggleLivePreview(page, {
      targetState: 'on',
    })

    const titleField = page.locator('#field-title')
    const iframe = page.locator('iframe.live-preview-iframe')

    const slugField = page.locator('#field-slug')
    const newSlug = `${testDoc.slug}-2`
    await slugField.fill(newSlug)
    await waitForAutoSaveToRunAndComplete(page)

    // expect the iframe to have a new src that reflects the updated slug
    await expect(iframe).toBeVisible()
    const pattern = new RegExp(`/live-preview/${ssrAutosavePagesSlug}/${newSlug}`)
    await expect.poll(async () => iframe.getAttribute('src')).toMatch(pattern)

    const frame = page.frameLocator('iframe.live-preview-iframe').first()

    const renderedPageTitleLocator = `#${renderedPageTitleID}`

    await expect(() =>
      expect(frame.locator(renderedPageTitleLocator)).toHaveText(`For Testing: ${initialTitle}`),
    ).toPass({
      timeout: POLL_TOPASS_TIMEOUT,
    })

    // edit the title and check the iframe updates
    const newTitle = `${initialTitle} (Edited)`
    await titleField.fill(newTitle)
    await waitForAutoSaveToRunAndComplete(page)

    await expect(() =>
      expect(frame.locator(renderedPageTitleLocator)).toHaveText(`For Testing: ${newTitle}`),
    ).toPass({
      timeout: POLL_TOPASS_TIMEOUT,
    })
  })

  test('collection ssr — iframe reflects form state on autosave', async () => {
    await goToCollectionLivePreview(page, ssrAutosavePagesURLUtil)

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

  test('trash — has live-preview toggle', async () => {
    await navigateToTrashedDoc(page, postsURLUtil)

    const livePreviewToggler = page.locator('button#live-preview-toggler')

    await expect(() => expect(livePreviewToggler).toBeTruthy()).toPass({
      timeout: POLL_TOPASS_TIMEOUT,
    })
  })

  test('trash - renders iframe', async () => {
    await goToTrashedLivePreview(page, postsURLUtil)
    const iframe = page.locator('iframe.live-preview-iframe')
    await expect(iframe).toBeVisible()
  })

  test('trash - fields should stay read-only', async () => {
    await goToTrashedLivePreview(page, postsURLUtil)

    const titleField = page.locator('#field-title')
    await expect(titleField).toBeDisabled()
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

  test('can open a custom live-preview', async () => {
    await goToCollectionLivePreview(page, customLivePreviewURLUtil)

    const customLivePreview = page.locator('.custom-live-preview')

    await expect(customLivePreview).toContainText('Custom live preview being rendered')
  })

  describe('A11y', () => {
    test.fixme(
      'Live preview and edit view should have no accessibility violations',
      async ({}, testInfo) => {
        await goToCollectionLivePreview(page, pagesURLUtil)
        const iframe = page.locator('iframe.live-preview-iframe')
        await expect(iframe).toBeVisible()
        await expect.poll(async () => iframe.getAttribute('src')).toMatch(/\/live-preview/)

        const scanResults = await runAxeScan({
          page,
          testInfo,
          include: ['.collection-edit'],
          exclude: ['.document-fields__main'], // we don't need to test fields here
        })

        expect(scanResults.violations.length).toBe(0)
      },
    )
  })

  test('renders custom live preview toggler', async () => {
    await navigateToDoc(page, customTogglerURLUtil)

    const customToggler = page.locator('#custom-live-preview-toggler')

    await expect(customToggler).toBeVisible()
    await expect(customToggler).toContainText('🟢 Enter Custom Live Preview')

    // Click the custom toggler to enable live preview
    await customToggler.click()

    await expect(customToggler).toContainText('🔴 Exit Custom Live Preview')
    await expect(page.locator('iframe.live-preview-iframe')).toBeVisible()

    // Click again to disable
    await customToggler.click()

    await expect(customToggler).toContainText('🟢 Enter Custom Live Preview')
    await expect(page.locator('iframe.live-preview-iframe')).toBeHidden()
  })
})
