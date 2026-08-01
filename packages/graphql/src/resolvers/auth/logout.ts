import type { Collection } from 'payload'

import { generateExpiredPayloadCookie, isolateObjectProperty } from 'payload'

import type { Context } from '../types.js'

import { invokeGraphQLOperation } from '../invokeOperation.js'

export function logout(collection: Collection): any {
  async function resolver(_, args, context: Context) {
    const options = {
      allSessions: args.allSessions,
      collection: collection.config.slug,
      req: isolateObjectProperty(context.req, 'transactionID'),
    }

    const result = await invokeGraphQLOperation(options.req, 'auth', 'logout', options)
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
