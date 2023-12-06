import type { SanitizedConfig } from 'payload/types'
import { me as meOperation } from 'payload/operations'
import { createPayloadRequest } from '../createPayloadRequest'
import { NextRequest, NextResponse } from 'next/server'

export const me = async ({
  config: configPromise,
  req: request,
  res,
  params,
}: {
  config: Promise<SanitizedConfig>
  req: NextRequest
  res: NextResponse
  params: {
    collection: string
  }
}) => {
  const config = await configPromise
  const req = await createPayloadRequest({ request, config: configPromise })
  const collection = config.collections[params.collection]

  const meRes = await meOperation({
    collection: {
      config: collection,
    },
    req,
  })

  return Response.json(meRes)
}
