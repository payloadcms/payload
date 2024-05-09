import type { Payload, PayloadRequestWithData } from 'payload/types'

import path from 'path'
import { fileURLToPath } from 'url'

import { pagesSlug, postsSlug, relationsSlug, uploadsSlug } from '../shared.js'

const filePath = fileURLToPath(import.meta.url)
const dirname = path.dirname(filePath)

export const seed = async (payload: Payload): Promise<boolean> => {
  payload.logger.info('Seeding data...')
  const req = {} as PayloadRequestWithData

  try {
    await payload.create({
      collection: 'users',
      data: {
        email: 'demo@payloadcms.com',
        password: 'demo',
      },
      req,
    })

    const page = await payload.create({
      collection: pagesSlug,
      data: {
        title: 'page',
      },
    })

    const post1 = await payload.create({
      collection: postsSlug,
      data: {
        title: 'post 1',
      },
    })

    const post2 = await payload.create({
      collection: postsSlug,
      data: {
        title: 'post 2',
      },
    })

    const upload = await payload.create({
      collection: uploadsSlug,
      data: {},
      filePath: path.resolve(dirname, './image.jpg'),
    })

    await payload.create({
      collection: relationsSlug,
      depth: 0,
      data: {
        hasOne: post1.id,
        hasOnePoly: { relationTo: 'pages', value: page.id },
        hasMany: [post1.id, post2.id],
        hasManyPoly: [
          { relationTo: 'posts', value: post1.id },
          { relationTo: 'pages', value: page.id },
        ],
        upload: upload.id,
      },
    })

    await payload.create({
      collection: relationsSlug,
      depth: 0,
      data: {
        hasOnePoly: { relationTo: 'pages', value: page.id },
      },
    })

    return true
  } catch (err) {
    console.error(err)
    return false
  }
}
