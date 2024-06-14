import type { Collection } from 'payload'

import { forgotPasswordOperation, isolateObjectProperty } from 'payload'

import type { Context } from '../types.js'

function forgotPasswordResolver(collection: Collection): any {
  async function resolver(_, args, context: Context) {
    const options = {
      collection,
      data: {
        email: args.email,
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

export default forgotPasswordResolver
