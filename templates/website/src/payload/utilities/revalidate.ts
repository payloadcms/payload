import type { RevalidationType } from '@/next/revalidate/route'
import type { Payload } from 'payload'

export const revalidate = async (args: {
  collection: string
  path?: string
  payload: Payload
  tag?: string
  type?: RevalidationType
}): Promise<void> => {
  const { type = 'path', collection, path, payload, tag } = args

  try {
    const baseUrl = `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/next/revalidate?secret=${process.env.REVALIDATION_KEY}`
    const url = baseUrl + (type === 'path' ? `&path=${path}` : `&tag=${tag}&type=tag`)

    const res = await fetch(url)

    if (res.ok) {
      switch (type) {
        case 'path':
          payload.logger.info(`Revalidated path '${path}' in collection '${collection}'`)
          break
        case 'tag':
          payload.logger.info(`Revalidated tag '${tag}'`)
          break
      }
    } else {
      switch (type) {
        case 'path':
          payload.logger.error(
            `Error revalidating path '${path}' in collection '${collection}`,
            res,
          )
          break
        case 'tag':
          payload.logger.error(`Error revalidating tag '${tag}' in '${collection}`, res)
          break
      }
    }
  } catch (err: unknown) {
    switch (type) {
      case 'path':
        payload.logger.error(`Error revalidating path '${path}' in collection '${collection}`, err)
        break
      case 'tag':
        payload.logger.error(`Error revalidating tag '${tag}' in '${collection}`, err)
        break
    }
  }
}
