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
import { formsSlug, formSubmissionsSlug, mediaSlug } from './shared.js'

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
      await page.goto(submissionsUrl.list)

      const firstSubmissionCell = page.locator('.table .cell-id a').last()
      const href = await firstSubmissionCell.getAttribute('href')

      await firstSubmissionCell.click()
      await expect(() => expect(page.url()).toContain(href)).toPass({
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
        selectLocator: formSelect,
        multiSelect: false,
        option: 'Contact Form',
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

      // Create multipart form data with file
      const fileBuffer = fs.readFileSync(testImagePath)
      const formData = new FormData()

      formData.append(
        '_payload',
        JSON.stringify({
          form: uploadForm.id,
          submissionData: [{ field: 'fullName', value: 'E2E Test User' }],
        }),
      )

      // Create a Blob from the file buffer for the file upload
      const blob = new Blob([fileBuffer], { type: 'image/png' })
      formData.append('avatar', blob, 'test-avatar.png')

      const response = await request.post(`${serverURL}/api/${formSubmissionsSlug}`, {
        multipart: {
          _payload: JSON.stringify({
            form: uploadForm.id,
            submissionData: [{ field: 'fullName', value: 'E2E Test User' }],
          }),
          avatar: {
            name: 'test-avatar.png',
            mimeType: 'image/png',
            buffer: fileBuffer,
          },
        },
      })

      expect(response.status()).toBe(201)

      const result = await response.json()
      expect(result.doc).toBeDefined()
      expect(result.doc.submissionData).toBeDefined()

      // Verify the file was uploaded and ID stored
      const avatarData = result.doc.submissionData.find(
        (d: { field: string }) => d.field === 'avatar',
      )
      expect(avatarData).toBeDefined()
      expect(avatarData.value).toBeTruthy()

      // Verify the media document was created
      const { docs: mediaDocs } = await payload.find({
        collection: mediaSlug,
        where: {
          id: {
            equals: avatarData.value,
          },
        },
      })
      expect(mediaDocs[0]).toBeDefined()
      expect(mediaDocs[0].filename).toContain('test-avatar')

      // Cleanup
      await payload.delete({ collection: formSubmissionsSlug, id: result.doc.id })
      await payload.delete({ collection: mediaSlug, id: avatarData.value })
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
            mimeType: 'application/pdf',
            buffer: pdfBuffer,
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
            mimeType: 'image/png',
            buffer: fileBuffer,
          },
        },
      })

      expect(response.status()).toBe(201)

      const result = await response.json()
      expect(result.doc).toBeDefined()

      const imageData = result.doc.submissionData.find(
        (d: { field: string }) => d.field === 'image',
      )
      expect(imageData).toBeDefined()
      expect(imageData.value).toBeTruthy()

      // Cleanup
      await payload.delete({ collection: formSubmissionsSlug, id: result.doc.id })
      await payload.delete({ collection: mediaSlug, id: imageData.value })
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
            mimeType: 'image/png',
            buffer: fileBuffer,
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
      const avatarData = result.doc.submissionData.find(
        (d: { field: string }) => d.field === 'avatar',
      )
      expect(avatarData.value).toBe(String(preUploadedFileId))

      // Cleanup
      await payload.delete({ collection: formSubmissionsSlug, id: result.doc.id })
      await payload.delete({ collection: mediaSlug, id: preUploadedFileId })
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
            mimeType: 'image/png',
            buffer: fileBuffer,
          },
        },
      })

      expect(response.status()).toBe(201)

      const result = await response.json()

      // Verify both fields are saved
      const nameData = result.doc.submissionData.find(
        (d: { field: string }) => d.field === 'fullName',
      )
      const avatarData = result.doc.submissionData.find(
        (d: { field: string }) => d.field === 'avatar',
      )

      expect(nameData).toBeDefined()
      expect(nameData.value).toBe('Mixed Fields User')
      expect(avatarData).toBeDefined()
      expect(avatarData.value).toBeTruthy()

      // Cleanup
      await payload.delete({ collection: formSubmissionsSlug, id: result.doc.id })
      await payload.delete({ collection: mediaSlug, id: avatarData.value })
    })
  })

  test.describe('Custom View - Upload Form Test', () => {
    const uploadFormTestPath = '/admin/upload-form-test'
    let uploadFormId: string
    let imageFormId: string

    test.beforeAll(async () => {
      const { docs: uploadForms } = await payload.find({
        collection: formsSlug,
        where: { title: { equals: 'Upload Form' } },
      })
      const { docs: imageForms } = await payload.find({
        collection: formsSlug,
        where: { title: { equals: 'Image Upload Form' } },
      })
      uploadFormId = uploadForms[0]!.id
      imageFormId = imageForms[0]!.id
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
      await payload.delete({ collection: formSubmissionsSlug, id: submissionId! })
      await payload.delete({ collection: mediaSlug, id: mediaId! })
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
      await payload.delete({ collection: formSubmissionsSlug, id: submissionId! })
      await payload.delete({ collection: mediaSlug, id: mediaId! })
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
      await payload.delete({ collection: formSubmissionsSlug, id: submissionId! })
      await payload.delete({ collection: mediaSlug, id: mediaId! })
    })
  })
})
