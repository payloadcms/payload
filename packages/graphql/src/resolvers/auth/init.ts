import { initOperation } from 'payload/operations'
import isolateTransactionID from '../../utilities/isolateTransactionID'
import { Context } from '../types'

function initResolver(collection: string) {
  async function resolver(_, args, context: Context) {
    const options = {
      collection,
      req: isolateTransactionID(context.req),
    }

    return initOperation(options)
  }

  return resolver
}

export default initResolver
