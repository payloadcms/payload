import { isolateObjectProperty } from 'payload'
import { initOperation } from 'payload/internal'

import type { Context } from '../types.js'

export function init(collection: string) {
  async function resolver(_, args, context: Context) {
    const options = {
      collection,
      req: isolateObjectProperty(context.req, 'transactionID'),
    }

    return initOperation(options)
  }

  return resolver
}
