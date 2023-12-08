import { PayloadRequest, SanitizedConfig } from 'payload/types'

type Args = {
  config: SanitizedConfig
  req: PayloadRequest
}
export const authenticate = async ({ config, req }: Args): Promise<PayloadRequest> => {
  return req
}
