/* eslint-disable no-param-reassign */
import type { Collection } from '../../../collections/config/types'
import type { PayloadRequest } from '../../../express/types'

import resetPassword from '../../operations/resetPassword'

function resetPasswordResolver(collection: Collection) {
  async function resolver(_, args, context) {
    if (args.locale) context.req.locale = args.locale
    if (args.fallbackLocale) context.req.fallbackLocale = args.fallbackLocale

    const options = {
      api: 'GraphQL',
      collection,
      data: args,
      depth: 0,
      req: { ...context.req } as PayloadRequest,
      res: context.res,
    }

    const result = await resetPassword(options)

    return result
  }

  return resolver
}

export default resetPasswordResolver
