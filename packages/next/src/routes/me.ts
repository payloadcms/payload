import type { SanitizedConfig } from 'payload/types'
import { me as meOperation } from 'payload/operations'
import { createPayloadRequest } from '../createPayloadRequest'

export const me = ({ config: configPromise }: { config: Promise<SanitizedConfig> }) =>
  async function (request: Request, { params }: { params: { collection: string } }) {
    const req = await createPayloadRequest({ request, config: configPromise })
    const config = await configPromise
    const collection = config.collections[params.collection]

    const meRes = await meOperation({
      collection: {
        config: collection,
      },
      req,
    })

    return Response.json(meRes)
  }
