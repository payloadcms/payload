/* eslint-disable no-param-reassign */
import type { Collection } from '../../../collections/config/types'
import type { PayloadRequest } from '../../../express/types'

import isolateObjectProperty from '../../../utilities/isolateObjectProperty'
import verifyEmail from '../../operations/verifyEmail'

function verifyEmailResolver(collection: Collection) {
  async function resolver(_, args, context) {
    let { req } = context
    req = isolateObjectProperty(req, 'locale')
    req = isolateObjectProperty(req, 'fallbackLocale')
    if (args.locale) req.locale = args.locale
    if (args.fallbackLocale) req.fallbackLocale = args.fallbackLocale

    const options = {
      api: 'GraphQL',
      collection,
      req: isolateObjectProperty<PayloadRequest>(req, 'transactionID'),
      res: context.res,
      token: args.token,
    }

    const success = await verifyEmail(options)
    return success
  }

  return resolver
}

export default verifyEmailResolver
