import type { Payload } from 'payload'
import type { PayloadRequest } from 'payload/types'

import path from 'path'
import { getFileByPath } from 'payload/utilities'

import { mediaSlug } from '../shared.js'

export const seed = async (payload: Payload): Promise<boolean> => {
  payload.logger.info('Seeding data...')
  const req = {} as PayloadRequest

  try {
    // Create image
    const filePath = path.resolve(process.cwd(), './test/plugin-seo/image-1.jpg')
    const file = await getFileByPath(filePath)

    const mediaDoc = await payload.create({
      collection: mediaSlug,
      data: {},
      file,
    })

    await payload.create({
      collection: 'pages',
      data: {
        title: 'Test Page',
        slug: 'test-page',
        meta: {
          title: 'This is a test meta title',
          description: 'This is a test meta description',
          ogTitle: 'This is a custom og:title field',
          image: mediaDoc.id,
        },
      },
      req,
    })

    return true
  } catch (err) {
    console.error(err)
    return false
  }
}
