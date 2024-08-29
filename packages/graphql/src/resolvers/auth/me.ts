import type { Collection } from 'payload'

import { extractJWT, isolateObjectProperty, meOperation } from 'payload'

import type { Context } from '../types.js'

export function me(collection: Collection): any {
  async function resolver(_, args, context: Context) {
    const currentToken = extractJWT(context.req)

    const options = {
      collection,
      currentToken,
      depth: 0,
      req: isolateObjectProperty(context.req, 'transactionID'),
    }

    const result = await meOperation(options)

    if (collection.config.auth.removeTokenFromResponses) {
      delete result.token
    }

    return result
  }

  return resolver
}
