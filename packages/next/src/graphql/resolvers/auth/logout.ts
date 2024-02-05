import { logoutOperation } from 'payload/operations'
import type { Collection } from 'payload/types'

import isolateObjectProperty from '../../../utilities/isolateObjectProperty'

function logoutResolver(collection: Collection): any {
  async function resolver(_, args, context) {
    const options = {
      collection,
      req: isolateObjectProperty(context.req, 'transactionID'),
    }

    const result = await logoutOperation(options)

    return result
  }

  return resolver
}

export default logoutResolver
