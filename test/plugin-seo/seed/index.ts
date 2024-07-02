import type { Payload, PayloadRequest } from 'payload'

import { fileURLToPath } from 'node:url'
import path from 'path'
import { getFileByPath } from 'payload'

import { mediaSlug } from '../shared.js'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const seed = async (payload: Payload): Promise<boolean> => {
  payload.logger.info('Seeding data...')
  const req = {} as PayloadRequest

  try {
    // Create image
    const filePath = path.resolve(dirname, '../image-1.jpg')
    const file = await getFileByPath(filePath)

    const mediaDoc = await payload.create({
      collection: mediaSlug,
      data: {},
      file,
    })

    await payload.create({
      collection: 'pages',
      data: {
        slug: 'test-page',
        meta: {
          description: 'This is a test meta description',
          image: mediaDoc.id,
          ogTitle: 'This is a custom og:title field',
          title: 'This is a test meta title',
        },
        title: 'Test Page',
      },
      req,
    })

    return true
  } catch (err) {
    console.error(err)
    return false
  }
}
