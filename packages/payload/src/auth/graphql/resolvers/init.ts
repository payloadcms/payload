import type { PayloadRequest } from '../../../express/types'

import isolateObjectProperty from '../../../utilities/isolateObjectProperty'
import init from '../../operations/init'

function initResolver(collection: string) {
  async function resolver(_, args, context) {
    const options = {
      collection,
      req: isolateObjectProperty<PayloadRequest>(context.req, 'transactionID'),
    }

    return init(options)
  }

  return resolver
}

export default initResolver
