import type { Collection } from 'payload'

import { extractJWT, generatePayloadCookie, isolateObjectProperty, refreshOperation } from 'payload'

import type { Context } from '../types.js'

function refreshResolver(collection: Collection): any {
  async function resolver(_, args, context: Context) {
    let token

    token = extractJWT(context.req)

    if (args.token) {
      token = args.token
    }

    const options = {
      collection,
      depth: 0,
      req: isolateObjectProperty(context.req, 'transactionID'),
      token,
    }

    const result = await refreshOperation(options)
    const cookie = generatePayloadCookie({
      collectionConfig: collection.config,
      payload: context.req.payload,
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

export default refreshResolver
