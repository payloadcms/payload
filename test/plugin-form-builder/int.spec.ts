import type { Payload } from '../../packages/payload/src'
import type { Form } from './payload-types'

import { getPayload } from '../../packages/payload/src'
import { startMemoryDB } from '../startMemoryDB'
import configPromise from './config'
import { formSubmissionsSlug, formsSlug } from './shared'

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
      expect(formSubmissions).toHaveLength(0)
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
  })
})
