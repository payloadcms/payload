import type { PayloadRequest } from 'payload'

import { rotateMcpApiKey } from '../utils/rotateMcpApiKey.js'

export const rotateMcpApiKeyHandler = async (req: PayloadRequest, res: Response) => {
  if (!req.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const id = req.routeParams?.id
  if (!id) {
    return Response.json({ error: 'ID is required' }, { status: 400 })
  }

  const { apiKey } = await rotateMcpApiKey({ id, req })

  return Response.json({ apiKey })
}
