import config from '@payload-config'
import { type CollectionSlug, getPayload } from 'payload'

export const getDocs = async <T>(collection: CollectionSlug): Promise<T[]> => {
  const payload = await getPayload({ config })

  try {
    const { docs } = await payload.find({
      collection,
      depth: 0,
      limit: 100,
    })

    if (docs) {
      return docs as T[]
    }
  } catch (err) {
    throw new Error(`Error getting docs: ${err.message}`)
  }

  throw new Error('No docs found')
}
