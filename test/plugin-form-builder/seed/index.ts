import type { Payload, PayloadRequest } from 'payload'

import { formsSlug, formSubmissionsSlug, pagesSlug } from '../shared.js'

export const seed = async (payload: Payload): Promise<boolean> => {
  payload.logger.info('Seeding data...')
  const req = {} as PayloadRequest

  try {
    await payload.create({
      collection: 'users',
      data: {
        email: 'demo@payloadcms.com',
        password: 'demo',
      },
      req,
    })

    await payload.create({
      collection: pagesSlug,
      data: {
        slug: 'home',
        title: 'Home page',
      },
      req,
    })

    const { id: formID } = await payload.create({
      collection: formsSlug,
      data: {
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
                    text: 'Confirmed',
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
            label: 'Name',
            required: true,
          },
          {
            name: 'email',
            blockType: 'email',
            label: 'Email',
            required: true,
          },
        ],
        title: 'Contact Form',
      },
    })

    await payload.create({
      collection: formSubmissionsSlug,
      data: {
        form: formID,
        submissionData: [
          {
            field: 'name',
            value: 'Test Submission',
          },
          {
            field: 'email',
            value: 'tester@example.com',
          },
        ],
      },
    })

    await payload.create({
      collection: pagesSlug,
      data: {
        slug: 'contact',
        form: formID,
        title: 'Contact',
      },
    })

    return true
  } catch (err) {
    console.error(err)
    return false
  }
}
