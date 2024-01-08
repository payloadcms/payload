import type { Payload } from '../../../packages/payload/src'
import type { PayloadRequest } from '../../../packages/payload/src/express/types'

import { formSubmissionsSlug, formsSlug, pagesSlug } from '../shared'

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
        title: 'Contact Form',
        confirmationMessage: [
          {
            type: 'paragraph',
            text: 'Confirmed',
          },
        ],
        fields: [
          {
            blockType: 'text',
            label: 'Name',
            name: 'name',
            required: true,
          },
          {
            blockType: 'email',
            label: 'Email',
            name: 'email',
            required: true,
          },
        ],
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
        title: 'Contact',
        slug: 'contact',
        form: formID,
      },
    })

    return true
  } catch (err) {
    console.error(err)
    return false
  }
}
