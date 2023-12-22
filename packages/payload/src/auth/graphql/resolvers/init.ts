import isolateObjectProperty from '../../../utilities/isolateObjectProperty'
import { initOperation } from '../../operations/init'

function initResolver(collection: string) {
  async function resolver(_, args, context) {
    const options = {
      collection,
      req: isolateObjectProperty(context.req, 'transactionID'),
    }

    return initOperation(options)
  }

  return resolver
}

export default initResolver
