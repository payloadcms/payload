import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import { readFileSync, statSync } from 'fs'
import path from 'path'
import { wait } from 'payload/shared'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../__helpers/shared/sdk/index.js'
import type { TestFileServer } from '../__helpers/shared/startTestFileServer.js'
import type { Config } from './payload-types.js'

import {
  getColumnSelectorItem,
  openListColumns,
  toggleColumn,
} from '../__helpers/e2e/columns/index.js'
import { openListFilters } from '../__helpers/e2e/filters/index.js'
import {
  closeAllToasts,
  ensureCompilationIsDone,
  exactText,
  gotoAndWaitForForm,
  initPageConsoleErrorCatch,
  saveDocAndAssert,
  waitForFormReady,
} from '../__helpers/e2e/helpers.js'
import { getSelectMenu } from '../__helpers/e2e/selectInput.js'
import { openDocDrawer } from '../__helpers/e2e/toggleDocDrawer.js'
import { AdminUrlUtil } from '../__helpers/shared/adminUrlUtil.js'
import { assertToastErrors } from '../__helpers/shared/assertToastErrors.js'
import { reInitializeDB } from '../__helpers/shared/clearAndSeed/reInitializeDB.js'
import { initPayloadE2ENoConfig } from '../__helpers/shared/initPayloadE2ENoConfig.js'
import { RESTClient } from '../__helpers/shared/rest.js'
import { startTestFileServer } from '../__helpers/shared/startTestFileServer.js'
import { POLL_TOPASS_TIMEOUT, TEST_TIMEOUT_LONG } from '../playwright.config.js'
import {
  adminThumbnailFunctionSlug,
  adminThumbnailSizeSlug,
  adminThumbnailWithSearchQueries,
  adminUploadControlSlug,
  adminUploadFilePreviewMapSlug,
  adminUploadFilePreviewSingleSlug,
  animatedTypeMedia,
  audioSlug,
  bulkUploadsHookErrorSlug,
  bulkUploadsSlug,
  constructorOptionsSlug,
  customFileNameMediaSlug,
  customUploadFieldSlug,
  fileMimeTypeSlug,
  filePreviewSlug,
  focalOnlySlug,
  hideFileInputOnCreateSlug,
  imageSizesOnlySlug,
  listViewPreviewSlug,
  mediaSlug,
  mediaWithFieldsSlug,
  mediaWithImageSizeAdminPropsSlug,
  mediaWithoutCacheTagsSlug,
  mediaWithoutDeleteAccessSlug,
  noFilesRequiredSlug,
  relationPreviewSlug,
  relationSlug,
  relationToNoFilesRequiredSlug,
  svgOnlySlug,
  threeDimensionalSlug,
  withMetadataSlug,
  withOnlyJPEGMetadataSlug,
  withoutEnlargeSlug,
  withoutMetadataSlug,
} from './shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

/**
 * Regex matcher for date cache tags.
 *
 * @example it will match `?2022-01-01T00%3A00%3A00.000Z` (`?2022-01-01T00:00:00.000Z` encoded)
 */
const cacheTagPattern = /\?\d{4}-\d{2}-\d{2}T\d{2}%3A\d{2}%3A\d{2}\.\d{3}Z/

const adminThumbnailFunctionSrcPattern = new RegExp(
  String.raw`^https://raw\.githubusercontent\.com/payloadcms/website/refs/heads/main/public/images/universal-truth\.jpg` +
    cacheTagPattern.source +
    '$',
)

const { afterAll, beforeAll, beforeEach, describe } = test

let payload: PayloadTestSDK<Config>
let client: RESTClient
let serverURL: string
let mediaURL: AdminUrlUtil
let animatedTypeMediaURL: AdminUrlUtil
let audioURL: AdminUrlUtil
let relationURL: AdminUrlUtil
let adminUploadControlURL: AdminUrlUtil
let adminThumbnailSizeURL: AdminUrlUtil
let adminThumbnailFunctionURL: AdminUrlUtil
let adminThumbnailWithSearchQueriesURL: AdminUrlUtil
let listViewPreviewURL: AdminUrlUtil
let mediaWithoutCacheTagsSlugURL: AdminUrlUtil
let focalOnlyURL: AdminUrlUtil
let imageSizesOnlyURL: AdminUrlUtil
let withMetadataURL: AdminUrlUtil
let withoutMetadataURL: AdminUrlUtil
let withOnlyJPEGMetadataURL: AdminUrlUtil
let relationPreviewURL: AdminUrlUtil
let customFileNameURL: AdminUrlUtil
let uploadsOne: AdminUrlUtil
let uploadsTwo: AdminUrlUtil
let customUploadFieldURL: AdminUrlUtil
let hideFileInputOnCreateURL: AdminUrlUtil
let bestFitURL: AdminUrlUtil
let withoutEnlargementResizeOptionsURL: AdminUrlUtil
let threeDimensionalURL: AdminUrlUtil
let constructorOptionsURL: AdminUrlUtil
let consoleErrorsFromPage: string[] = []
let collectErrorsFromPage: () => boolean
let stopCollectingErrorsFromPage: () => boolean
let bulkUploadsURL: AdminUrlUtil
let bulkUploadsHookErrorURL: AdminUrlUtil
let fileMimeTypeURL: AdminUrlUtil
let svgOnlyURL: AdminUrlUtil
let mediaWithoutDeleteAccessURL: AdminUrlUtil
let mediaWithImageSizeAdminPropsURL: AdminUrlUtil
let noFilesRequiredURL: AdminUrlUtil
let relationToNoFilesRequiredURL: AdminUrlUtil
let adminUploadFilePreviewSingleURL: AdminUrlUtil
let adminUploadFilePreviewMapURL: AdminUrlUtil
let filePreviewURL: AdminUrlUtil
let mediaWithFieldsURL: AdminUrlUtil

describe('Uploads', () => {
  let page: Page

  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    ;({ payload, serverURL } = await initPayloadE2ENoConfig<Config>({ dirname }))

    mediaURL = new AdminUrlUtil(serverURL, mediaSlug)
    animatedTypeMediaURL = new AdminUrlUtil(serverURL, animatedTypeMedia)
    audioURL = new AdminUrlUtil(serverURL, audioSlug)
    relationURL = new AdminUrlUtil(serverURL, relationSlug)
    adminUploadControlURL = new AdminUrlUtil(serverURL, adminUploadControlSlug)
    adminThumbnailSizeURL = new AdminUrlUtil(serverURL, adminThumbnailSizeSlug)
    adminThumbnailFunctionURL = new AdminUrlUtil(serverURL, adminThumbnailFunctionSlug)
    adminThumbnailWithSearchQueriesURL = new AdminUrlUtil(
      serverURL,
      adminThumbnailWithSearchQueries,
    )
    listViewPreviewURL = new AdminUrlUtil(serverURL, listViewPreviewSlug)
    mediaWithoutCacheTagsSlugURL = new AdminUrlUtil(serverURL, mediaWithoutCacheTagsSlug)
    focalOnlyURL = new AdminUrlUtil(serverURL, focalOnlySlug)
    imageSizesOnlyURL = new AdminUrlUtil(serverURL, imageSizesOnlySlug)
    withMetadataURL = new AdminUrlUtil(serverURL, withMetadataSlug)
    withoutMetadataURL = new AdminUrlUtil(serverURL, withoutMetadataSlug)
    withOnlyJPEGMetadataURL = new AdminUrlUtil(serverURL, withOnlyJPEGMetadataSlug)
    relationPreviewURL = new AdminUrlUtil(serverURL, relationPreviewSlug)
    customFileNameURL = new AdminUrlUtil(serverURL, customFileNameMediaSlug)
    uploadsOne = new AdminUrlUtil(serverURL, 'uploads-1')
    uploadsTwo = new AdminUrlUtil(serverURL, 'uploads-2')
    customUploadFieldURL = new AdminUrlUtil(serverURL, customUploadFieldSlug)
    hideFileInputOnCreateURL = new AdminUrlUtil(serverURL, hideFileInputOnCreateSlug)
    bestFitURL = new AdminUrlUtil(serverURL, 'best-fit')
    withoutEnlargementResizeOptionsURL = new AdminUrlUtil(serverURL, withoutEnlargeSlug)
    threeDimensionalURL = new AdminUrlUtil(serverURL, threeDimensionalSlug)
    constructorOptionsURL = new AdminUrlUtil(serverURL, constructorOptionsSlug)
    bulkUploadsURL = new AdminUrlUtil(serverURL, bulkUploadsSlug)
    bulkUploadsHookErrorURL = new AdminUrlUtil(serverURL, bulkUploadsHookErrorSlug)
    fileMimeTypeURL = new AdminUrlUtil(serverURL, fileMimeTypeSlug)
    svgOnlyURL = new AdminUrlUtil(serverURL, svgOnlySlug)
    mediaWithoutDeleteAccessURL = new AdminUrlUtil(serverURL, mediaWithoutDeleteAccessSlug)
    mediaWithImageSizeAdminPropsURL = new AdminUrlUtil(serverURL, mediaWithImageSizeAdminPropsSlug)
    noFilesRequiredURL = new AdminUrlUtil(serverURL, noFilesRequiredSlug)
    relationToNoFilesRequiredURL = new AdminUrlUtil(serverURL, relationToNoFilesRequiredSlug)
    adminUploadFilePreviewSingleURL = new AdminUrlUtil(serverURL, adminUploadFilePreviewSingleSlug)
    adminUploadFilePreviewMapURL = new AdminUrlUtil(serverURL, adminUploadFilePreviewMapSlug)
    filePreviewURL = new AdminUrlUtil(serverURL, filePreviewSlug)
    mediaWithFieldsURL = new AdminUrlUtil(serverURL, mediaWithFieldsSlug)

    const context = await browser.newContext()
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    page = await context.newPage()

    const { collectErrors, consoleErrors, stopCollectingErrors } = initPageConsoleErrorCatch(page, {
      ignoreCORS: true,
    })

    consoleErrorsFromPage = consoleErrors
    collectErrorsFromPage = collectErrors
    stopCollectingErrorsFromPage = stopCollectingErrors

    await ensureCompilationIsDone({ page, serverURL })
  })

  beforeEach(async () => {
    await reInitializeDB({
      serverURL,
      snapshotKey: 'uploadsTest',
      uploadsDir: [
        path.resolve(dirname, './uploads'),
        path.resolve(dirname, './media'),
        path.resolve(dirname, './media-gif'),
        path.resolve(dirname, './no-image-sizes'),
        path.resolve(dirname, './object-fit'),
        path.resolve(dirname, './custom-file-name-media'),
        path.resolve(dirname, './focal-only'),
        path.resolve(dirname, './crop-only'),
        path.resolve(dirname, './optional'),
        path.resolve(dirname, './required'),
        path.resolve(dirname, './focal-no-sizes'),
        path.resolve(dirname, './svg-only'),
        path.resolve(dirname, './media-trim'),
        path.resolve(dirname, './image-sizes-only'),
        path.resolve(dirname, './versions'),
        path.resolve(dirname, './media-with-relation-preview'),
        path.resolve(dirname, './with-meta-data'),
        path.resolve(dirname, './with-any-image-type'),
        path.resolve(dirname, './with-only-jpeg-meta-data'),
        path.resolve(dirname, './without-meta-data'),
        path.resolve(dirname, './collections/Upload1/uploads'),
        path.resolve(dirname, './collections/Upload2/uploads'),
        path.resolve(dirname, './collections/AdminThumbnailFunction/test/uploads'),
        path.resolve(dirname, './collections/AdminThumbnailSize/test/uploads'),
        path.resolve(dirname, './collections/AdminThumbnailWithSearchQueries/test/uploads'),
        path.resolve(dirname, './collections/AdminUploadControl/test/uploads'),
      ],
    })

    if (client) {
      await client.logout()
    }
    client = new RESTClient({ defaultSlug: 'users', serverURL })
    await client.login()

    await ensureCompilationIsDone({ page, serverURL })
  })

  test('should show upload filename in upload collection list', async () => {
    await page.goto(mediaURL.list)
    const audioUpload = page.locator('tbody .cell-filename', { hasText: exactText('audio.mp3') })
    await expect(audioUpload).toBeVisible()

    const imageUpload = page.locator('tbody .cell-filename', { hasText: exactText('image.png') })
    await expect(imageUpload).toBeVisible()
  })

  test('should see upload filename in relation list', async () => {
    await page.goto(relationURL.list)
    const field = page.locator('.cell-image')

    await expect(field).toContainText('image.png')
  })

  test('should see upload versioned filename in relation list', async () => {
    await page.goto(relationURL.list)
    const field = page.locator('.cell-versionedImage')

    await expect(field).toContainText('image')
  })

  test('should update upload field after editing relationship in document drawer', async () => {
    const relationDoc = (
      await payload.find({
        collection: relationSlug,
        depth: 0,
        limit: 1,
        pagination: false,
      })
    ).docs[0]

    await page.goto(relationURL.edit(relationDoc!.id))

    const filename = page.locator('.upload-relationship-details__filename a').nth(0)
    await expect(filename).toContainText('image.png')

    await page.locator('.field-type.upload').nth(0).getByRole('button', { name: 'Edit' }).click()

    // Replace the file from within the document drawer's file manager
    await page.locator('.doc-drawer .file-toolbar__filename-btn').click()
    await page.locator('.popup-button-list__button', { hasText: 'Replace file' }).click()

    await page.setInputFiles(
      '.doc-drawer .file-manager input[type="file"]',
      path.join(dirname, 'test-image.jpg'),
    )
    await saveDocAndAssert(page, '.doc-drawer button#action-save')

    await page.locator('.doc-drawer__header-close').click()

    await expect(filename).toContainText('test-image.png')
  })

  test('should preserve collection when bulk selecting polymorphic uploads', async () => {
    await page.goto(uploadsTwo.create)
    await page.locator('#field-prefix').fill('video')
    await page.locator('#field-title').fill('Polymorphic upload two')
    await page.setInputFiles('input[type="file"]', path.resolve(dirname, './image.png'))
    await saveDocAndAssert(page)

    const uploadTwoID = page.url().split('/').pop()
    const relationDoc = await payload.create({
      collection: relationSlug,
      data: {},
    })

    await page.goto(relationURL.edit(relationDoc.id))
    await openDocDrawer({ page, selector: '#field-polymorphicUploads .upload__listToggler' })

    const listDrawer = page.locator('[id^=list-drawer_1_]')
    await expect(listDrawer).toBeVisible()

    await listDrawer.locator('.list-header__select-collection').click()
    await page.getByText('Uploads 2', { exact: true }).click()
    await expect(
      listDrawer.locator('.cell-title', { hasText: 'Polymorphic upload two' }),
    ).toBeVisible()

    await listDrawer
      .locator('tr', { hasText: 'Polymorphic upload two' })
      .locator('.select-row__checkbox')
      .click()
    await listDrawer.getByRole('button', { name: 'Select 1' }).click()

    await saveDocAndAssert(page)

    const updatedRelationDoc = (
      await payload.find({
        collection: relationSlug,
        depth: 0,
        where: {
          id: {
            equals: relationDoc.id,
          },
        },
      })
    ).docs[0] as any

    expect(updatedRelationDoc.polymorphicUploads).toEqual([
      {
        relationTo: 'uploads-2',
        value: uploadTwoID,
      },
    ])
    expect(updatedRelationDoc.polymorphicUploads).not.toEqual([
      {
        relationTo: 'uploads-1',
        value: uploadTwoID,
      },
    ])
  })

  test('should copy the file url field to the clipboard', async () => {
    const mediaDoc = (
      await payload.find({
        collection: mediaSlug,
        depth: 0,
        limit: 1,
        pagination: false,
      })
    ).docs[0]

    await page.goto(mediaURL.edit(mediaDoc!.id))
    await page.locator('.copy-to-clipboard').click()
    const clipbaordContent = await page.evaluate(() => navigator.clipboard.readText())
    expect(clipbaordContent).toBe(mediaDoc?.url)
  })

  test('should show side-by-side layout for upload collection document with file', async () => {
    const mediaDoc = (
      await payload.find({
        collection: mediaSlug,
        depth: 0,
        pagination: false,
        where: {
          mimeType: {
            equals: 'image/png',
          },
        },
      })
    ).docs[0]

    await page.goto(mediaURL.edit(mediaDoc!.id))
    await waitForFormReady(page)

    await expect(page.locator('.collection-edit__main-wrapper--has-upload-panel')).toBeVisible()
    await expect(page.locator('.file-manager')).toBeVisible()
    await expect(page.locator('.file-preview')).toBeVisible()
    await expect(page.locator('.mini-carousel')).toBeVisible()
  })

  test('should open the current asset in a new tab from the upload toolbar', async () => {
    const mediaDoc = (
      await payload.find({
        collection: mediaSlug,
        depth: 0,
        limit: 1,
        pagination: false,
      })
    ).docs[0]

    await page.goto(mediaURL.edit(mediaDoc!.id))
    await waitForFormReady(page)

    const previewLink = page.locator('.file-toolbar__right a[target="_blank"]')

    await expect(previewLink).toBeVisible()
    await expect(previewLink).toHaveAttribute('rel', 'noopener noreferrer')
    // Opens the current asset (the served media file) in a new tab
    await expect(previewLink).toHaveAttribute('href', /\/api\/media\/file\//)
  })

  test('should show upload dropzone in right panel for new upload collection document', async () => {
    await page.goto(mediaURL.create)
    await waitForFormReady(page)

    await expect(page.locator('.collection-edit__main-wrapper--has-upload-panel')).toBeVisible()
    await expect(page.locator('.file-manager .dropzone')).toBeVisible()
  })

  test('should switch active thumbnail when clicking mini carousel item', async () => {
    const mediaDoc = (
      await payload.find({
        collection: mediaSlug,
        depth: 0,
        limit: 1,
        pagination: false,
        sort: 'createdAt',
        where: {
          mimeType: { contains: 'image/' },
        },
      })
    ).docs[0]

    await page.goto(mediaURL.edit(mediaDoc!.id))
    await waitForFormReady(page)

    const carouselItems = page.locator('.mini-carousel__item')

    await expect(carouselItems.first()).toHaveClass(/mini-carousel__item--active/)

    // Fail loudly if a future imageSizes change leaves fewer than two carousel items, rather than
    // throwing an opaque "element not found" on the nth(1) click below.
    expect(await carouselItems.count()).toBeGreaterThanOrEqual(2)

    await carouselItems.nth(1).click()

    await expect(carouselItems.nth(1)).toHaveClass(/mini-carousel__item--active/)
    await expect(carouselItems.first()).not.toHaveClass(/mini-carousel__item--active/)
  })

  test('should render the many-fields side panel alongside the upload preview for media-with-fields', async () => {
    const mediaWithFieldsDoc = (
      await payload.find({
        collection: mediaWithFieldsSlug,
        depth: 0,
        limit: 1,
        pagination: false,
        sort: 'createdAt',
        where: {
          mimeType: { contains: 'image/' },
        },
      })
    ).docs[0]

    await page.goto(mediaWithFieldsURL.edit(mediaWithFieldsDoc!.id))
    await waitForFormReady(page)

    await expect(page.locator('.collection-edit__main-wrapper--has-upload-panel')).toBeVisible()
    await expect(page.locator('.file-manager')).toBeVisible()
    await expect(page.locator('.file-preview')).toBeVisible()

    // The many configured imageSizes should surface as carousel items alongside the preview.
    const carouselItems = page.locator('.mini-carousel__item')
    await expect(carouselItems.first()).toBeVisible()
    expect(await carouselItems.count()).toBeGreaterThanOrEqual(2)

    // The collection's many fields should render in the side panel alongside the upload preview.
    await expect(page.locator('#field-title')).toBeVisible()
    await expect(page.locator('#field-description')).toBeVisible()
    await expect(page.locator('#field-category')).toBeVisible()
  })

  test('should render sidebar-positioned fields inline for upload collections', async () => {
    const mediaWithFieldsDoc = (
      await payload.find({
        collection: mediaWithFieldsSlug,
        depth: 0,
        limit: 1,
        pagination: false,
        sort: 'createdAt',
        where: {
          mimeType: { contains: 'image/' },
        },
      })
    ).docs[0]

    await page.goto(mediaWithFieldsURL.edit(mediaWithFieldsDoc!.id))
    await waitForFormReady(page)

    // Upload collections collapse the field sidebar inline via the force-sidebar-wrap layout.
    await expect(page.locator('.document-fields--force-sidebar-wrap')).toBeVisible()

    // The photographer field uses admin.position: 'sidebar' but renders inline within the wrapped sidebar.
    await expect(page.locator('#field-photographer')).toBeVisible()
  })

  test('should create file upload', async () => {
    await gotoAndWaitForForm(page, mediaURL.create)
    await page.setInputFiles('input[type="file"]', path.resolve(dirname, './image.png'))

    const filename = page.locator('#field-filemanager-filename')

    await expect(filename).toHaveValue('image.png')

    await saveDocAndAssert(page)
  })

  test('should show a tooltip for the remove button on an unsaved selected file', async () => {
    await gotoAndWaitForForm(page, mediaURL.create)
    await page.setInputFiles('input[type="file"]', path.resolve(dirname, './image.png'))

    const removeButton = page.locator('.file-manager__remove')
    await expect(removeButton).toBeVisible()
    await removeButton.hover()

    await expect(page.locator('.tooltip--show', { hasText: exactText('Cancel') })).toBeVisible()
  })

  test('should remove remote URL button if pasteURL is false', async () => {
    // pasteURL option is set to false in the media collection
    await page.goto(mediaURL.create)

    const pasteURLButton = page.locator('.file-manager__upload button', {
      hasText: 'Paste URL',
    })
    await expect(pasteURLButton).toBeHidden()
  })

  test('should properly create IOS file upload', async () => {
    await gotoAndWaitForForm(page, mediaURL.create)

    await page.setInputFiles('input[type="file"]', path.resolve(dirname, './ios-image.jpeg'))

    const filename = page.locator('#field-filemanager-filename')

    await expect(filename).toHaveValue('ios-image.jpeg')

    await saveDocAndAssert(page)
  })

  test('should properly convert avif image to png', async () => {
    await gotoAndWaitForForm(page, mediaURL.create)

    await page.setInputFiles('input[type="file"]', path.resolve(dirname, './test-image-avif.avif'))
    const filename = page.locator('#field-filemanager-filename')
    await expect(filename).toHaveValue('test-image-avif.avif')

    await saveDocAndAssert(page)

    const fileMetaSizeType = page.locator('.file-preview__info-meta')
    await expect(fileMetaSizeType).toHaveText(/image\/png/)
  })

  test('should show proper mimetype for glb file', async () => {
    await gotoAndWaitForForm(page, threeDimensionalURL.create)

    await page.setInputFiles('input[type="file"]', path.resolve(dirname, './duck.glb'))
    const filename = page.locator('#field-filemanager-filename')
    await expect(filename).toHaveValue('duck.glb')

    await saveDocAndAssert(page)

    const fileMetaSizeType = page.locator('.file-preview__info-meta')
    await expect(fileMetaSizeType).toHaveText(/model\/gltf-binary/)
  })

  test('should show proper mimetype for svg+xml file', async () => {
    await gotoAndWaitForForm(page, svgOnlyURL.create)

    await page.setInputFiles('input[type="file"]', path.resolve(dirname, './svgWithXml.svg'))
    const filename = page.locator('#field-filemanager-filename')
    await expect(filename).toHaveValue('svgWithXml.svg')

    await saveDocAndAssert(page)

    const fileMetaSizeType = page.locator('.file-preview__info-meta')
    await expect(fileMetaSizeType).toHaveText(/image\/svg\+xml/)

    // ensure the svg loads
    const svgImage = page.locator('.file-preview__thumbnail img[src*="svgWithXml"]')
    await expect(svgImage).toBeVisible()
  })

  test('should create animated file upload', async () => {
    await gotoAndWaitForForm(page, animatedTypeMediaURL.create)

    await page.setInputFiles('input[type="file"]', path.resolve(dirname, './animated.webp'))
    const animatedFilename = page.locator('#field-filemanager-filename')

    await expect(animatedFilename).toHaveValue('animated.webp')

    await saveDocAndAssert(page)

    await gotoAndWaitForForm(page, animatedTypeMediaURL.create)

    await page.setInputFiles('input[type="file"]', path.resolve(dirname, './non-animated.webp'))
    const nonAnimatedFileName = page.locator('#field-filemanager-filename')

    await expect(nonAnimatedFileName).toHaveValue('non-animated.webp')

    await saveDocAndAssert(page)
  })

  test('should show proper file names for resized animated file', async () => {
    await gotoAndWaitForForm(page, animatedTypeMediaURL.create)

    await page.setInputFiles('input[type="file"]', path.resolve(dirname, './animated.webp'))
    const animatedFilename = page.locator('#field-filemanager-filename')

    await expect(animatedFilename).toHaveValue('animated.webp')

    await saveDocAndAssert(page)

    // The per-size detail is no longer surfaced in the doc edit UI; verify the generated size
    // filename via the API instead.
    const mediaID = page.url().split('/').pop()
    const { doc } = await client.findByID({
      id: mediaID as number | string,
      slug: animatedTypeMedia,
      auth: true,
    })
    expect(doc.sizes.squareSmall.filename).toMatch(/480x480\.webp$/)
  })

  test('should show resized images', async () => {
    const pngDoc = (
      await payload.find({
        collection: mediaSlug,
        depth: 0,
        pagination: false,
        where: {
          mimeType: {
            equals: 'image/png',
          },
        },
      })
    ).docs[0]

    // The per-size detail drawer was replaced by the inline carousel, which no longer surfaces
    // per-size dimensions/formats; verify the generated sizes via the API instead.
    const { sizes } = pngDoc!

    expect(sizes!.maintainedAspectRatio).toMatchObject({ height: 1024, width: 1024 })
    expect(sizes!.differentFormatFromMainImage!.mimeType).toBe('image/jpeg')
    expect(sizes!.maintainedImageSize).toMatchObject({ height: 1600, width: 1600 })
    expect(sizes!.maintainedImageSizeWithNewFormat).toMatchObject({
      height: 1600,
      mimeType: 'image/jpeg',
      width: 1600,
    })
    expect(sizes!.accidentalSameSize).toMatchObject({ height: 80, width: 320 })
    expect(sizes!.tablet).toMatchObject({ height: 480, width: 640 })
    expect(sizes!.mobile).toMatchObject({ height: 240, width: 320 })
    expect(sizes!.icon).toMatchObject({ height: 16, width: 16 })
  })

  test('should resize and show tiff images', async () => {
    await gotoAndWaitForForm(page, mediaURL.create)
    await page.setInputFiles('input[type="file"]', path.resolve(dirname, './test-image.tiff'))

    await expect(page.locator('.file-manager__selected-preview .thumbnail svg')).toBeVisible()

    await saveDocAndAssert(page)

    await expect(page.locator('.file-preview__thumbnail img')).toBeVisible()
  })

  test('should show the native video player when selecting a video to upload', async () => {
    await page.goto(mediaURL.create)
    await page.setInputFiles(
      'input[type="file"]',
      path.resolve(dirname, './christmas-mariachi-in-guadalajara.mp4'),
    )

    await expect(page.locator('.file-manager__selected-preview video.video-preview')).toBeVisible()
  })

  test('should show the native audio player when selecting an audio file to upload', async () => {
    await page.goto(mediaURL.create)
    await page.setInputFiles('input[type="file"]', path.resolve(dirname, './audio.mp3'))

    await expect(
      page.locator('.file-manager__selected-preview--audio audio.audio-preview'),
    ).toBeVisible()
  })

  test('should have custom file name for image size', async () => {
    await gotoAndWaitForForm(page, customFileNameURL.create)
    await page.setInputFiles('input[type="file"]', path.resolve(dirname, './image.png'))

    await expect(page.locator('.file-manager__selected-preview .thumbnail img')).toBeVisible()

    await saveDocAndAssert(page)

    await expect(page.locator('.file-preview__thumbnail img')).toBeVisible()

    // The per-size detail is no longer surfaced in the doc edit UI; verify the custom generated
    // size filename via the API instead.
    const mediaID = page.url().split('/').pop()
    const { doc } = await client.findByID({
      id: mediaID as number | string,
      slug: customFileNameMediaSlug,
      auth: true,
    })
    expect(doc.sizes.custom.filename).toBe('custom-500x500.png')
  })

  test('should show draft uploads in the relation list', async () => {
    await page.goto(relationURL.list)
    // Wait for hydration
    await wait(1000)
    // from the list edit the first document
    await page.locator('.row-1 a').click()

    // edit the versioned image
    await page.locator('.field-type:nth-of-type(2) .icon--write').click()

    // fill the title with 'draft'
    await page.locator('#field-title').fill('draft')

    await saveDocAndAssert(
      page,
      '.payload__modal-item .collection-edit--versions button#action-save-draft',
    )

    // close the drawer
    await page.locator('.doc-drawer__header-close').click()

    // remove the selected versioned image
    await page.locator('#field-versionedImage .icon--x').click()

    // choose from existing
    await openDocDrawer({ page, selector: '#field-versionedImage .upload__listToggler' })

    await expect(page.locator('.row-3 .cell-title')).toContainText('draft')
  })

  test('should upload edge case media when an image size contains an undefined height', async () => {
    await gotoAndWaitForForm(page, mediaURL.create)
    await page.setInputFiles(
      'input[type="file"]',
      path.resolve(dirname, './test-image-1500x735.jpeg'),
    )

    const filename = page.locator('#field-filemanager-filename')

    await expect(filename).toHaveValue('test-image-1500x735.jpeg')

    await saveDocAndAssert(page)
  })

  describe('filterOptions', () => {
    test('should restrict mimetype based on filterOptions', async () => {
      const audioDoc = (
        await payload.find({
          collection: audioSlug,
          depth: 0,
          pagination: false,
        })
      ).docs[0]

      await page.goto(audioURL.edit(audioDoc!.id))

      // remove the selection and open the list drawer
      await wait(500) // flake workaround
      await page.locator('#field-audio').getByRole('button', { name: 'Remove' }).click()

      await openDocDrawer({ page, selector: '#field-audio .upload__listToggler' })

      const listDrawer = page.locator('[id^=list-drawer_1_]')
      await expect(listDrawer).toBeVisible()

      await openDocDrawer({
        page,
        selector: 'button.list-header__create-new-button.doc-drawer__toggler',
      })
      await expect(page.locator('[id^=doc-drawer_media_1_]')).toBeVisible()

      // upload an image and try to select it
      await page
        .locator('[id^=doc-drawer_media_1_] .file-manager input[type="file"]')
        .setInputFiles(path.resolve(dirname, './image.png'))
      await page.locator('[id^=doc-drawer_media_1_] button#action-save').click()
      await expect(page.locator('.payload-toast-container .toast-success')).toContainText(
        'successfully',
      )

      await closeAllToasts(page)

      // save the document and expect an error
      await page.locator('button#action-save').click()
      await assertToastErrors({
        errors: ['Audio'],
        page,
      })
    })

    test('should restrict uploads in drawer based on filterOptions', async () => {
      const audioDoc = (
        await payload.find({
          collection: audioSlug,
          depth: 0,
          pagination: false,
        })
      ).docs[0]

      await page.goto(audioURL.edit(audioDoc!.id))

      // remove the selection and open the list drawer
      await wait(500) // flake workaround
      await page.locator('#field-audio').getByRole('button', { name: 'Remove' }).click()

      await openDocDrawer({ page, selector: '.upload__listToggler' })

      const listDrawer = page.locator('[id^=list-drawer_1_]')
      await expect(listDrawer).toBeVisible()

      await expect(listDrawer.locator('tbody tr')).toHaveCount(1)
    })
  })

  test('should throw error when file is larger than the limit and abortOnLimit is true', async () => {
    await gotoAndWaitForForm(page, mediaURL.create)
    await page.setInputFiles('input[type="file"]', path.resolve(dirname, './2mb.jpg'))
    await expect(page.locator('#field-filemanager-filename')).toHaveValue('2mb.jpg')

    await page.click('#action-save', { delay: 100 })
    await expect(page.locator('.payload-toast-container .toast-error')).toContainText(
      'File size limit has been reached',
    )
  })

  test('should render adminUploadControls', async () => {
    await page.goto(adminUploadControlURL.create)

    const loadFromFileButton = page.locator('#load-from-file-upload-button')
    const loadFromUrlButton = page.locator('#load-from-url-upload-button')
    await expect(loadFromFileButton).toBeVisible()
    await expect(loadFromUrlButton).toBeVisible()
  })

  test('should load a file using a file reference from custom controls', async () => {
    await page.goto(adminUploadControlURL.create)

    const loadFromFileButton = page.locator('#load-from-file-upload-button')
    await loadFromFileButton.click()
    await wait(1000)

    await page.locator('#action-save').click()
    await expect(page.locator('.payload-toast-container')).toContainText('successfully')
    await closeAllToasts(page)

    await wait(1000)

    const mediaID = page.url().split('/').pop()
    const { doc: mediaDoc } = await client.findByID({
      id: mediaID as string,
      slug: adminUploadControlSlug,
      auth: true,
    })
    await expect
      .poll(() => mediaDoc.filename, { timeout: POLL_TOPASS_TIMEOUT })
      .toContain('universal-truth')
  })

  test('should load a file using a URL reference from custom controls', async () => {
    await page.goto(adminUploadControlURL.create)

    const loadFromUrlButton = page.locator('#load-from-url-upload-button')
    await loadFromUrlButton.click()
    await page.locator('#action-save').click()
    await expect(page.locator('.payload-toast-container')).toContainText('successfully')
    await closeAllToasts(page)

    await wait(1000)

    const mediaID = page.url().split('/').pop()
    const { doc: mediaDoc } = await client.findByID({
      id: mediaID as string,
      slug: adminUploadControlSlug,
      auth: true,
    })
    await expect
      .poll(() => mediaDoc.filename, { timeout: POLL_TOPASS_TIMEOUT })
      .toContain('universal-truth')
  })

  test('should render adminThumbnail when using a function', async () => {
    await page.goto(adminThumbnailFunctionURL.list)

    // Ensure sure false or null shows generic file svg
    const genericUploadImage = page.locator('tr.row-1 .thumbnail img')

    // cacheTags defaults to true, so the cache tag is appended to the src in list view
    await expect(genericUploadImage).toHaveAttribute('src', adminThumbnailFunctionSrcPattern)
  })

  test('should render adminThumbnail when using a custom thumbnail URL with additional queries', async () => {
    // The collection's `adminThumbnail` config hardcodes a Next.js image-optimizer
    // URL (`/_next/image?url=...&w=384&q=5`). That endpoint only exists on the
    // Next.js adapter; TanStack Start has no `/_next/image` route, so the thumbnail
    // 404s and never renders. The feature (custom thumbnailURL) is exercised by the
    // other adminThumbnail tests; this one is Next-image-optimizer specific.
    test.skip(
      process.env.PAYLOAD_FRAMEWORK === 'tanstack-start',
      'Asserts the Next.js image-optimizer URL (/_next/image), which TanStack Start does not provide.',
    )

    await page.goto(adminThumbnailWithSearchQueriesURL.list)

    const genericUploadImage = page.locator('tr.row-1 .thumbnail img')
    // Match the URL with the regex pattern
    const regexPattern = /\/_next\/image\?url=.*?&w=384&q=5/

    await expect(genericUploadImage).toHaveAttribute('src', regexPattern)
  })

  test('should render adminThumbnail without the additional cache tag', async () => {
    const imageDoc = (
      await payload.find({
        collection: mediaWithoutCacheTagsSlug,
        depth: 0,
        pagination: false,
        where: {
          mimeType: {
            equals: 'image/png',
          },
        },
      })
    ).docs[0]

    await page.goto(mediaWithoutCacheTagsSlugURL.edit(imageDoc!.id))

    const genericUploadImage = page.locator('.file-preview__thumbnail img')
    await expect(genericUploadImage).not.toHaveAttribute('src', cacheTagPattern)
  })

  test('should render adminThumbnail without the additional cache tag in upload collection list', async () => {
    await page.goto(mediaWithoutCacheTagsSlugURL.list)

    const genericUploadImage = page.locator('tr.row-1 .thumbnail img')
    await expect(genericUploadImage).not.toHaveAttribute('src', cacheTagPattern)
  })

  test('should render adminThumbnail with the cache tag by default', async () => {
    const imageDoc = (
      await payload.find({
        collection: adminThumbnailFunctionSlug,
        depth: 0,
        pagination: false,
        where: {
          mimeType: {
            equals: 'image/png',
          },
        },
      })
    ).docs[0]

    await page.goto(adminThumbnailFunctionURL.edit(imageDoc!.id))

    const genericUploadImage = page.locator('.file-preview__thumbnail img')
    await expect(genericUploadImage).toHaveAttribute('src', cacheTagPattern)
  })

  test('should render adminThumbnail with the cache tag in upload collection list by default', async () => {
    await page.goto(adminThumbnailFunctionURL.list)

    const genericUploadImage = page.locator('tr.row-1 .thumbnail img')
    await expect(genericUploadImage).toHaveAttribute('src', cacheTagPattern)
  })

  test('should render adminThumbnail with the cache tag in relation list by default', async () => {
    await page.goto(relationPreviewURL.list)

    const relationPreview1 = page.locator('.cell-imageWithPreview1 img')
    await expect(relationPreview1).toHaveAttribute('src', cacheTagPattern)
  })

  test('should render adminThumbnail with the cache tag in upload field by default', async () => {
    const relationPreviewDoc = (
      await payload.find({
        collection: relationPreviewSlug,
        depth: 0,
        limit: 1,
        pagination: false,
      })
    ).docs[0]

    await page.goto(relationPreviewURL.edit(relationPreviewDoc!.id))

    const relationPreview1 = page.locator('#field-imageWithPreview1 .thumbnail img')
    await expect(relationPreview1).toHaveAttribute('src', cacheTagPattern)
  })

  test('should render adminThumbnail when using a specific size', async () => {
    await page.goto(adminThumbnailSizeURL.list)

    // Ensure sure false or null shows generic file svg
    const genericUploadImage = page.locator('tr.row-1 .thumbnail img')
    await expect(genericUploadImage).toBeVisible()

    // Ensure adminThumbnail fn returns correct value based on audio/mp3 mime
    const audioUploadImage = page.locator('tr.row-2 .thumbnail svg')
    await expect(audioUploadImage).toBeVisible()
  })

  test('should detect correct mimeType', async () => {
    await gotoAndWaitForForm(page, mediaURL.create)
    await page.setInputFiles('input[type="file"]', path.resolve(dirname, './image.png'))
    await saveDocAndAssert(page)

    const imageID = page.url().split('/').pop()

    const { doc: uploadedImage } = await client.findByID({
      id: imageID as number | string,
      slug: mediaSlug,
      auth: true,
    })

    expect(uploadedImage.mimeType).toEqual('image/png')
  })

  test('should upload image with metadata', async () => {
    await gotoAndWaitForForm(page, withMetadataURL.create)

    await page.setInputFiles('input[type="file"]', path.join(dirname, 'test-image.jpg'))
    await saveDocAndAssert(page)

    const mediaID = page.url().split('/').pop()

    const { doc: mediaDoc } = await client.findByID({
      id: mediaID as number | string,
      slug: withMetadataSlug,
      auth: true,
    })

    const acceptableFileSizes = [9431, 9435]

    await expect
      .poll(() => acceptableFileSizes.includes(mediaDoc.sizes.sizeOne.filesize))
      .toBe(true)
  })

  test('should upload image without metadata', async () => {
    await gotoAndWaitForForm(page, withoutMetadataURL.create)

    await page.setInputFiles('input[type="file"]', path.join(dirname, 'test-image.jpg'))
    await saveDocAndAssert(page)

    const mediaID = page.url().split('/').pop()

    const { doc: mediaDoc } = await client.findByID({
      id: mediaID as number | string,
      slug: withoutMetadataSlug,
      auth: true,
    })

    const acceptableFileSizes = [2424, 2445]

    await expect
      .poll(() => acceptableFileSizes.includes(mediaDoc.sizes.sizeTwo.filesize))
      .toBe(true)
  })

  test('should only upload image with metadata if jpeg mimetype', async () => {
    await gotoAndWaitForForm(page, withOnlyJPEGMetadataURL.create)

    await page.setInputFiles('input[type="file"]', path.join(dirname, 'test-image.jpg'))
    await saveDocAndAssert(page)

    const jpegMediaID = page.url().split('/').pop()

    const { doc: jpegMediaDoc } = await client.findByID({
      id: jpegMediaID as number | string,
      slug: withOnlyJPEGMetadataSlug,
      auth: true,
    })

    const acceptableFileSizesForJPEG = [9554, 9575]

    // without metadata appended, the jpeg image filesize would be 2424
    await expect
      .poll(() => acceptableFileSizesForJPEG.includes(jpegMediaDoc.sizes.sizeThree.filesize))
      .toBe(true)

    await gotoAndWaitForForm(page, withOnlyJPEGMetadataURL.create)

    await page.setInputFiles('input[type="file"]', path.join(dirname, 'animated.webp'))
    await saveDocAndAssert(page)

    const webpMediaID = page.url().split('/').pop()

    const { doc: webpMediaDoc } = await client.findByID({
      id: webpMediaID as number | string,
      slug: withOnlyJPEGMetadataSlug,
      auth: true,
    })

    // With metadata, the animated image filesize would be 218762
    await expect.poll(() => webpMediaDoc.sizes.sizeThree.filesize).toBe(211638)
  })

  test('should show custom upload component', async () => {
    await page.goto(customUploadFieldURL.create)

    const serverText = page.locator('.collection-edit--custom-upload-field h2')
    await expect(serverText).toHaveText('This text was rendered on the server')

    const clientText = page.locator('.collection-edit--custom-upload-field h3')
    await expect(clientText).toHaveText('This text was rendered on the client')

    // The custom Upload component replaces the default FileManager in the upload panel.
    await expect(page.locator('.collection-edit--custom-upload-field .file-manager')).toHaveCount(0)
  })

  test('should show original image url on a single upload card for an upload with adminThumbnail defined', async () => {
    await gotoAndWaitForForm(page, uploadsOne.create)

    const singleThumbnailButton = page.locator('#field-singleThumbnailUpload button', {
      hasText: exactText('Create New'),
    })

    await singleThumbnailButton.click()

    const singleThumbnailModal = page.locator('[id^="doc-drawer_admin-thumbnail-size"]')
    await expect(singleThumbnailModal).toBeVisible()

    await page.setInputFiles(
      '[id^="doc-drawer_admin-thumbnail-size"] input[type="file"]',
      path.resolve(dirname, './test-image.png'),
    )
    const filename = page.locator(
      '[id^="doc-drawer_admin-thumbnail-size"] #field-filemanager-filename',
    )
    await expect(filename).toHaveValue('test-image.png')

    await expect(page.locator('[id^="doc-drawer_admin-thumbnail-size"] #action-save')).toBeVisible()

    await page.locator('[id^="doc-drawer_admin-thumbnail-size"] #action-save').click()

    await expect(page.locator('.payload-toast-container')).toContainText('successfully')
    await closeAllToasts(page)

    const href = await page.locator('#field-singleThumbnailUpload a').getAttribute('href')

    // Ensure the URL ends correctly
    await expect
      .poll(() => href)
      .toMatch(/\/api\/admin-thumbnail-size\/file\/test-image(-\d+)?\.png$/i)

    // Ensure no "-100x100" or any similar suffix
    await expect.poll(() => !/-\d+x\d+\.png$/.test(href!)).toBe(true)
  })

  test('should show original image url on a hasMany upload card for an upload with adminThumbnail defined', async () => {
    await gotoAndWaitForForm(page, uploadsOne.create)

    const hasManyThumbnailButton = page.locator('#field-hasManyThumbnailUpload button', {
      hasText: exactText('Create New'),
    })
    await hasManyThumbnailButton.click()

    const hasManyThumbnailModal = page.locator('#hasManyThumbnailUpload-bulk-upload-modal-slug-1')
    await expect(hasManyThumbnailModal).toBeVisible()

    await hasManyThumbnailModal
      .locator('.dropzone input[type="file"]')
      .setInputFiles([path.resolve(dirname, './test-image.png')])

    const saveButton = hasManyThumbnailModal.locator(
      '.bulk-upload--actions-bar__saveButtons button',
    )
    await saveButton.click()
    await closeAllToasts(page)

    await expect(
      page.locator('#field-hasManyThumbnailUpload .upload--has-many__dragItem'),
    ).toBeVisible()
    const itemCount = await page
      .locator('#field-hasManyThumbnailUpload .upload--has-many__dragItem')
      .count()
    await expect.poll(() => itemCount).toBe(1)

    await expect(
      page.locator('#field-hasManyThumbnailUpload .upload--has-many__dragItem a'),
    ).toBeVisible()
    const href = await page
      .locator('#field-hasManyThumbnailUpload .upload--has-many__dragItem a')
      .getAttribute('href')

    expect(href).toMatch(/\/api\/admin-thumbnail-size\/file\/test-image(-\d+)?\.png$/i)
    expect(href).not.toMatch(/-\d+x\d+\.png$/)
  })

  test('should show preview button if image sizes are defined but crop and focal point are not', async () => {
    await gotoAndWaitForForm(page, imageSizesOnlyURL.create)

    const fileChooserPromise = page.waitForEvent('filechooser')
    await page.getByText('Select a file').click()
    const fileChooser = await fileChooserPromise
    await wait(1000)
    await fileChooser.setFiles(path.join(dirname, 'test-image.jpg'))

    await page.waitForSelector('button#action-save')
    await page.locator('button#action-save').click()
    await expect(page.locator('.payload-toast-container')).toContainText('successfully')
    await closeAllToasts(page)

    await wait(1000) // Wait for the save

    // Image sizes are now surfaced inline via the mini carousel rather than a preview-sizes button.
    await expect(page.locator('.mini-carousel')).toBeVisible()
  })

  describe('bulk uploads', () => {
    test('should bulk upload multiple files', async () => {
      // Navigate to the upload creation page
      await gotoAndWaitForForm(page, uploadsOne.create)

      // Upload single file
      await page.setInputFiles(
        '.file-manager input[type="file"]',
        path.resolve(dirname, './image.png'),
      )
      const filename = page.locator('#field-filemanager-filename')
      await expect(filename).toHaveValue('image.png')

      const bulkUploadButton = page.locator('#field-hasManyUpload button', {
        hasText: exactText('Create New'),
      })
      await bulkUploadButton.click()

      const bulkUploadModal = page.locator('#hasManyUpload-bulk-upload-modal-slug-1')
      await expect(bulkUploadModal).toBeVisible()

      // Bulk upload multiple files at once
      await bulkUploadModal
        .locator('.dropzone input[type="file"]')
        .setInputFiles([
          path.resolve(dirname, './image.png'),
          path.resolve(dirname, './test-image.png'),
        ])

      await bulkUploadModal
        .locator('.bulk-upload--file-manager .render-fields #field-prefix')
        .fill('prefix-one')

      const nextImageChevronButton = bulkUploadModal.locator(
        '.bulk-upload--actions-bar__controls button:nth-of-type(2)',
      )
      await nextImageChevronButton.click()

      await bulkUploadModal
        .locator('.bulk-upload--file-manager .render-fields #field-prefix')
        .fill('prefix-two')

      const saveButton = bulkUploadModal.locator('.bulk-upload--actions-bar__saveButtons button')
      await saveButton.click()
      await closeAllToasts(page)

      const items = page.locator('#field-hasManyUpload .upload--has-many__dragItem')
      await expect(items).toHaveCount(2)
      await expect(items.nth(0)).toBeVisible()
      await expect(items.nth(1)).toBeVisible()

      await saveDocAndAssert(page)
    })

    test('should render the file manager preview for files in the bulk upload drawer', async () => {
      await page.goto(uploadsTwo.list)

      // Wait for page header to be visible (indicates page is loaded and hydrated)
      await expect(page.locator('.list-header__title')).toBeVisible()

      const bulkUploadButton = page.locator('.list-header__title-actions button', {
        hasText: 'Bulk Upload',
      })
      await expect(bulkUploadButton).toBeEnabled()

      // Click and retry until dropzone appears (handles hydration timing issues)
      const dropzoneInput = page.locator('.dropzone input[type="file"]')
      await expect(async () => {
        await bulkUploadButton.click()
        await expect(dropzoneInput).toBeAttached({ timeout: 1500 })
      }).toPass({ intervals: [500], timeout: 5000 })

      await page
        .locator('.dropzone input[type="file"]')
        .setInputFiles([
          path.resolve(dirname, './image.png'),
          path.resolve(dirname, './test-pdf.pdf'),
        ])

      const bulkUploadForm = page.locator('.bulk-upload--file-manager')

      // The drawer reuses the FileManager preview rather than the legacy file-field upload
      await expect(bulkUploadForm.locator('.file-manager')).toBeVisible()
      await expect(bulkUploadForm.locator('.file-field')).toHaveCount(0)

      // The active (image) file renders the rich image preview
      await expect(
        bulkUploadForm.locator('.file-manager__selected-preview .thumbnail img'),
      ).toBeVisible()

      // Switching to the PDF renders the built-in PDF preview
      await bulkUploadForm
        .locator('.file-selections__fileRowContainer', { hasText: 'test-pdf.pdf' })
        .locator('button.file-selections__fileRow')
        .click()

      await expect(
        bulkUploadForm.locator('.file-manager__selected-preview .pdf-preview'),
      ).toBeVisible()
    })

    test('should hide the drag and drop text based on the field container width, not the viewport', async () => {
      await page.goto(uploadsOne.list)

      const bulkUploadButton = page.locator('.list-header__title-actions button', {
        hasText: 'Bulk Upload',
      })
      await bulkUploadButton.click()

      await page
        .locator('.dropzone input[type="file"]')
        .setInputFiles(path.resolve(dirname, './image.png'))

      await expect(page.locator('#field-hasManyUpload .upload__dropzoneContent')).toHaveCSS(
        'flex-wrap',
        'wrap',
      )

      await expect(page.locator('#field-hasManyUpload .upload__dragAndDropText')).toBeHidden()
    })

    test('should show the drag and drop text when a field has enough room outside the bulk upload drawer', async () => {
      await gotoAndWaitForForm(page, relationURL.create)

      await expect(page.locator('#field-hasManyImage .upload__dragAndDropText')).toBeVisible()
    })

    test('should bulk upload non-image files without page errors', async () => {
      // Enable collection ONLY for this test
      collectErrorsFromPage()

      // Navigate to the upload creation page
      await gotoAndWaitForForm(page, uploadsOne.create)

      // Upload single file
      await page.setInputFiles(
        '.file-manager input[type="file"]',
        path.resolve(dirname, './image.png'),
      )
      const filename = page.locator('#field-filemanager-filename')
      await expect(filename).toHaveValue('image.png')

      const bulkUploadButton = page.locator('#field-hasManyUpload button', {
        hasText: exactText('Create New'),
      })
      await bulkUploadButton.click()

      const bulkUploadModal = page.locator('#hasManyUpload-bulk-upload-modal-slug-1')
      await expect(bulkUploadModal).toBeVisible()

      await bulkUploadModal
        .locator('.dropzone input[type="file"]')
        .setInputFiles([path.resolve(dirname, './test-pdf.pdf')])

      await bulkUploadModal
        .locator('.bulk-upload--file-manager .render-fields #field-prefix')
        .fill('prefix-one')
      const saveButton = bulkUploadModal.locator('.bulk-upload--actions-bar__saveButtons button')
      await saveButton.click()
      await closeAllToasts(page)

      const items = page.locator('#field-hasManyUpload .upload--has-many__dragItem')
      await expect(items).toHaveCount(1)
      await expect(items.nth(0)).toBeVisible()

      await saveDocAndAssert(page)

      // Assert no console errors occurred for this test only
      await expect.poll(() => consoleErrorsFromPage).toEqual([])

      // Reset global behavior for other tests
      stopCollectingErrorsFromPage()
    })

    test('should apply field value to all bulk upload files after edit many', async () => {
      await gotoAndWaitForForm(page, uploadsOne.create)

      // Upload single file
      await page.setInputFiles(
        '.file-manager input[type="file"]',
        path.resolve(dirname, './image.png'),
      )

      const filename = page.locator('#field-filemanager-filename')
      await expect(filename).toHaveValue('image.png')

      const bulkUploadButton = page.locator('#field-hasManyUpload button', {
        hasText: exactText('Create New'),
      })

      await bulkUploadButton.click()

      const bulkUploadModal = page.locator('#hasManyUpload-bulk-upload-modal-slug-1')
      await expect(bulkUploadModal).toBeVisible()

      // Bulk upload multiple files at once
      await bulkUploadModal
        .locator('.dropzone input[type="file"]')
        .setInputFiles([
          path.resolve(dirname, './image.png'),
          path.resolve(dirname, './test-image.png'),
        ])

      await bulkUploadModal.locator('.edit-many-bulk-uploads button').click()
      const editManyBulkUploadModal = page.locator('#edit-uploads-2-bulk-uploads')
      await expect(editManyBulkUploadModal).toBeVisible()

      const editFieldSelector = editManyBulkUploadModal.locator(
        '.edit-many-bulk-uploads__form .react-select',
      )
      await editFieldSelector.click({ delay: 100 })
      const editFieldMenu = getSelectMenu({ page })
      const options = editFieldMenu.locator('.rs__option')

      await options.locator('text=Prefix').click()

      await editManyBulkUploadModal.locator('#field-prefix').fill('some prefix')

      await editManyBulkUploadModal
        .locator('.edit-many-bulk-uploads__header__actions button')
        .click()
      await bulkUploadModal.locator('.bulk-upload--actions-bar__saveButtons button').click()
      await closeAllToasts(page)

      const items = page.locator('#field-hasManyUpload .upload--has-many__dragItem')
      await expect(items).toHaveCount(2)
      await expect(items.nth(0)).toBeVisible()
      await expect(items.nth(1)).toBeVisible()

      await saveDocAndAssert(page)
    })

    test('should remove validation errors from bulk upload files after correction in edit many drawer', async () => {
      // Navigate to the upload creation page
      await gotoAndWaitForForm(page, uploadsOne.create)
      await waitForFormReady(page)

      // Upload single file
      await page.setInputFiles(
        '.file-manager input[type="file"]',
        path.resolve(dirname, './image.png'),
      )
      const filename = page.locator('#field-filemanager-filename')
      await expect(filename).toHaveValue('image.png')

      const bulkUploadButton = page.locator('#field-hasManyUpload button', {
        hasText: exactText('Create New'),
      })
      await bulkUploadButton.click()

      const bulkUploadModal = page.locator('#hasManyUpload-bulk-upload-modal-slug-1')
      await expect(bulkUploadModal).toBeVisible()

      // Bulk upload multiple files at once
      await bulkUploadModal
        .locator('.dropzone input[type="file"]')
        .setInputFiles([
          path.resolve(dirname, './image.png'),
          path.resolve(dirname, './test-image.png'),
        ])

      const saveButton = bulkUploadModal.locator('.bulk-upload--actions-bar__saveButtons button')
      await saveButton.click()
      await expect(page.locator('.payload-toast-container')).toContainText('Failed to save 2 files')
      await closeAllToasts(page)

      const errorCount = bulkUploadModal.locator('.file-selections .error-pill__count').first()
      await expect(errorCount).toHaveText('1')

      await bulkUploadModal.locator('.edit-many-bulk-uploads button').click()
      const editManyBulkUploadModal = page.locator('#edit-uploads-2-bulk-uploads')
      await expect(editManyBulkUploadModal).toBeVisible()

      const fieldSelector = editManyBulkUploadModal.locator(
        '.edit-many-bulk-uploads__form .react-select',
      )
      await fieldSelector.click({ delay: 100 })
      const fieldSelectorMenu = getSelectMenu({ page })
      const options = fieldSelectorMenu.locator('.rs__option')
      // Select an option
      await options.locator('text=Prefix').click()

      await editManyBulkUploadModal.locator('#field-prefix').fill('some prefix')

      await editManyBulkUploadModal
        .locator('.edit-many-bulk-uploads__header__actions button')
        .click()

      await saveButton.click()
      await expect(page.locator('.payload-toast-container')).toContainText(
        'Successfully saved 2 files',
      )
      await closeAllToasts(page)

      await saveDocAndAssert(page)
    })

    test('should show validation error when bulk uploading files and then soft removing one of the files', async () => {
      // Navigate to the upload creation page
      await gotoAndWaitForForm(page, uploadsOne.create)

      // Upload single file
      await page.setInputFiles(
        '.file-manager input[type="file"]',
        path.resolve(dirname, './image.png'),
      )
      const filename = page.locator('#field-filemanager-filename')
      await expect(filename).toHaveValue('image.png')

      const bulkUploadButton = page.locator('#field-hasManyUpload button', {
        hasText: exactText('Create New'),
      })
      await bulkUploadButton.click()

      const bulkUploadModal = page.locator('#hasManyUpload-bulk-upload-modal-slug-1')
      await expect(bulkUploadModal).toBeVisible()

      // Bulk upload multiple files at once
      await bulkUploadModal
        .locator('.dropzone input[type="file"]')
        .setInputFiles([
          path.resolve(dirname, './image.png'),
          path.resolve(dirname, './test-image.png'),
        ])

      await bulkUploadModal.locator('.edit-many-bulk-uploads button').click()
      const editManyBulkUploadModal = page.locator('#edit-uploads-2-bulk-uploads')
      await expect(editManyBulkUploadModal).toBeVisible()

      const fieldSelector = editManyBulkUploadModal.locator(
        '.edit-many-bulk-uploads__form .react-select',
      )
      await fieldSelector.click({ delay: 100 })
      const fieldSelectorMenu2 = getSelectMenu({ page })
      const options = fieldSelectorMenu2.locator('.rs__option')
      // Select an option
      await options.locator('text=Prefix').click()

      await editManyBulkUploadModal.locator('#field-prefix').fill('some prefix')

      await editManyBulkUploadModal
        .locator('.edit-many-bulk-uploads__header__actions button')
        .click()

      await bulkUploadModal.locator('.file-manager__remove').click()

      const chevronRight = bulkUploadModal.locator(
        '.bulk-upload--actions-bar__controls button:nth-of-type(2)',
      )

      await chevronRight.click()

      await expect(
        bulkUploadModal
          .locator('.file-selections .file-selections__fileRow .file-selections__fileName')
          .first(),
      ).toContainText('No file')

      const saveButton = bulkUploadModal.locator('.bulk-upload--actions-bar__saveButtons button')
      await saveButton.click()
      await closeAllToasts(page)

      const errorCount = bulkUploadModal.locator('.file-selections .error-pill__count').first()
      await expect(errorCount).toHaveText('1')
    })

    test('should preserve state when adding additional files to an existing bulk upload', async () => {
      await page.goto(uploadsTwo.list)

      // Wait for page header to be visible (indicates page is loaded and hydrated)
      await expect(page.locator('.list-header__title')).toBeVisible()

      const bulkUploadButton = page.locator('.list-header__title-actions button', {
        hasText: 'Bulk Upload',
      })
      await expect(bulkUploadButton).toBeEnabled()

      // Click and retry until dropzone appears (handles hydration timing issues)
      const dropzoneInput = page.locator('.dropzone input[type="file"]')
      await expect(async () => {
        await bulkUploadButton.click()
        await expect(dropzoneInput).toBeAttached({ timeout: 1500 })
      }).toPass({ intervals: [500], timeout: 5000 })

      await page.setInputFiles('.dropzone input[type="file"]', path.resolve(dirname, './image.png'))

      await page.locator('#field-prefix').fill('should-preserve')

      // add another file
      const addFileButton = page.locator(
        '.bulk-upload--file-manager .dialog__header-extras button',
        {
          hasText: 'Add files',
        },
      )
      await expect(addFileButton).toBeEnabled()
      await addFileButton.click()

      // Wait for new dropzone to be ready
      await expect(dropzoneInput).toBeAttached()

      await page.setInputFiles('.dropzone input[type="file"]', path.resolve(dirname, './small.png'))

      const originalFileRow = page
        .locator('.file-selections__filesContainer .file-selections__fileRowContainer')
        .nth(1)

      // ensure the original file thumbnail is visible (not using default placeholder svg)
      await expect(originalFileRow.locator('.thumbnail img')).toBeVisible()

      // navigate to the first file added
      await originalFileRow.locator('button.file-selections__fileRow').click()

      // ensure the prefix field is still filled with the original value
      await expect(page.locator('#field-prefix')).toHaveValue('should-preserve')
    })

    test('should not redirect to created relationship document inside the bulk upload drawer', async () => {
      await page.goto(bulkUploadsURL.list)

      // Wait for page header to be visible (indicates page is loaded and hydrated)
      await expect(page.locator('.list-header__title')).toBeVisible()

      const bulkUploadButton = page.locator('.list-header__title-actions button', {
        hasText: 'Bulk Upload',
      })
      await expect(bulkUploadButton).toBeEnabled()

      // Click and retry until dropzone appears (handles hydration timing issues)
      const dropzoneInput = page.locator('.dropzone input[type="file"]')
      await expect(async () => {
        await bulkUploadButton.click()
        await expect(dropzoneInput).toBeAttached({ timeout: 1500 })
      }).toPass({ intervals: [500], timeout: 5000 })

      await page.setInputFiles('.dropzone input[type="file"]', path.resolve(dirname, './image.png'))

      await page.locator('#field-title').fill('Upload title 1')
      const bulkUploadForm = page.locator('.bulk-upload--file-manager')
      const relationshipField = bulkUploadForm.locator('#field-relationship')
      await relationshipField.locator('.relationship-add-new__add-button').click()

      const collectionForm = page.locator('.collection-edit')
      await collectionForm.locator('#field-title').fill('Related Document Title')
      await saveDocAndAssert(page)
      await collectionForm.locator('.doc-drawer__header-close').click()

      await expect(bulkUploadForm.locator('.relationship--single-value__text')).toHaveText(
        'Related Document Title',
      )
    })

    test('should reset state once all files are saved successfully from field bulk upload', async () => {
      await gotoAndWaitForForm(page, uploadsOne.create)
      const fieldBulkUploadButton = page.locator('#field-hasManyThumbnailUpload button', {
        hasText: exactText('Create New'),
      })
      await fieldBulkUploadButton.click()
      const fieldBulkUploadModal = page.locator('#hasManyThumbnailUpload-bulk-upload-modal-slug-1')
      await expect(fieldBulkUploadModal).toBeVisible()
      await fieldBulkUploadModal
        .locator('.dropzone input[type="file"]')
        .setInputFiles([
          path.resolve(dirname, './image.png'),
          path.resolve(dirname, './test-image.png'),
        ])
      await fieldBulkUploadModal.locator('.dialog__footer button', { hasText: 'Save' }).click()
      await expect(fieldBulkUploadModal).toBeHidden()
      await fieldBulkUploadButton.click()

      // should show add files dropzone view
      await expect(fieldBulkUploadModal.locator('.bulk-upload--add-files')).toBeVisible()
    })

    test('should show error when bulk uploading files with missing filenames and allow retry after fixing', async () => {
      await gotoAndWaitForForm(page, uploadsOne.create)

      await page.setInputFiles(
        '.file-manager input[type="file"]',
        path.resolve(dirname, './image.png'),
      )
      const filename = page.locator('#field-filemanager-filename')
      await expect(filename).toHaveValue('image.png')

      const bulkUploadButton = page.locator('#field-hasManyUpload button', {
        hasText: exactText('Create New'),
      })
      await bulkUploadButton.click()

      const bulkUploadModal = page.locator('#hasManyUpload-bulk-upload-modal-slug-1')
      await expect(bulkUploadModal).toBeVisible()

      await bulkUploadModal
        .locator('.dropzone input[type="file"]')
        .setInputFiles([
          path.resolve(dirname, './image.png'),
          path.resolve(dirname, './test-image.png'),
        ])

      await bulkUploadModal
        .locator('.bulk-upload--file-manager .render-fields #field-prefix')
        .fill('prefix-one')

      // Clear the filename from the first file
      await bulkUploadModal.locator('#field-filemanager-filename').clear()

      const nextImageChevronButton = bulkUploadModal.locator(
        '.bulk-upload--actions-bar__controls button:nth-of-type(2)',
      )
      await nextImageChevronButton.click()

      await bulkUploadModal
        .locator('.bulk-upload--file-manager .render-fields #field-prefix')
        .fill('prefix-two')

      const saveButton = bulkUploadModal.locator('.bulk-upload--actions-bar__saveButtons button')
      await saveButton.click()

      // Should show error message for failed files
      await expect(page.locator('.payload-toast-container')).toContainText('Failed to save 1 files')
      await expect(page.locator('.payload-toast-container')).toContainText(
        'Successfully saved 1 files',
      )
      await closeAllToasts(page)

      const errorCount = bulkUploadModal.locator('.file-selections .error-pill__count').first()
      await expect(errorCount).toHaveText('1')

      await expect(bulkUploadModal).toBeVisible()

      // After the successful file is saved and removed, only the failed file remains.
      // It should already be active (no need to navigate).

      // Should show "A file name is required" error message
      await expect(page.locator('[id^="field-error-filename"]')).toContainText(
        'A file name is required',
      )

      // Filename field should be empty (as we cleared it)
      await expect(bulkUploadModal.locator('#field-filemanager-filename')).toHaveValue('')

      // Add the filename back
      await bulkUploadModal.locator('#field-filemanager-filename').fill('fixed-filename.png')

      await saveButton.click()

      await expect(page.locator('.payload-toast-container')).toContainText(
        'Successfully saved 1 files',
      )
      await closeAllToasts(page)

      await expect(bulkUploadModal).toBeHidden()

      const items = page.locator('#field-hasManyUpload .upload--has-many__dragItem')
      await expect(items).toHaveCount(2)

      await saveDocAndAssert(page)
    })

    test('should show correct error count when bulk uploading files with validation errors', async () => {
      await gotoAndWaitForForm(page, uploadsOne.create)

      await page.setInputFiles(
        '.file-manager input[type="file"]',
        path.resolve(dirname, './image.png'),
      )
      const filename = page.locator('#field-filemanager-filename')
      await expect(filename).toHaveValue('image.png')

      const bulkUploadButton = page.locator('#field-hasManyUpload button', {
        hasText: exactText('Create New'),
      })
      await bulkUploadButton.click()

      const bulkUploadModal = page.locator('#hasManyUpload-bulk-upload-modal-slug-1')
      await expect(bulkUploadModal).toBeVisible()

      // Bulk upload multiple files - omit required field to trigger validation error
      await bulkUploadModal
        .locator('.dropzone input[type="file"]')
        .setInputFiles([
          path.resolve(dirname, './image.png'),
          path.resolve(dirname, './test-image.png'),
          path.resolve(dirname, './small.png'),
        ])

      // Do not fill in the required 'prefix' field for any of the uploads
      const saveButton = bulkUploadModal.locator('.bulk-upload--actions-bar__saveButtons button')
      await saveButton.click()

      // Should show error message for all failed files
      await expect(page.locator('.payload-toast-container')).toContainText('Failed to save 3 files')
      await closeAllToasts(page)

      // Check that each file has exactly 1 error (the missing required field)
      const errorCounts = await bulkUploadModal
        .locator('.file-selections .file-selections__fileRow .error-pill__count')
        .allTextContents()

      // All 3 files should have error count of 1
      expect(errorCounts).toEqual(['1', '1', '1'])
    })

    test('should maintain correct error counts when cycling through forms after submit with errors', async () => {
      await gotoAndWaitForForm(page, uploadsOne.create)

      await page.setInputFiles(
        '.file-manager input[type="file"]',
        path.resolve(dirname, './image.png'),
      )
      const filename = page.locator('#field-filemanager-filename')
      await expect(filename).toHaveValue('image.png')

      const bulkUploadButton = page.locator('#field-hasManyUpload button', {
        hasText: exactText('Create New'),
      })
      await bulkUploadButton.click()

      const bulkUploadModal = page.locator('#hasManyUpload-bulk-upload-modal-slug-1')
      await expect(bulkUploadModal).toBeVisible()

      // Upload 3 files
      await bulkUploadModal
        .locator('.dropzone input[type="file"]')
        .setInputFiles([
          path.resolve(dirname, './image.png'),
          path.resolve(dirname, './test-image.png'),
          path.resolve(dirname, './small.png'),
        ])

      // Form 1: Fill prefix but remove file (should have 1 error: missing file)
      await bulkUploadModal.locator('#field-prefix').fill('prefix-one')
      await bulkUploadModal.locator('.file-manager__remove').click()

      // Form 2: Omit prefix and remove file (should have 2 errors: missing file + missing prefix)
      const nextButton = bulkUploadModal.locator(
        '.bulk-upload--actions-bar__controls button:nth-of-type(2)',
      )
      await nextButton.click()
      await bulkUploadModal.locator('.file-manager__remove').click()

      // Form 3: Fill prefix and keep file (should have 0 errors - will succeed)
      await nextButton.click()
      await bulkUploadModal.locator('#field-prefix').fill('prefix-three')

      const saveButton = bulkUploadModal.locator('.bulk-upload--actions-bar__saveButtons button')
      await saveButton.click()

      // Should show mixed results: 1 successful, 2 failed
      await expect(page.locator('.payload-toast-container .toast-success')).toContainText(
        'Successfully saved 1 files',
      )
      await expect(
        page.locator('.payload-toast-container .toast-error:has-text("Failed to save 2 files")'),
      ).toBeVisible()
      await closeAllToasts(page)
      // After submission, the successful form (form 3) is removed from sidebar
      // Only the 2 failed forms remain in the sidebar
      const fileSelections = bulkUploadModal.locator('.file-selections__filesContainer')

      // Wait for the successful form to be removed and only 2 forms to remain
      const remainingRows = fileSelections.locator('button.file-selections__fileRow')
      await expect(remainingRows).toHaveCount(2, { timeout: 5000 })

      // The remaining forms are form 1 (index 0) and form 2 (index 1)
      const form1Row = remainingRows.nth(0)
      const form2Row = remainingRows.nth(1)

      // Verify initial error counts in sidebar (re-query each time to avoid stale elements)
      await expect(form1Row.locator('.error-pill__count')).toHaveText('1') // missing file
      await expect(form2Row.locator('.error-pill__count')).toHaveText('2') // missing file + missing prefix

      // Click on form 1 and verify count remains stable
      await form1Row.click()
      await expect(form1Row.locator('.error-pill__count')).toHaveText('1')

      // Click on form 2 and verify count remains stable
      await form2Row.click()
      await expect(form2Row.locator('.error-pill__count')).toHaveText('2')

      // Cycle through again to ensure counts remain stable
      await form1Row.click()
      await expect(form1Row.locator('.error-pill__count')).toHaveText('1')

      await form2Row.click()
      await expect(form2Row.locator('.error-pill__count')).toHaveText('2')

      await form1Row.click()
      await expect(form1Row.locator('.error-pill__count')).toHaveText('1')
    })

    test('should show correct error count when bulk uploading files that exceed size limit', async () => {
      await gotoAndWaitForForm(page, uploadsOne.create)

      await page.setInputFiles(
        '.file-manager input[type="file"]',
        path.resolve(dirname, './image.png'),
      )
      const filename = page.locator('#field-filemanager-filename')
      await expect(filename).toHaveValue('image.png')

      const bulkUploadButton = page.locator('#field-hasManyUpload button', {
        hasText: exactText('Create New'),
      })
      await bulkUploadButton.click()

      const bulkUploadModal = page.locator('#hasManyUpload-bulk-upload-modal-slug-1')
      await expect(bulkUploadModal).toBeVisible()

      // Bulk upload multiple files including one that exceeds the 2MB limit
      await bulkUploadModal.locator('.dropzone input[type="file"]').setInputFiles([
        path.resolve(dirname, './image.png'),
        path.resolve(dirname, './2mb.jpg'), // This file exceeds the 2MB limit
        path.resolve(dirname, './small.png'),
      ])

      // Fill in the required prefix field for all uploads
      await bulkUploadModal.locator('#field-prefix').fill('test-prefix')

      // Navigate to second file
      const nextButton = bulkUploadModal.locator(
        '.bulk-upload--actions-bar__controls button:nth-of-type(2)',
      )
      await nextButton.click()
      await bulkUploadModal.locator('#field-prefix').fill('test-prefix')

      // Navigate to third file
      await nextButton.click()
      await bulkUploadModal.locator('#field-prefix').fill('test-prefix')

      const saveButton = bulkUploadModal.locator('.bulk-upload--actions-bar__saveButtons button')
      await saveButton.click()

      // Should show mixed success/failure messages. The save processes each file
      // (incl. uploading the 2MB file that hits the size limit) sequentially, which
      // can take longer than the default expect timeout under slower adapters, so
      // wait longer for the success toast to appear.
      await expect(page.locator('.payload-toast-container .toast-success')).toContainText(
        'Successfully saved 2 files',
        { timeout: POLL_TOPASS_TIMEOUT },
      )
      await expect(
        page.locator('.payload-toast-container .toast-error:has-text("Failed to save 1 files")'),
      ).toBeVisible()
      // Verify the error message indicates file size limit
      await expect(
        page.locator('.payload-toast-container .toast-error:has-text("File size limit")'),
      ).toBeVisible()
      await closeAllToasts(page)
      // The file that exceeded the size limit should have exactly 1 error.
      // After the 2 successful files are saved and removed, only the failed file (2mb.jpg) remains.
      // It should already be active (no need to navigate).

      const errorCount = bulkUploadModal.locator('.file-selections .error-pill__count').first()
      await expect(errorCount).toHaveText('1')
    })

    test('should report failure when beforeChange hook throws non-field error', async () => {
      await page.goto(bulkUploadsHookErrorURL.list)

      await expect(page.locator('.list-header__title')).toBeVisible()

      const bulkUploadButton = page.locator('.list-header__title-actions button', {
        hasText: 'Bulk Upload',
      })
      await expect(bulkUploadButton).toBeEnabled()

      const dropzoneInput = page.locator('.dropzone input[type="file"]')
      await expect(async () => {
        await bulkUploadButton.click()
        await expect(dropzoneInput).toBeAttached({ timeout: 1500 })
      }).toPass({ intervals: [500], timeout: 5000 })

      await page
        .locator('.dropzone input[type="file"]')
        .setInputFiles([path.resolve(dirname, './image.png'), path.resolve(dirname, './small.png')])

      const nextButton = page.locator('.bulk-upload--actions-bar__controls button:nth-of-type(2)')
      await nextButton.click()

      await page.locator('#field-shouldFail').check()

      const saveButton = page.locator('.bulk-upload--actions-bar__saveButtons button')
      await saveButton.click()

      await expect(page.locator('.payload-toast-container .toast-success')).toContainText(
        'Successfully saved 1 files',
      )
      await expect(
        page.locator('.payload-toast-container .toast-error:has-text("Failed to save 1 files")'),
      ).toBeVisible()
      await expect(
        page.locator(
          '.payload-toast-container .toast-error:has-text("Simulated hook error in beforeChange")',
        ),
      ).toBeVisible()

      await expect(page.locator('.file-selections .file-selections__fileRowContainer')).toHaveCount(
        1,
      )
    })
  })

  describe('remote url fetching', () => {
    let testFileServer: TestFileServer | undefined

    beforeAll(async () => {
      testFileServer = await startTestFileServer({
        contentType: 'image/jpeg',
        data: readFileSync(path.resolve(dirname, 'test-image.jpg')),
        hostname: 'localhost',
        port: 4000,
      })
    })

    afterAll(async () => {
      if (testFileServer) {
        await testFileServer.close()
      }
    })

    test('should fetch remote URL server-side if pasteURL.allowList is defined', async () => {
      // Navigate to the upload creation page
      await gotoAndWaitForForm(page, uploadsOne.create)

      // Open the paste-from-URL modal
      const pasteURLButton = page.locator('.file-manager__upload button', { hasText: 'Paste URL' })
      await pasteURLButton.click()

      // Input the remote URL
      const remoteImage = 'http://localhost:4000/mock-cors-image'
      const inputField = page.locator('#upload-paste-url #field-url')
      await inputField.fill(remoteImage)

      // Intercept the server-side fetch to the paste-url endpoint
      const encodedImageURL = encodeURIComponent(remoteImage)
      const pasteUrlEndpoint = `/api/uploads-1/paste-url?src=${encodedImageURL}`
      const serverSideFetchPromise = page.waitForResponse(
        (response) => response.url().includes(pasteUrlEndpoint) && response.status() === 200,
        { timeout: POLL_TOPASS_TIMEOUT },
      )

      // Click the "Add file" button
      const addFileButton = page.locator('#upload-paste-url button', { hasText: 'Add file' })
      await addFileButton.click()

      // Wait for the server-side fetch to complete
      const serverSideFetch = await serverSideFetchPromise
      // Assert that the server-side fetch completed successfully
      await serverSideFetch.text()

      // Wait for the filename field to be updated
      const filenameInput = page.locator('#field-filemanager-filename')
      await expect(filenameInput).toHaveValue('mock-cors-image', { timeout: 500 })

      // Save and assert the document
      await saveDocAndAssert(page)

      // Validate the uploaded image
      const imageDetails = page.locator('.file-preview__thumbnail img')
      await expect(imageDetails).toHaveAttribute('src', /mock-cors-image/, { timeout: 500 })
    })

    test('should fail to fetch remote URL server-side if the pasteURL.allowList domains do not match', async () => {
      // Navigate to the upload creation page
      await gotoAndWaitForForm(page, uploadsTwo.create)

      // Open the paste-from-URL modal
      const pasteURLButton = page.locator('.file-manager__upload button', { hasText: 'Paste URL' })
      await pasteURLButton.click()

      // Input the remote URL
      const remoteImage = 'http://localhost:4000/mock-cors-image'
      const inputField = page.locator('#upload-paste-url #field-url')
      await inputField.fill(remoteImage)

      // Click the "Add file" button
      const addFileButton = page.locator('#upload-paste-url button', { hasText: 'Add file' })
      await addFileButton.click()

      // Verify the toast error appears with the correct message
      await expect(page.locator('.payload-toast-container .toast-error')).toContainText(
        'The provided URL is not allowed.',
      )
    })
  })

  describe('image manipulation', () => {
    // Skip until the crop tool is reworked to v4 design
    test.skip('should crop image correctly', async () => {
      const positions = {
        'bottom-right': {
          dragX: 800,
          dragY: 800,
          focalX: 75,
          focalY: 75,
        },
        'top-left': {
          dragX: 0,
          dragY: 0,
          focalX: 25,
          focalY: 25,
        },
      }
      const createFocalCrop = async (page: Page, position: 'bottom-right' | 'top-left') => {
        const { dragX, dragY, focalX, focalY } = positions[position]
        await gotoAndWaitForForm(page, mediaURL.create)

        await page.setInputFiles('input[type="file"]', path.join(dirname, 'test-image.jpg'))

        await page.locator('.file-field__edit').click()

        // set crop
        await page.locator('.edit-upload__input input[name="Width (px)"]').fill('400')
        await page.locator('.edit-upload__input input[name="Height (px)"]').fill('400')
        // set focal point
        await page.locator('.edit-upload__input input[name="X %"]').fill('25') // init left focal point
        await page.locator('.edit-upload__input input[name="Y %"]').fill('25') // init top focal point

        // hover the crop selection, position mouse outside of focal point hitbox
        await page.locator('.ReactCrop__crop-selection').hover({ position: { x: 100, y: 100 } })
        await page.mouse.down() // start drag
        await page.mouse.move(dragX, dragY) // drag selection to the lower right corner
        await page.mouse.up() // release drag

        // focal point should reset to center
        await expect(page.locator('.edit-upload__input input[name="X %"]')).toHaveValue(`${focalX}`)
        await expect(page.locator('.edit-upload__input input[name="Y %"]')).toHaveValue(`${focalY}`)

        // apply crop
        await page.locator('button:has-text("Apply Changes")').click()
        await saveDocAndAssert(page)
      }

      await createFocalCrop(page, 'bottom-right') // green square
      const greenSquareMediaID = page.url().split('/').pop() // get the ID of the doc
      await createFocalCrop(page, 'top-left') // red square
      const redSquareMediaID = page.url().split('/').pop() // get the ID of the doc

      const { doc: greenDoc } = await client.findByID({
        id: greenSquareMediaID as number | string,
        slug: mediaSlug,
        auth: true,
      })

      const { doc: redDoc } = await client.findByID({
        id: redSquareMediaID as number | string,
        slug: mediaSlug,
        auth: true,
      })

      // green and red squares should have different sizes (colors make the difference)
      expect(greenDoc.filesize).toEqual(1205)
      expect(redDoc.filesize).toEqual(1207)
    })

    test('should update image alignment based on focal point', async () => {
      const updateFocalPosition = async (page: Page) => {
        await gotoAndWaitForForm(page, focalOnlyURL.create)
        await page.setInputFiles('input[type="file"]', path.join(dirname, 'horizontal-squares.jpg'))
        // The crop/focal editor opens from the file toolbar, which appears once the file is saved
        await saveDocAndAssert(page)

        await page.locator('button[aria-label="Edit Image"]').click()

        // set focal point
        await page.locator('.edit-upload__dialog input[name="focalX"]').fill('12') // left focal point
        await page.locator('.edit-upload__dialog input[name="focalY"]').fill('50') // top focal point

        // apply focal point
        await page.locator('button:has-text("Apply Changes")').click()
        await saveDocAndAssert(page)
      }

      await updateFocalPosition(page) // red square
      const redSquareMediaID = page.url().split('/').pop() // get the ID of the doc

      const { doc: redDoc } = await client.findByID({
        id: redSquareMediaID as number | string,
        slug: focalOnlySlug,
        auth: true,
      })

      // without focal point update this generated size was equal to 1736
      await expect.poll(() => redDoc.sizes.focalTest.filesize).toBe(1586)
    })

    test('should resize image after crop if resizeOptions defined', async () => {
      await gotoAndWaitForForm(page, animatedTypeMediaURL.create)

      await page.setInputFiles('input[type="file"]', path.join(dirname, 'test-image.jpg'))
      // The crop editor opens from the file toolbar, which appears once the file is saved
      await saveDocAndAssert(page)

      await page.locator('button[aria-label="Edit Image"]').click()

      // set crop
      await page.locator('input[name="cropWidth"]').fill('400')
      await page.locator('input[name="cropHeight"]').fill('800')
      // set focal point
      await page.locator('.edit-upload__dialog input[name="focalX"]').fill('75') // init left focal point
      await page.locator('.edit-upload__dialog input[name="focalY"]').fill('50') // init top focal point

      await page.locator('button:has-text("Apply Changes")').click()
      await saveDocAndAssert(page)

      const resizeOptionMedia = page.locator('.file-preview__info-meta')
      await expect(resizeOptionMedia).toContainText('200 × 200')
    })

    test('should allow incrementing crop dimensions back to original maximum size', async () => {
      await gotoAndWaitForForm(page, mediaURL.create)

      await page.setInputFiles('input[type="file"]', path.join(dirname, 'test-image.jpg'))
      // The crop editor opens from the file toolbar, which appears once the file is saved
      await saveDocAndAssert(page)

      await page.locator('button[aria-label="Edit Image"]').click()

      const widthInput = page.locator('input[name="cropWidth"]')
      const heightInput = page.locator('input[name="cropHeight"]')

      await expect(widthInput).toHaveValue('800')
      await expect(heightInput).toHaveValue('800')

      await widthInput.fill('799')
      await expect(widthInput).toHaveValue('799')

      // Increment back to original using arrow up
      await widthInput.press('ArrowUp')
      await expect(widthInput).toHaveValue('800')

      await heightInput.fill('799')
      await expect(heightInput).toHaveValue('799')

      // Increment back to original using arrow up
      await heightInput.press('ArrowUp')
      await expect(heightInput).toHaveValue('800')
    })
  })

  test('should see upload previews in relation list if allowed in config', async () => {
    await page.goto(relationPreviewURL.list)

    // Show all columns with relations
    await toggleColumn(page, { columnLabel: 'Image Without Preview2', targetState: 'on' })
    await toggleColumn(page, { columnLabel: 'Image With Preview3', targetState: 'on' })
    await toggleColumn(page, { columnLabel: 'Image Without Preview3', targetState: 'on' })

    // Wait for the columns to be displayed
    await expect(page.locator('.cell-imageWithoutPreview3')).toBeVisible()

    // collection's displayPreview: true, field's displayPreview: unset
    const relationPreview1 = page.locator('.cell-imageWithPreview1 img')
    await expect(relationPreview1).toBeVisible()
    // collection's displayPreview: true, field's displayPreview: true
    const relationPreview2 = page.locator('.cell-imageWithPreview2 img')
    await expect(relationPreview2).toBeVisible()
    // collection's displayPreview: true, field's displayPreview: false
    const relationPreview3 = page.locator('.cell-imageWithoutPreview1 img')
    await expect(relationPreview3).toBeHidden()
    // collection's displayPreview: false, field's displayPreview: unset
    const relationPreview4 = page.locator('.cell-imageWithoutPreview2 img')
    await expect(relationPreview4).toBeHidden()
    // collection's displayPreview: false, field's displayPreview: true
    const relationPreview5 = page.locator('.cell-imageWithPreview3 img')
    await expect(relationPreview5).toBeVisible()
    // collection's displayPreview: false, field's displayPreview: false
    const relationPreview6 = page.locator('.cell-imageWithoutPreview3 img')
    await expect(relationPreview6).toBeHidden()
  })

  test('should hide file input when disableCreateFileInput is true on collection create', async () => {
    await page.goto(hideFileInputOnCreateURL.create)
    await expect(page.locator('.file-manager__upload')).toBeHidden()
  })

  test('should hide bulk upload from list view when disableCreateFileInput is true', async () => {
    await page.goto(hideFileInputOnCreateURL.list)
    await expect(page.locator('.list-header')).not.toContainText('Bulk Upload')
  })

  test('should hide remove button in file input when hideRemove is true', async () => {
    const doc = await payload.create({
      collection: hideFileInputOnCreateSlug,
      data: {
        title: 'test',
      },
    })
    await page.goto(hideFileInputOnCreateURL.edit(doc.id))

    await expect(page.locator('.file-field .file-details__remove')).toBeHidden()
  })

  test('should skip applying resizeOptions after updating an image if resizeOptions.withoutEnlargement is true and the original image size is smaller than the dimensions defined in resizeOptions', async () => {
    await gotoAndWaitForForm(page, withoutEnlargementResizeOptionsURL.create)

    await page.setInputFiles('input[type="file"]', path.join(dirname, 'test-image.jpg'))
    await saveDocAndAssert(page)

    await page.locator('button[aria-label="Edit Image"]').click()

    // no need to make any changes to the image if resizeOptions.withoutEnlargement is actually being respected now
    await page.locator('button:has-text("Apply Changes")').click()
    await saveDocAndAssert(page)

    const resizeOptionMedia = page.locator('.file-preview__info-meta')

    // expect the image to be the original size since the original image is smaller than the dimensions defined in resizeOptions
    await expect(resizeOptionMedia).toContainText('800 × 800')
  })

  describe('imageSizes best fit', () => {
    test('should select adminThumbnail if one exists', async () => {
      await page.goto(bestFitURL.create)
      await page.locator('#field-withAdminThumbnail button.upload__listToggler').click()
      await page.locator('tr.row-1 td.cell-filename button.default-cell__first-cell').click()
      const thumbnail = page.locator('#field-withAdminThumbnail div.thumbnail > img')
      await expect(thumbnail).toHaveAttribute('src', adminThumbnailFunctionSrcPattern)
    })

    test('should select an image within target range', async () => {
      await gotoAndWaitForForm(page, bestFitURL.create)
      await page.locator('#field-withinRange button.upload__createNewToggler').click()
      await page.setInputFiles('input[type="file"]', path.join(dirname, 'test-image.jpg'))
      await page.locator('dialog button#action-save').click()
      const thumbnail = page.locator('#field-withinRange div.thumbnail > img')
      await expect(thumbnail).toHaveAttribute(
        'src',
        /\/api\/enlarge\/file\/test-image-180x50\.jpg(\?.*)?$/,
      )
    })

    test('should select next smallest image outside of range but smaller than original', async () => {
      await gotoAndWaitForForm(page, bestFitURL.create)
      await page.locator('#field-nextSmallestOutOfRange button.upload__createNewToggler').click()
      await page.setInputFiles('input[type="file"]', path.join(dirname, 'test-image.jpg'))
      await page.locator('dialog button#action-save').click()
      const thumbnail = page.locator('#field-nextSmallestOutOfRange div.thumbnail > img')
      await expect(thumbnail).toHaveAttribute(
        'src',
        /\/api\/focal-only\/file\/test-image-400x300\.jpg(\?.*)?$/,
      )
    })

    test('should select original if smaller than next available size', async () => {
      await gotoAndWaitForForm(page, bestFitURL.create)
      await page.locator('#field-original button.upload__createNewToggler').click()
      await page.setInputFiles('input[type="file"]', path.join(dirname, 'small.png'))
      await page.locator('dialog button#action-save').click()
      const thumbnail = page.locator('#field-original div.thumbnail > img')
      await expect(thumbnail).toHaveAttribute('src', /\/api\/focal-only\/file\/small\.png(\?.*)?$/)
    })
  })

  test('should show correct image preview or placeholder after paginating', async () => {
    await page.goto(listViewPreviewURL.list)
    const firstRow = page.locator('.row-1')

    const imageUploadCell = firstRow.locator('.cell-imageUpload .relationship-cell')
    await expect(imageUploadCell).toHaveText('<No Image Upload>')

    const imageRelationshipCell = firstRow.locator('.cell-imageRelationship .relationship-cell')
    await expect(imageRelationshipCell).toHaveText('<No Image Relationship>')

    // Navigate to page 2 using the right arrow
    const nextPageButton = page.locator('.clickable-arrow--right')
    await expect(nextPageButton).toBeVisible()
    await nextPageButton.click()

    const imageUploadImg = imageUploadCell.locator('.thumbnail')
    await expect(imageUploadImg).toBeVisible()
    await expect(imageRelationshipCell).toHaveText('image.png')

    // Navigate back to page 1 using the left arrow
    const prevPageButton = page.locator('.clickable-arrow--left')
    await expect(prevPageButton).toBeVisible()
    await prevPageButton.click()

    await expect(imageUploadCell).toHaveText('<No Image Upload>')
    await expect(imageRelationshipCell).toHaveText('<No Image Relationship>')
  })

  test('should respect Sharp constructorOptions', async () => {
    await gotoAndWaitForForm(page, constructorOptionsURL.create)

    await page.setInputFiles('input[type="file"]', path.resolve(dirname, './animated.webp'))

    const filename = page.locator('#field-filemanager-filename')

    await expect(filename).toHaveValue('animated.webp')
    await saveDocAndAssert(page, '#action-save', 'error')
  })

  test('should prevent invalid mimetype disguised as valid mimetype', async () => {
    await gotoAndWaitForForm(page, fileMimeTypeURL.create)
    await page.setInputFiles('input[type="file"]', path.resolve(dirname, './image-as-pdf.pdf'))

    const filename = page.locator('#field-filemanager-filename')
    await expect(filename).toHaveValue('image-as-pdf.pdf')

    await saveDocAndAssert(page, '#action-save', 'error')
  })

  test('should not rewrite file when updating collection fields', async () => {
    await gotoAndWaitForForm(page, mediaURL.create)
    await page.setInputFiles('input[type="file"]', path.resolve(dirname, './test-image.png'))
    await saveDocAndAssert(page)
    const imageID = page.url().split('/').pop()!
    const { doc } = await client.findByID({ id: imageID, slug: mediaSlug, auth: true })
    const filename = doc.filename as string
    const filePath = path.resolve(dirname, 'media', filename)
    const before = statSync(filePath)

    const altField = page.locator('#field-alt')
    await altField.fill('test alt')

    await saveDocAndAssert(page)
    const after = statSync(filePath)
    expect(after.mtime.getTime()).toEqual(before.mtime.getTime())
  })

  test('should be able to replace the file even if the user doesnt have delete access', async () => {
    const docID = (await payload.find({ collection: mediaWithoutDeleteAccessSlug, limit: 1 }))
      .docs[0]?.id as string
    await gotoAndWaitForForm(page, mediaWithoutDeleteAccessURL.edit(docID))
    // Replacing the file is available even without delete access
    await page.locator('.file-toolbar__filename-btn').click()
    const replaceButton = page.locator('.popup-button-list__button', { hasText: 'Replace file' })
    await expect(replaceButton).toBeVisible()
    await replaceButton.click()
    await expect(page.locator('.file-manager input[type="file"]')).toBeAttached()
    await page.setInputFiles(
      '.file-manager input[type="file"]',
      path.join(dirname, 'test-image.jpg'),
    )
    const filename = page.locator('#field-filemanager-filename')
    await expect(filename).toHaveValue('test-image.jpg')
    await saveDocAndAssert(page)
    const filenameFromAPI = (
      await payload.find({ collection: mediaWithoutDeleteAccessSlug, limit: 1 })
    ).docs[0]?.filename
    expect(filenameFromAPI).toBe('test-image.jpg')
  })

  test('should not show image sizes in column selector in list view if imageSize has admin.disableListColumn true', async () => {
    await page.goto(mediaWithImageSizeAdminPropsURL.list)

    await openListColumns(page, {})

    await expect(
      getColumnSelectorItem({
        container: page.locator('.popup__content .column-selector'),
        label: 'Sizes > one > URL',
      }),
    ).toBeHidden()
    await expect(
      getColumnSelectorItem({
        container: page.locator('.popup__content .column-selector'),
        label: 'Sizes > one > Width',
      }),
    ).toBeHidden()
    await expect(
      getColumnSelectorItem({
        container: page.locator('.popup__content .column-selector'),
        label: 'Sizes > one > Height',
      }),
    ).toBeHidden()
    await expect(
      getColumnSelectorItem({
        container: page.locator('.popup__content .column-selector'),
        label: 'Sizes > one > MIME Type',
      }),
    ).toBeHidden()
    await expect(
      getColumnSelectorItem({
        container: page.locator('.popup__content .column-selector'),
        label: 'Sizes > one > File Size',
      }),
    ).toBeHidden()
    await expect(
      getColumnSelectorItem({
        container: page.locator('.popup__content .column-selector'),
        label: 'Sizes > one > File Name',
      }),
    ).toBeHidden()

    await expect(
      getColumnSelectorItem({
        container: page.locator('.popup__content .column-selector'),
        label: 'Sizes > two > URL',
      }),
    ).toBeHidden()
    await expect(
      getColumnSelectorItem({
        container: page.locator('.popup__content .column-selector'),
        label: 'Sizes > two > Width',
      }),
    ).toBeHidden()
    await expect(
      getColumnSelectorItem({
        container: page.locator('.popup__content .column-selector'),
        label: 'Sizes > two > Height',
      }),
    ).toBeHidden()
    await expect(
      getColumnSelectorItem({
        container: page.locator('.popup__content .column-selector'),
        label: 'Sizes > two > MIME Type',
      }),
    ).toBeHidden()
    await expect(
      getColumnSelectorItem({
        container: page.locator('.popup__content .column-selector'),
        label: 'Sizes > two > File Size',
      }),
    ).toBeHidden()
    await expect(
      getColumnSelectorItem({
        container: page.locator('.popup__content .column-selector'),
        label: 'Sizes > two > File Name',
      }),
    ).toBeHidden()
  })

  test('should show image size in column selector in list view if imageSize has admin.disableListColumn false', async () => {
    await page.goto(mediaWithImageSizeAdminPropsURL.list)

    await openListColumns(page, {})

    await expect(
      getColumnSelectorItem({
        container: page.locator('.popup__content .column-selector'),
        label: 'Sizes > three > URL',
      }),
    ).toBeVisible()
    await expect(
      getColumnSelectorItem({
        container: page.locator('.popup__content .column-selector'),
        label: 'Sizes > three > Width',
      }),
    ).toBeVisible()
    await expect(
      getColumnSelectorItem({
        container: page.locator('.popup__content .column-selector'),
        label: 'Sizes > three > Height',
      }),
    ).toBeVisible()
    await expect(
      getColumnSelectorItem({
        container: page.locator('.popup__content .column-selector'),
        label: 'Sizes > three > MIME Type',
      }),
    ).toBeVisible()
    await expect(
      getColumnSelectorItem({
        container: page.locator('.popup__content .column-selector'),
        label: 'Sizes > three > File Size',
      }),
    ).toBeVisible()
    await expect(
      getColumnSelectorItem({
        container: page.locator('.popup__content .column-selector'),
        label: 'Sizes > three > File Name',
      }),
    ).toBeVisible()

    await expect(
      getColumnSelectorItem({
        container: page.locator('.popup__content .column-selector'),
        label: 'Sizes > four > URL',
      }),
    ).toBeVisible()
    await expect(
      getColumnSelectorItem({
        container: page.locator('.popup__content .column-selector'),
        label: 'Sizes > four > Width',
      }),
    ).toBeVisible()
    await expect(
      getColumnSelectorItem({
        container: page.locator('.popup__content .column-selector'),
        label: 'Sizes > four > Height',
      }),
    ).toBeVisible()
    await expect(
      getColumnSelectorItem({
        container: page.locator('.popup__content .column-selector'),
        label: 'Sizes > four > MIME Type',
      }),
    ).toBeVisible()
    await expect(
      getColumnSelectorItem({
        container: page.locator('.popup__content .column-selector'),
        label: 'Sizes > four > File Size',
      }),
    ).toBeVisible()
    await expect(
      getColumnSelectorItem({
        container: page.locator('.popup__content .column-selector'),
        label: 'Sizes > four > File Name',
      }),
    ).toBeVisible()
  })

  test('should not show image size in where filter drodown in list view if imageSize has admin.disableListFilter true', async () => {
    await page.goto(mediaWithImageSizeAdminPropsURL.list)

    await openListFilters(page, {})

    const whereBuilder = page.locator('.where-builder')

    const conditionField = whereBuilder.locator('.condition__field')
    await conditionField.click()

    const menuList = getSelectMenu({ page })

    // ensure the image size is not present
    await expect(menuList.getByText('Sizes > one > Width', { exact: true })).toHaveCount(0)
    await expect(menuList.getByText('Sizes > one > Height', { exact: true })).toHaveCount(0)
    await expect(menuList.getByText('Sizes > one > MIME Type', { exact: true })).toHaveCount(0)
    await expect(menuList.getByText('Sizes > one > File Size', { exact: true })).toHaveCount(0)
    await expect(menuList.getByText('Sizes > one > File Name', { exact: true })).toHaveCount(0)

    await expect(menuList.getByText('Sizes > three > URL', { exact: true })).toHaveCount(0)
    await expect(menuList.getByText('Sizes > three > Width', { exact: true })).toHaveCount(0)
    await expect(menuList.getByText('Sizes > three > Height', { exact: true })).toHaveCount(0)
    await expect(menuList.getByText('Sizes > three > MIME Type', { exact: true })).toHaveCount(0)
    await expect(menuList.getByText('Sizes > three > File Size', { exact: true })).toHaveCount(0)
    await expect(menuList.getByText('Sizes > three > File Name', { exact: true })).toHaveCount(0)
  })

  test('should show image size in where filter drodown in list view if imageSize has admin.disableListFilter false', async () => {
    await page.goto(mediaWithImageSizeAdminPropsURL.list)

    await openListFilters(page, {})

    const whereBuilder = page.locator('.where-builder')

    const conditionField = whereBuilder.locator('.condition__field')
    await conditionField.click()

    const menuList = getSelectMenu({ page })

    // ensure the image size is present
    await expect(menuList.getByText('Sizes > two > URL', { exact: true })).toHaveCount(1)
    await expect(menuList.getByText('Sizes > two > Width', { exact: true })).toHaveCount(1)
    await expect(menuList.getByText('Sizes > two > Height', { exact: true })).toHaveCount(1)
    await expect(menuList.getByText('Sizes > two > MIME Type', { exact: true })).toHaveCount(1)
    await expect(menuList.getByText('Sizes > two > File Size', { exact: true })).toHaveCount(1)
    await expect(menuList.getByText('Sizes > two > File Name', { exact: true })).toHaveCount(1)

    await expect(menuList.getByText('Sizes > four > URL', { exact: true })).toHaveCount(1)
    await expect(menuList.getByText('Sizes > four > Width', { exact: true })).toHaveCount(1)
    await expect(menuList.getByText('Sizes > four > Height', { exact: true })).toHaveCount(1)
    await expect(menuList.getByText('Sizes > four > MIME Type', { exact: true })).toHaveCount(1)
    await expect(menuList.getByText('Sizes > four > File Size', { exact: true })).toHaveCount(1)
    await expect(menuList.getByText('Sizes > four > File Name', { exact: true })).toHaveCount(1)
  })

  test('should allow saving other fields after changing file', async () => {
    await gotoAndWaitForForm(page, uploadsTwo.create)

    // Upload initial file with required field
    await page.setInputFiles('input[type="file"]', path.resolve(dirname, './image.png'))
    await page.locator('#field-prefix').fill('initial')
    await saveDocAndAssert(page)

    // Change the file via the toolbar replace action
    await page.locator('.file-toolbar__filename-btn').click()
    await page.locator('.popup-button-list__button', { hasText: 'Replace file' }).click()
    await page.setInputFiles(
      '.file-manager input[type="file"]',
      path.resolve(dirname, './test-image.jpg'),
    )
    await saveDocAndAssert(page)

    // Modify another field and save - this should work without errors
    await page.locator('#field-title').fill('updated title')
    await saveDocAndAssert(page)

    const titleField = page.locator('#field-title')
    await expect(titleField).toHaveValue('updated title')
  })

  test('should show the file preview for the new file after saving a replaced file', async () => {
    await gotoAndWaitForForm(page, uploadsTwo.create)

    await page.setInputFiles('input[type="file"]', path.resolve(dirname, './image.png'))
    await page.locator('#field-prefix').fill('initial')
    await saveDocAndAssert(page)

    await page.locator('.file-toolbar__filename-btn').click()
    await page.locator('.popup-button-list__button', { hasText: 'Replace file' }).click()
    await page.setInputFiles(
      '.file-manager input[type="file"]',
      path.resolve(dirname, './test-image.jpg'),
    )
    await saveDocAndAssert(page)

    await expect(page.locator('.file-toolbar__filename-btn')).toBeVisible()
    await expect(page.locator('.file-toolbar__filename-text')).toContainText('test-image')
    await expect(page.locator('.file-manager .dropzone')).toBeHidden()
  })

  test('should allow cancelling a replace before selecting a new file', async () => {
    await gotoAndWaitForForm(page, uploadsTwo.create)

    await page.setInputFiles('input[type="file"]', path.resolve(dirname, './image.png'))
    await page.locator('#field-prefix').fill('initial')
    await saveDocAndAssert(page)

    await page.locator('.file-toolbar__filename-btn').click()
    await page.locator('.popup-button-list__button', { hasText: 'Replace file' }).click()

    await expect(page.locator('.file-manager .dropzone')).toBeVisible()

    await page.locator('.file-manager__remove').click()

    await expect(page.locator('.file-toolbar__filename-btn')).toBeVisible()
    await expect(page.locator('.file-toolbar__filename-text')).toContainText('image')
    await expect(page.locator('.file-manager .dropzone')).toBeHidden()
  })

  test('should show data in drawer when editing relationship to upload collection with filesRequiredOnCreate: false', async () => {
    const uploadDoc = await payload.create({
      collection: noFilesRequiredSlug,
      data: {
        title: 'Upload without file',
      },
    })

    const relationDoc = await payload.create({
      collection: relationToNoFilesRequiredSlug,
      data: {
        title: 'Relation document',
        uploadField: uploadDoc.id,
      },
    })

    await page.goto(relationToNoFilesRequiredURL.edit(relationDoc.id))

    await expect(page.locator('#field-uploadField')).toBeVisible()

    await page.locator('#field-uploadField').getByRole('button', { name: 'Edit' }).click()

    const drawer = page.locator('[id^=doc-drawer_no-files-required_]')
    await expect(drawer).toBeVisible()

    const titleField = drawer.locator('#field-title')

    await expect(titleField).toHaveValue('Upload without file')
  })

  test('should upload and serve file with # and % in filename', async () => {
    await gotoAndWaitForForm(page, mediaURL.create)

    const imageBuffer = readFileSync(path.resolve(dirname, './image.png'))

    await page.setInputFiles('input[type="file"]', {
      name: 'file%20#hash.png',
      buffer: imageBuffer,
      mimeType: 'image/png',
    })

    const filenameField = page.locator('#field-filemanager-filename')
    await expect(filenameField).toHaveValue('file%20#hash.png')

    await saveDocAndAssert(page)

    // After saving, the file URL (the toolbar "open in new tab" link) must have # and % encoded
    const fileUrlLink = page.locator('.file-toolbar__right a[target="_blank"]')
    await expect(fileUrlLink).toHaveAttribute('href')

    const href = await fileUrlLink.getAttribute('href')
    expect(href).toContain('%23') // # encoded
    expect(href).toContain('%25') // % encoded
    expect(href).not.toContain('#') // no literal #

    // Navigating to the file URL must return 200
    const response = await page.goto(`${serverURL}${href}`)
    expect(response?.status()).toBe(200)
  })

  describe('filePreview custom components', () => {
    test('should render single custom filePreview for any file type', async () => {
      const imageDoc = (
        await payload.find({
          collection: adminUploadFilePreviewSingleSlug,
          depth: 0,
          limit: 1,
          where: { mimeType: { equals: 'image/png' } },
        })
      ).docs[0]

      await page.goto(adminUploadFilePreviewSingleURL.edit(imageDoc!.id))
      await waitForFormReady(page)

      await expect(page.locator('#custom-file-preview-single')).toBeVisible()
      await expect(page.locator('.file-preview__image-wrap .thumbnail')).toBeHidden()
    })

    test('should pass mimeType as clientProp to filePreview component', async () => {
      const audioDoc = (
        await payload.find({
          collection: adminUploadFilePreviewSingleSlug,
          depth: 0,
          limit: 1,
          where: { mimeType: { equals: 'audio/mpeg' } },
        })
      ).docs[0]

      await page.goto(adminUploadFilePreviewSingleURL.edit(audioDoc!.id))
      await waitForFormReady(page)

      await expect(page.locator('#custom-file-preview-single')).toHaveAttribute(
        'data-mime-type',
        'audio/mpeg',
      )
    })

    test('should render filePreview matched by exact MIME type', async () => {
      const pdfDoc = (
        await payload.find({
          collection: adminUploadFilePreviewMapSlug,
          depth: 0,
          limit: 1,
          where: { mimeType: { equals: 'application/pdf' } },
        })
      ).docs[0]

      await page.goto(adminUploadFilePreviewMapURL.edit(pdfDoc!.id))
      await waitForFormReady(page)

      await expect(page.locator('#custom-file-preview-pdf')).toBeVisible()
      // Assert the inner element rendered from `fileSrc` is present so the test fails if `fileSrc`
      // stops being passed through to the matched component.
      await expect(page.locator('#custom-file-preview-pdf span')).toBeVisible()
    })

    test('should render filePreview matched by category wildcard', async () => {
      const audioDoc = (
        await payload.find({
          collection: adminUploadFilePreviewMapSlug,
          depth: 0,
          limit: 1,
          where: { mimeType: { equals: 'audio/mpeg' } },
        })
      ).docs[0]

      await page.goto(adminUploadFilePreviewMapURL.edit(audioDoc!.id))
      await waitForFormReady(page)

      await expect(page.locator('#custom-file-preview-audio')).toBeVisible()
      // Assert the inner media element renders so the test fails if `fileSrc` stops being passed
      // through to the matched component.
      await expect(page.locator('#custom-file-preview-audio audio')).toBeAttached()
    })

    test('should render filePreview matched by video category wildcard', async () => {
      const videoDoc = (
        await payload.find({
          collection: adminUploadFilePreviewMapSlug,
          depth: 0,
          limit: 1,
          where: { mimeType: { equals: 'video/mp4' } },
        })
      ).docs[0]

      await page.goto(adminUploadFilePreviewMapURL.edit(videoDoc!.id))
      await waitForFormReady(page)

      await expect(page.locator('#file-preview[data-mime-category="video"]')).toBeVisible()
      // Assert the inner media element renders so the test fails if `fileSrc` stops being passed
      // through to the matched component.
      await expect(page.locator('#file-preview video')).toBeAttached()
    })

    test('should fall back to default Thumbnail when no filePreview matches', async () => {
      const imageDoc = (
        await payload.find({
          collection: adminUploadFilePreviewMapSlug,
          depth: 0,
          limit: 1,
          where: { mimeType: { equals: 'image/png' } },
        })
      ).docs[0]

      await page.goto(adminUploadFilePreviewMapURL.edit(imageDoc!.id))
      await waitForFormReady(page)

      await expect(page.locator('.file-preview__image-wrap .thumbnail')).toBeVisible()
      await expect(page.locator('#custom-file-preview-pdf')).toBeHidden()
      await expect(page.locator('#custom-file-preview-audio')).toBeHidden()
    })
  })

  describe('filePreview switch-case component', () => {
    test('should render image branch for image uploads', async () => {
      const imageDoc = (
        await payload.find({
          collection: filePreviewSlug,
          depth: 0,
          limit: 1,
          where: { mimeType: { equals: 'image/png' } },
        })
      ).docs[0]

      await page.goto(filePreviewURL.edit(imageDoc!.id))
      await waitForFormReady(page)

      await expect(page.locator('#file-preview[data-mime-category="image"]')).toBeVisible()
      await expect(page.locator('#file-preview img')).toBeVisible()
    })

    test('should render audio branch for audio uploads', async () => {
      const audioDoc = (
        await payload.find({
          collection: filePreviewSlug,
          depth: 0,
          limit: 1,
          where: { mimeType: { equals: 'audio/mpeg' } },
        })
      ).docs[0]

      await page.goto(filePreviewURL.edit(audioDoc!.id))
      await waitForFormReady(page)

      await expect(page.locator('#file-preview[data-mime-category="audio"]')).toBeVisible()
      await expect(page.locator('#file-preview audio')).toBeVisible()
    })
  })

  describe('built-in file previews', () => {
    test('should render the native audio player for audio uploads', async () => {
      const audioDoc = (
        await payload.find({
          collection: mediaSlug,
          depth: 0,
          limit: 1,
          where: { mimeType: { equals: 'audio/mpeg' } },
        })
      ).docs[0]

      await page.goto(mediaURL.edit(audioDoc!.id))
      await waitForFormReady(page)

      await expect(page.locator('audio.audio-preview')).toBeVisible()
      await expect(page.locator('.file-preview__thumbnail')).toBeHidden()
    })

    test('should render a browser iframe for PDF uploads', async () => {
      const pdfDoc = (
        await payload.find({
          collection: mediaSlug,
          depth: 0,
          limit: 1,
          where: { mimeType: { equals: 'application/pdf' } },
        })
      ).docs[0]

      await page.goto(mediaURL.edit(pdfDoc!.id))
      await waitForFormReady(page)

      await expect(page.locator('iframe.pdf-preview')).toBeVisible()
    })

    test('should fall back to the thumbnail for image uploads', async () => {
      const imageDoc = (
        await payload.find({
          collection: mediaSlug,
          depth: 0,
          limit: 1,
          where: { mimeType: { equals: 'image/png' } },
        })
      ).docs[0]

      await page.goto(mediaURL.edit(imageDoc!.id))
      await waitForFormReady(page)

      await expect(page.locator('.file-preview__thumbnail')).toBeVisible()
      await expect(page.locator('.audio-preview')).toBeHidden()
      await expect(page.locator('.pdf-preview')).toBeHidden()
    })

    test('should render the native video player for video uploads', async () => {
      const videoDoc = (
        await payload.find({
          collection: mediaSlug,
          depth: 0,
          limit: 1,
          where: { mimeType: { equals: 'video/mp4' } },
        })
      ).docs[0]

      await page.goto(mediaURL.edit(videoDoc!.id))
      await waitForFormReady(page)

      await expect(page.locator('video.video-preview')).toBeVisible()
    })
  })
})
