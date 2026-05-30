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

    await payload.create({
      collection: 'pages',
      data: {
        title: 'Page 1',
        _status: 'published',
      },
    })

    await payload.create({
      collection: 'pages',
      data: {
        title: 'Page 2',
        _status: 'published',
      },
    })

    await payload.create({
      collection: 'pages',
      data: {
        title: 'Page 3',
        _status: 'published',
      },
    })

    await payload.create({
      collection: 'pages',
      data: {
        title: 'Page 4',
        _status: 'published',
      },
    })

    await payload.create({
      collection: 'posts',
      data: {
        slug: 'post-1',
        title: 'Post 1',
        _status: 'published',
      },
    })

    await payload.create({
      collection: 'posts',
      data: {
        slug: 'post-2',
        title: 'Post 2',
        _status: 'published',
      },
    })

    await payload.create({
      collection: 'posts',
      data: {
        slug: 'post-3',
        title: 'Post 3',
        _status: 'published',
      },
    })

    return true
  } catch (err) {
    console.error(err)
    return false
  }
}
