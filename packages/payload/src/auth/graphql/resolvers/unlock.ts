import type { Collection } from '../../../collections/config/types'
import type { PayloadRequest } from '../../../express/types'

import isolateObjectProperty from '../../../utilities/isolateObjectProperty'
import unlock from '../../operations/unlock'

function unlockResolver(collection: Collection) {
  async function resolver(_, args, context) {
    const options = {
      collection,
      data: { email: args.email },
      req: isolateObjectProperty<PayloadRequest>(context.req, 'transactionID'),
    }

    const result = await unlock(options)
    return result
  }

  return resolver
}

export default unlockResolver
