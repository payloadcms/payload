import type { PayloadRequestWithData } from 'payload'

type CorsArgs = {
  headers: Headers
  req: Partial<PayloadRequestWithData>
}
export const headersWithCors = ({ headers, req }: CorsArgs): Headers => {
  const cors = req?.payload.config.cors
  const requestOrigin = req?.headers.get('Origin')

  if (cors) {
    headers.set('Access-Control-Allow-Methods', 'PUT, PATCH, POST, GET, DELETE, OPTIONS')
    headers.set(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept, Authorization, Content-Encoding, x-apollo-tracing',
    )

    if (cors === '*') {
      headers.set('Access-Control-Allow-Origin', '*')
    } else if (Array.isArray(cors) && cors.indexOf(requestOrigin) > -1) {
      headers.set('Access-Control-Allow-Credentials', 'true')
      headers.set('Access-Control-Allow-Origin', requestOrigin)
    }
  }

  return headers
}
