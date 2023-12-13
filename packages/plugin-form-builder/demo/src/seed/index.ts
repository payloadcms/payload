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
      confirmationMessage: [
        {
          text: 'Confirmed',
          type: 'paragraph',
        },
      ],
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
    collection: 'pages',
    data: {
      form: formID,
      title: 'Contact',
    },
  })
}
