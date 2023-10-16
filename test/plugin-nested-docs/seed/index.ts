import type { Payload } from '../../../packages/payload/src'

export const seed = async (payload: Payload): Promise<boolean> => {
  payload.logger.info('Seeding data...')

  try {
    await payload.create({
      collection: 'users',
      data: {
        email: 'demo@payloadcms.com',
        password: 'demo',
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
    return true
  } catch (err) {
    console.error(err)
    return false
  }
}
