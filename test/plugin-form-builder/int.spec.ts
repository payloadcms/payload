import type { Payload } from 'payload'

import path from 'path'
import { ValidationError } from 'payload'
import { fileURLToPath } from 'url'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import type { NextRESTClient } from '../__helpers/shared/NextRESTClient.js'
import type { Form } from './payload-types.js'

import { handleUploads } from '../../packages/plugin-form-builder/src/collections/FormSubmissions/hooks/handleUploads.js'
import { keyValuePairToHtmlTable } from '../../packages/plugin-form-builder/src/utilities/keyValuePairToHtmlTable.js'
import { serializeLexical } from '../../packages/plugin-form-builder/src/utilities/lexical/serializeLexical.js'
import { replaceDoubleCurlys } from '../../packages/plugin-form-builder/src/utilities/replaceDoubleCurlys.js'
import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'
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

  describe('replaceDoubleCurlys', () => {
    const testVariables = [
      { field: 'name', value: '<script>alert("xss")</script>' },
      { field: '<img onerror=alert(1)>', value: 'normal' },
    ]

    it('escapes HTML in named variable replacement', () => {
      const result = replaceDoubleCurlys('Hello {{name}}', testVariables)
      expect(result).not.toContain('<script>')
      expect(result).toContain('&lt;script&gt;')
    })

    it('escapes HTML in wildcard (*) field names and values', () => {
      const result = replaceDoubleCurlys('{{*}}', testVariables)
      expect(result).not.toContain('<script>')
      expect(result).not.toContain('<img')
      expect(result).toContain('&lt;script&gt;')
      expect(result).toContain('&lt;img onerror=alert(1)&gt;')
    })

    it('escapes HTML in table (*:table) output', () => {
      const result = replaceDoubleCurlys('{{*:table}}', testVariables)
      expect(result).not.toContain('<script>')
      expect(result).not.toContain('<img onerror')
      expect(result).toContain('<table>')
      expect(result).toContain('&lt;script&gt;')
    })

    it('does not double-escape safe text', () => {
      const variables = [{ field: 'greeting', value: 'Hello World' }]
      const result = replaceDoubleCurlys('{{greeting}}', variables)
      expect(result).toBe('Hello World')
    })

    it('returns original string when no variables provided', () => {
      const result = replaceDoubleCurlys('{{name}}')
      expect(result).toBe('{{name}}')
    })

    it('properly encodes quotes and special characters', () => {
      const variables = [{ field: 'name', value: '"><img src=x onerror=alert(1)>' }]
      const result = replaceDoubleCurlys('Value: {{name}}', variables)
      expect(result).not.toContain('">')
      expect(result).toContain('&quot;')
      expect(result).toContain('&lt;img')
    })
  })

  describe('keyValuePairToHtmlTable', () => {
    it('escapes HTML in keys and values', () => {
      const result = keyValuePairToHtmlTable({
        '<script>alert(1)</script>': '<img src=x onerror=alert(1)>',
        name: 'safe value',
      })
      expect(result).toContain('<table>')
      expect(result).not.toContain('<script>')
      expect(result).not.toContain('<img')
      expect(result).toContain('&lt;script&gt;')
      expect(result).toContain('&lt;img')
      // Safe values are untouched
      expect(result).toContain('safe value')
    })

    it('produces valid table structure', () => {
      const result = keyValuePairToHtmlTable({ email: 'test@test.com', name: 'John' })
      expect(result).toMatch(/^<table>.*<\/table>$/)
      expect(result).toContain('<tr><td>')
      expect(result).toContain('</td><td>')
      expect(result).toContain('</td></tr>')
    })
  })

  describe('Lexical TextHTMLConverter', () => {
    // Dynamic import to avoid circular dependency with serializeLexical
    let FormBuilderTextConverter: any
    beforeAll(async () => {
      FormBuilderTextConverter = (
        await import('../../packages/plugin-form-builder/src/utilities/lexical/converters/text.js')
      ).TextHTMLConverter
    })

    it('escapes script tags in text', () => {
      const result = FormBuilderTextConverter.converter({
        node: { format: 0, text: '<script>alert("xss")</script>' },
        submissionData: undefined,
      } as any)
      expect(result).not.toContain('<script>')
      expect(result).toContain('&lt;script&gt;')
    })

    it('escapes HTML while preserving formatting', () => {
      const result = FormBuilderTextConverter.converter({
        node: { format: 1, text: '<img src=x onerror=alert(1)>' },
        submissionData: undefined,
      } as any)
      expect(result).toContain('<strong>')
      expect(result).not.toContain('<img')
      expect(result).toContain('&lt;img')
    })

    it('applies submission data replacement after escaping', () => {
      const result = FormBuilderTextConverter.converter({
        node: { format: 0, text: 'Hello {{name}}' },
        submissionData: [{ field: 'name', value: '<b>World</b>' }],
      } as any)
      // The escapeHTML call on node.text will turn {{name}} into {{name}} (unchanged)
      // Then replaceDoubleCurlys replaces it with the escaped value
      expect(result).not.toContain('<b>')
      expect(result).toContain('&lt;b&gt;')
    })

    it('does not over-escape normal text', () => {
      const result = FormBuilderTextConverter.converter({
        node: { format: 0, text: 'Hello World' },
        submissionData: undefined,
      } as any)
      expect(result).toBe('Hello World')
    })
  })

  describe('Lexical LinkHTMLConverter', () => {
    // Dynamic import to avoid circular dependency with serializeLexical
    let FormBuilderLinkConverter: any
    beforeAll(async () => {
      FormBuilderLinkConverter = (
        await import('../../packages/plugin-form-builder/src/utilities/lexical/converters/link.js')
      ).LinkHTMLConverter
    })

    it('blocks javascript: in link href', async () => {
      const result = await FormBuilderLinkConverter.converter({
        converters: [],
        node: {
          children: [],
          fields: { linkType: 'custom', newTab: false, url: 'javascript:alert(1)' },
        },
        parent: {},
        submissionData: undefined,
      } as any)
      expect(result).not.toContain('javascript:')
      expect(result).toContain('href="#"')
    })

    it('blocks data: in link href', async () => {
      const result = await FormBuilderLinkConverter.converter({
        converters: [],
        node: {
          children: [],
          fields: {
            linkType: 'custom',
            newTab: false,
            url: 'data:text/html,<script>alert(1)</script>',
          },
        },
        parent: {},
        submissionData: undefined,
      } as any)
      expect(result).not.toContain('data:')
      expect(result).toContain('href="#"')
    })

    it('properly encodes special characters in href', async () => {
      const result = await FormBuilderLinkConverter.converter({
        converters: [],
        node: {
          children: [],
          fields: { linkType: 'custom', newTab: false, url: '"><img src=x onerror=alert(1)>' },
        },
        parent: {},
        submissionData: undefined,
      } as any)
      expect(result).not.toContain('<img')
      expect(result).toContain('&quot;')
      expect(result).toContain('&lt;img')
    })

    it('allows safe https URLs', async () => {
      const result = await FormBuilderLinkConverter.converter({
        converters: [],
        node: {
          children: [],
          fields: { linkType: 'custom', newTab: false, url: 'https://example.com/page' },
        },
        parent: {},
        submissionData: undefined,
      } as any)
      expect(result).toContain('href="https://example.com/page"')
    })

    it('allows mailto: URLs', async () => {
      const result = await FormBuilderLinkConverter.converter({
        converters: [],
        node: {
          children: [],
          fields: { linkType: 'custom', newTab: false, url: 'mailto:test@example.com' },
        },
        parent: {},
        submissionData: undefined,
      } as any)
      expect(result).toContain('href="mailto:test@example.com"')
    })

    it('allows relative URLs', async () => {
      const result = await FormBuilderLinkConverter.converter({
        converters: [],
        node: {
          children: [],
          fields: { linkType: 'custom', newTab: false, url: '/contact' },
        },
        parent: {},
        submissionData: undefined,
      } as any)
      expect(result).toContain('href="/contact"')
    })
  })

  describe('upload fields', () => {
    const createdFormIds: string[] = []
    const createdSubmissionIds: string[] = []
    const createdMediaIds: string[] = []
    const createdDocumentIds: string[] = []

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

      for (const id of createdDocumentIds) {
        try {
          await payload.delete({ collection: documentsSlug, id })
        } catch {
          // ignore if already deleted
        }
      }
      createdDocumentIds.length = 0
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
        // Upload fields are stored in submissionUploads, not submissionData
        expect(submission.submissionUploads).toHaveLength(1)
        expect(submission.submissionUploads?.[0]).toHaveProperty('field', 'requiredFile')
        expect(submission.submissionUploads?.[0].value).toBeTruthy()
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

        createdDocumentIds.push(pdfDoc.id)

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

        // Upload fields are excluded from submissionData; only text fields remain
        expect(submission.submissionData).toHaveLength(2)
        expect(
          submission.submissionData.find((d: { field: string }) => d.field === 'name'),
        ).toHaveProperty('value', 'John Doe')
        expect(
          submission.submissionData.find((d: { field: string }) => d.field === 'email'),
        ).toHaveProperty('value', 'john@example.com')
        // Upload field is in submissionUploads
        expect(submission.submissionUploads).toHaveLength(1)
        expect(submission.submissionUploads?.[0]).toHaveProperty('field', 'avatar')
        expect(submission.submissionUploads?.[0].value).toBeTruthy()
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

        // Upload field is in submissionUploads, not submissionData
        const avatarUpload = result.doc.submissionUploads?.[0]

        expect(avatarUpload).toBeDefined()
        expect(avatarUpload.field).toBe('avatar')
        // value is now hasMany: array of polymorphic items [{ relationTo, value: id | populatedDoc }]
        expect(Array.isArray(avatarUpload.value)).toBe(true)
        expect(avatarUpload.value).toHaveLength(1)

        const avatarItem = avatarUpload.value[0]
        const avatarMediaId = avatarItem?.value?.id ?? avatarItem?.value
        createdMediaIds.push(String(avatarMediaId))

        // Verify the media document was created
        const mediaDoc = await payload.findByID({
          collection: mediaSlug,
          id: avatarMediaId,
        })

        expect(mediaDoc).toBeDefined()
        expect(String(mediaDoc.id)).toBe(String(avatarMediaId))
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

        // Non-upload fields are in submissionData
        const fullNameData = result.doc.submissionData.find(
          (d: { field: string }) => d.field === 'fullName',
        )
        const emailData = result.doc.submissionData.find(
          (d: { field: string }) => d.field === 'email',
        )

        expect(fullNameData).toHaveProperty('value', 'Jane Smith')
        expect(emailData).toHaveProperty('value', 'jane@example.com')

        // Upload field is in submissionUploads
        const photoUpload = result.doc.submissionUploads?.[0]

        expect(photoUpload).toBeDefined()
        expect(photoUpload.field).toBe('photo')
        // value is now hasMany: array of polymorphic items
        expect(Array.isArray(photoUpload.value)).toBe(true)
        expect(photoUpload.value).toHaveLength(1)

        const photoItem = photoUpload.value[0]
        const photoMediaId = photoItem?.value?.id ?? photoItem?.value
        createdMediaIds.push(String(photoMediaId))
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

        // Pre-uploaded file IDs are moved from submissionData into submissionUploads
        const documentUpload = result.doc.submissionUploads?.[0]

        expect(documentUpload).toBeDefined()
        expect(documentUpload.field).toBe('document')
        expect(documentUpload.value).toBeTruthy()
      })
    })

    describe('submissionUploads population', () => {
      it('should populate submissionUploads when direct file upload succeeds', async () => {
        const testForm = await payload.create({
          collection: formsSlug,
          data: {
            confirmationType: 'message',
            confirmationMessage,
            title: 'submissionUploads direct upload test',
            fields: [
              {
                blockType: 'upload',
                name: 'photo',
                uploadCollection: mediaSlug,
                required: true,
              },
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
            submissionData: [],
          }),
        )
        formData.append('photo', file)
        let response: Awaited<ReturnType<typeof restClient.POST>>
        try {
          response = await restClient.POST(`/${formSubmissionsSlug}`, {
            body: formData,
            file,
          })
        } finally {
          await handle.close()
        }

        const result = await response.json()
        if (result.doc?.id) {
          createdSubmissionIds.push(result.doc.id)
        }

        // Register server-created media before assertions can throw
        // value is now hasMany: array of polymorphic items
        if (result.doc?.submissionUploads?.[0]?.value?.[0]) {
          const item = result.doc.submissionUploads[0].value[0]
          const mediaId = item?.value?.id ?? item?.value
          createdMediaIds.push(String(mediaId))
        }

        // Assert submissionUploads — one entry per field, value is an array
        expect(response.status).toBe(201)
        expect(result.doc.submissionUploads).toBeDefined()
        expect(result.doc.submissionUploads).toHaveLength(1)
        expect(result.doc.submissionUploads[0]).toHaveProperty('field', 'photo')
        expect(result.doc.submissionUploads[0].value).toHaveLength(1)
      })

      it('should populate submissionUploads when pre-uploaded file ID is provided', async () => {
        const mediaDoc = await payload.create({
          collection: mediaSlug,
          data: { alt: 'pre-upload' },
          filePath: testImagePath,
        })
        createdMediaIds.push(mediaDoc.id)

        const testForm = await payload.create({
          collection: formsSlug,
          data: {
            confirmationType: 'message',
            confirmationMessage,
            title: 'submissionUploads pre-upload test',
            fields: [
              {
                blockType: 'upload',
                name: 'doc',
                uploadCollection: mediaSlug,
                required: false,
              },
            ],
          },
        })
        createdFormIds.push(testForm.id)

        const formData = new FormData()
        formData.append(
          '_payload',
          JSON.stringify({
            form: testForm.id,
            submissionData: [{ field: 'doc', value: mediaDoc.id }],
          }),
        )
        const response = await restClient.POST(`/${formSubmissionsSlug}`, {
          body: formData,
        })
        const result = await response.json()
        if (result.doc?.id) {
          createdSubmissionIds.push(result.doc.id)
        }
        expect(response.status).toBe(201)

        expect(result.doc.submissionUploads).toBeDefined()
        expect(result.doc.submissionUploads).toHaveLength(1)
        expect(result.doc.submissionUploads[0]).toHaveProperty('field', 'doc')
        expect(result.doc.submissionUploads[0].value).toHaveLength(1)
      })

      it('should not populate submissionUploads when form has no upload fields', async () => {
        const testForm = await payload.create({
          collection: formsSlug,
          data: {
            confirmationType: 'message',
            confirmationMessage,
            title: 'submissionUploads empty test',
            fields: [{ blockType: 'text', name: 'fullName', required: true }],
          },
        })
        createdFormIds.push(testForm.id)

        const formData = new FormData()
        formData.append(
          '_payload',
          JSON.stringify({
            form: testForm.id,
            submissionData: [{ field: 'fullName', value: 'Alice' }],
          }),
        )
        const response = await restClient.POST(`/${formSubmissionsSlug}`, {
          body: formData,
        })
        const result = await response.json()
        if (result.doc?.id) {
          createdSubmissionIds.push(result.doc.id)
        }
        expect(response.status).toBe(201)

        // No upload fields means submissionUploads should be absent or empty
        const uploads = result.doc.submissionUploads
        expect(
          uploads === undefined ||
            uploads === null ||
            (Array.isArray(uploads) && uploads.length === 0),
        ).toBe(true)
      })

      it('should populate one submissionUploads entry per file for multiple direct uploads', async () => {
        const testForm = await payload.create({
          collection: formsSlug,
          data: {
            confirmationType: 'message',
            confirmationMessage,
            title: 'Direct multi-upload test',
            fields: [
              {
                blockType: 'upload',
                name: 'photos',
                uploadCollection: mediaSlug,
                multiple: true,
                required: false,
              },
            ],
          },
        })
        createdFormIds.push(testForm.id)

        const formData = new FormData()
        const { file: file1, handle: handle1 } = await createStreamableFile(testImagePath)
        const { file: file2, handle: handle2 } = await createStreamableFile(testImagePath)

        formData.append('_payload', JSON.stringify({ form: testForm.id, submissionData: [] }))
        formData.append('photos', file1)
        formData.append('photos', file2)

        let response: Awaited<ReturnType<typeof restClient.POST>>
        try {
          response = await restClient.POST(`/${formSubmissionsSlug}`, { body: formData })
        } finally {
          await handle1.close()
          await handle2.close()
        }

        const result = await response.json()

        if (result.doc?.id) {
          createdSubmissionIds.push(result.doc.id)
        }

        // Register created media for cleanup before assertions can throw
        // value is now hasMany: array of polymorphic items per field entry
        for (const upload of result.doc?.submissionUploads ?? []) {
          for (const item of upload.value ?? []) {
            const mediaId = item?.value?.id ?? item?.value
            createdMediaIds.push(String(mediaId))
          }
        }

        expect(response.status).toBe(201)
        // Upload field is not in submissionData
        expect(
          result.doc.submissionData?.find((d: { field: string }) => d.field === 'photos'),
        ).toBeUndefined()
        // Two files → one submissionUploads entry with two items in value
        expect(result.doc.submissionUploads).toHaveLength(1)
        expect(result.doc.submissionUploads[0]).toHaveProperty('field', 'photos')
        expect(result.doc.submissionUploads[0].value).toHaveLength(2)
      })

      it('should populate submissionUploads for hasMany + polymorphic (multi-file media + single document)', async () => {
        // Pre-upload two media files and one document
        const media1 = await payload.create({
          collection: mediaSlug,
          data: { alt: 'photo-1' },
          filePath: testImagePath,
        })
        createdMediaIds.push(media1.id)

        const media2 = await payload.create({
          collection: mediaSlug,
          data: { alt: 'photo-2' },
          filePath: testImagePath,
        })
        createdMediaIds.push(media2.id)

        const docFile = await payload.create({
          collection: documentsSlug,
          data: {},
          filePath: testPdfPath,
        })
        createdDocumentIds.push(docFile.id)

        const testForm = await payload.create({
          collection: formsSlug,
          data: {
            confirmationType: 'message',
            confirmationMessage,
            title: 'hasMany poly test form',
            fields: [
              {
                blockType: 'upload',
                name: 'photos',
                uploadCollection: mediaSlug,
                multiple: true,
                required: false,
              },
              {
                blockType: 'upload',
                name: 'doc',
                uploadCollection: documentsSlug,
                required: false,
              },
            ],
          },
        })
        createdFormIds.push(testForm.id)

        // Submit with comma-separated IDs for the multiple field + single ID for doc
        const formData = new FormData()
        formData.append(
          '_payload',
          JSON.stringify({
            form: testForm.id,
            submissionData: [
              { field: 'photos', value: `${media1.id},${media2.id}` },
              { field: 'doc', value: docFile.id },
            ],
          }),
        )
        const response = await restClient.POST(`/${formSubmissionsSlug}`, {
          body: formData,
        })
        const result = await response.json()
        if (result.doc?.id) {
          createdSubmissionIds.push(result.doc.id)
        }

        expect(response.status).toBe(201)

        // Upload fields are not in submissionData
        const photosInSubmissionData = result.doc.submissionData?.find(
          (d: { field: string }) => d.field === 'photos',
        )
        expect(photosInSubmissionData).toBeUndefined()

        // submissionUploads: one entry per field — 2 entries total (photos + doc)
        expect(result.doc.submissionUploads).toHaveLength(2)

        const photosEntry = result.doc.submissionUploads.find(
          (u: { field: string }) => u.field === 'photos',
        )
        const docEntry = result.doc.submissionUploads.find(
          (u: { field: string }) => u.field === 'doc',
        )

        // photos field has 2 files in its value array
        expect(photosEntry).toBeDefined()
        expect(photosEntry.value).toHaveLength(2)
        expect(photosEntry.value[0]).toHaveProperty('relationTo', mediaSlug)
        expect(photosEntry.value[0]).toHaveProperty('value')
        expect(photosEntry.value[1]).toHaveProperty('relationTo', mediaSlug)

        // doc field has 1 file in its value array
        expect(docEntry).toBeDefined()
        expect(docEntry.value).toHaveLength(1)
        expect(docEntry.value[0]).toHaveProperty('relationTo', documentsSlug)
        expect(docEntry.value[0]).toHaveProperty('value')
      })
    })

    describe('multiple guard', () => {
      it('should reject direct upload of multiple files when multiple is false', async () => {
        const testForm = await payload.create({
          collection: formsSlug,
          data: {
            confirmationType: 'message',
            confirmationMessage,
            title: 'Single Upload Only Form',
            fields: [
              {
                blockType: 'upload',
                name: 'avatar',
                uploadCollection: mediaSlug,
                multiple: false,
              },
            ],
          },
        })

        createdFormIds.push(testForm.id)

        const formData = new FormData()
        const { file: file1, handle: handle1 } = await createStreamableFile(testImagePath)
        const { file: file2, handle: handle2 } = await createStreamableFile(testImagePath)

        formData.append(
          '_payload',
          JSON.stringify({
            form: testForm.id,
            submissionData: [],
          }),
        )
        formData.append('avatar', file1)
        formData.append('avatar', file2)

        let response: Awaited<ReturnType<typeof restClient.POST>>
        try {
          response = await restClient.POST(`/${formSubmissionsSlug}`, {
            body: formData,
          })
        } finally {
          await handle1.close()
          await handle2.close()
        }

        expect(response.status).toBe(400)

        const result = await response.json()

        // Detailed validation messages are nested inside errors[0].data.errors
        const validationErrors: Array<{ message: string }> = result.errors[0]?.data?.errors ?? []
        const errorMessages = validationErrors.map((e) => e.message).join(' ')

        expect(errorMessages).toContain('does not allow multiple files')
      })

      it('should reject comma-separated pre-uploaded IDs when multiple is false', async () => {
        const mediaDoc1 = await payload.create({
          collection: mediaSlug,
          data: { alt: 'first' },
          filePath: testImagePath,
        })
        const mediaDoc2 = await payload.create({
          collection: mediaSlug,
          data: { alt: 'second' },
          filePath: testImagePath,
        })

        createdMediaIds.push(mediaDoc1.id, mediaDoc2.id)

        const testForm = await payload.create({
          collection: formsSlug,
          data: {
            confirmationType: 'message',
            confirmationMessage,
            title: 'Single Pre-Upload Only Form',
            fields: [
              {
                blockType: 'upload',
                name: 'photo',
                uploadCollection: mediaSlug,
                multiple: false,
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
              submissionData: [{ field: 'photo', value: `${mediaDoc1.id},${mediaDoc2.id}` }],
            },
          }),
        ).rejects.toThrow(ValidationError)
      })
    })

    describe('uploadCollection allowlist guard', () => {
      it('should reject uploads when uploadCollection is not in plugin config', async () => {
        // The form's select field enforces valid uploadCollection values at the schema level.
        // To test the defence-in-depth guard in handleUploads, create a valid form and call
        // the hook directly with a formConfig that excludes the form's uploadCollection.
        const testForm = await payload.create({
          collection: formsSlug,
          data: {
            confirmationType: 'message',
            confirmationMessage,
            title: 'Allowlist Guard Test Form',
            fields: [
              {
                blockType: 'upload',
                name: 'avatar',
                uploadCollection: mediaSlug,
              },
            ],
          },
        })

        createdFormIds.push(testForm.id)

        // formConfig with mediaSlug absent from uploadCollections — simulates a deployment
        // where the collection was later removed from the plugin config
        const restrictedFormConfig = {
          formOverrides: { slug: formsSlug },
          formSubmissionOverrides: { slug: formSubmissionsSlug },
          uploadCollections: [],
        }

        const mockReq = { payload, files: {} } as unknown as Parameters<
          import('payload').CollectionBeforeChangeHook
        >[0]['req']

        await expect(
          handleUploads(
            {
              collection: { slug: formSubmissionsSlug } as any,
              context: {},
              data: { form: testForm.id, submissionData: [] },
              findMany: false,
              operation: 'create',
              originalDoc: undefined,
              req: mockReq,
            } as any,
            restrictedFormConfig,
          ),
        ).rejects.toThrow(ValidationError)
      })
    })

    describe('dangling doc cleanup', () => {
      it('should delete successfully created docs when a later file fails validation', async () => {
        const testForm = await payload.create({
          collection: formsSlug,
          data: {
            confirmationType: 'message',
            confirmationMessage,
            title: 'Dangling Cleanup Form',
            fields: [
              {
                blockType: 'upload',
                name: 'photos',
                uploadCollection: mediaSlug,
                multiple: true,
                // Only allow images — the second file (PDF) will fail
                mimeTypes: [{ mimeType: 'image/*' }],
              },
            ],
          },
        })

        createdFormIds.push(testForm.id)

        // Capture media count before the submission attempt
        const mediaBefore = await payload.find({ collection: mediaSlug, limit: 0 })
        const countBefore = mediaBefore.totalDocs

        const formData = new FormData()
        const { file: imageFile, handle: imageHandle } = await createStreamableFile(testImagePath)
        const { file: pdfFile, handle: pdfHandle } = await createStreamableFile(testPdfPath)

        formData.append(
          '_payload',
          JSON.stringify({
            form: testForm.id,
            submissionData: [],
          }),
        )
        // First file passes (image), second fails (PDF not in image/*)
        formData.append('photos', imageFile)
        formData.append('photos', pdfFile)

        let response: Awaited<ReturnType<typeof restClient.POST>>
        try {
          response = await restClient.POST(`/${formSubmissionsSlug}`, {
            body: formData,
          })
        } finally {
          await imageHandle.close()
          await pdfHandle.close()
        }

        expect(response.status).toBe(400)

        // The image doc created before the PDF validation failure should have been cleaned up
        const mediaAfter = await payload.find({ collection: mediaSlug, limit: 0 })

        expect(mediaAfter.totalDocs).toBe(countBefore)
      })
    })
  })
})
