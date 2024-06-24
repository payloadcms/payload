import type { Collection } from 'payload'

import { isolateObjectProperty, meOperation } from 'payload'

import type { Context } from '../types.js'

function meResolver(collection: Collection): any {
  async function resolver(_, args, context: Context) {
    const options = {
      collection,
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

export default meResolver
