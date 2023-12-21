import type { Collection } from '../../../collections/config/types'

import isolateTransactionID from '../../../utilities/isolateTransactionID'
import { meOperation } from '../../operations/me'

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
