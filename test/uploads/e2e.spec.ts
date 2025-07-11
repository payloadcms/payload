import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import { toggleColumn } from 'helpers/e2e/toggleColumn.js'
import { openDocDrawer } from 'helpers/e2e/toggleDocDrawer.js'
import path from 'path'
import { wait } from 'payload/shared'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../helpers/sdk/index.js'
import type { Config } from './payload-types.js'

import {
  ensureCompilationIsDone,
  exactText,
  initPageConsoleErrorCatch,
  saveDocAndAssert,
} from '../helpers.js'
import { AdminUrlUtil } from '../helpers/adminUrlUtil.js'
import { assertToastErrors } from '../helpers/assertToastErrors.js'
import { initPayloadE2ENoConfig } from '../helpers/initPayloadE2ENoConfig.js'
import { reInitializeDB } from '../helpers/reInitializeDB.js'
import { RESTClient } from '../helpers/rest.js'
import { POLL_TOPASS_TIMEOUT, TEST_TIMEOUT_LONG } from '../playwright.config.js'
import {
  adminThumbnailFunctionSlug,
  adminThumbnailSizeSlug,
  adminThumbnailWithSearchQueries,
  adminUploadControlSlug,
  animatedTypeMedia,
  audioSlug,
  bulkUploadsSlug,
  constructorOptionsSlug,
  customFileNameMediaSlug,
  customUploadFieldSlug,
  fileMimeTypeSlug,
  focalOnlySlug,
  hideFileInputOnCreateSlug,
  imageSizesOnlySlug,
  listViewPreviewSlug,
  mediaSlug,
  mediaWithoutCacheTagsSlug,
  relationPreviewSlug,
  relationSlug,
  threeDimensionalSlug,
  withMetadataSlug,
  withOnlyJPEGMetadataSlug,
  withoutEnlargeSlug,
  withoutMetadataSlug,
} from './shared.js'
import { startMockCorsServer } from './startMockCorsServer.js'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

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
let fileMimeTypeURL: AdminUrlUtil

describe('Uploads', () => {
  let page: Page
  let mockCorsServer: ReturnType<typeof startMockCorsServer> | undefined

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
    fileMimeTypeURL = new AdminUrlUtil(serverURL, fileMimeTypeSlug)

    const context = await browser.newContext()
    page = await context.newPage()

    const { consoleErrors, collectErrors, stopCollectingErrors } = initPageConsoleErrorCatch(page, {
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
    })

    if (client) {
      await client.logout()
    }
    client = new RESTClient({ defaultSlug: 'users', serverURL })
    await client.login()

    await ensureCompilationIsDone({ page, serverURL })
  })

  afterAll(() => {
    if (mockCorsServer) {
      mockCorsServer.close()
    }
  })

  test('should show upload filename in upload collection list', async () => {
    await page.goto(mediaURL.list)
    const audioUpload = page.locator('tr.row-1 .cell-filename')
    await expect(audioUpload).toHaveText('audio.mp3')

    const imageUpload = page.locator('tr.row-2 .cell-filename')
    await expect(imageUpload).toHaveText('image.png')
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

    await page.locator('.upload-relationship-details__edit').nth(0).click()
    await page.locator('.file-details__remove').click()

    await page.setInputFiles('input[type="file"]', path.join(dirname, 'test-image.jpg'))
    await saveDocAndAssert(page, '.doc-drawer button#action-save')

    await page.locator('.doc-drawer__header-close').click()

    await expect(filename).toContainText('test-image.png')
  })

  test('should create file upload', async () => {
    await page.goto(mediaURL.create)
    await page.setInputFiles('input[type="file"]', path.resolve(dirname, './image.png'))

    const filename = page.locator('.file-field__filename')

    await expect(filename).toHaveValue('image.png')

    await saveDocAndAssert(page)
  })

  test('should remove remote URL button if pasteURL is false', async () => {
    // pasteURL option is set to false in the media collection
    await page.goto(mediaURL.create)

    const pasteURLButton = page.locator('.file-field__upload button', {
      hasText: 'Paste URL',
    })
    await expect(pasteURLButton).toBeHidden()
  })

  test('should properly create IOS file upload', async () => {
    await page.goto(mediaURL.create)

    await page.setInputFiles('input[type="file"]', path.resolve(dirname, './ios-image.jpeg'))

    const filename = page.locator('.file-field__filename')

    await expect(filename).toHaveValue('ios-image.jpeg')

    await saveDocAndAssert(page)
  })

  test('should properly convert avif image to png', async () => {
    await page.goto(mediaURL.create)

    await page.setInputFiles('input[type="file"]', path.resolve(dirname, './test-image-avif.avif'))
    const filename = page.locator('.file-field__filename')
    await expect(filename).toHaveValue('test-image-avif.avif')

    await saveDocAndAssert(page)

    const fileMetaSizeType = page.locator('.file-meta__size-type')
    await expect(fileMetaSizeType).toHaveText(/image\/png/)
  })

  test('should show proper mimetype for glb file', async () => {
    await page.goto(threeDimensionalURL.create)

    await page.setInputFiles('input[type="file"]', path.resolve(dirname, './duck.glb'))
    const filename = page.locator('.file-field__filename')
    await expect(filename).toHaveValue('duck.glb')

    await saveDocAndAssert(page)

    const fileMetaSizeType = page.locator('.file-meta__size-type')
    await expect(fileMetaSizeType).toHaveText(/model\/gltf-binary/)
  })

  test('should create animated file upload', async () => {
    await page.goto(animatedTypeMediaURL.create)

    await page.setInputFiles('input[type="file"]', path.resolve(dirname, './animated.webp'))
    const animatedFilename = page.locator('.file-field__filename')

    await expect(animatedFilename).toHaveValue('animated.webp')

    await saveDocAndAssert(page)

    await page.goto(animatedTypeMediaURL.create)

    await page.setInputFiles('input[type="file"]', path.resolve(dirname, './non-animated.webp'))
    const nonAnimatedFileName = page.locator('.file-field__filename')

    await expect(nonAnimatedFileName).toHaveValue('non-animated.webp')

    await saveDocAndAssert(page)
  })

  test('should show proper file names for resized animated file', async () => {
    await page.goto(animatedTypeMediaURL.create)

    await page.setInputFiles('input[type="file"]', path.resolve(dirname, './animated.webp'))
    const animatedFilename = page.locator('.file-field__filename')

    await expect(animatedFilename).toHaveValue('animated.webp')

    await saveDocAndAssert(page)

    await page.locator('.file-field__previewSizes').click()

    const smallSquareFilename = page
      .locator('.preview-sizes__list .preview-sizes__sizeOption')
      .nth(1)
      .locator('.file-meta__url a')
    await expect(smallSquareFilename).toContainText(/480x480\.webp$/)
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

    await page.goto(mediaURL.edit(pngDoc!.id))

    await page.locator('.file-field__previewSizes').click()

    const maintainedAspectRatioItem = page
      .locator('.preview-sizes__list .preview-sizes__sizeOption')
      .nth(1)
      .locator('.file-meta__size-type')
    await expect(maintainedAspectRatioItem).toContainText('1024x1024')

    const differentFormatFromMainImageMeta = page
      .locator('.preview-sizes__list .preview-sizes__sizeOption')
      .nth(2)
      .locator('.file-meta__size-type')
    await expect(differentFormatFromMainImageMeta).toContainText('image/jpeg')

    const maintainedImageSizeMeta = page
      .locator('.preview-sizes__list .preview-sizes__sizeOption')
      .nth(3)
      .locator('.file-meta__size-type')
    await expect(maintainedImageSizeMeta).toContainText('1600x1600')

    const maintainedImageSizeWithNewFormatMeta = page
      .locator('.preview-sizes__list .preview-sizes__sizeOption')
      .nth(4)
      .locator('.file-meta__size-type')
    await expect(maintainedImageSizeWithNewFormatMeta).toContainText('1600x1600')
    await expect(maintainedImageSizeWithNewFormatMeta).toContainText('image/jpeg')

    const sameSizeMeta = page
      .locator('.preview-sizes__list .preview-sizes__sizeOption')
      .nth(5)
      .locator('.file-meta__size-type')
    await expect(sameSizeMeta).toContainText('320x80')

    const tabletMeta = page
      .locator('.preview-sizes__list .preview-sizes__sizeOption')
      .nth(6)
      .locator('.file-meta__size-type')
    await expect(tabletMeta).toContainText('640x480')

    const mobileMeta = page
      .locator('.preview-sizes__list .preview-sizes__sizeOption')
      .nth(7)
      .locator('.file-meta__size-type')
    await expect(mobileMeta).toContainText('320x240')

    const iconMeta = page
      .locator('.preview-sizes__list .preview-sizes__sizeOption')
      .nth(8)
      .locator('.file-meta__size-type')
    await expect(iconMeta).toContainText('16x16')
  })

  test('should resize and show tiff images', async () => {
    await page.goto(mediaURL.create)
    await page.setInputFiles('input[type="file"]', path.resolve(dirname, './test-image.tiff'))

    await expect(page.locator('.file-field__upload .thumbnail svg')).toBeVisible()

    await saveDocAndAssert(page)

    await expect(page.locator('.file-details img')).toBeVisible()
  })

  test('should have custom file name for image size', async () => {
    await page.goto(customFileNameURL.create)
    await page.setInputFiles('input[type="file"]', path.resolve(dirname, './image.png'))

    await expect(page.locator('.file-field__upload .thumbnail img')).toBeVisible()

    await saveDocAndAssert(page)

    await expect(page.locator('.file-details img')).toBeVisible()

    await page.locator('.file-field__previewSizes').click()

    const renamedImageSizeFile = page
      .locator('.preview-sizes__list .preview-sizes__sizeOption')
      .nth(1)

    await expect(renamedImageSizeFile).toContainText('custom-500x500.png')
  })

  test('should show draft uploads in the relation list', async () => {
    await page.goto(relationURL.list)
    // from the list edit the first document
    await page.locator('.row-1 a').click()

    // edit the versioned image
    await page.locator('.field-type:nth-of-type(2) .icon--edit').click()

    // fill the title with 'draft'
    await page.locator('#field-title').fill('draft')

    // save draft
    await page.locator('#action-save-draft').click()

    // close the drawer
    await page.locator('.doc-drawer__header-close').click()

    // remove the selected versioned image
    await page.locator('#field-versionedImage .icon--x').click()

    // choose from existing
    await openDocDrawer({ page, selector: '#field-versionedImage .upload__listToggler' })

    await expect(page.locator('.row-3 .cell-title')).toContainText('draft')
  })

  test('should upload edge case media when an image size contains an undefined height', async () => {
    await page.goto(mediaURL.create)
    await page.setInputFiles(
      'input[type="file"]',
      path.resolve(dirname, './test-image-1500x735.jpeg'),
    )

    const filename = page.locator('.file-field__filename')

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
      await page.locator('#field-audio .upload-relationship-details__remove').click()

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
        .locator('[id^=doc-drawer_media_1_] .file-field__upload input[type="file"]')
        .setInputFiles(path.resolve(dirname, './image.png'))
      await page.locator('[id^=doc-drawer_media_1_] button#action-save').click()
      await expect(page.locator('.payload-toast-container .toast-success')).toContainText(
        'successfully',
      )
      await page
        .locator('.payload-toast-container .toast-success .payload-toast-close-button')
        .click()

      // save the document and expect an error
      await page.locator('button#action-save').click()
      await assertToastErrors({
        page,
        errors: ['Audio'],
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
      await page.locator('#field-audio .upload-relationship-details__remove').click()

      await openDocDrawer({ page, selector: '.upload__listToggler' })

      const listDrawer = page.locator('[id^=list-drawer_1_]')
      await expect(listDrawer).toBeVisible()

      await expect(listDrawer.locator('tbody tr')).toHaveCount(1)
    })
  })

  test('should throw error when file is larger than the limit and abortOnLimit is true', async () => {
    await page.goto(mediaURL.create)
    await page.setInputFiles('input[type="file"]', path.resolve(dirname, './2mb.jpg'))
    await expect(page.locator('.file-field__filename')).toHaveValue('2mb.jpg')

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
    await expect(genericUploadImage).toHaveAttribute(
      'src',
      'https://raw.githubusercontent.com/payloadcms/website/refs/heads/main/public/images/universal-truth.jpg',
    )
  })

  test('should render adminThumbnail when using a custom thumbnail URL with additional queries', async () => {
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

    const genericUploadImage = page.locator('.file-details .thumbnail img')

    const src = await genericUploadImage.getAttribute('src')

    /**
     * Regex matcher for date cache tags.
     *
     * @example it will match `?2022-01-01T00%3A00%3A00.000Z` (`?2022-01-01T00:00:00.000Z` encoded)
     */
    const cacheTagPattern = /\?\d{4}-\d{2}-\d{2}T\d{2}%3A\d{2}%3A\d{2}\.\d{3}Z/

    expect(src).not.toMatch(cacheTagPattern)
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

    const genericUploadImage = page.locator('.file-details .thumbnail img')

    const src = await genericUploadImage.getAttribute('src')

    /**
     * Regex matcher for date cache tags.
     *
     * @example it will match `?2022-01-01T00%3A00%3A00.000Z` (`?2022-01-01T00:00:00.000Z` encoded)
     */
    const cacheTagPattern = /\?\d{4}-\d{2}-\d{2}T\d{2}%3A\d{2}%3A\d{2}\.\d{3}Z/

    expect(src).toMatch(cacheTagPattern)
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
    await page.goto(mediaURL.create)
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
    await page.goto(withMetadataURL.create)

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
    await page.goto(withoutMetadataURL.create)

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
    await page.goto(withOnlyJPEGMetadataURL.create)

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

    await page.goto(withOnlyJPEGMetadataURL.create)

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

    const serverText = page.locator(
      '.collection-edit--custom-upload-field .document-fields__edit h2',
    )
    await expect(serverText).toHaveText('This text was rendered on the server')

    const clientText = page.locator(
      '.collection-edit--custom-upload-field .document-fields__edit h3',
    )
    await expect(clientText).toHaveText('This text was rendered on the client')
  })

  test('should show original image url on a single upload card for an upload with adminThumbnail defined', async () => {
    await page.goto(uploadsOne.create)

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
    const filename = page.locator('[id^="doc-drawer_admin-thumbnail-size"] .file-field__filename')
    await expect(filename).toHaveValue('test-image.png')

    await expect(page.locator('[id^="doc-drawer_admin-thumbnail-size"] #action-save')).toBeVisible()

    await page.locator('[id^="doc-drawer_admin-thumbnail-size"] #action-save').click()

    await expect(page.locator('.payload-toast-container')).toContainText('successfully')

    const href = await page.locator('#field-singleThumbnailUpload a').getAttribute('href')

    // Ensure the URL starts correctly
    await expect
      .poll(() => href)
      .toMatch(/^\/api\/admin-thumbnail-size\/file\/test-image(-\d+)?\.png$/i)

    // Ensure no "-100x100" or any similar suffix
    await expect.poll(() => !/-\d+x\d+\.png$/.test(href!)).toBe(true)
  })

  test('should show original image url on a hasMany upload card for an upload with adminThumbnail defined', async () => {
    await page.goto(uploadsOne.create)

    const hasManyThumbnailButton = page.locator('#field-hasManyThumbnailUpload button', {
      hasText: exactText('Create New'),
    })
    await hasManyThumbnailButton.click()

    const hasManyThumbnailModal = page.locator('#hasManyThumbnailUpload-bulk-upload-drawer-slug-1')
    await expect(hasManyThumbnailModal).toBeVisible()

    await hasManyThumbnailModal
      .locator('.dropzone input[type="file"]')
      .setInputFiles([path.resolve(dirname, './test-image.png')])

    const saveButton = hasManyThumbnailModal.locator(
      '.bulk-upload--actions-bar__saveButtons button',
    )
    await saveButton.click()

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

    expect(href).toMatch(/^\/api\/admin-thumbnail-size\/file\/test-image(-\d+)?\.png$/i)
    expect(href).not.toMatch(/-\d+x\d+\.png$/)
  })

  test('should show preview button if image sizes are defined but crop and focal point are not', async () => {
    await page.goto(imageSizesOnlyURL.create)

    const fileChooserPromise = page.waitForEvent('filechooser')
    await page.getByText('Select a file').click()
    const fileChooser = await fileChooserPromise
    await wait(1000)
    await fileChooser.setFiles(path.join(dirname, 'test-image.jpg'))

    await page.waitForSelector('button#action-save')
    await page.locator('button#action-save').click()
    await expect(page.locator('.payload-toast-container')).toContainText('successfully')
    await wait(1000) // Wait for the save

    await expect(page.locator('.file-field__previewSizes')).toBeVisible()
  })

  describe('bulk uploads', () => {
    test('should bulk upload multiple files', async () => {
      // Navigate to the upload creation page
      await page.goto(uploadsOne.create)

      // Upload single file
      await page.setInputFiles(
        '.file-field input[type="file"]',
        path.resolve(dirname, './image.png'),
      )
      const filename = page.locator('.file-field__filename')
      await expect(filename).toHaveValue('image.png')

      const bulkUploadButton = page.locator('#field-hasManyUpload button', {
        hasText: exactText('Create New'),
      })
      await bulkUploadButton.click()

      const bulkUploadModal = page.locator('#hasManyUpload-bulk-upload-drawer-slug-1')
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

      const items = page.locator('#field-hasManyUpload .upload--has-many__dragItem')
      await expect(items).toHaveCount(2)
      await expect(items.nth(0)).toBeVisible()
      await expect(items.nth(1)).toBeVisible()

      await saveDocAndAssert(page)
    })

    test('should bulk upload non-image files without page errors', async () => {
      // Enable collection ONLY for this test
      collectErrorsFromPage()

      // Navigate to the upload creation page
      await page.goto(uploadsOne.create)

      // Upload single file
      await page.setInputFiles(
        '.file-field input[type="file"]',
        path.resolve(dirname, './image.png'),
      )
      const filename = page.locator('.file-field__filename')
      await expect(filename).toHaveValue('image.png')

      const bulkUploadButton = page.locator('#field-hasManyUpload button', {
        hasText: exactText('Create New'),
      })
      await bulkUploadButton.click()

      const bulkUploadModal = page.locator('#hasManyUpload-bulk-upload-drawer-slug-1')
      await expect(bulkUploadModal).toBeVisible()

      await bulkUploadModal
        .locator('.dropzone input[type="file"]')
        .setInputFiles([path.resolve(dirname, './test-pdf.pdf')])

      await bulkUploadModal
        .locator('.bulk-upload--file-manager .render-fields #field-prefix')
        .fill('prefix-one')
      const saveButton = bulkUploadModal.locator('.bulk-upload--actions-bar__saveButtons button')
      await saveButton.click()

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
      await page.goto(uploadsOne.create)

      // Upload single file
      await page.setInputFiles(
        '.file-field input[type="file"]',
        path.resolve(dirname, './image.png'),
      )

      const filename = page.locator('.file-field__filename')
      await expect(filename).toHaveValue('image.png')

      const bulkUploadButton = page.locator('#field-hasManyUpload button', {
        hasText: exactText('Create New'),
      })

      await bulkUploadButton.click()

      const bulkUploadModal = page.locator('#hasManyUpload-bulk-upload-drawer-slug-1')
      await expect(bulkUploadModal).toBeVisible()

      // Bulk upload multiple files at once
      await bulkUploadModal
        .locator('.dropzone input[type="file"]')
        .setInputFiles([
          path.resolve(dirname, './image.png'),
          path.resolve(dirname, './test-image.png'),
        ])

      await bulkUploadModal.locator('.edit-many-bulk-uploads__toggle').click()
      const editManyBulkUploadModal = page.locator('#edit-uploads-2-bulk-uploads')
      await expect(editManyBulkUploadModal).toBeVisible()

      await editManyBulkUploadModal
        .locator('.edit-many-bulk-uploads__form .react-select')
        .click({ delay: 100 })
      const options = editManyBulkUploadModal.locator('.rs__option')

      await options.locator('text=Prefix').click()

      await editManyBulkUploadModal.locator('#field-prefix').fill('some prefix')

      await editManyBulkUploadModal.locator('.edit-many-bulk-uploads__sidebar-wrap button').click()
      await bulkUploadModal.locator('.bulk-upload--actions-bar__saveButtons button').click()

      const items = page.locator('#field-hasManyUpload .upload--has-many__dragItem')
      await expect(items).toHaveCount(2)
      await expect(items.nth(0)).toBeVisible()
      await expect(items.nth(1)).toBeVisible()

      await saveDocAndAssert(page)
    })

    test('should remove validation errors from bulk upload files after correction in edit many drawer', async () => {
      // Navigate to the upload creation page
      await page.goto(uploadsOne.create)

      // Upload single file
      await page.setInputFiles(
        '.file-field input[type="file"]',
        path.resolve(dirname, './image.png'),
      )
      const filename = page.locator('.file-field__filename')
      await expect(filename).toHaveValue('image.png')

      const bulkUploadButton = page.locator('#field-hasManyUpload button', {
        hasText: exactText('Create New'),
      })
      await bulkUploadButton.click()

      const bulkUploadModal = page.locator('#hasManyUpload-bulk-upload-drawer-slug-1')
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

      const errorCount = bulkUploadModal.locator('.file-selections .error-pill__count').first()
      await expect(errorCount).toHaveText('3')

      await bulkUploadModal.locator('.edit-many-bulk-uploads__toggle').click()
      const editManyBulkUploadModal = page.locator('#edit-uploads-2-bulk-uploads')
      await expect(editManyBulkUploadModal).toBeVisible()

      const fieldSelector = editManyBulkUploadModal.locator(
        '.edit-many-bulk-uploads__form .react-select',
      )
      await fieldSelector.click({ delay: 100 })
      const options = editManyBulkUploadModal.locator('.rs__option')
      // Select an option
      await options.locator('text=Prefix').click()

      await editManyBulkUploadModal.locator('#field-prefix').fill('some prefix')

      await editManyBulkUploadModal.locator('.edit-many-bulk-uploads__sidebar-wrap button').click()

      await saveButton.click()
      await expect(page.locator('.payload-toast-container')).toContainText(
        'Successfully saved 2 files',
      )

      await saveDocAndAssert(page)
    })

    test('should show validation error when bulk uploading files and then soft removing one of the files', async () => {
      // Navigate to the upload creation page
      await page.goto(uploadsOne.create)

      // Upload single file
      await page.setInputFiles(
        '.file-field input[type="file"]',
        path.resolve(dirname, './image.png'),
      )
      const filename = page.locator('.file-field__filename')
      await expect(filename).toHaveValue('image.png')

      const bulkUploadButton = page.locator('#field-hasManyUpload button', {
        hasText: exactText('Create New'),
      })
      await bulkUploadButton.click()

      const bulkUploadModal = page.locator('#hasManyUpload-bulk-upload-drawer-slug-1')
      await expect(bulkUploadModal).toBeVisible()

      // Bulk upload multiple files at once
      await bulkUploadModal
        .locator('.dropzone input[type="file"]')
        .setInputFiles([
          path.resolve(dirname, './image.png'),
          path.resolve(dirname, './test-image.png'),
        ])

      await bulkUploadModal.locator('.edit-many-bulk-uploads__toggle').click()
      const editManyBulkUploadModal = page.locator('#edit-uploads-2-bulk-uploads')
      await expect(editManyBulkUploadModal).toBeVisible()

      const fieldSelector = editManyBulkUploadModal.locator(
        '.edit-many-bulk-uploads__form .react-select',
      )
      await fieldSelector.click({ delay: 100 })
      const options = editManyBulkUploadModal.locator('.rs__option')
      // Select an option
      await options.locator('text=Prefix').click()

      await editManyBulkUploadModal.locator('#field-prefix').fill('some prefix')

      await editManyBulkUploadModal.locator('.edit-many-bulk-uploads__sidebar-wrap button').click()

      await bulkUploadModal.locator('.file-field__upload .file-field__remove').click()

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

      const errorCount = bulkUploadModal.locator('.file-selections .error-pill__count').first()
      await expect(errorCount).toHaveText('1')
    })

    test('should preserve state when adding additional files to an existing bulk upload', async () => {
      await page.goto(uploadsTwo.list)
      await page.locator('.list-header__title-actions button', { hasText: 'Bulk Upload' }).click()

      await page.setInputFiles('.dropzone input[type="file"]', path.resolve(dirname, './image.png'))

      await page.locator('#field-prefix').fill('should-preserve')

      // add another file
      await page
        .locator('.file-selections__header__actions button', { hasText: 'Add File' })
        .click()
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
      await page.locator('.list-header__title-actions button', { hasText: 'Bulk Upload' }).click()
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
      await page.goto(uploadsOne.create)
      const fieldBulkUploadButton = page.locator('#field-hasManyThumbnailUpload button', {
        hasText: exactText('Create New'),
      })
      await fieldBulkUploadButton.click()
      const fieldBulkUploadDrawer = page.locator(
        '#hasManyThumbnailUpload-bulk-upload-drawer-slug-1',
      )
      await expect(fieldBulkUploadDrawer).toBeVisible()
      await fieldBulkUploadDrawer
        .locator('.dropzone input[type="file"]')
        .setInputFiles([
          path.resolve(dirname, './image.png'),
          path.resolve(dirname, './test-image.png'),
        ])
      await fieldBulkUploadDrawer
        .locator('.bulk-upload--actions-bar button', { hasText: 'Save' })
        .click()
      await expect(fieldBulkUploadDrawer).toBeHidden()
      await fieldBulkUploadButton.click()

      // should show add files dropzone view
      await expect(fieldBulkUploadDrawer.locator('.bulk-upload--add-files')).toBeVisible()
    })
  })

  describe('remote url fetching', () => {
    beforeAll(() => {
      mockCorsServer = startMockCorsServer()
    })

    afterAll(() => {
      if (mockCorsServer) {
        mockCorsServer.close()
      }
    })

    test('should fetch remote URL server-side if pasteURL.allowList is defined', async () => {
      // Navigate to the upload creation page
      await page.goto(uploadsOne.create)

      // Click the "Paste URL" button
      const pasteURLButton = page.locator('.file-field__upload button', { hasText: 'Paste URL' })
      await pasteURLButton.click()

      // Input the remote URL
      const remoteImage = 'http://localhost:4000/mock-cors-image'
      const inputField = page.locator('.file-field__upload .file-field__remote-file')
      await inputField.fill(remoteImage)

      // Intercept the server-side fetch to the paste-url endpoint
      const encodedImageURL = encodeURIComponent(remoteImage)
      const pasteUrlEndpoint = `/api/uploads-1/paste-url?src=${encodedImageURL}`
      const serverSideFetchPromise = page.waitForResponse(
        (response) => response.url().includes(pasteUrlEndpoint) && response.status() === 200,
        { timeout: 1000 },
      )

      // Click the "Add File" button
      const addFileButton = page.locator('.file-field__add-file')
      await addFileButton.click()

      // Wait for the server-side fetch to complete
      const serverSideFetch = await serverSideFetchPromise
      // Assert that the server-side fetch completed successfully
      await serverSideFetch.text()

      // Wait for the filename field to be updated
      const filenameInput = page.locator('.file-field .file-field__filename')
      await expect(filenameInput).toHaveValue('mock-cors-image', { timeout: 500 })

      // Save and assert the document
      await saveDocAndAssert(page)

      // Validate the uploaded image
      const imageDetails = page.locator('.file-field .file-details img')
      await expect(imageDetails).toHaveAttribute('src', /mock-cors-image/, { timeout: 500 })
    })

    test('should fail to fetch remote URL server-side if the pasteURL.allowList domains do not match', async () => {
      // Navigate to the upload creation page
      await page.goto(uploadsTwo.create)

      // Click the "Paste URL" button
      const pasteURLButton = page.locator('.file-field__upload button', { hasText: 'Paste URL' })
      await pasteURLButton.click()

      // Input the remote URL
      const remoteImage = 'http://localhost:4000/mock-cors-image'
      const inputField = page.locator('.file-field__upload .file-field__remote-file')
      await inputField.fill(remoteImage)

      // Click the "Add File" button
      const addFileButton = page.locator('.file-field__add-file')
      await addFileButton.click()

      // Verify the toast error appears with the correct message
      await expect(page.locator('.payload-toast-container .toast-error')).toContainText(
        'The provided URL is not allowed.',
      )
    })
  })

  describe('image manipulation', () => {
    test('should crop image correctly', async () => {
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
        await page.goto(mediaURL.create)

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
        await page.goto(focalOnlyURL.create)
        await page.setInputFiles('input[type="file"]', path.join(dirname, 'horizontal-squares.jpg'))

        await page.locator('.file-field__edit').click()

        // set focal point
        await page.locator('.edit-upload__input input[name="X %"]').fill('12') // left focal point
        await page.locator('.edit-upload__input input[name="Y %"]').fill('50') // top focal point

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
      await page.goto(animatedTypeMediaURL.create)

      await page.setInputFiles('input[type="file"]', path.join(dirname, 'test-image.jpg'))

      await page.locator('.file-field__edit').click()

      // set crop
      await page.locator('.edit-upload__input input[name="Width (px)"]').fill('400')
      await page.locator('.edit-upload__input input[name="Height (px)"]').fill('800')
      // set focal point
      await page.locator('.edit-upload__input input[name="X %"]').fill('75') // init left focal point
      await page.locator('.edit-upload__input input[name="Y %"]').fill('50') // init top focal point

      await page.locator('button:has-text("Apply Changes")').click()
      await saveDocAndAssert(page)

      const resizeOptionMedia = page.locator('.file-meta .file-meta__size-type')
      await expect(resizeOptionMedia).toContainText('200x200')
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
    await expect(page.locator('.file-field__upload')).toBeHidden()
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
    await page.goto(withoutEnlargementResizeOptionsURL.create)

    await page.setInputFiles('input[type="file"]', path.join(dirname, 'test-image.jpg'))
    await saveDocAndAssert(page)

    await page.locator('.file-field__edit').click()

    // no need to make any changes to the image if resizeOptions.withoutEnlargement is actually being respected now
    await page.locator('button:has-text("Apply Changes")').click()
    await saveDocAndAssert(page)

    const resizeOptionMedia = page.locator('.file-meta .file-meta__size-type')

    // expect the image to be the original size since the original image is smaller than the dimensions defined in resizeOptions
    await expect(resizeOptionMedia).toContainText('800x800')
  })

  describe('imageSizes best fit', () => {
    test('should select adminThumbnail if one exists', async () => {
      await page.goto(bestFitURL.create)
      await page.locator('#field-withAdminThumbnail button.upload__listToggler').click()
      await page.locator('tr.row-1 td.cell-filename button.default-cell__first-cell').click()
      const thumbnail = page.locator('#field-withAdminThumbnail div.thumbnail > img')
      await expect(thumbnail).toHaveAttribute(
        'src',
        'https://raw.githubusercontent.com/payloadcms/website/refs/heads/main/public/images/universal-truth.jpg',
      )
    })

    test('should select an image within target range', async () => {
      await page.goto(bestFitURL.create)
      await page.locator('#field-withinRange button.upload__createNewToggler').click()
      await page.setInputFiles('input[type="file"]', path.join(dirname, 'test-image.jpg'))
      await page.locator('dialog button#action-save').click()
      const thumbnail = page.locator('#field-withinRange div.thumbnail > img')
      await expect(thumbnail).toHaveAttribute('src', '/api/enlarge/file/test-image-180x50.jpg')
    })

    test('should select next smallest image outside of range but smaller than original', async () => {
      await page.goto(bestFitURL.create)
      await page.locator('#field-nextSmallestOutOfRange button.upload__createNewToggler').click()
      await page.setInputFiles('input[type="file"]', path.join(dirname, 'test-image.jpg'))
      await page.locator('dialog button#action-save').click()
      const thumbnail = page.locator('#field-nextSmallestOutOfRange div.thumbnail > img')
      await expect(thumbnail).toHaveAttribute('src', '/api/focal-only/file/test-image-400x300.jpg')
    })

    test('should select original if smaller than next available size', async () => {
      await page.goto(bestFitURL.create)
      await page.locator('#field-original button.upload__createNewToggler').click()
      await page.setInputFiles('input[type="file"]', path.join(dirname, 'small.png'))
      await page.locator('dialog button#action-save').click()
      const thumbnail = page.locator('#field-original div.thumbnail > img')
      await expect(thumbnail).toHaveAttribute('src', '/api/focal-only/file/small.png')
    })
  })

  test('should show correct image preview or placeholder after paginating', async () => {
    await page.goto(listViewPreviewURL.list)
    const firstRow = page.locator('.row-1')

    const imageUploadCell = firstRow.locator('.cell-imageUpload .relationship-cell')
    await expect(imageUploadCell).toHaveText('<No Image Upload>')

    const imageRelationshipCell = firstRow.locator('.cell-imageRelationship .relationship-cell')
    await expect(imageRelationshipCell).toHaveText('<No Image Relationship>')

    const pageTwoButton = page.locator('.paginator__page', { hasText: '2' })
    await expect(pageTwoButton).toBeVisible()
    await pageTwoButton.click()

    const imageUploadImg = imageUploadCell.locator('.thumbnail')
    await expect(imageUploadImg).toBeVisible()
    await expect(imageRelationshipCell).toHaveText('image-1.png')

    const pageOneButton = page.locator('.paginator__page', { hasText: '1' })
    await expect(pageOneButton).toBeVisible()
    await pageOneButton.click()

    await expect(imageUploadCell).toHaveText('<No Image Upload>')
    await expect(imageRelationshipCell).toHaveText('<No Image Relationship>')
  })

  test('should respect Sharp constructorOptions', async () => {
    await page.goto(constructorOptionsURL.create)

    await page.setInputFiles('input[type="file"]', path.resolve(dirname, './animated.webp'))

    const filename = page.locator('.file-field__filename')

    await expect(filename).toHaveValue('animated.webp')
    await saveDocAndAssert(page, '#action-save', 'error')
  })

  test('should prevent invalid mimetype disguised as valid mimetype', async () => {
    await page.goto(fileMimeTypeURL.create)
    await page.setInputFiles('input[type="file"]', path.resolve(dirname, './image-as-pdf.pdf'))

    const filename = page.locator('.file-field__filename')
    await expect(filename).toHaveValue('image-as-pdf.pdf')

    await saveDocAndAssert(page, '#action-save', 'error')
  })
})
