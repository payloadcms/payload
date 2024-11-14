import type { Collection } from 'payload'

import { generateExpiredPayloadCookie, isolateObjectProperty, logoutOperation } from 'payload'

import type { Context } from '../types.js'

export function logout(collection: Collection): any {
  async function resolver(_, args, context: Context) {
    const options = {
      collection,
      req: isolateObjectProperty(context.req, 'transactionID'),
    }

    const result = await logoutOperation(options)
    const expiredCookie = generateExpiredPayloadCookie({
      collectionAuthConfig: collection.config.auth,
      config: context.req.payload.config,
      cookiePrefix: context.req.payload.config.cookiePrefix,
    })
    context.headers['Set-Cookie'] = expiredCookie
    return result
  }

  return resolver
}
