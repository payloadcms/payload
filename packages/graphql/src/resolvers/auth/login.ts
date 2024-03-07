import { loginOperation } from 'payload/operations'
import { generatePayloadCookie } from 'payload/auth'
import type { Collection } from 'payload/types'

import { isolateObjectProperty } from 'payload/utilities'
import type { Context } from '../types.js'

function loginResolver(collection: Collection): any {
  async function resolver(_, args, context: Context) {
    const options = {
      collection,
      data: {
        email: args.email,
        password: args.password,
      },
      depth: 0,
      req: isolateObjectProperty(context.req, 'transactionID'),
    }

    const result = await loginOperation(options)
    const cookie = generatePayloadCookie({
      token: result.token,
      payload: context.req.payload,
      collectionConfig: collection.config,
    })

    context.headers['Set-Cookie'] = cookie

    if (collection.config.auth.removeTokenFromResponses) {
      delete result.token
    }

    return result
  }

  return resolver
}

export default loginResolver
