import type { Collection } from '../../../collections/config/types.js'

import getExtractJWT from '../../getExtractJWT.js'
import refresh from '../../operations/refresh.js'

function refreshResolver(collection: Collection) {
  async function resolver(_, args, context) {
    let token

    const extractJWT = getExtractJWT(context.req.payload.config)
    token = extractJWT(context.req)

    if (args.token) {
      token = args.token
    }

    const options = {
      collection,
      depth: 0,
      req: context.req,
      res: context.res,
      token,
    }

    const result = await refresh(options)

    return result
  }

  return resolver
}

export default refreshResolver
