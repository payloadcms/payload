import type { Collection } from '../../../collections/config/types'
import type { PayloadRequest } from '../../../express/types'

import isolateObjectProperty from '../../../utilities/isolateObjectProperty'
import logout from '../../operations/logout'

function logoutResolver(collection: Collection): any {
  async function resolver(_, args, context) {
    const options = {
      collection,
      req: isolateObjectProperty<PayloadRequest>(context.req, 'transactionID'),
      res: context.res,
    }

    const result = await logout(options)

    return result
  }

  return resolver
}

export default logoutResolver
