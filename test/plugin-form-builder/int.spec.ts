import type { Payload } from 'payload'

import path from 'path'
import { ValidationError } from 'payload'
import { fileURLToPath } from 'url'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import type { NextRESTClient } from '../helpers/NextRESTClient.js'
import type { Form } from './payload-types.js'

import { serializeLexical } from '../../packages/plugin-form-builder/src/utilities/lexical/serializeLexical.js'
import { serializeSlate } from '../../packages/plugin-form-builder/src/utilities/slate/serializeSlate.js'
import { initPayloadInt } from '../helpers/initPayloadInt.js'
import { createStreamableFile } from '../uploads/createStreamableFile.js'
import { documentsSlug, formsSlug, formSubmissionsSlug, mediaSlug } from './shared.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Path to test image file
const testImagePath = path.resolve(dirname, '../uploads/image.png')
const testPdfPath = path.resolve(dirname, '../uploads/test-pdf.pdf')

let payload: Payload
let restClient: NextRESTClient
let form: Form

describe('@payloadcms/plugin-form-builder', () => {
  beforeAll(async () => {
    ;({ payload, restClient } = await initPayloadInt(dirname))

    const formConfig: Omit<Form, 'createdAt' | 'id' | 'updatedAt'> = {
      confirmationType: 'message',
      confirmationMessage: {
        root: {
          children: [
            {
              children: [
                {
                  detail: 0,
                  format: 0,
                  mode: 'normal',
                  style: '',
                  text: 'Confirmed.',
                  type: 'text',
                  version: 1,
                },
              ],
              direction: 'ltr',
              format: '',
              indent: 0,
              type: 'paragraph',
              version: 1,
              textFormat: 0,
              textStyle: '',
            },
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          type: 'root',
          version: 1,
        },
      },
      fields: [
        {
          name: 'name',
          blockType: 'text',
        },
      ],
      title: 'Test Form',
    }

    form = (await payload.create({
      collection: formsSlug,
      data: formConfig,
    })) as unknown as Form
  })

  afterAll(async () => {
    await payload.destroy()
  })

  describe('plugin collections', () => {
    it('adds forms collection', async () => {
      const { docs: forms } = await payload.find({ collection: formsSlug })
      expect(forms.length).toBeGreaterThan(0)
    })

    it('adds form submissions collection', async () => {
      const { docs: formSubmissions } = await payload.find({ collection: formSubmissionsSlug })
      expect(formSubmissions).toHaveLength(1)
    })
  })

  describe('form building', () => {
    it('can create a simple form', async () => {
      const formConfig: Omit<Form, 'createdAt' | 'id' | 'updatedAt'> = {
        confirmationType: 'message',
        confirmationMessage: {
          root: {
            children: [
              {
                children: [
                  {
                    detail: 0,
                    format: 0,
                    mode: 'normal',
                    style: '',
                    text: 'Confirmed.',
                    type: 'text',
                    version: 1,
                  },
                ],
                direction: 'ltr',
                format: '',
                indent: 0,
                type: 'paragraph',
                version: 1,
                textFormat: 0,
                textStyle: '',
              },
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            type: 'root',
            version: 1,
          },
        },
        fields: [
          {
            name: 'name',
            blockType: 'text',
          },
        ],
        title: 'Test Form',
      }

      const testForm = await payload.create({
        collection: formsSlug,
        data: formConfig,
      })

      expect(testForm).toHaveProperty('fields')
      expect(testForm.fields).toHaveLength(1)
      expect(testForm.fields[0]).toHaveProperty('name', 'name')
    })

    it('can use form overrides', async () => {
      const formConfig: Omit<Form, 'createdAt' | 'id' | 'updatedAt'> = {
        confirmationType: 'message',
        confirmationMessage: {
          root: {
            children: [
              {
                children: [
                  {
                    detail: 0,
                    format: 0,
                    mode: 'normal',
                    style: '',
                    text: 'Confirmed.',
                    type: 'text',
                    version: 1,
                  },
                ],
                direction: 'ltr',
                format: '',
                indent: 0,
                type: 'paragraph',
                version: 1,
                textFormat: 0,
                textStyle: '',
              },
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            type: 'root',
            version: 1,
          },
        },
        custom: 'custom',
        title: 'Test Form',
      }

      const testForm = await payload.create({
        collection: formsSlug,
        data: formConfig,
      })

      expect(testForm).toHaveProperty('custom', 'custom')
    })
  })

  describe('form submissions and validations', () => {
    it('can create a form submission', async () => {
      const formSubmission = await payload.create({
        collection: formSubmissionsSlug,
        data: {
          form: form.id,
          submissionData: [
            {
              field: 'name',
              value: 'Test Submission',
            },
          ],
        },
        depth: 0,
      })

      expect(formSubmission).toHaveProperty('form', form.id)
      expect(formSubmission).toHaveProperty('submissionData')
      expect(formSubmission.submissionData).toHaveLength(1)
      expect(formSubmission.submissionData[0]).toHaveProperty('field', 'name')
      expect(formSubmission.submissionData[0]).toHaveProperty('value', 'Test Submission')
    })

    it('does not create a form submission for a non-existing form', async () => {
      const req = async () =>
        payload.create({
          collection: formSubmissionsSlug,
          data: {
            form: '659c7c2f98ffb5d83df9dadb',
            submissionData: [
              {
                field: 'name',
                value: 'Test Submission',
              },
            ],
          },
          depth: 0,
        })

      await expect(req).rejects.toThrow(ValidationError)
    })

    describe('replaces curly braces', () => {
      describe('slate serializer', () => {
        it('specific field names', () => {
          const mockName = 'Test Submission'
          const mockEmail = 'dev@payloadcms.com'

          const serializedEmail = serializeSlate(
            [
              { text: 'Welcome {{name}}. Here is a dynamic ' },
              {
                type: 'link',
                children: [
                  {
                    text: 'link',
                  },
                ],
                url: 'www.test.com?email={{email}}',
              },
            ],
            [
              { field: 'name', value: mockName },
              { field: 'email', value: mockEmail },
            ],
          )

          expect(serializedEmail).toContain(mockName)
          expect(serializedEmail).toContain(mockEmail)
        })

        it('wildcard "{{*}}"', () => {
          const mockName = 'Test Submission'
          const mockEmail = 'dev@payloadcms.com'

          const serializedEmail = serializeSlate(
            [{ text: '{{*}}' }],
            [
              { field: 'name', value: mockName },
              { field: 'email', value: mockEmail },
            ],
          )

          expect(serializedEmail).toContain(`name : ${mockName}`)
          expect(serializedEmail).toContain(`email : ${mockEmail}`)
        })

        it('wildcard with table formatting "{{*:table}}"', () => {
          const mockName = 'Test Submission'
          const mockEmail = 'dev@payloadcms.com'

          const serializedEmail = serializeSlate(
            [{ text: '{{*:table}}' }],
            [
              { field: 'name', value: mockName },
              { field: 'email', value: mockEmail },
            ],
          )

          expect(serializedEmail).toContain(`<table>`)
          expect(serializedEmail).toContain(`<tr><td>name</td><td>${mockName}</td></tr>`)
          expect(serializedEmail).toContain(`<tr><td>email</td><td>${mockEmail}</td></tr>`)
        })
      })

      describe('lexical serializer', () => {
        it('specific field names', async () => {
          const mockName = 'Test Submission'
          const mockEmail = 'dev@payloadcms.com'

          const serializedEmail = await serializeLexical(
            {
              root: {
                type: 'root',
                children: [
                  {
                    type: 'paragraph',
                    children: [
                      {
                        type: 'text',
                        detail: 0,
                        format: 0,
                        mode: 'normal',
                        style: '',
                        text: 'Name: {{name}}',
                        version: 1,
                      },
                      {
                        type: 'linebreak',
                        version: 1,
                      },
                      {
                        type: 'text',
                        detail: 0,
                        format: 0,
                        mode: 'normal',
                        style: '',
                        text: 'Email: {{email}}',
                        version: 1,
                      },
                    ],
                    direction: 'ltr',
                    format: '',
                    indent: 0,
                    version: 1,
                  },
                ],
                direction: 'ltr',
                format: '',
                indent: 0,
                version: 1,
              },
            },
            [
              { field: 'name', value: mockName },
              { field: 'email', value: mockEmail },
            ],
          )

          expect(serializedEmail).toContain(`Name: ${mockName}`)
          expect(serializedEmail).toContain(`Email: ${mockEmail}`)
        })

        it('wildcard "{{*}}"', async () => {
          const mockName = 'Test Submission'
          const mockEmail = 'dev@payloadcms.com'

          const serializedEmail = await serializeLexical(
            {
              root: {
                type: 'root',
                children: [
                  {
                    type: 'paragraph',
                    children: [
                      {
                        type: 'text',
                        detail: 0,
                        format: 0,
                        mode: 'normal',
                        style: '',
                        text: '{{*}}',
                        version: 1,
                      },
                    ],
                    direction: 'ltr',
                    format: '',
                    indent: 0,
                    version: 1,
                  },
                ],
                direction: 'ltr',
                format: '',
                indent: 0,
                version: 1,
              },
            },
            [
              { field: 'name', value: mockName },
              { field: 'email', value: mockEmail },
            ],
          )

          expect(serializedEmail).toContain(`name : ${mockName}`)
          expect(serializedEmail).toContain(`email : ${mockEmail}`)
        })

        it('wildcard with table formatting "{{*:table}}"', async () => {
          const mockName = 'Test Submission'
          const mockEmail = 'dev@payloadcms.com'

          const serializedEmail = await serializeLexical(
            {
              root: {
                type: 'root',
                children: [
                  {
                    type: 'paragraph',
                    children: [
                      {
                        type: 'text',
                        detail: 0,
                        format: 0,
                        mode: 'normal',
                        style: '',
                        text: '{{*:table}}',
                        version: 1,
                      },
                    ],
                    direction: 'ltr',
                    format: '',
                    indent: 0,
                    version: 1,
                  },
                ],
                direction: 'ltr',
                format: '',
                indent: 0,
                version: 1,
              },
            },
            [
              { field: 'name', value: mockName },
              { field: 'email', value: mockEmail },
            ],
          )

          expect(serializedEmail).toContain(`<table>`)
          expect(serializedEmail).toContain(`<tr><td>name</td><td>${mockName}</td></tr>`)
          expect(serializedEmail).toContain(`<tr><td>email</td><td>${mockEmail}</td></tr>`)
        })
      })
    })
  })

  describe('upload fields', () => {
    const createdFormIds: string[] = []
    const createdSubmissionIds: string[] = []
    const createdMediaIds: string[] = []

    afterEach(async () => {
      for (const id of createdSubmissionIds) {
        try {
          await payload.delete({ collection: formSubmissionsSlug, id })
        } catch {
          // ignore if already deleted
        }
      }
      createdSubmissionIds.length = 0

      for (const id of createdFormIds) {
        try {
          await payload.delete({ collection: formsSlug, id })
        } catch {
          // ignore if already deleted
        }
      }
      createdFormIds.length = 0

      for (const id of createdMediaIds) {
        try {
          await payload.delete({ collection: mediaSlug, id })
        } catch {
          // ignore if already deleted
        }
      }
      createdMediaIds.length = 0
    })

    const confirmationMessage = {
      root: {
        children: [
          {
            children: [
              {
                detail: 0,
                format: 0,
                mode: 'normal',
                style: '',
                text: 'Thanks!',
                type: 'text',
                version: 1,
              },
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            type: 'paragraph',
            version: 1,
            textFormat: 0,
            textStyle: '',
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'root',
        version: 1,
      },
    }

    describe('form creation with upload fields', () => {
      it('should create a form with a single upload field', async () => {
        const testForm = await payload.create({
          collection: formsSlug,
          data: {
            confirmationType: 'message',
            confirmationMessage,
            title: 'Upload Form',
            fields: [
              {
                blockType: 'upload',
                name: 'resume',
                label: 'Resume',
                uploadCollection: mediaSlug,
                required: true,
              },
            ],
          },
        })

        createdFormIds.push(testForm.id)

        expect(testForm.fields).toHaveLength(1)
        expect(testForm.fields[0]).toHaveProperty('blockType', 'upload')
        expect(testForm.fields[0]).toHaveProperty('name', 'resume')
        expect(testForm.fields[0]).toHaveProperty('uploadCollection', mediaSlug)
      })

      it('should create a form with multiple upload fields', async () => {
        const testForm = await payload.create({
          collection: formsSlug,
          data: {
            confirmationType: 'message',
            confirmationMessage,
            title: 'Multi Upload Form',
            fields: [
              {
                blockType: 'upload',
                name: 'photo',
                uploadCollection: mediaSlug,
              },
              {
                blockType: 'upload',
                name: 'document',
                uploadCollection: documentsSlug,
              },
            ],
          },
        })

        createdFormIds.push(testForm.id)

        expect(testForm.fields).toHaveLength(2)
      })

      it('should create a form with mixed field types including upload', async () => {
        const testForm = await payload.create({
          collection: formsSlug,
          data: {
            confirmationType: 'message',
            confirmationMessage,
            title: 'Mixed Form',
            fields: [
              { blockType: 'text', name: 'fullName' },
              { blockType: 'email', name: 'email' },
              { blockType: 'upload', name: 'avatar', uploadCollection: mediaSlug },
            ],
          },
        })

        createdFormIds.push(testForm.id)

        expect(testForm.fields).toHaveLength(3)
        expect(testForm.fields[2]).toHaveProperty('blockType', 'upload')
      })
    })

    describe('required field validation', () => {
      it('should reject submission when required upload field is missing', async () => {
        const testForm = await payload.create({
          collection: formsSlug,
          data: {
            confirmationType: 'message',
            confirmationMessage,
            title: 'Required Upload Form',
            fields: [
              {
                blockType: 'upload',
                name: 'requiredFile',
                label: 'Required File',
                uploadCollection: mediaSlug,
                required: true,
              },
            ],
          },
        })

        createdFormIds.push(testForm.id)

        await expect(
          payload.create({
            collection: formSubmissionsSlug,
            data: {
              form: testForm.id,
              submissionData: [],
            },
          }),
        ).rejects.toThrow(ValidationError)
      })

      it('should reject submission when required upload field has empty string', async () => {
        const testForm = await payload.create({
          collection: formsSlug,
          data: {
            confirmationType: 'message',
            confirmationMessage,
            title: 'Required Upload Form 2',
            fields: [
              {
                blockType: 'upload',
                name: 'requiredFile',
                label: 'Required File',
                uploadCollection: mediaSlug,
                required: true,
              },
            ],
          },
        })

        createdFormIds.push(testForm.id)

        await expect(
          payload.create({
            collection: formSubmissionsSlug,
            data: {
              form: testForm.id,
              submissionData: [{ field: 'requiredFile', value: '' }],
            },
          }),
        ).rejects.toThrow(ValidationError)
      })

      it('should accept submission when required upload field has valid file ID', async () => {
        // Create a test media document
        const mediaDoc = await payload.create({
          collection: mediaSlug,
          data: { alt: 'test' },
          filePath: testImagePath,
        })

        createdMediaIds.push(mediaDoc.id)

        const testForm = await payload.create({
          collection: formsSlug,
          data: {
            confirmationType: 'message',
            confirmationMessage,
            title: 'Required Upload Form 3',
            fields: [
              {
                blockType: 'upload',
                name: 'requiredFile',
                uploadCollection: mediaSlug,
                required: true,
              },
            ],
          },
        })

        createdFormIds.push(testForm.id)

        const submission = await payload.create({
          collection: formSubmissionsSlug,
          data: {
            form: testForm.id,
            submissionData: [{ field: 'requiredFile', value: mediaDoc.id }],
          },
        })

        createdSubmissionIds.push(submission.id)

        expect(submission).toHaveProperty('id')
        // IDs are stored as strings in submission data
        expect(submission.submissionData?.[0]).toHaveProperty('value', String(mediaDoc.id))
      })
    })

    describe('optional field handling', () => {
      it('should accept submission when optional upload field is omitted', async () => {
        const testForm = await payload.create({
          collection: formsSlug,
          data: {
            confirmationType: 'message',
            confirmationMessage,
            title: 'Optional Upload Form',
            fields: [
              { blockType: 'text', name: 'name', required: true },
              {
                blockType: 'upload',
                name: 'optionalFile',
                uploadCollection: mediaSlug,
                required: false,
              },
            ],
          },
        })

        createdFormIds.push(testForm.id)

        const submission = await payload.create({
          collection: formSubmissionsSlug,
          data: {
            form: testForm.id,
            submissionData: [{ field: 'name', value: 'John Doe' }],
          },
        })

        createdSubmissionIds.push(submission.id)

        expect(submission).toHaveProperty('id')
      })

      it('should accept submission with only some upload fields filled', async () => {
        const mediaDoc = await payload.create({
          collection: mediaSlug,
          data: { alt: 'test' },
          filePath: testImagePath,
        })

        createdMediaIds.push(mediaDoc.id)

        const testForm = await payload.create({
          collection: formsSlug,
          data: {
            confirmationType: 'message',
            confirmationMessage,
            title: 'Multiple Optional Uploads',
            fields: [
              {
                blockType: 'upload',
                name: 'required',
                uploadCollection: mediaSlug,
                required: true,
              },
              {
                blockType: 'upload',
                name: 'optional1',
                uploadCollection: mediaSlug,
                required: false,
              },
              {
                blockType: 'upload',
                name: 'optional2',
                uploadCollection: mediaSlug,
                required: false,
              },
            ],
          },
        })

        createdFormIds.push(testForm.id)

        const submission = await payload.create({
          collection: formSubmissionsSlug,
          data: {
            form: testForm.id,
            submissionData: [{ field: 'required', value: mediaDoc.id }],
          },
        })

        createdSubmissionIds.push(submission.id)

        expect(submission).toHaveProperty('id')
      })
    })

    describe('mimeType validation', () => {
      it('should reject file with disallowed mime type', async () => {
        // Create a PDF document in documents collection
        const pdfDoc = await payload.create({
          collection: documentsSlug,
          data: {},
          filePath: testPdfPath,
        })

        createdMediaIds.push(pdfDoc.id) // Using same cleanup array

        const testForm = await payload.create({
          collection: formsSlug,
          data: {
            confirmationType: 'message',
            confirmationMessage,
            title: 'Image Only Form',
            fields: [
              {
                blockType: 'upload',
                name: 'image',
                uploadCollection: mediaSlug,
                mimeTypes: [{ mimeType: 'image/*' }],
                required: true,
              },
            ],
          },
        })

        createdFormIds.push(testForm.id)

        // Try to submit with a PDF (from documents collection) to a field expecting images
        // This should fail because we're referencing a file from the wrong collection
        await expect(
          payload.create({
            collection: formSubmissionsSlug,
            data: {
              form: testForm.id,
              submissionData: [{ field: 'image', value: pdfDoc.id }],
            },
          }),
        ).rejects.toThrow(ValidationError)
      })

      it('should accept file with allowed mime type', async () => {
        const mediaDoc = await payload.create({
          collection: mediaSlug,
          data: { alt: 'test' },
          filePath: testImagePath,
        })

        createdMediaIds.push(mediaDoc.id)

        const testForm = await payload.create({
          collection: formsSlug,
          data: {
            confirmationType: 'message',
            confirmationMessage,
            title: 'Image Form',
            fields: [
              {
                blockType: 'upload',
                name: 'image',
                uploadCollection: mediaSlug,
                mimeTypes: [{ mimeType: 'image/*' }],
                required: true,
              },
            ],
          },
        })

        createdFormIds.push(testForm.id)

        const submission = await payload.create({
          collection: formSubmissionsSlug,
          data: {
            form: testForm.id,
            submissionData: [{ field: 'image', value: mediaDoc.id }],
          },
        })

        createdSubmissionIds.push(submission.id)

        expect(submission).toHaveProperty('id')
      })
    })

    describe('file reference validation', () => {
      it('should reject non-existent file ID', async () => {
        const testForm = await payload.create({
          collection: formsSlug,
          data: {
            confirmationType: 'message',
            confirmationMessage,
            title: 'File Ref Form',
            fields: [
              {
                blockType: 'upload',
                name: 'file',
                uploadCollection: mediaSlug,
                required: true,
              },
            ],
          },
        })

        createdFormIds.push(testForm.id)

        await expect(
          payload.create({
            collection: formSubmissionsSlug,
            data: {
              form: testForm.id,
              submissionData: [{ field: 'file', value: '507f1f77bcf86cd799439011' }],
            },
          }),
        ).rejects.toThrow(ValidationError)
      })
    })

    describe('other form data integrity', () => {
      it('should save all non-upload fields when upload succeeds', async () => {
        const mediaDoc = await payload.create({
          collection: mediaSlug,
          data: { alt: 'test' },
          filePath: testImagePath,
        })

        createdMediaIds.push(mediaDoc.id)

        const testForm = await payload.create({
          collection: formsSlug,
          data: {
            confirmationType: 'message',
            confirmationMessage,
            title: 'Mixed Data Form',
            fields: [
              { blockType: 'text', name: 'name' },
              { blockType: 'email', name: 'email' },
              { blockType: 'upload', name: 'avatar', uploadCollection: mediaSlug },
            ],
          },
        })

        createdFormIds.push(testForm.id)

        const submission = await payload.create({
          collection: formSubmissionsSlug,
          data: {
            form: testForm.id,
            submissionData: [
              { field: 'name', value: 'John Doe' },
              { field: 'email', value: 'john@example.com' },
              { field: 'avatar', value: mediaDoc.id },
            ],
          },
        })

        createdSubmissionIds.push(submission.id)

        expect(submission.submissionData).toHaveLength(3)
        expect(
          submission.submissionData.find((d: { field: string }) => d.field === 'name'),
        ).toHaveProperty('value', 'John Doe')
        expect(
          submission.submissionData.find((d: { field: string }) => d.field === 'email'),
        ).toHaveProperty('value', 'john@example.com')
        expect(
          submission.submissionData.find((d: { field: string }) => d.field === 'avatar'),
        ).toHaveProperty('value', String(mediaDoc.id))
      })

      it('should handle form with no upload fields same as before', async () => {
        const testForm = await payload.create({
          collection: formsSlug,
          data: {
            confirmationType: 'message',
            confirmationMessage,
            title: 'No Upload Form',
            fields: [{ blockType: 'text', name: 'message' }],
          },
        })

        createdFormIds.push(testForm.id)

        const submission = await payload.create({
          collection: formSubmissionsSlug,
          data: {
            form: testForm.id,
            submissionData: [{ field: 'message', value: 'Hello World' }],
          },
        })

        createdSubmissionIds.push(submission.id)

        expect(submission).toHaveProperty('id')
        expect(submission.submissionData[0]).toHaveProperty('value', 'Hello World')
      })
    })

    describe('direct file upload via REST', () => {
      it('should upload file directly with form submission', async () => {
        const testForm = await payload.create({
          collection: formsSlug,
          data: {
            confirmationType: 'message',
            confirmationMessage,
            title: 'Direct Upload Form',
            fields: [
              { blockType: 'text', name: 'name' },
              { blockType: 'upload', name: 'avatar', uploadCollection: mediaSlug, required: true },
            ],
          },
        })

        createdFormIds.push(testForm.id)

        // Create form data with file
        const formData = new FormData()
        const { file, handle } = await createStreamableFile(testImagePath)

        formData.append(
          '_payload',
          JSON.stringify({
            form: testForm.id,
            submissionData: [{ field: 'name', value: 'John Doe' }],
          }),
        )
        formData.append('avatar', file)

        const response = await restClient.POST(`/${formSubmissionsSlug}`, {
          body: formData,
          file,
        })

        await handle.close()

        expect(response.status).toBe(201)

        const result = await response.json()

        createdSubmissionIds.push(result.doc.id)

        // Find the media doc that was created and clean it up
        const avatarData = result.doc.submissionData.find(
          (d: { field: string }) => d.field === 'avatar',
        )

        expect(avatarData).toBeDefined()
        expect(avatarData.value).toBeTruthy()

        createdMediaIds.push(avatarData.value)

        // Verify the media document was created
        const mediaDoc = await payload.findByID({
          collection: mediaSlug,
          id: avatarData.value,
        })

        expect(mediaDoc).toBeDefined()
        // Compare as strings since submission data stores IDs as strings
        expect(String(mediaDoc.id)).toBe(String(avatarData.value))
        expect(mediaDoc).toHaveProperty('filename')
      })

      it('should reject direct upload when MIME type is not allowed', async () => {
        const testForm = await payload.create({
          collection: formsSlug,
          data: {
            confirmationType: 'message',
            confirmationMessage,
            title: 'Image Only Direct Upload',
            fields: [
              {
                blockType: 'upload',
                name: 'image',
                uploadCollection: mediaSlug,
                mimeTypes: [{ mimeType: 'image/*' }],
                required: true,
              },
            ],
          },
        })

        createdFormIds.push(testForm.id)

        // Try to upload a PDF to a field that only accepts images
        const formData = new FormData()
        const { file, handle } = await createStreamableFile(testPdfPath)

        formData.append(
          '_payload',
          JSON.stringify({
            form: testForm.id,
            submissionData: [],
          }),
        )
        formData.append('image', file)

        const response = await restClient.POST(`/${formSubmissionsSlug}`, {
          body: formData,
          file,
        })

        await handle.close()

        expect(response.status).toBe(400)
      })

      it('should create submission with mixed direct upload and other fields', async () => {
        const testForm = await payload.create({
          collection: formsSlug,
          data: {
            confirmationType: 'message',
            confirmationMessage,
            title: 'Mixed Direct Upload Form',
            fields: [
              { blockType: 'text', name: 'fullName' },
              { blockType: 'email', name: 'email' },
              { blockType: 'upload', name: 'photo', uploadCollection: mediaSlug },
            ],
          },
        })

        createdFormIds.push(testForm.id)

        const formData = new FormData()
        const { file, handle } = await createStreamableFile(testImagePath)

        formData.append(
          '_payload',
          JSON.stringify({
            form: testForm.id,
            submissionData: [
              { field: 'fullName', value: 'Jane Smith' },
              { field: 'email', value: 'jane@example.com' },
            ],
          }),
        )
        formData.append('photo', file)

        const response = await restClient.POST(`/${formSubmissionsSlug}`, {
          body: formData,
          file,
        })

        await handle.close()

        expect(response.status).toBe(201)

        const result = await response.json()

        createdSubmissionIds.push(result.doc.id)

        // Check all fields are saved
        const fullNameData = result.doc.submissionData.find(
          (d: { field: string }) => d.field === 'fullName',
        )
        const emailData = result.doc.submissionData.find(
          (d: { field: string }) => d.field === 'email',
        )
        const photoData = result.doc.submissionData.find(
          (d: { field: string }) => d.field === 'photo',
        )

        expect(fullNameData).toHaveProperty('value', 'Jane Smith')
        expect(emailData).toHaveProperty('value', 'jane@example.com')
        expect(photoData).toBeDefined()
        expect(photoData.value).toBeTruthy()

        createdMediaIds.push(photoData.value)
      })

      it('should still accept pre-uploaded file IDs for backwards compatibility', async () => {
        // Pre-upload a file
        const mediaDoc = await payload.create({
          collection: mediaSlug,
          data: { alt: 'test' },
          filePath: testImagePath,
        })

        createdMediaIds.push(mediaDoc.id)

        const testForm = await payload.create({
          collection: formsSlug,
          data: {
            confirmationType: 'message',
            confirmationMessage,
            title: 'Pre-uploaded File Form',
            fields: [
              {
                blockType: 'upload',
                name: 'document',
                uploadCollection: mediaSlug,
                required: true,
              },
            ],
          },
        })

        createdFormIds.push(testForm.id)

        // Submit with file ID instead of direct upload
        const formData = new FormData()
        formData.append(
          '_payload',
          JSON.stringify({
            form: testForm.id,
            submissionData: [{ field: 'document', value: mediaDoc.id }],
          }),
        )

        const response = await restClient.POST(`/${formSubmissionsSlug}`, {
          body: formData,
        })

        expect(response.status).toBe(201)

        const result = await response.json()

        createdSubmissionIds.push(result.doc.id)

        const documentData = result.doc.submissionData.find(
          (d: { field: string }) => d.field === 'document',
        )

        expect(documentData).toHaveProperty('value', String(mediaDoc.id))
      })
    })
  })
})
