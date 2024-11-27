import config from '@payload-config'
import { getPayload } from 'payload'

export const getDocs = async <T>(collection: string): Promise<T[]> => {
  const payload = await getPayload({ config })

  try {
    const { docs } = await payload.find({
      collection,
      depth: 0,
      limit: 100,
    })

    return docs as T[]
  } catch (err) {
    console.error(err)
  }

  throw new Error('Error getting docs')
}
