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
    collection: 'pages',
    data: {
      form: formID,
      title: 'Contact',
    },
  })
}
