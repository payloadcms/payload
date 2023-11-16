import type { Collection } from '../../../collections/config/types'

import isolateTransactionID from '../../../utilities/isolateTransactionID'
import unlock from '../../operations/unlock'

function unlockResolver(collection: Collection) {
  async function resolver(_, args, context) {
    const options = {
      collection,
      data: { email: args.email },
      req: isolateTransactionID(context.req),
    }

    const result = await unlock(options)
    return result
  }

  return resolver
}

export default unlockResolver
