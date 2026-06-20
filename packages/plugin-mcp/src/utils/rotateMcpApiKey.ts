import type { DefaultDocumentIDType, PayloadRequest } from 'payload'

import crypto from 'crypto'

import type { MCPAPIKeysDoc } from '../types.js'

export async function rotateMcpApiKey({
  id,
  req,
}: {
  id: DefaultDocumentIDType
  req: PayloadRequest
}): Promise<MCPAPIKeysDoc> {
  const newKey = crypto.randomUUID()
  await req.payload.update({
    id,
    collection: 'payload-mcp-api-keys',
    data: { apiKey: newKey },
    overrideAccess: false,
    user: req.user,
  })

  return { apiKey: newKey }
}
