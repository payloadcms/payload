import config from '@payload-config'
import { getPayloadHMR } from '@payloadcms/next/utilities/getPayloadHMR.js'

export const getDocs = async <T>(collection: string): Promise<T[]> => {
  const payload = await getPayloadHMR({ config })

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
