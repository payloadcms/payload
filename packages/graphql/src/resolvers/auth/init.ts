import { isolateObjectProperty } from 'payload'

import type { Context } from '../types.js'

import { invokeGraphQLOperation } from '../invokeOperation.js'

export function init(collection: string) {
  async function resolver(_, args, context: Context) {
    const options = {
      collection,
      req: isolateObjectProperty(context.req, 'transactionID'),
    }

    return invokeGraphQLOperation(options.req, 'auth', 'init', options)
  }

  return resolver
}
