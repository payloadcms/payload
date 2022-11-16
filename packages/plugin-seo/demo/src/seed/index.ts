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

  await payload.create({
    collection: 'pages',
    data: {
      title: 'Home Page',
      slug: 'home',
      excerpt: 'This is the home page'
    },
  })
}
