import type { GeneratedTypes, SanitizedConfig } from 'payload'

import { PayloadSDK } from '@payloadcms/sdk'

import { createTestRequestHandler } from './createTestRequestHandler.js'

export type TypedPayloadSDK = PayloadSDK<GeneratedTypes>

/**
 * SDK with a custom fetch to run the routes directly without an HTTP server.
 */
export const getSDK = (config: SanitizedConfig) => {
  const handleRequest = createTestRequestHandler({ config })

  return new PayloadSDK<GeneratedTypes>({
    baseURL: ``,
    fetch: (path: string, init: RequestInit) => {
      const [slugs, search] = path.slice(1).split('?')
      const url = `${config.serverURL || `http://localhost:${process.env.PORT || 3000}`}${config.routes.api}/${slugs}${search ? `?${search}` : ''}`

      if (init.body instanceof FormData) {
        const file = init.body.get('file') as Blob
        if (file && init.headers instanceof Headers) {
          init.headers.set('Content-Length', file.size.toString())
        }
      }
      const request = new Request(url, init)

      return handleRequest({ request, slug: slugs.split('/') })
    },
  })
}
