import { refreshOperation } from 'payload/operations'
import type { Collection } from 'payload/types'

import { extractJWT } from '../../../utilities/jwt'
import isolateObjectProperty from '../../../utilities/isolateObjectProperty'
import { generatePayloadCookie } from '../../../utilities/cookies'

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
      req: isolateObjectProperty(context.req, 'transactionID'),
      token,
    }

    const result = await refreshOperation(options)
    const cookie = generatePayloadCookie({
      token: result.refreshedToken,
      payload: context.req.payload,
      collectionConfig: context.req.collection.config,
    })
    context.headers.set('Set-Cookie', cookie)
    return result
  }

  return resolver
}

export default refreshResolver
