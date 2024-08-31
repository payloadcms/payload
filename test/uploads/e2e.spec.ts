import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import path from 'path'
import { wait } from 'payload/shared'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../helpers/sdk/index.js'
import type { Config, Media } from './payload-types.js'

import {
  ensureCompilationIsDone,
  exactText,
  initPageConsoleErrorCatch,
  openDocDrawer,
  saveDocAndAssert,
} from '../helpers.js'
import { AdminUrlUtil } from '../helpers/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../helpers/initPayloadE2ENoConfig.js'
import { RESTClient } from '../helpers/rest.js'
import { TEST_TIMEOUT_LONG } from '../playwright.config.js'
import {
  adminThumbnailFunctionSlug,
  adminThumbnailSizeSlug,
  animatedTypeMedia,
  audioSlug,
  customFileNameMediaSlug,
  focalOnlySlug,
  mediaSlug,
  relationPreviewSlug,
  relationSlug,
  withMetadataSlug,
  withOnlyJPEGMetadataSlug,
  withoutMetadataSlug,
} from './shared.js'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const { beforeAll, describe } = test

let payload: PayloadTestSDK<Config>
let client: RESTClient
let serverURL: string
let mediaURL: AdminUrlUtil
let animatedTypeMediaURL: AdminUrlUtil
let audioURL: AdminUrlUtil
let relationURL: AdminUrlUtil
let adminThumbnailSizeURL: AdminUrlUtil
let adminThumbnailFunctionURL: AdminUrlUtil
let focalOnlyURL: AdminUrlUtil
let withMetadataURL: AdminUrlUtil
let withoutMetadataURL: AdminUrlUtil
let withOnlyJPEGMetadataURL: AdminUrlUtil
let relationPreviewURL: AdminUrlUtil
let customFileNameURL: AdminUrlUtil

describe('uploads', () => {
  let page: Page
  let pngDoc: Media
  let audioDoc: Media

  beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    ;({ payload, serverURL } = await initPayloadE2ENoConfig<Config>({ dirname }))
    client = new RESTClient(null, { defaultSlug: 'users', serverURL })
    await client.login()

    mediaURL = new AdminUrlUtil(serverURL, mediaSlug)
    animatedTypeMediaURL = new AdminUrlUtil(serverURL, animatedTypeMedia)
    audioURL = new AdminUrlUtil(serverURL, audioSlug)
    relationURL = new AdminUrlUtil(serverURL, relationSlug)
    adminThumbnailSizeURL = new AdminUrlUtil(serverURL, adminThumbnailSizeSlug)
    adminThumbnailFunctionURL = new AdminUrlUtil(serverURL, adminThumbnailFunctionSlug)
    focalOnlyURL = new AdminUrlUtil(serverURL, focalOnlySlug)
    withMetadataURL = new AdminUrlUtil(serverURL, withMetadataSlug)
    withoutMetadataURL = new AdminUrlUtil(serverURL, withoutMetadataSlug)
    withOnlyJPEGMetadataURL = new AdminUrlUtil(serverURL, withOnlyJPEGMetadataSlug)
    relationPreviewURL = new AdminUrlUtil(serverURL, relationPreviewSlug)
    customFileNameURL = new AdminUrlUtil(serverURL, customFileNameMediaSlug)

    const context = await browser.newContext()
    page = await context.newPage()

    initPageConsoleErrorCatch(page)

    const findPNG = await payload.find({
      collection: mediaSlug,
      depth: 0,
      pagination: false,
      where: {
        mimeType: {
          equals: 'image/png',
        },
      },
    })

    pngDoc = findPNG.docs[0] as unknown as Media

    const findAudio = await payload.find({
      collection: audioSlug,
      depth: 0,
      pagination: false,
    })

    audioDoc = findAudio.docs[0] as unknown as Media

    await ensureCompilationIsDone({ page, serverURL })
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

  test('should show upload filename in upload collection list', async () => {
    await page.goto(mediaURL.list)
    const audioUpload = page.locator('tr.row-1 .cell-filename')
    await expect(audioUpload).toHaveText('audio.mp3')

    const imageUpload = page.locator('tr.row-2 .cell-filename')
    await expect(imageUpload).toHaveText('image.png')
  })

  test('should create file upload', async () => {
    await page.goto(mediaURL.create)
    await page.setInputFiles('input[type="file"]', path.resolve(dirname, './image.png'))

    const filename = page.locator('.file-field__filename')

    await expect(filename).toHaveValue('image.png')

    await saveDocAndAssert(page)
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
    await page.goto(mediaURL.edit(pngDoc.id))

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
    await page.locator('.field-type:nth-of-type(2) .icon--x').click()

    // choose from existing
    await openDocDrawer(page, '.upload__listToggler')

    await expect(page.locator('.row-3 .cell-title')).toContainText('draft')
  })

  test('should restrict mimetype based on filterOptions', async () => {
    await page.goto(audioURL.edit(audioDoc.id))
    await page.waitForURL(audioURL.edit(audioDoc.id))

    // remove the selection and open the list drawer
    await wait(500) // flake workaround
    await page.locator('#field-audio .upload-relationship-details__remove').click()

    await openDocDrawer(page, '#field-audio  .upload__listToggler')

    const listDrawer = page.locator('[id^=drawer_1_list-drawer]')
    await expect(listDrawer).toBeVisible()

    await openDocDrawer(page, 'button.list-drawer__create-new-button.doc-drawer__toggler')
    await expect(page.locator('[id^=drawer_2_doc-drawer__media]')).toBeVisible()

    // upload an image and try to select it
    await page
      .locator('[id^=drawer_2_doc-drawer__media] .file-field__upload input[type="file"]')
      .setInputFiles(path.resolve(dirname, './image.png'))
    await page.locator('[id^=drawer_2_doc-drawer__media] button#action-save').click()
    await expect(page.locator('.payload-toast-container .toast-success')).toContainText(
      'successfully',
    )
    await page
      .locator('.payload-toast-container .toast-success .payload-toast-close-button')
      .click()

    // save the document and expect an error
    await page.locator('button#action-save').click()
    await expect(page.locator('.payload-toast-container .toast-error')).toContainText(
      'The following field is invalid: audio',
    )
  })

  test('should restrict uploads in drawer based on filterOptions', async () => {
    await page.goto(audioURL.edit(audioDoc.id))
    await page.waitForURL(audioURL.edit(audioDoc.id))

    // remove the selection and open the list drawer
    await wait(500) // flake workaround
    await page.locator('#field-audio .upload-relationship-details__remove').click()

    await openDocDrawer(page, '.upload__listToggler')

    const listDrawer = page.locator('[id^=drawer_1_list-drawer]')
    await expect(listDrawer).toBeVisible()

    await expect(listDrawer.locator('tbody tr')).toHaveCount(1)
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

  test('should render adminThumbnail when using a function', async () => {
    await page.reload() // Flakey test, it likely has to do with the test that comes before it. Trace viewer is not helpful when it fails.
    await page.goto(adminThumbnailFunctionURL.list)
    await page.waitForURL(adminThumbnailFunctionURL.list)

    // Ensure sure false or null shows generic file svg
    const genericUploadImage = page.locator('tr.row-1 .thumbnail img')
    await expect(genericUploadImage).toHaveAttribute(
      'src',
      'https://payloadcms.com/images/universal-truth.jpg',
    )
  })

  test('should render adminThumbnail when using a specific size', async () => {
    await page.goto(adminThumbnailSizeURL.list)
    await page.waitForURL(adminThumbnailSizeURL.list)

    // Ensure sure false or null shows generic file svg
    const genericUploadImage = page.locator('tr.row-1 .thumbnail img')
    await expect(genericUploadImage).toBeVisible()

    // Ensure adminThumbnail fn returns correct value based on audio/mp3 mime
    const audioUploadImage = page.locator('tr.row-2 .thumbnail svg')
    await expect(audioUploadImage).toBeVisible()
  })

  test('should detect correct mimeType', async () => {
    await page.goto(mediaURL.create)
    await page.waitForURL(mediaURL.create)
    await page.setInputFiles('input[type="file"]', path.resolve(dirname, './image.png'))
    await saveDocAndAssert(page)

    const imageID = page.url().split('/').pop()

    const { doc: uploadedImage } = await client.findByID({
      id: imageID,
      slug: mediaSlug,
      auth: true,
    })

    expect(uploadedImage.mimeType).toEqual('image/png')
  })

  test('should upload image with metadata', async () => {
    await page.goto(withMetadataURL.create)
    await page.waitForURL(withMetadataURL.create)

    const fileChooserPromise = page.waitForEvent('filechooser')
    await page.getByText('Select a file').click()
    const fileChooser = await fileChooserPromise
    await wait(1000)
    await fileChooser.setFiles(path.join(dirname, 'test-image.jpg'))

    await page.waitForSelector('button#action-save')
    await page.locator('button#action-save').click()
    await expect(page.locator('.payload-toast-container')).toContainText('successfully')
    await wait(1000)

    const mediaID = page.url().split('/').pop()

    const { doc: mediaDoc } = await client.findByID({
      id: mediaID,
      slug: withMetadataSlug,
      auth: true,
    })

    const acceptableFileSizes = [9431, 9435]

    expect(acceptableFileSizes).toContain(mediaDoc.sizes.sizeOne.filesize)
  })

  test('should upload image without metadata', async () => {
    await page.goto(withoutMetadataURL.create)
    await page.waitForURL(withoutMetadataURL.create)

    const fileChooserPromise = page.waitForEvent('filechooser')
    await page.getByText('Select a file').click()
    const fileChooser = await fileChooserPromise
    await wait(1000)
    await fileChooser.setFiles(path.join(dirname, 'test-image.jpg'))

    await page.waitForSelector('button#action-save')
    await page.locator('button#action-save').click()
    await expect(page.locator('.payload-toast-container')).toContainText('successfully')
    await wait(1000)

    const mediaID = page.url().split('/').pop()

    const { doc: mediaDoc } = await client.findByID({
      id: mediaID,
      slug: withoutMetadataSlug,
      auth: true,
    })

    const acceptableFileSizes = [2424, 2445]

    expect(acceptableFileSizes).toContain(mediaDoc.sizes.sizeTwo.filesize)
  })

  test('should only upload image with metadata if jpeg mimetype', async () => {
    await page.goto(withOnlyJPEGMetadataURL.create)
    await page.waitForURL(withOnlyJPEGMetadataURL.create)

    const fileChooserPromiseForJPEG = page.waitForEvent('filechooser')
    await page.getByText('Select a file').click()
    const fileChooserForJPEG = await fileChooserPromiseForJPEG
    await wait(1000)
    await fileChooserForJPEG.setFiles(path.join(dirname, 'test-image.jpg'))

    await page.waitForSelector('button#action-save')
    await page.locator('button#action-save').click()
    await expect(page.locator('.payload-toast-container')).toContainText('successfully')
    await wait(1000)

    const jpegMediaID = page.url().split('/').pop()

    const { doc: jpegMediaDoc } = await client.findByID({
      id: jpegMediaID,
      slug: withOnlyJPEGMetadataSlug,
      auth: true,
    })

    const acceptableFileSizesForJPEG = [9554, 9575]

    // without metadata appended, the jpeg image filesize would be 2424
    expect(acceptableFileSizesForJPEG).toContain(jpegMediaDoc.sizes.sizeThree.filesize)

    await page.goto(withOnlyJPEGMetadataURL.create)
    await page.waitForURL(withOnlyJPEGMetadataURL.create)

    const fileChooserPromiseForWEBP = page.waitForEvent('filechooser')
    await page.getByText('Select a file').click()
    const fileChooserForWEBP = await fileChooserPromiseForWEBP
    await wait(1000)
    await fileChooserForWEBP.setFiles(path.join(dirname, 'animated.webp'))

    await page.waitForSelector('button#action-save')
    await page.locator('button#action-save').click()
    await expect(page.locator('.payload-toast-container')).toContainText('successfully')
    await wait(1000)

    const webpMediaID = page.url().split('/').pop()

    const { doc: webpMediaDoc } = await client.findByID({
      id: webpMediaID,
      slug: withOnlyJPEGMetadataSlug,
      auth: true,
    })

    // With metadata, the animated image filesize would be 218762
    expect(webpMediaDoc.sizes.sizeThree.filesize).toEqual(211638)
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
        await page.waitForURL(mediaURL.create)
        // select and upload file
        const fileChooserPromise = page.waitForEvent('filechooser')
        await page.getByText('Select a file').click()
        const fileChooser = await fileChooserPromise
        await wait(1000)
        await fileChooser.setFiles(path.join(dirname, 'test-image.jpg'))

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
        await page.waitForSelector('button#action-save')
        await page.locator('button#action-save').click()
        await expect(page.locator('.payload-toast-container')).toContainText('successfully')
        await wait(1000) // Wait for the save
      }

      await createFocalCrop(page, 'bottom-right') // green square
      const greenSquareMediaID = page.url().split('/').pop() // get the ID of the doc
      await createFocalCrop(page, 'top-left') // red square
      const redSquareMediaID = page.url().split('/').pop() // get the ID of the doc

      const { doc: greenDoc } = await client.findByID({
        id: greenSquareMediaID,
        slug: mediaSlug,
        auth: true,
      })

      const { doc: redDoc } = await client.findByID({
        id: redSquareMediaID,
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
        await page.waitForURL(focalOnlyURL.create)
        // select and upload file
        const fileChooserPromise = page.waitForEvent('filechooser')
        await page.getByText('Select a file').click()
        const fileChooser = await fileChooserPromise
        await wait(1000)
        await fileChooser.setFiles(path.join(dirname, 'horizontal-squares.jpg'))

        await page.locator('.file-field__edit').click()

        // set focal point
        await page.locator('.edit-upload__input input[name="X %"]').fill('12') // left focal point
        await page.locator('.edit-upload__input input[name="Y %"]').fill('50') // top focal point

        // apply focal point
        await page.locator('button:has-text("Apply Changes")').click()
        await page.waitForSelector('button#action-save')
        await page.locator('button#action-save').click()
        await expect(page.locator('.payload-toast-container')).toContainText('successfully')
        await wait(1000) // Wait for the save
      }

      await updateFocalPosition(page) // red square
      const redSquareMediaID = page.url().split('/').pop() // get the ID of the doc

      const { doc: redDoc } = await client.findByID({
        id: redSquareMediaID,
        slug: focalOnlySlug,
        auth: true,
      })

      // without focal point update this generated size was equal to 1736
      expect(redDoc.sizes.focalTest.filesize).toEqual(1598)
    })
  })

  test('should see upload previews in relation list if allowed in config', async () => {
    await page.goto(relationPreviewURL.list)

    await wait(110)

    // Show all columns with relations
    await page.locator('.list-controls__toggle-columns').click()
    await expect(page.locator('.column-selector')).toBeVisible()
    const imageWithoutPreview2Button = page.locator(`.column-selector .column-selector__column`, {
      hasText: exactText('Image Without Preview2'),
    })
    const imageWithPreview3Button = page.locator(`.column-selector .column-selector__column`, {
      hasText: exactText('Image With Preview3'),
    })
    const imageWithoutPreview3Button = page.locator(`.column-selector .column-selector__column`, {
      hasText: exactText('Image Without Preview3'),
    })
    await imageWithoutPreview2Button.click()
    await imageWithPreview3Button.click()
    await imageWithoutPreview3Button.click()

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
})
