import type { PayloadRequest } from '../types/index.js'

export const corsHeaders = (req: PayloadRequest): HeadersInit => {
  const cors = req.payload.config.cors
  const origin = req.headers.get('Origin')

  const headers: HeadersInit = {}

  if (cors) {
    headers['Access-Control-Allow-Methods'] = 'PUT, PATCH, POST, GET, DELETE, OPTIONS'
    headers['Access-Control-Allow-Headers'] =
      'Origin, X-Requested-With, Content-Type, Accept, Authorization, Content-Encoding, x-apollo-tracing'

    if (cors === '*') {
      headers['Access-Control-Allow-Origin'] = '*'
    } else if (Array.isArray(cors) && cors.indexOf(origin) > -1) {
      headers['Access-Control-Allow-Credentials'] = 'true'
      headers['Access-Control-Allow-Origin'] = origin
    }
  }

  return headers
}
