import type { Collection } from '../../../collections/config/types'
import type { PayloadRequest } from '../../../express/types'

import unlock from '../../operations/unlock'

function unlockResolver(collection: Collection) {
  async function resolver(_, args, context) {
    const options = {
      collection,
      data: { email: args.email },
      req: { ...context.req } as PayloadRequest,
    }

    const result = await unlock(options)
    return result
  }

  return resolver
}

export default unlockResolver
