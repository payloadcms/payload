import { unlockOperation } from 'payload/operations'
import type { Collection } from 'payload/types'

import { isolateObjectProperty } from 'payload/utilities'
import type { Context } from '../types.d.ts'

function unlockResolver(collection: Collection) {
  async function resolver(_, args, context: Context) {
    const options = {
      collection,
      data: { email: args.email },
      req: isolateObjectProperty(context.req, 'transactionID'),
    }

    const result = await unlockOperation(options)
    return result
  }

  return resolver
}

export default unlockResolver
