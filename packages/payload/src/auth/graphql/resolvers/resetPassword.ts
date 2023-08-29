/* eslint-disable no-param-reassign */
import type { Collection } from '../../../collections/config/types.js'

import resetPassword from '../../operations/resetPassword.js'

function resetPasswordResolver(collection: Collection) {
  async function resolver(_, args, context) {
    if (args.locale) context.req.locale = args.locale
    if (args.fallbackLocale) context.req.fallbackLocale = args.fallbackLocale

    const options = {
      api: 'GraphQL',
      collection,
      data: args,
      depth: 0,
      req: context.req,
      res: context.res,
    }

    const result = await resetPassword(options)

    return result
  }

  return resolver
}

export default resetPasswordResolver
