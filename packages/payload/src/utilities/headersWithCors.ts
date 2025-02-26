// @ts-strict-ignore
import type { PayloadRequest } from '../types/index.js'

type CorsArgs = {
  headers: Headers
  req: Partial<PayloadRequest>
}
export const headersWithCors = ({ headers, req }: CorsArgs): Headers => {
  const cors = req?.payload.config.cors
  const requestOrigin = req?.headers.get('Origin')

  if (cors) {
    const defaultAllowedHeaders = [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'Content-Encoding',
      'x-apollo-tracing',
    ]

    headers.set('Access-Control-Allow-Methods', 'PUT, PATCH, POST, GET, DELETE, OPTIONS')

    if (typeof cors === 'object' && 'headers' in cors) {
      headers.set(
        'Access-Control-Allow-Headers',
        [...defaultAllowedHeaders, ...cors.headers].filter(Boolean).join(', '),
      )
    } else {
      headers.set('Access-Control-Allow-Headers', defaultAllowedHeaders.join(', '))
    }

    if (cors === '*' || (typeof cors === 'object' && 'origins' in cors && cors.origins === '*')) {
      headers.set('Access-Control-Allow-Origin', '*')
    } else if (
      (Array.isArray(cors) && cors.indexOf(requestOrigin) > -1) ||
      (!Array.isArray(cors) &&
        typeof cors === 'object' &&
        'origins' in cors &&
        cors.origins.indexOf(requestOrigin) > -1)
    ) {
      headers.set('Access-Control-Allow-Credentials', 'true')
      headers.set('Access-Control-Allow-Origin', requestOrigin)
    }
  }

  return headers
}
