import type { Payload } from 'payload'

export const seed = async (payload: Payload): Promise<boolean> => {
  payload.logger.info('Seeding data...')

  try {
    await payload.create({
      collection: 'users',
      data: {
        email: 'demo@payloadcms.com',
        password: 'demo',
      },
      overrideAccess: true,
    })

    const { id: parentID } = await payload.create({
      collection: 'pages',
      data: {
        slug: 'parent-page',
        title: 'Parent page',
        _status: 'published',
      },
      overrideAccess: true,
    })

    const { id: childID } = await payload.create({
      collection: 'pages',
      data: {
        parent: parentID,
        slug: 'child-page',
        title: 'Child page',
        _status: 'published',
      },
      overrideAccess: true,
    })

    await payload.create({
      collection: 'pages',
      data: {
        parent: childID,
        slug: 'grandchild-page',
        title: 'Grandchild page',
        _status: 'published',
      },
      overrideAccess: true,
    })

    await payload.create({
      collection: 'pages',
      data: {
        slug: 'sister-page',
        title: 'Sister page',
        _status: 'published',
      },
      overrideAccess: true,
    })
    return true
  } catch (err) {
    console.error(err)
    return false
  }
}
