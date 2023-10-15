import type { Payload } from 'payload'

export const seed = async (payload: Payload): Promise<void> => {
  payload.logger.info('Seeding data...')

  await payload.create({
    collection: 'users',
    data: {
      email: 'dev@payloadcms.com',
      password: 'test',
    },
  })

  const { id: parentID } = await payload.create({
    collection: 'pages',
    data: {
      title: 'Parent page',
      slug: 'parent-page',
    },
  })

  const { id: childID } = await payload.create({
    collection: 'pages',
    data: {
      title: 'Child page',
      slug: 'child-page',
      parent: parentID,
    },
  })

  await payload.create({
    collection: 'pages',
    data: {
      title: 'Grandchild page',
      slug: 'grandchild-page',
      parent: childID,
    },
  })

  await payload.create({
    collection: 'pages',
    data: {
      title: 'Sister page',
      slug: 'sister-page',
    },
  })
}
