import type { Form } from './payload-types'

import payload from '../../packages/payload/src'
import { initPayloadTest } from '../helpers/configHelpers'
import { formSubmissionsSlug, formsSlug, sentEmailSlug } from './shared'

describe('Form Builder Plugin', () => {
  let form: Form

  beforeAll(async () => {
    await initPayloadTest({ __dirname, init: { local: true } })

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

    it('can create a form with emails configured', async () => {
      const emailFormConfig: Omit<Form, 'createdAt' | 'id' | 'updatedAt'> = {
        title: 'Form With Emails',
        fields: [
          {
            name: 'name',
            blockType: 'text',
          },
          {
            name: 'email',
            blockType: 'text',
          },
        ],
        confirmationMessage: [
          {
            type: 'text',
            text: 'Confirmed.',
          },
        ],
        emails: [
          {
            subject: "You've received a new message.",
            emailTo: '{{email}}',
            message: [
              {
                children: [
                  {
                    text: 'Welcome {{name}}. Here is a dynamic ',
                  },
                  {
                    children: [
                      {
                        text: 'link',
                      },
                    ],
                    linkType: 'custom',
                    type: 'link',
                    url: 'www.payload.com?email={{email}}',
                  },
                  {
                    text: '.',
                  },
                ],
              },
            ],
          },
        ],
      }

      const testForm = await payload.create({
        collection: formsSlug,
        data: emailFormConfig,
      })

      expect(testForm).toHaveProperty('fields')
      expect(testForm.fields).toHaveLength(2)
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

    it('should send email after form submission', async () => {
      const { docs: forms } = await payload.find({
        collection: formsSlug,
        depth: 0,
        limit: 1,
        where: {
          title: {
            contains: 'Emails',
          },
        },
      })

      const formSubmission = await payload.create({
        collection: formSubmissionsSlug,
        data: {
          form: forms[0].id,
          submissionData: [
            {
              field: 'name',
              value: 'Test Submission',
            },
            {
              field: 'email',
              value: 'dev@payloadcms.com',
            },
          ],
        },
        depth: 0,
      })

      expect(formSubmission).toHaveProperty('form', forms[0].id)

      const help = await payload.find({
        collection: sentEmailSlug,
      })

      console.log(help)

      // expect(lastSentEmail[0].html).toContain(email)
    })
  })
})
