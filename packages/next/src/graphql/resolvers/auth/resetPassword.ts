import { resetPasswordOperation } from 'payload/operations'
import type { Collection } from 'payload/types'

import isolateObjectProperty from '../../../utilities/isolateObjectProperty'

function resetPasswordResolver(collection: Collection) {
  async function resolver(_, args, context) {
    if (args.locale) context.req.locale = args.locale
    if (args.fallbackLocale) context.req.fallbackLocale = args.fallbackLocale

    const options = {
      api: 'GraphQL',
      collection,
      data: args,
      depth: 0,
      req: isolateObjectProperty(context.req, 'transactionID'),
    }

    const result = await resetPasswordOperation(options)

    return result
  }

  return resolver
}

export default resetPasswordResolver
