import type { PayloadRequest } from '../../../express/types'
import type { Where } from '../../../types'
import type { Collection } from '../../config/types'

import isolateObjectProperty from '../../../utilities/isolateObjectProperty'
import count from '../../operations/count'

export type Resolver = (
  _: unknown,
  args: {
    data: Record<string, unknown>
    locale?: string
    where?: Where
  },
  context: {
    req: PayloadRequest
    res: Response
  },
) => Promise<{ totalDocs: number }>

export default function findResolver(collection: Collection): Resolver {
  return async function resolver(_, args, context) {
    let { req } = context
    const locale = req.locale
    const fallbackLocale = req.fallbackLocale
    req = isolateObjectProperty(req, 'locale')
    req = isolateObjectProperty(req, 'fallbackLocale')
    req.locale = args.locale || locale
    req.fallbackLocale = fallbackLocale

    context.req = req

    const options = {
      collection,
      req: isolateObjectProperty<PayloadRequest>(req, 'transactionID'),
      where: args.where,
    }

    const results = await count(options)
    return results
  }
}
