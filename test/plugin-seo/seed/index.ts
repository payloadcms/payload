import type { Payload } from 'payload'

import path from 'path'

import type { PayloadRequest } from '../../../packages/payload/types'

import getFileByPath from '../../../packages/payload/src/uploads/getFileByPath'
import { mediaSlug } from '../shared'

export const seed = async (payload: Payload): Promise<boolean> => {
  payload.logger.info('Seeding data...')
  const req = {} as PayloadRequest

  try {
    // Create image
    const filePath = path.resolve(__dirname, '../image-1.jpg')
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
