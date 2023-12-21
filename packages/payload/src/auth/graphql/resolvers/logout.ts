import type { Collection } from '../../../collections/config/types'

import isolateTransactionID from '../../../utilities/isolateTransactionID'
import { logoutOperation } from '../../operations/logout'

function logoutResolver(collection: Collection): any {
  async function resolver(_, args, context) {
    const options = {
      collection,
      req: isolateTransactionID(context.req),
      res: context.res,
    }

    const result = await logoutOperation(options)

    return result
  }

  return resolver
}

export default logoutResolver
