import isolateTransactionID from '../../../utilities/isolateTransactionID'
import { initOperation } from '../../operations/init'

function initResolver(collection: string) {
  async function resolver(_, args, context) {
    const options = {
      collection,
      req: isolateTransactionID(context.req),
    }

    return initOperation(options)
  }

  return resolver
}

export default initResolver
