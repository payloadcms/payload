import type { Collection } from 'payload'

import { isolateObjectProperty } from 'payload'
import { forgotPasswordOperation } from 'payload/internal'

import type { Context } from '../types.js'

export function forgotPassword(collection: Collection): any {
  async function resolver(_, args, context: Context) {
    const options = {
      collection,
      data: {
        email: args.email,
        username: args.username,
      },
      req: isolateObjectProperty(context.req, 'transactionID'),
    }

    await forgotPasswordOperation(options)
    return true
  }

  return resolver
}
