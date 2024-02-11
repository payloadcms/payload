/* eslint-disable no-param-reassign */
import type { Collection } from '../../../collections/config/types'
import type { PayloadRequest } from '../../../express/types'

import isolateObjectProperty from '../../../utilities/isolateObjectProperty'
import resetPassword from '../../operations/resetPassword'

function resetPasswordResolver(collection: Collection) {
  async function resolver(_, args, context) {
    let { req } = context
    req = isolateObjectProperty(req, 'locale')
    req = isolateObjectProperty(req, 'fallbackLocale')
    if (args.locale) req.locale = args.locale
    if (args.fallbackLocale) req.fallbackLocale = args.fallbackLocale

    const options = {
      api: 'GraphQL',
      collection,
      data: args,
      depth: 0,
      req: isolateObjectProperty<PayloadRequest>(req, 'transactionID'),
      res: context.res,
    }

    const result = await resetPassword(options)

    return result
  }

  return resolver
}

export default resetPasswordResolver
