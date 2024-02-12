import type { Collection } from '../../../collections/config/types'
import type { PayloadRequest } from '../../../express/types'

import isolateObjectProperty from '../../../utilities/isolateObjectProperty'
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
      req: isolateObjectProperty<PayloadRequest>(context.req, 'transactionID'),
    }

    await forgotPassword(options)
    return true
  }

  return resolver
}

export default forgotPasswordResolver
