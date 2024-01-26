import type { Payload } from '../../../packages/payload/src'
import type { PayloadRequest } from '../../../packages/payload/src/types'

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

    const { id: parentID } = await payload.create({
      collection: 'pages',
      data: {
        slug: 'parent-page',
        title: 'Parent page',
      },
      req,
    })

    const { id: childID } = await payload.create({
      collection: 'pages',
      data: {
        parent: parentID,
        slug: 'child-page',
        title: 'Child page',
      },
      req,
    })

    await payload.create({
      collection: 'pages',
      data: {
        parent: childID,
        slug: 'grandchild-page',
        title: 'Grandchild page',
      },
      req,
    })

    await payload.create({
      collection: 'pages',
      data: {
        slug: 'sister-page',
        title: 'Sister page',
      },
      req,
    })
    return true
  } catch (err) {
    console.error(err)
    return false
  }
}
