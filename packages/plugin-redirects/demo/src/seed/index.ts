import { Payload } from 'payload';

export const seed = async (payload: Payload) => {
  payload.logger.info('Seeding data...');

  await payload.create({
    collection: 'users',
    data: {
      email: 'dev@payloadcms.com',
      password: 'test',
    }
  });

  const { id: homePageID } = await payload.create({
    collection: 'pages',
    data: {
      title: 'Home Page',
      slug: 'home',
      excerpt: 'This is the home page',
    },
  })

  await payload.create({
    collection: 'redirects',
    data: {
      from: 'https://payloadcms.com/old',
      to: {
        type: 'reference',
        reference: {
          relationTo: 'pages',
          value: homePageID
        }
      }
    },
  })

  await payload.create({
    collection: 'redirects',
    data: {
      from: 'https://payloadcms.com/bad',
      to: {
        type: 'custom',
        url: 'https://payloadcms.com/good'
      }
    },
  })
}
