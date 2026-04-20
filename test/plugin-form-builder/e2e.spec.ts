import type { Page } from '@playwright/test'

import { expect, test } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

import type { PayloadTestSDK } from '../__helpers/shared/sdk/index.js'
import type { Config } from './payload-types.js'

import {
  ensureCompilationIsDone,
  initPageConsoleErrorCatch,
  saveDocAndAssert,
} from '../__helpers/e2e/helpers.js'
import { selectInput } from '../__helpers/e2e/selectInput.js'
import { AdminUrlUtil } from '../__helpers/shared/adminUrlUtil.js'
import { initPayloadE2ENoConfig } from '../__helpers/shared/initPayloadE2ENoConfig.js'
import { POLL_TOPASS_TIMEOUT, TEST_TIMEOUT_LONG } from '../playwright.config.js'
import { documentsSlug, formsSlug, formSubmissionsSlug, mediaSlug } from './shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Test file paths
const testImagePath = path.resolve(dirname, '../uploads/image.png')
const testPdfPath = path.resolve(dirname, '../uploads/test-pdf.pdf')

test.describe('Form Builder Plugin', () => {
  let page: Page
  let formsUrl: AdminUrlUtil
  let submissionsUrl: AdminUrlUtil
  let payload: PayloadTestSDK<Config>
  let serverURL: string

  test.beforeAll(async ({ browser }, testInfo) => {
    testInfo.setTimeout(TEST_TIMEOUT_LONG)
    const { payload: payloadFromInit, serverURL: serverURLFromInit } =
      await initPayloadE2ENoConfig<Config>({
        dirname,
      })
    serverURL = serverURLFromInit

    formsUrl = new AdminUrlUtil(serverURL, 'forms')
    submissionsUrl = new AdminUrlUtil(serverURL, 'form-submissions')
    payload = payloadFromInit

    const context = await browser.newContext()
    page = await context.newPage()
    initPageConsoleErrorCatch(page)

    await ensureCompilationIsDone({ page, serverURL })
  })

  test.describe('Forms collection', () => {
    test('has contact form', async () => {
      await page.goto(formsUrl.list)

      const titleCell = page.locator('.cell-title a', {
        hasText: 'Contact Form',
      })
      const linkURL = await titleCell.getAttribute('href')
      await page.goto(`${serverURL}${linkURL}`)

      const nameField = page.locator('#field-fields__0__name')
      await expect(nameField).toHaveValue('name')

      const addFieldsButton = page.locator('.blocks-field__drawer-toggler')

      await addFieldsButton.click()

      await expect(() => expect(page.locator('.drawer__header__title')).toBeVisible()).toPass({
        timeout: POLL_TOPASS_TIMEOUT,
      })

      await page
        .locator('button.thumbnail-card', {
          hasText: 'Text Area',
        })
        .click()

      await expect(() =>
        expect(
          page.locator('.pill__label', {
            hasText: 'Text Area',
          }),
        ).toBeVisible(),
      ).toPass({
        timeout: POLL_TOPASS_TIMEOUT,
      })
    })
  })

  test.describe('Form submissions collection', () => {
    test('has form submissions', async () => {
      // Verify the list is non-empty
      await page.goto(submissionsUrl.list)
      await expect(page.locator('.table .cell-id a').first()).toBeVisible()

      // Find the seeded submission via SDK to avoid ordering issues from accumulated test data
      const { docs: contactForms } = await payload.find({
        collection: formsSlug,
        limit: 1,
        where: { title: { equals: 'Contact Form' } },
      })
      const { docs: submissions } = await payload.find({
        collection: formSubmissionsSlug,
        limit: 1,
        sort: 'createdAt',
        where: { form: { equals: contactForms[0]!.id } },
      })
      const seededSubmission = submissions[0]!

      await page.goto(submissionsUrl.edit(seededSubmission.id))
      await expect(() => expect(page.url()).toContain(String(seededSubmission.id))).toPass({
        timeout: POLL_TOPASS_TIMEOUT,
      })

      await expect(page.locator('#field-submissionData__0__value')).toHaveValue('Test Submission')
      await expect(page.locator('#field-submissionData__1__value')).toHaveValue(
        'tester@example.com',
      )
    })

    test('can create form submission', async () => {
      const { docs } = await payload.find({
        collection: 'forms',
        where: {
          title: {
            contains: 'Contact',
          },
        },
      })

      const createdSubmission = await payload.create({
        collection: 'form-submissions',
        data: {
          form: docs[0].id,
          submissionData: [
            {
              field: 'name',
              value: 'New tester',
            },
            {
              field: 'email',
              value: 'new@example.com',
            },
          ],
        },
      })

      await page.goto(submissionsUrl.edit(createdSubmission.id))

      await expect(page.locator('#field-submissionData__0__value')).toHaveValue('New tester')
      await expect(page.locator('#field-submissionData__1__value')).toHaveValue('new@example.com')
    })

    test('can create form submission from the admin panel', async () => {
      await page.goto(submissionsUrl.create)

      const formSelect = page.locator('#field-form')
      await selectInput({
        multiSelect: false,
        option: 'Contact Form',
        selectLocator: formSelect,
        selectType: 'relationship',
      })

      await expect(formSelect.locator('.rs__value-container')).toContainText('Contact Form')

      await page.locator('#field-submissionData button.array-field__add-row').click()
      await page.locator('#field-submissionData__0__field').fill('name')
      await page.locator('#field-submissionData__0__value').fill('Test Submission')
      await saveDocAndAssert(page)

      // Check that the fields are still editable, as this user is an admin
      await expect(page.locator('#field-submissionData__0__field')).toBeEditable()
      await expect(page.locator('#field-submissionData__0__value')).toBeEditable()
    })

    test('can create form submission - with date field', async () => {
      const { docs } = await payload.find({
        collection: 'forms',
        where: {
          title: {
            contains: 'Booking',
          },
        },
      })

      const createdSubmission = await payload.create({
        collection: 'form-submissions',
        data: {
          form: docs[0].id,
          submissionData: [
            {
              field: 'name',
              value: 'New tester',
            },
            {
              field: 'email',
              value: 'new@example.com',
            },
            {
              field: 'date',
              value: '2025-10-01T00:00:00.000Z',
            },
          ],
        },
      })

      await page.goto(submissionsUrl.edit(createdSubmission.id))

      await expect(page.locator('#field-submissionData__0__value')).toHaveValue('New tester')
      await expect(page.locator('#field-submissionData__1__value')).toHaveValue('new@example.com')
      await expect(page.locator('#field-submissionData__2__value')).toHaveValue(
        '2025-10-01T00:00:00.000Z',
      )
    })
  })

  test.describe('REST API - Upload Fields', () => {
    test('can submit form with direct file upload via REST API', async ({ request }) => {
      // Get the upload form
      const { docs } = await payload.find({
        collection: 'forms',
        where: {
          title: {
            equals: 'Upload Form',
          },
        },
      })

      const uploadForm = docs[0]
      expect(uploadForm).toBeDefined()

      const fileBuffer = fs.readFileSync(testImagePath)

      const response = await request.post(`${serverURL}/api/${formSubmissionsSlug}`, {
        multipart: {
          _payload: JSON.stringify({
            form: uploadForm.id,
            submissionData: [{ field: 'fullName', value: 'E2E Test User' }],
          }),
          avatar: {
            name: 'test-avatar.png',
            buffer: fileBuffer,
            mimeType: 'image/png',
          },
        },
      })

      expect(response.status()).toBe(201)

      const result = await response.json()
      expect(result.doc).toBeDefined()

      // Fetch at depth=0 so submissionUploads value is a raw ID, not a populated document
      const { docs: submissionDocs } = await payload.find({
        collection: formSubmissionsSlug,
        depth: 0,
        limit: 1,
        where: { id: { equals: result.doc.id } },
      })
      const avatarUpload = submissionDocs[0]?.submissionUploads?.[0]
      // value is now hasMany array; at depth=0 each item is { relationTo, value: rawId }
      const avatarItems = avatarUpload?.value as Array<{ relationTo: string; value: string }>
      const mediaRelation = avatarItems?.[0]
      const mediaId = mediaRelation?.value

      expect(avatarUpload?.field).toBe('avatar')
      expect(mediaRelation?.relationTo).toBe(mediaSlug)

      // Verify the media document was created
      const { docs: mediaDocs } = await payload.find({
        collection: mediaSlug,
        where: { id: { equals: mediaId } },
      })
      expect(mediaDocs[0]).toBeDefined()
      expect(mediaDocs[0]?.filename).toContain('test-avatar')

      // Cleanup
      await payload.delete({ id: String(result.doc.id), collection: formSubmissionsSlug })
      await payload.delete({ id: mediaId, collection: mediaSlug })
    })

    test('validates required upload field via REST API', async ({ request }) => {
      const { docs } = await payload.find({
        collection: 'forms',
        where: {
          title: {
            equals: 'Upload Form',
          },
        },
      })

      const uploadForm = docs[0]

      // Submit without the required file
      const response = await request.post(`${serverURL}/api/${formSubmissionsSlug}`, {
        data: {
          form: uploadForm.id,
          submissionData: [{ field: 'fullName', value: 'Missing File User' }],
        },
      })

      expect(response.status()).toBe(400)

      const result = await response.json()
      expect(result.errors).toBeDefined()
      // Validation errors are nested in data.errors
      const validationErrors = result.errors[0]?.data?.errors
      expect(validationErrors).toBeDefined()
      expect(validationErrors.length).toBeGreaterThan(0)
    })

    test('validates MIME type restrictions via REST API', async ({ request }) => {
      const { docs } = await payload.find({
        collection: 'forms',
        where: {
          title: {
            equals: 'Image Upload Form',
          },
        },
      })

      const imageForm = docs[0]
      expect(imageForm).toBeDefined()

      // Try to upload a PDF to a field that only accepts PNG/JPEG
      const pdfBuffer = fs.readFileSync(testPdfPath)

      const response = await request.post(`${serverURL}/api/${formSubmissionsSlug}`, {
        multipart: {
          _payload: JSON.stringify({
            form: imageForm?.id,
            submissionData: [{ field: 'description', value: 'Test with wrong file type' }],
          }),
          image: {
            name: 'test.pdf',
            buffer: pdfBuffer,
            mimeType: 'application/pdf',
          },
        },
      })

      expect(response.status()).toBe(400)

      const result = await response.json()
      expect(result.errors).toBeDefined()
      // Validation errors are nested in data.errors
      const validationErrors = result.errors[0]?.data?.errors
      expect(validationErrors).toBeDefined()
      // Should have an error about MIME type
      const mimeError = validationErrors.find((e: { message: string }) =>
        e.message.includes('not allowed'),
      )
      expect(mimeError).toBeDefined()
    })

    test('accepts valid image upload with MIME type restrictions via REST API', async ({
      request,
    }) => {
      const { docs } = await payload.find({
        collection: 'forms',
        where: {
          title: {
            equals: 'Image Upload Form',
          },
        },
      })

      const imageForm = docs[0]
      const fileBuffer = fs.readFileSync(testImagePath)

      const response = await request.post(`${serverURL}/api/${formSubmissionsSlug}`, {
        multipart: {
          _payload: JSON.stringify({
            form: imageForm.id,
            submissionData: [{ field: 'description', value: 'Valid image upload' }],
          }),
          image: {
            name: 'valid-image.png',
            buffer: fileBuffer,
            mimeType: 'image/png',
          },
        },
      })

      expect(response.status()).toBe(201)

      const result = await response.json()
      expect(result.doc).toBeDefined()

      // Upload fields are in submissionUploads; fetch at depth=0 for raw IDs
      const { docs: submissionDocs } = await payload.find({
        collection: formSubmissionsSlug,
        depth: 0,
        limit: 1,
        where: { id: { equals: result.doc.id } },
      })
      const imageUpload = submissionDocs[0]?.submissionUploads?.[0]
      // value is now hasMany array; at depth=0 each item is { relationTo, value: rawId }
      const imageItems = imageUpload?.value as Array<{ relationTo: string; value: string }>
      const imageRelation = imageItems?.[0]
      const imageMediaId = imageRelation?.value

      expect(imageUpload?.field).toBe('image')
      expect(imageRelation?.relationTo).toBe(mediaSlug)

      // Cleanup
      await payload.delete({ id: String(result.doc.id), collection: formSubmissionsSlug })
      await payload.delete({ id: imageMediaId, collection: mediaSlug })
    })

    test('supports pre-uploaded file IDs for backwards compatibility via REST API', async ({
      request,
    }) => {
      const { docs } = await payload.find({
        collection: 'forms',
        where: {
          title: {
            equals: 'Upload Form',
          },
        },
      })

      const uploadForm = docs[0]

      // Pre-upload a file
      const fileBuffer = fs.readFileSync(testImagePath)
      const uploadResponse = await request.post(`${serverURL}/api/${mediaSlug}`, {
        multipart: {
          file: {
            name: 'pre-uploaded.png',
            buffer: fileBuffer,
            mimeType: 'image/png',
          },
        },
      })

      expect(uploadResponse.status()).toBe(201)
      const uploadResult = await uploadResponse.json()
      const preUploadedFileId = uploadResult.doc.id

      // Submit form with pre-uploaded file ID
      const response = await request.post(`${serverURL}/api/${formSubmissionsSlug}`, {
        data: {
          form: uploadForm.id,
          submissionData: [
            { field: 'fullName', value: 'Pre-upload Test User' },
            { field: 'avatar', value: preUploadedFileId },
          ],
        },
      })

      expect(response.status()).toBe(201)

      const result = await response.json()

      // Pre-uploaded file IDs are now in submissionUploads; fetch at depth=0 for raw IDs
      const { docs: submissionDocs } = await payload.find({
        collection: formSubmissionsSlug,
        depth: 0,
        limit: 1,
        where: { id: { equals: result.doc.id } },
      })
      const avatarUpload = submissionDocs[0]?.submissionUploads?.[0]
      // value is now hasMany array; at depth=0 each item is { relationTo, value: rawId }
      const avatarItems = avatarUpload?.value as Array<{ relationTo: string; value: string }>
      const avatarRelation = avatarItems?.[0]

      expect(avatarUpload?.field).toBe('avatar')
      expect(String(avatarRelation?.value)).toBe(String(preUploadedFileId))

      // Cleanup
      await payload.delete({ id: String(result.doc.id), collection: formSubmissionsSlug })
      await payload.delete({ id: String(preUploadedFileId), collection: mediaSlug })
    })

    test('can submit form with mixed fields (text + upload) via REST API', async ({ request }) => {
      const { docs } = await payload.find({
        collection: 'forms',
        where: {
          title: {
            equals: 'Upload Form',
          },
        },
      })

      const uploadForm = docs[0]
      const fileBuffer = fs.readFileSync(testImagePath)

      const response = await request.post(`${serverURL}/api/${formSubmissionsSlug}`, {
        multipart: {
          _payload: JSON.stringify({
            form: uploadForm.id,
            submissionData: [{ field: 'fullName', value: 'Mixed Fields User' }],
          }),
          avatar: {
            name: 'mixed-test.png',
            buffer: fileBuffer,
            mimeType: 'image/png',
          },
        },
      })

      expect(response.status()).toBe(201)

      const result = await response.json()

      // Text fields remain in submissionData
      const nameData = result.doc.submissionData.find(
        (d: { field: string }) => d.field === 'fullName',
      )
      expect(nameData).toBeDefined()
      expect(nameData.value).toBe('Mixed Fields User')

      // Upload field is in submissionUploads; fetch at depth=0 for raw IDs
      const { docs: submissionDocs } = await payload.find({
        collection: formSubmissionsSlug,
        depth: 0,
        limit: 1,
        where: { id: { equals: result.doc.id } },
      })
      const avatarUpload = submissionDocs[0]?.submissionUploads?.[0]
      // value is now hasMany array; at depth=0 each item is { relationTo, value: rawId }
      const avatarItems = avatarUpload?.value as Array<{ relationTo: string; value: string }>
      const avatarRelation = avatarItems?.[0]
      const avatarMediaId = avatarRelation?.value

      expect(avatarUpload?.field).toBe('avatar')
      expect(avatarRelation?.relationTo).toBe(mediaSlug)

      // Cleanup
      await payload.delete({ id: String(result.doc.id), collection: formSubmissionsSlug })
      await payload.delete({ id: avatarMediaId, collection: mediaSlug })
    })

    test('can submit multi-file upload form via REST API and stores one entry per field', async ({
      request,
    }) => {
      const { docs } = await payload.find({
        collection: 'forms',
        where: { title: { equals: 'Multi-File Upload Form' } },
      })

      const multiFileForm = docs[0]!

      const imageBuffer = fs.readFileSync(testImagePath)
      const pdfBuffer = fs.readFileSync(testPdfPath)

      // Upload two images to photos + one PDF to doc in a single request
      const response = await request.post(`${serverURL}/api/${formSubmissionsSlug}`, {
        multipart: {
          _payload: JSON.stringify({
            form: multiFileForm.id,
            submissionData: [],
          }),
          photos: { name: 'photo1.png', buffer: imageBuffer, mimeType: 'image/png' },
          // Playwright multipart doesn't support duplicate keys; use the REST API directly
          // for the second photo — we test that one entry has multiple items instead
          doc: { name: 'report.pdf', buffer: pdfBuffer, mimeType: 'application/pdf' },
        },
      })

      expect(response.status()).toBe(201)
      const result = await response.json()

      // Fetch at depth=0 for raw IDs
      const { docs: submissionDocs } = await payload.find({
        collection: formSubmissionsSlug,
        depth: 0,
        limit: 1,
        where: { id: { equals: result.doc.id } },
      })

      const submissionUploads = submissionDocs[0]?.submissionUploads
      // One entry per field (photos + doc = 2 entries)
      expect(submissionUploads).toHaveLength(2)

      const photosEntry = submissionUploads?.find((u: { field: string }) => u.field === 'photos')
      const docEntry = submissionUploads?.find((u: { field: string }) => u.field === 'doc')

      // photos entry: value is array with 1 item pointing to media
      expect(photosEntry).toBeDefined()
      const photosItems = photosEntry?.value as Array<{ relationTo: string; value: string }>
      expect(photosItems).toHaveLength(1)
      expect(photosItems[0]?.relationTo).toBe(mediaSlug)

      // doc entry: value is array with 1 item pointing to documents
      expect(docEntry).toBeDefined()
      const docItems = docEntry?.value as Array<{ relationTo: string; value: string }>
      expect(docItems).toHaveLength(1)
      expect(docItems[0]?.relationTo).toBe(documentsSlug)

      // Cleanup
      await payload.delete({ id: String(result.doc.id), collection: formSubmissionsSlug })
      await payload.delete({ id: photosItems[0]!.value, collection: mediaSlug })
      await payload.delete({ id: docItems[0]!.value, collection: documentsSlug })
    })
  })

  test.describe('Custom View - Upload Form Test', () => {
    const uploadFormTestPath = '/admin/upload-form-test'
    let uploadFormId: string
    let imageFormId: string
    let multiFileFormId: string

    test.beforeAll(async () => {
      const { docs: uploadForms } = await payload.find({
        collection: formsSlug,
        where: { title: { equals: 'Upload Form' } },
      })
      const { docs: imageForms } = await payload.find({
        collection: formsSlug,
        where: { title: { equals: 'Image Upload Form' } },
      })
      const { docs: multiFileForms } = await payload.find({
        collection: formsSlug,
        where: { title: { equals: 'Multi-File Upload Form' } },
      })
      uploadFormId = uploadForms[0]!.id
      imageFormId = imageForms[0]!.id
      multiFileFormId = multiFileForms[0]!.id
    })

    test('renders both upload form sections', async () => {
      await page.goto(`${serverURL}${uploadFormTestPath}`)
      await expect(page.locator(`[data-testid="form-section-${uploadFormId}"] h2`)).toBeVisible()
      await expect(page.locator(`[data-testid="form-section-${imageFormId}"] h2`)).toBeVisible()
    })

    test('Upload Form: submits with valid image and shows upload result', async () => {
      await page.goto(`${serverURL}${uploadFormTestPath}`)

      const uploadFormSection = page.locator(`[data-testid="form-section-${uploadFormId}"]`)

      await uploadFormSection.locator('input[name="fullName"]').fill('E2E Browser User')
      await uploadFormSection
        .locator('input[type="file"][name="avatar"]')
        .setInputFiles(testImagePath)
      await uploadFormSection.getByRole('button', { name: 'Submit' }).click()

      const successEl = uploadFormSection.locator('[data-testid="upload-success"]')
      await expect(successEl).toBeVisible({ timeout: POLL_TOPASS_TIMEOUT })
      await expect(successEl).toContainText('media')

      const avatarResult = uploadFormSection.locator('[data-testid="upload-result-avatar"]')
      const resultText = await avatarResult.textContent()
      const idMatch = resultText?.match(/id:\s*(\S+)\)/)
      const mediaId = idMatch?.[1]

      const submissionText = await successEl.locator('p').first().textContent()
      const submissionIdMatch = submissionText?.match(/id:\s*(\S+)\)/)
      const submissionId = submissionIdMatch?.[1]

      expect(submissionId).toBeTruthy()
      expect(mediaId).toBeTruthy()
      await payload.delete({ id: submissionId!, collection: formSubmissionsSlug })
      await payload.delete({ id: mediaId!, collection: mediaSlug })
    })

    test('Upload Form: submission is visible in admin with submissionUploads image', async () => {
      await page.goto(`${serverURL}${uploadFormTestPath}`)

      const uploadFormSection = page.locator(`[data-testid="form-section-${uploadFormId}"]`)
      await uploadFormSection.locator('input[name="fullName"]').fill('Admin View User')
      await uploadFormSection
        .locator('input[type="file"][name="avatar"]')
        .setInputFiles(testImagePath)
      await uploadFormSection.getByRole('button', { name: 'Submit' }).click()

      const successEl = uploadFormSection.locator('[data-testid="upload-success"]')
      await expect(successEl).toBeVisible({ timeout: POLL_TOPASS_TIMEOUT })

      const submissionText = await successEl.locator('p').first().textContent()
      const submissionId = submissionText?.match(/id:\s*(\S+)\)/)?.[1]
      const mediaId = (
        await uploadFormSection.locator('[data-testid="upload-result-avatar"]').textContent()
      )?.match(/id:\s*(\S+)\)/)?.[1]

      expect(submissionId).toBeTruthy()
      expect(mediaId).toBeTruthy()

      // Navigate to the submission in the admin
      await page.goto(`${serverURL}/admin/collections/${formSubmissionsSlug}/${submissionId}`)

      // The submissionUploads array should render the image thumbnail
      await expect(page.locator('.field-type.upload').first()).toBeVisible({
        timeout: POLL_TOPASS_TIMEOUT,
      })

      // Cleanup
      await payload.delete({ id: submissionId!, collection: formSubmissionsSlug })
      await payload.delete({ id: mediaId!, collection: mediaSlug })
    })

    test('Image Upload Form: shows MIME type error when uploading PDF', async () => {
      await page.goto(`${serverURL}${uploadFormTestPath}`)

      const imageFormSection = page.locator(`[data-testid="form-section-${imageFormId}"]`)

      await imageFormSection.locator('input[type="file"][name="image"]').setInputFiles(testPdfPath)
      await imageFormSection.getByRole('button', { name: 'Submit' }).click()

      const errorEl = imageFormSection.locator('[data-testid="upload-error"]')
      await expect(errorEl).toBeVisible({ timeout: POLL_TOPASS_TIMEOUT })
      await expect(errorEl).toContainText('not allowed')
    })

    test('Image Upload Form: accepts valid PNG and shows upload result', async () => {
      await page.goto(`${serverURL}${uploadFormTestPath}`)

      const imageFormSection = page.locator(`[data-testid="form-section-${imageFormId}"]`)

      await imageFormSection
        .locator('input[type="file"][name="image"]')
        .setInputFiles(testImagePath)
      await imageFormSection.getByRole('button', { name: 'Submit' }).click()

      const successEl = imageFormSection.locator('[data-testid="upload-success"]')
      await expect(successEl).toBeVisible({ timeout: POLL_TOPASS_TIMEOUT })
      await expect(successEl).toContainText('media')

      const imageResult = imageFormSection.locator('[data-testid="upload-result-image"]')
      const resultText = await imageResult.textContent()
      const idMatch = resultText?.match(/id:\s*(\S+)\)/)
      const mediaId = idMatch?.[1]

      const submissionText = await successEl.locator('p').first().textContent()
      const submissionIdMatch = submissionText?.match(/id:\s*(\S+)\)/)
      const submissionId = submissionIdMatch?.[1]

      expect(submissionId).toBeTruthy()
      expect(mediaId).toBeTruthy()
      await payload.delete({ id: submissionId!, collection: formSubmissionsSlug })
      await payload.delete({ id: mediaId!, collection: mediaSlug })
    })

    test('Multi-File Upload Form: submits two images + one document and shows both collections in result', async () => {
      await page.goto(`${serverURL}${uploadFormTestPath}`)

      const multiFormSection = page.locator(`[data-testid="form-section-${multiFileFormId}"]`)

      await multiFormSection
        .locator('input[type="file"][name="photos"]')
        .setInputFiles([testImagePath, testImagePath])
      await multiFormSection.locator('input[type="file"][name="doc"]').setInputFiles(testPdfPath)
      await multiFormSection.getByRole('button', { name: 'Submit' }).click()

      const successEl = multiFormSection.locator('[data-testid="upload-success"]')
      await expect(successEl).toBeVisible({ timeout: POLL_TOPASS_TIMEOUT })

      // photos field should mention media collection
      const photosResult = multiFormSection.locator('[data-testid="upload-result-photos"]')
      await expect(photosResult.first()).toContainText(mediaSlug)

      // doc field should mention documents collection
      const docResult = multiFormSection.locator('[data-testid="upload-result-doc"]')
      await expect(docResult).toContainText(documentsSlug)

      // Cleanup — extract submission ID then delete via SDK
      const submissionText = await successEl.locator('p').first().textContent()
      const submissionId = submissionText?.match(/id:\s*(\S+)\)/)?.[1]
      expect(submissionId).toBeTruthy()

      // Collect uploaded media/document IDs from the submission so we can clean them up
      const { docs: submissionDocs } = await payload.find({
        collection: formSubmissionsSlug,
        depth: 0,
        limit: 1,
        where: { id: { equals: submissionId! } },
      })

      const uploadedIdsByCollection = new Map<string, string[]>()
      for (const upload of submissionDocs[0]?.submissionUploads || []) {
        const items = upload.value as Array<{ relationTo: string; value: string }>
        for (const item of items) {
          const existing = uploadedIdsByCollection.get(item.relationTo) || []
          existing.push(item.value)
          uploadedIdsByCollection.set(item.relationTo, existing)
        }
      }

      await payload.delete({ id: submissionId!, collection: formSubmissionsSlug })

      for (const [collection, ids] of uploadedIdsByCollection.entries()) {
        for (const id of ids) {
          await payload.delete({ id, collection: collection as 'documents' | 'media' })
        }
      }
    })
  })
})
