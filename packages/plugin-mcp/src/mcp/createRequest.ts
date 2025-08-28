import { APIError, type PayloadRequest } from 'payload'

export const createRequestFromPayloadRequest = (req: PayloadRequest) => {
  if (!req.url) {
    throw new APIError('Request URL is required', 500)
  }
  return new Request(req.url, {
    body: req.body,
    duplex: 'half',
    headers: req.headers,
    method: req.method,
  } as { duplex: 'half' } & RequestInit)
}
