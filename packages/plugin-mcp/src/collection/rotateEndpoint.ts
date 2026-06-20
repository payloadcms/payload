import type { PayloadRequest } from 'payload'

import { rotateMcpApiKey } from '../utils/rotateMcpApiKey.js'

export const rotateMcpApiKeyHandler = async (req: PayloadRequest) => {
  if (!req.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const id = req.routeParams?.id
  if (!id || typeof id !== 'string') {
    return Response.json({ error: 'ID is required' }, { status: 400 })
  }

  try {
    const { apiKey } = await rotateMcpApiKey({ id, req })

    return Response.json({ apiKey })
  } catch {
    return Response.json({ error: 'Failed to rotate API key' }, { status: 500 })
  }
}
