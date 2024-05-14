import type { Payload } from 'payload'

export const revalidate = async (args: {
  collection: string
  path: string
  payload: Payload
}): Promise<void> => {
  const { collection, path, payload } = args

  try {
    const res = await fetch(
      `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/next/revalidate?secret=${process.env.REVALIDATION_KEY}&path=${path}`,
    )

    if (res.ok) {
      payload.logger.info(`Revalidated path '${path}' in collection '${collection}'`)
    } else {
      payload.logger.error(`Error revalidating path '${path}' in collection '${collection}`, res)
    }
  } catch (err: unknown) {
    payload.logger.error(`Error revalidating path '${path}' in collection '${collection}`, err)
  }
}
