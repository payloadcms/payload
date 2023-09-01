/* eslint-disable no-param-reassign */
import type { Collection } from '../../../collections/config/types'

import verifyEmail from '../../operations/verifyEmail'

function verifyEmailResolver(collection: Collection) {
  async function resolver(_, args, context) {
    if (args.locale) context.req.locale = args.locale
    if (args.fallbackLocale) context.req.fallbackLocale = args.fallbackLocale

    const options = {
      api: 'GraphQL',
      collection,
      req: context.req,
      res: context.res,
      token: args.token,
    }

    const success = await verifyEmail(options)
    return success
  }

  return resolver
}

export default verifyEmailResolver
