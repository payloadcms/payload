import type { Payload, PayloadRequest } from 'payload'
import type { PayloadSDK } from '@payloadcms/sdk'

export async function aliasedReads(payload: Payload, sdk: PayloadSDK, req: PayloadRequest) {
  const fromReq = await req.payload.find({
    collection: 'posts',
    draft: true,
  })

  const fromSdk = await sdk.find({
    collection: 'posts',
    draft: false,
  })

  const { findByID } = payload
  const byID = await findByID({
    id: '1',
    collection: 'posts',
    draft: true,
  })

  return { byID, fromReq, fromSdk }
}
