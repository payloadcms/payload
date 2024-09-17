import type { Collection } from 'payload'

import { isolateObjectProperty, verifyEmailOperation } from 'payload'

import type { Context } from '../types.js'

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
      collection,
      req: isolateObjectProperty(context.req, 'transactionID'),
      token: args.token,
    }

    const success = await verifyEmailOperation(options)
    return success
  }

  return resolver
}
