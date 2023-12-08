import type { SanitizedConfig } from 'payload/types'
import { init as initOperation } from 'payload/operations'
import { createPayloadRequest } from '../createPayloadRequest'

export const init = ({ config }: { config: Promise<SanitizedConfig> }) =>
  async function (request: Request, { params }: { params: { collection: string } }) {
    const req = await createPayloadRequest({ request, config, params })

    const initialized = await initOperation({
      collection: params.collection,
      req,
    })

    return Response.json({ initialized })
  }
