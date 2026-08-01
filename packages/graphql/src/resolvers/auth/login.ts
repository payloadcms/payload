import type { Collection } from 'payload'

import { generatePayloadCookie, isolateObjectProperty } from 'payload'

import type { Context } from '../types.js'

import { invokeGraphQLOperation } from '../invokeOperation.js'

export function login(collection: Collection): any {
  async function resolver(_, args, context: Context) {
    const options = {
      collection: collection.config.slug,
      data: {
        email: args.email,
        password: args.password,
        username: args.username,
      },
      depth: 0,
      overrideAccess: false,
      req: isolateObjectProperty(context.req, 'transactionID'),
    }

    const result = await invokeGraphQLOperation(options.req, 'auth', 'login', options)
    const cookie = generatePayloadCookie({
      collectionAuthConfig: collection.config.auth,
      cookiePrefix: context.req.payload.config.cookiePrefix,
      token: result.token,
    })

    context.headers['Set-Cookie'] = cookie

    if (collection.config.auth.removeTokenFromResponses) {
      delete result.token
    }

    return result
  }

  return resolver
}
