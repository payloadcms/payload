import { loginOperation } from 'payload/operations'
import type { Collection } from 'payload/types'

import isolateTransactionID from '../../utilities/isolateTransactionID'

function loginResolver(collection: Collection) {
  async function resolver(_, args, context) {
    const options = {
      collection,
      data: {
        email: args.email,
        password: args.password,
      },
      depth: 0,
      req: isolateTransactionID(context.req),
    }

    const result = loginOperation(options)
    return result
  }

  return resolver
}

export default loginResolver
