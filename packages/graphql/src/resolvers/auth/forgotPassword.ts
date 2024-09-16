import type { Collection } from 'payload'

import { forgotPasswordOperation, isolateObjectProperty } from 'payload'

import type { Context } from '../types.js'

export function forgotPassword(collection: Collection): any {
  async function resolver(_, args, context: Context) {
    const options = {
      collection,
      data: {
        email: args.email,
        username: args.username,
      },
      disableEmail: args.disableEmail,
      expiration: args.expiration,
      req: isolateObjectProperty(context.req, 'transactionID'),
    }

    await forgotPasswordOperation(options)
    return true
  }

  return resolver
}
