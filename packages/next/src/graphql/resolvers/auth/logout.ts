import { logoutOperation } from 'payload/operations'
import type { Collection } from 'payload/types'

import isolateTransactionID from '../../utilities/isolateTransactionID'

function logoutResolver(collection: Collection): any {
  async function resolver(_, args, context) {
    const options = {
      collection,
      req: isolateTransactionID(context.req),
    }

    const result = await logoutOperation(options)

    return result
  }

  return resolver
}

export default logoutResolver
