import type { Collection } from 'payload'

import { generatePayloadCookie, isolateObjectProperty } from 'payload'

import type { Context } from '../types.js'

import { invokeGraphQLOperation } from '../invokeOperation.js'

export function refresh(collection: Collection): any {
  async function resolver(_, __, context: Context) {
    const options = {
      collection: collection.config.slug,
      req: isolateObjectProperty(context.req, 'transactionID'),
    }

    const result = await invokeGraphQLOperation(options.req, 'auth', 'refresh', options)
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
