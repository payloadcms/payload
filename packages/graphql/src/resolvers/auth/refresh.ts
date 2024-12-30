import type { Collection } from 'payload'

import { generatePayloadCookie, isolateObjectProperty, refreshOperation } from 'payload'

import type { Context } from '../types.js'

export function refresh(collection: Collection): any {
  async function resolver(_, __, context: Context) {
    const options = {
      collection,
      depth: 0,
      req: isolateObjectProperty(context.req, 'transactionID'),
    }

    const result = await refreshOperation(options)
    const cookie = generatePayloadCookie({
      collectionAuthConfig: collection.config.auth,
      cookiePrefix: context.req.payload.config.cookiePrefix,
      token: result.refreshedToken,
    })
    context.headers['Set-Cookie'] = cookie

    if (collection.config.auth.removeTokenFromResponses) {
      delete result.refreshedToken
    }

    return result
  }

  return resolver
}
