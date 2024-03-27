import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import path from 'path'

import type { Media } from './payload-types'

import payload from '../../packages/payload/src'
import wait from '../../packages/payload/src/utilities/wait'
import { initPageConsoleErrorCatch, saveDocAndAssert } from '../helpers'
import { AdminUrlUtil } from '../helpers/adminUrlUtil'
import { initPayloadE2E } from '../helpers/configHelpers'
import { RESTClient } from '../helpers/rest'
import { adminThumbnailSrc } from './collections/admin-thumbnail'
import { adminThumbnailSlug, audioSlug, mediaSlug, relationSlug } from './shared'

const { beforeAll, describe } = test

let client: RESTClient
let mediaURL: AdminUrlUtil
let audioURL: AdminUrlUtil
let relationURL: AdminUrlUtil
let adminThumbnailURL: AdminUrlUtil

describe('uploads', () => {
  let page: Page
  let pngDoc: Media
  let audioDoc: Media

  beforeAll(async ({ browser }) => {
    const { serverURL } = await initPayloadE2E(__dirname)
    client = new RESTClient(null, { defaultSlug: 'users', serverURL })
    await client.login()

    mediaURL = new AdminUrlUtil(serverURL, mediaSlug)
    audioURL = new AdminUrlUtil(serverURL, audioSlug)
    relationURL = new AdminUrlUtil(serverURL, relationSlug)
    adminThumbnailURL = new AdminUrlUtil(serverURL, adminThumbnailSlug)

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
  })

  test('should see upload filename and thumbnail in relation list', async () => {
    await page.goto(relationURL.list)

    await wait(110)
    const field = page.locator('.cell-image')

    await expect(field).toContainText('image.png')

    const thumbnail = page.locator('.cell-image img')
    await expect(thumbnail).toBeVisible()
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

    await page.setInputFiles('input[type="file"]', path.resolve(__dirname, './image.png'))

    const filename = page.locator('.file-field__filename')

    await expect(filename).toHaveValue('image.png')

    await saveDocAndAssert(page)
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
    await page.setInputFiles('input[type="file"]', path.resolve(__dirname, './test-image.tiff'))

    await expect(page.locator('.file-field__upload .thumbnail svg')).toBeVisible()

    await saveDocAndAssert(page)

    await expect(page.locator('.file-details img')).toBeVisible()
  })

  test('should show draft uploads in the relation list', async () => {
    await page.goto(relationURL.list)

    // from the list edit the first document
    await page.locator('.row-1 a').click()

    // edit the versioned image
    await page.locator('.field-versionedImage .icon--edit').click()

    // fill the title with 'draft'
    await page.locator('#field-title').fill('draft')

    // save draft
    await page.locator('#action-save-draft').click()

    // close the drawer
    await page.locator('.doc-drawer__header-close').click()

    // remove the selected versioned image
    await page.locator('.field-versionedImage .icon--x').click()

    // choose from existing
    await page.locator('.list-drawer__toggler').click()

    await expect(page.locator('.cell-title')).toContainText('draft')
  })

  test('should restrict mimetype based on filterOptions', async () => {
    await page.goto(audioURL.edit(audioDoc.id))
    await wait(200)

    // remove the selection and open the list drawer
    await page.locator('.file-details__remove').click()
    await page.locator('.upload__toggler.list-drawer__toggler').click()
    const listDrawer = page.locator('[id^=list-drawer_1_]')
    await expect(listDrawer).toBeVisible()
    await wait(200) // list is loading

    // ensure the only card is the audio file
    const rows = listDrawer.locator('table tbody tr')
    expect(await rows.count()).toEqual(1)
    const filename = rows.locator('.cell-filename')
    await expect(filename).toHaveText('audio.mp3')

    // upload an image and try to select it
    await listDrawer.locator('button.list-drawer__create-new-button.doc-drawer__toggler').click()
    await expect(page.locator('[id^=doc-drawer_media_2_]')).toBeVisible()
    await page
      .locator('[id^=doc-drawer_media_2_] .file-field__upload input[type="file"]')
      .setInputFiles(path.resolve(__dirname, './image.png'))
    await page.locator('[id^=doc-drawer_media_2_] button#action-save').click()
    await wait(200)
    await expect(page.locator('.Toastify')).toContainText('successfully')

    // save the document and expect an error
    await page.locator('button#action-save').click()
    await wait(200)
    await expect(page.locator('.Toastify')).toContainText('The following field is invalid: audio')
  })

  test('Should execute adminThumbnail and provide thumbnail when set', async () => {
    await page.goto(adminThumbnailURL.list)
    await wait(200)

    // Ensure sure false or null shows generic file svg
    const genericUploadImage = page.locator('tr.row-1 .thumbnail svg')
    await expect(genericUploadImage).toBeVisible()

    // Ensure adminThumbnail fn returns correct value based on audio/mp3 mime
    const audioUploadImage = page.locator('tr.row-2 .thumbnail img')
    expect(await audioUploadImage.getAttribute('src')).toContain(adminThumbnailSrc)
  })

  test('Should detect correct mimeType', async () => {
    await page.goto(mediaURL.create)
    await page.setInputFiles('input[type="file"]', path.resolve(__dirname, './image.png'))
    await saveDocAndAssert(page)

    const imageID = page.url().split('/').pop()

    const { doc: uploadedImage } = await client.findByID({
      id: imageID,
      slug: mediaSlug,
      auth: true,
    })

    expect(uploadedImage.mimeType).toEqual('image/png')
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

        // select and upload file
        const fileChooserPromise = page.waitForEvent('filechooser')
        await page.getByText('Select a file').click()
        const fileChooser = await fileChooserPromise
        await fileChooser.setFiles(path.join(__dirname, 'test-image.jpg'))
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

        await page.locator('button:has-text("Apply Changes")').click()
        await page.waitForSelector('button#action-save')
        await page.locator('button#action-save').click()
      }

      await createFocalCrop(page, 'bottom-right') // green square
      await wait(1000) // wait for edit view navigation (saving images)
      // get the ID of the doc
      const greenSquareMediaID = page.url().split('/').pop()
      await createFocalCrop(page, 'top-left') // red square
      await wait(1000) // wait for edit view navigation (saving images)
      const redSquareMediaID = page.url().split('/').pop()

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
  })
})
