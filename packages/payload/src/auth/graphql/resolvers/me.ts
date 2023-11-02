import type { Collection } from '../../../collections/config/types'

import me from '../../operations/me'

function meResolver(collection: Collection): any {
  async function resolver(_, args, context) {
    const options = {
      collection,
      depth: 0,
      req: { ...context.req } as PayloadRequest,
    }
    return me(options)
  }

  return resolver
}

export default meResolver
