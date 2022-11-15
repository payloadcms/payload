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

  const { id: parentID } = await payload.create({
    collection: 'pages',
    data: {
      title: 'Parent page',
      slug: 'parent-page',
    },
  })

  await payload.create({
    collection: 'pages',
    data: {
      title: 'Child page',
      slug: 'child-page',
      parent: parentID
    },
  })
}
