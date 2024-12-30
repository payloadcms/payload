import type { CollectionSlug, Where } from 'payload'

import config from '@payload-config'
import { getPayload } from 'payload'

export const getDoc = async <T>(args: {
  collection: CollectionSlug
  depth?: number
  draft?: boolean
  slug?: string
}): Promise<T> => {
  const payload = await getPayload({ config })
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

    if (docs[0]) {
      return docs[0] as T
    }
  } catch (err) {
    throw new Error(`Error getting doc: ${err.message}`)
  }

  throw new Error('No doc found')
}
