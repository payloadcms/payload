import type { Collection } from 'payload'

import { unlockOperation } from 'payload'
import { isolateObjectProperty } from 'payload'

import type { Context } from '../types.js'

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
