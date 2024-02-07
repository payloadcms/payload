import { resetPasswordOperation } from 'payload/operations'
import type { Collection } from 'payload/types'

import isolateTransactionID from '../../utilities/isolateTransactionID'
import { generatePayloadCookie } from '../../../utilities/cookies'
import { Context } from '../types'

function resetPasswordResolver(collection: Collection) {
  async function resolver(_, args, context: Context) {
    if (args.locale) context.req.locale = args.locale
    if (args.fallbackLocale) context.req.fallbackLocale = args.fallbackLocale

    const options = {
      api: 'GraphQL',
      collection,
      data: args,
      depth: 0,
      req: isolateTransactionID(context.req),
    }

    const result = await resetPasswordOperation(options)
    const cookie = generatePayloadCookie({
      token: result.token,
      payload: context.req.payload,
      collectionConfig: collection.config,
    })
    context.headers['Set-Cookie'] = cookie
    return result
  }

  return resolver
}

export default resetPasswordResolver
