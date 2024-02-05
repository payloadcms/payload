import { meOperation } from 'payload/operations'
import type { Collection } from 'payload/types'

import isolateObjectProperty from 'payload/utilities/isolateObjectProperty'

function meResolver(collection: Collection): any {
  async function resolver(_, args, context) {
    const options = {
      collection,
      depth: 0,
      req: isolateObjectProperty(context.req, 'transactionID'),
    }
    return meOperation(options)
  }

  return resolver
}

export default meResolver
