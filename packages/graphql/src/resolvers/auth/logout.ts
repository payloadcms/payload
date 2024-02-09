import { logoutOperation } from 'payload/operations'
import { generateExpiredPayloadCookie } from 'payload/auth'
import type { Collection } from 'payload/types'

import isolateTransactionID from '../../utilities/isolateTransactionID'
import { Context } from '../types'

function logoutResolver(collection: Collection): any {
  async function resolver(_, args, context: Context) {
    const options = {
      collection,
      req: isolateTransactionID(context.req),
    }

    const result = await logoutOperation(options)
    const expiredCookie = generateExpiredPayloadCookie({
      collectionConfig: collection.config,
      payload: context.req.payload,
    })
    context.headers['Set-Cookie'] = expiredCookie
    return result
  }

  return resolver
}

export default logoutResolver
