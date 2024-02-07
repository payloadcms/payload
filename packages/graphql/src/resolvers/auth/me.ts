import { meOperation } from 'payload/operations'
import type { Collection } from 'payload/types'

import { isolateObjectProperty } from 'payload/utilities'
import { Context } from '../types'

function meResolver(collection: Collection): any {
  async function resolver(_, args, context: Context) {
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
