import type { GeneratedTypes, SanitizedConfig } from 'payload'

import { REST_DELETE, REST_GET, REST_PATCH, REST_POST, REST_PUT } from '@payloadcms/next/routes'
import { PayloadSDK } from '@payloadcms/sdk'

import { serverURL as serverURL_ } from './serverURL.js'

export type TypedPayloadSDK = PayloadSDK<GeneratedTypes>

/**
 * SDK with a custom fetch to run the routes directly without an HTTP server.
 */
export const getSDK = (config: SanitizedConfig) => {
  const api = {
    GET: REST_GET(config),
    POST: REST_POST(config),
    PATCH: REST_PATCH(config),
    DELETE: REST_DELETE(config),
    PUT: REST_PUT(config),
  }

  return new PayloadSDK<GeneratedTypes>({
    baseURL: ``,
    fetch: (path: string, init: RequestInit) => {
      const [slugs, search] = path.slice(1).split('?')
      const url = `${config.serverURL || serverURL_}${config.routes.api}/${slugs}${search ? `?${search}` : ''}`

      if (init.body instanceof FormData) {
        const file = init.body.get('file') as Blob
        if (file && init.headers instanceof Headers) {
          init.headers.set('Content-Length', file.size.toString())
        }
      }
      const request = new Request(url, init)

      const params = {
        params: Promise.resolve({
          slug: slugs.split('/'),
        }),
      }

      return api[init.method.toUpperCase()](request, params)
    },
  })
}
