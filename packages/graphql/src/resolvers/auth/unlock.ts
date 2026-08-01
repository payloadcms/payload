import type { Collection } from 'payload'

import { isolateObjectProperty } from 'payload'

import type { Context } from '../types.js'

import { invokeGraphQLOperation } from '../invokeOperation.js'

export function unlock(collection: Collection) {
  async function resolver(_, args, context: Context) {
    const options = {
      collection: collection.config.slug,
      data: { email: args.email, username: args.username },
      overrideAccess: false,
      req: isolateObjectProperty(context.req, 'transactionID'),
    }

    const result = await invokeGraphQLOperation(options.req, 'auth', 'unlock', options)
    return result
  }

  return resolver
}
