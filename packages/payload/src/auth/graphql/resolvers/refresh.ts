import type { Collection } from '../../../collections/config/types'
import type { PayloadRequest } from '../../../express/types'

import isolateObjectProperty from '../../../utilities/isolateObjectProperty'
import { extractJWT } from '../../getExtractJWT'
import refresh from '../../operations/refresh'

function refreshResolver(collection: Collection) {
  async function resolver(_, args, context) {
    let token

    token = extractJWT(context.req)

    if (args.token) {
      token = args.token
    }

    const options = {
      collection,
      depth: 0,
      req: isolateObjectProperty<PayloadRequest>(context.req, 'transactionID'),
      res: context.res,
      token,
    }

    const result = await refresh(options)

    return result
  }

  return resolver
}

export default refreshResolver
