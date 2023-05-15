import type { Payload } from 'payload'

export const seed = async (payload: Payload): Promise<any> => {
  payload.logger.info('Seeding data...')

  await payload.create({
    collection: 'users',
    data: {
      email: 'dev@payloadcms.com',
      password: 'test',
    },
  })

  const { id: formID } = await payload.create({
    collection: 'forms',
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
    collection: 'pages',
    data: {
      title: 'Contact',
      form: formID,
    },
  })
}
