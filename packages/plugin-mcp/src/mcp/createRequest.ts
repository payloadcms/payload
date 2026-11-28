import { AuthenticationError, type PayloadRequest } from 'payload'
import { stripTrailingSlash } from 'payload/shared'

export const createRequestFromPayloadRequest = (req: PayloadRequest) => {
  if (!req.url) {
    throw new AuthenticationError()
  }

  // mcp-handler matches its endpoint path exactly. Payload's own router already ignores a
  // trailing slash, e.g. the one Next.js uses when `trailingSlash: true` is set.
  const url = new URL(req.url)
  url.pathname = stripTrailingSlash(url.pathname)

  return new Request(url, {
    body: req.body,
    duplex: 'half',
    headers: req.headers,
    method: req.method,
  } as { duplex: 'half' } & RequestInit)
}
