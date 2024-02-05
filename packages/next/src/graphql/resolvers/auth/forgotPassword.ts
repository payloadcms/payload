import { forgotPasswordOperation } from 'payload/operations'
import type { Collection } from 'payload/types'

import isolateObjectProperty from '../../../utilities/isolateObjectProperty'

function forgotPasswordResolver(collection: Collection): any {
  async function resolver(_, args, context) {
    const options = {
      collection,
      data: {
        email: args.email,
      },
      disableEmail: args.disableEmail,
      expiration: args.expiration,
      req: isolateObjectProperty<PayloadRequest>(context.req, 'transactionID'),
    }

    await forgotPasswordOperation(options)
    return true
  }

  return resolver
}

export default forgotPasswordResolver
