import type { Payload, PayloadRequest } from 'payload'

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

    // seed 1000 pages
    for (let i = 0; i < 1000; i++) {
      await payload.create({
        collection: 'pages',
        data: {
          title: `Test page title ${i}`,
          _status: 'published',
        },
        req,
      })
    }

    // seed 1000 posts
    for (let i = 0; i < 1000; i++) {
      await payload.create({
        collection: 'posts',
        data: {
          title: `Test post title ${i}`,
          _status: 'published',
        },
        req,
      })
    }

    return true
  } catch (err) {
    console.error(err)
    return false
  }
}
