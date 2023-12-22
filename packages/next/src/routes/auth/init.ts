import type { PayloadRequest } from 'payload/types'
import { initOperation } from 'payload/operations'

export const init = async ({ req }: { req: PayloadRequest }): Promise<Response> => {
  const initialized = await initOperation({
    collection: req.collection.config.slug,
    req,
  })

  return Response.json({ initialized })
}
