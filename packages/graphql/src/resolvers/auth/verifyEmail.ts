import type { Collection } from 'payload'

import { isolateObjectProperty } from 'payload'

import type { Context } from '../types.js'

import { invokeGraphQLOperation } from '../invokeOperation.js'

export function verifyEmail(collection: Collection) {
  async function resolver(_, args, context: Context) {
    if (args.locale) {
      context.req.locale = args.locale
    }
    if (args.fallbackLocale) {
      context.req.fallbackLocale = args.fallbackLocale
    }

    const options = {
      api: 'GraphQL',
      collection: collection.config.slug,
      req: isolateObjectProperty(context.req, 'transactionID'),
      token: args.token,
    }

    const success = await invokeGraphQLOperation(options.req, 'auth', 'verifyEmail', options)
    return success
  }

  return resolver
}
