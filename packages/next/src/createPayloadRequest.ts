import type { SanitizedConfig, PayloadRequest } from 'payload/types'
import { getPayload } from 'payload'

type Args = {
  request: Request
  config: Promise<SanitizedConfig>
}

export const createPayloadRequest = async ({ request, config }: Args): Promise<PayloadRequest> => {
  const payload = await getPayload({ config })

  const req: PayloadRequest = Object.assign(request, {
    payload,
  })

  return req
}
