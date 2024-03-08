import type { Payload } from '../../packages/payload/src/index.js'
import type { Form } from './payload-types.js'

import { ValidationError } from '../../packages/payload/src/errors/index.js'
import { getPayload } from '../../packages/payload/src/index.js'
import { serializeLexical } from '../../packages/plugin-form-builder/src/utilities/lexical/serializeLexical.js'
import { serializeSlate } from '../../packages/plugin-form-builder/src/utilities/slate/serializeSlate.js'
import { startMemoryDB } from '../startMemoryDB.js'
import configPromise from './config.js'
import { formSubmissionsSlug, formsSlug } from './shared.js'

let payload: Payload
let form: Form

describe('@payloadcms/plugin-form-builder', () => {
  beforeAll(async () => {
    const config = await startMemoryDB(configPromise)
    payload = await getPayload({ config })

    const formConfig: Omit<Form, 'createdAt' | 'id' | 'updatedAt'> = {
      title: 'Test Form',
      fields: [
        {
          name: 'name',
          blockType: 'text',
        },
      ],
      confirmationMessage: [
        {
          type: 'text',
          text: 'Confirmed.',
        },
      ],
    }

    form = (await payload.create({
      collection: formsSlug,
      data: formConfig,
    })) as unknown as Form
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
        title: 'Test Form',
        fields: [
          {
            name: 'name',
            blockType: 'text',
          },
        ],
        confirmationMessage: [
          {
            type: 'text',
            text: 'Confirmed.',
          },
        ],
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
        custom: 'custom',
        title: 'Test Form',
        confirmationMessage: [
          {
            type: 'text',
            text: 'Confirmed.',
          },
        ],
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

    it('replaces curly braces with data when using slate serializer', async () => {
      const mockName = 'Test Submission'
      const mockEmail = 'dev@payloadcms.com'

      const serializedEmail = serializeSlate(
        [
          { text: 'Welcome {{name}}. Here is a dynamic ' },
          {
            children: [
              {
                text: 'link',
              },
            ],
            type: 'link',
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

    it('replaces curly braces with data when using lexical serializer', async () => {
      const mockName = 'Test Submission'
      const mockEmail = 'dev@payloadcms.com'

      const serializedEmail = await serializeLexical(
        {
          root: {
            type: 'root',
            format: '',
            indent: 0,
            version: 1,
            children: [
              {
                type: 'paragraph',
                direction: 'ltr',
                format: '',
                indent: 0,
                version: 1,
                children: [
                  {
                    detail: 0,
                    format: 0,
                    mode: 'normal',
                    style: '',
                    text: 'Name: {{name}}',
                    type: 'text',
                    version: 1,
                  },
                  {
                    type: 'linebreak',
                    version: 1,
                  },
                  {
                    detail: 0,
                    format: 0,
                    mode: 'normal',
                    style: '',
                    text: 'Email: {{email}}',
                    type: 'text',
                    version: 1,
                  },
                ],
              },
            ],
            direction: 'ltr',
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
  })
})
