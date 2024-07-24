import type { Where } from 'payload'

import config from '@payload-config'
import { getPayloadHMR } from '@payloadcms/next/utilities/getPayloadHMR.js'

export const getDoc = async <T>(args: {
  collection: string
  depth?: number
  draft?: boolean
  slug?: string
}): Promise<T> => {
  const payload = await getPayloadHMR({ config })
  const { slug, collection, depth = 2, draft } = args || {}

  const where: Where = {}

  if (slug) {
    where.slug = {
      equals: slug,
    }
  }

  try {
    const { docs } = await payload.find({
      collection,
      depth,
      where,
      draft,
    })

    if (docs[0]) return docs[0] as T
  } catch (err) {
    console.log('Error getting doc', err)
  }

  throw new Error('Error getting doc')
}
