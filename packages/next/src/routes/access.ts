import type { SanitizedConfig } from 'payload/types'
import { getAccessResults } from 'payload/auth'
import { createPayloadRequest } from '../createPayloadRequest'

export const access = ({ config }: { config: Promise<SanitizedConfig> }) =>
  async function (request: Request, { params }: { params: { collection: string } }) {
    const req = await createPayloadRequest({ request, config })
    const accessRes = await getAccessResults({ req })
    return Response.json(accessRes)
  }
