import type { Collection } from 'payload'

import { isolateObjectProperty, unlockOperation } from 'payload'

import type { Context } from '../types.js'

function unlockResolver(collection: Collection) {
  async function resolver(_, args, context: Context) {
    const options = {
      collection,
      data: { email: args.email, username: args.username },
      req: isolateObjectProperty(context.req, 'transactionID'),
    }

    const result = await unlockOperation(options)
    return result
  }

  return resolver
}

export default unlockResolver
