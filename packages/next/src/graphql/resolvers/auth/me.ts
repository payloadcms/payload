import { meOperation } from 'payload/operations'
import type { Collection } from 'payload/types'

import isolateTransactionID from '../../utilities/isolateTransactionID'

function meResolver(collection: Collection): any {
  async function resolver(_, args, context) {
    const options = {
      collection,
      depth: 0,
      req: isolateTransactionID(context.req),
    }
    return meOperation(options)
  }

  return resolver
}

export default meResolver
