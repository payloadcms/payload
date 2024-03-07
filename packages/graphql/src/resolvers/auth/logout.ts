import { logoutOperation } from 'payload/operations'
import { generateExpiredPayloadCookie } from 'payload/auth'
import type { Collection } from 'payload/types'

import { isolateObjectProperty } from 'payload/utilities'
import type { Context } from '../types.js'

function logoutResolver(collection: Collection): any {
  async function resolver(_, args, context: Context) {
    const options = {
      collection,
      req: isolateObjectProperty(context.req, 'transactionID'),
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
