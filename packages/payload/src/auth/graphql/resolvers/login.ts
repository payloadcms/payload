import type { Collection } from '../../../collections/config/types'

import isolateTransactionID from '../../../utilities/isolateTransactionID'
import login from '../../operations/login'

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
      res: context.res,
    }

    const result = login(options)
    return result
  }

  return resolver
}

export default loginResolver
