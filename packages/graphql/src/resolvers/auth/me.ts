import type { Collection } from 'payload'

import { extractJWT, isolateObjectProperty } from 'payload'

import type { Context } from '../types.js'

import { invokeGraphQLOperation } from '../invokeOperation.js'

export function me(collection: Collection): any {
  async function resolver(_, args, context: Context) {
    const currentToken = extractJWT(context.req)

    const options = {
      collection: collection.config.slug,
      currentToken,
      depth: 0,
      req: isolateObjectProperty(context.req, 'transactionID'),
    }

    const result = await invokeGraphQLOperation(options.req, 'auth', 'me', options)

    if (collection.config.auth.removeTokenFromResponses) {
      delete result.token
    }

    return result
  }

  return resolver
}
