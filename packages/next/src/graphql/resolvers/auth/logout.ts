import { logoutOperation } from 'payload/operations'
import type { Collection } from 'payload/types'

import isolateTransactionID from '../../utilities/isolateTransactionID'
import { generateExpiredPayloadCookie } from '../../../utilities/cookies'

function logoutResolver(collection: Collection): any {
  async function resolver(_, args, context) {
    const options = {
      collection,
      req: isolateTransactionID(context.req),
    }

    const result = await logoutOperation(options)
    const expiredCookie = generateExpiredPayloadCookie({
      collectionConfig: context.req.collection.config,
      payload: context.req.payload,
    })
    context.headers.set('Set-Cookie', expiredCookie)
    return result
  }

  return resolver
}

export default logoutResolver
