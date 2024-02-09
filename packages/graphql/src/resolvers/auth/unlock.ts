import { unlockOperation } from 'payload/operations'
import type { Collection } from 'payload/types'

import isolateTransactionID from '../../utilities/isolateTransactionID'
import { Context } from '../types'

function unlockResolver(collection: Collection) {
  async function resolver(_, args, context: Context) {
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
