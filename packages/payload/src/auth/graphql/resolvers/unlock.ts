import type { Collection } from '../../../collections/config/types'

import isolateTransactionID from '../../../utilities/isolateTransactionID'
import { unlockOperation } from '../../operations/unlock'

function unlockResolver(collection: Collection) {
  async function resolver(_, args, context) {
    const options = {
      collection,
      data: { email: args.email },
      req: isolateTransactionID(context.req),
    }

    const result = await unlockOperation(options)
    return result
  }

  return resolver
}

export default unlockResolver
