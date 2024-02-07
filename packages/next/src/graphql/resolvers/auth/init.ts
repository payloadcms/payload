import { initOperation } from 'payload/operations'
import { isolateObjectProperty } from 'payload/utilities'
import { Context } from '../types'

function initResolver(collection: string) {
  async function resolver(_, args, context: Context) {
    const options = {
      collection,
      req: isolateObjectProperty(context.req, 'transactionID'),
    }

    return initOperation(options)
  }

  return resolver
}

export default initResolver
