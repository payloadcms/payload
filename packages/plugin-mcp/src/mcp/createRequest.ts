import { AuthenticationError, type PayloadRequest } from 'payload'

export const createRequestFromPayloadRequest = (req: PayloadRequest) => {
  if (!req.url) {
    throw new AuthenticationError()
  }

  const noBody = req.method === 'GET' || req.method === 'HEAD'

  return new Request(req.url, {
    ...(noBody ? {} : { body: req.body, duplex: 'half' }),
    headers: req.headers,
    method: req.method,
  } as { duplex: 'half' } & RequestInit)
}
