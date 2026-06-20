import type { DefaultDocumentIDType, PayloadRequest } from 'payload'

import crypto from 'crypto'

export async function rotateMcpApiKey({
  id,
  req,
}: {
  id: DefaultDocumentIDType
  req: PayloadRequest
}): Promise<{ apiKey: string }> {
  const newKey = crypto.randomUUID()

  await req.payload.update({
    id,
    collection: 'payload-mcp-api-keys',
    data: { apiKey: newKey },
    overrideAccess: false,
    req,
    user: req.user,
  })

  return { apiKey: newKey }
}
