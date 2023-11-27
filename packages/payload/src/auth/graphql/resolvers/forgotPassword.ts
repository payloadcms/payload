import type { Collection } from '../../../collections/config/types'

import isolateTransactionID from '../../../utilities/isolateTransactionID'
import forgotPassword from '../../operations/forgotPassword'

function forgotPasswordResolver(collection: Collection): any {
  async function resolver(_, args, context) {
    const options = {
      collection,
      data: {
        email: args.email,
      },
      disableEmail: args.disableEmail,
      expiration: args.expiration,
      req: isolateTransactionID(context.req),
    }

    await forgotPassword(options)
    return true
  }

  return resolver
}

export default forgotPasswordResolver
