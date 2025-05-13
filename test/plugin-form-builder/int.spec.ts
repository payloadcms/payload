import type { Payload } from 'payload'

import path from 'path'
import { ValidationError } from 'payload'
import { fileURLToPath } from 'url'

import type { Form } from './payload-types.js'

import { serializeLexical } from '../../packages/plugin-form-builder/src/utilities/lexical/serializeLexical.js'
import { serializeSlate } from '../../packages/plugin-form-builder/src/utilities/slate/serializeSlate.js'
import { initPayloadInt } from '../helpers/initPayloadInt.js'
import { formsSlug, formSubmissionsSlug } from './shared.js'

let payload: Payload
let form: Form

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

describe('@payloadcms/plugin-form-builder', () => {
  beforeAll(async () => {
    ;({ payload } = await initPayloadInt(dirname))

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
    if (typeof payload.db.destroy === 'function') {
      await payload.db.destroy()
    }
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
})
