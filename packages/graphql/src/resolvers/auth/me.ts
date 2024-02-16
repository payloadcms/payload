import { meOperation } from 'payload/operations'
import type { Collection } from 'payload/types'

import isolateTransactionID from '../../utilities/isolateTransactionID'
import { Context } from '../types'

function meResolver(collection: Collection): any {
  async function resolver(_, args, context: Context) {
    const options = {
      collection,
      depth: 0,
      req: isolateTransactionID(context.req),
    }
    const result = await meOperation(options)

    if (collection.config.auth.removeTokenFromResponses) {
      delete result.token
    }

    return result
  }

  return resolver
}

export default meResolver
