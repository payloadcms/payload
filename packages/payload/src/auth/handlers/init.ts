import type { SanitizedConfig } from '../../exports/config'

import { getPayload } from '../..'
import init from '../operations/init'

export const initHandler = ({ config }: { config: Promise<SanitizedConfig> }) =>
  async function (request: Request, { params }: { params: { collection: string } }) {
    const payload = await getPayload({ config })
    request.payload = payload

    const initialized = await init({
      collection: params.collection,
      req: request,
    })

    return Response.json({ initialized })
  }
