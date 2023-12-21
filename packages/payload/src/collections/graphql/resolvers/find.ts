/* eslint-disable no-param-reassign */
import type { PaginatedDocs } from '../../../database/types'
import type { PayloadRequest } from '../../../types'
import type { Where } from '../../../types'
import type { Collection } from '../../config/types'

<<<<<<< HEAD
import isolateObjectProperty from '../../../utilities/isolateObjectProperty'
import find from '../../operations/find'
=======
import isolateTransactionID from '../../../utilities/isolateTransactionID'
import { findOperation } from '../../operations/find'
>>>>>>> 988a21e94 (feat(3.0): next route handlers (#4590))

export type Resolver = (
  _: unknown,
  args: {
    data: Record<string, unknown>
    draft: boolean
    fallbackLocale?: string
    limit?: number
    locale?: string
    page?: number
    sort?: string
    where?: Where
  },
  context: {
    req: PayloadRequest
    res: Response
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
) => Promise<PaginatedDocs<any>>

export default function findResolver(collection: Collection): Resolver {
  return async function resolver(_, args, context) {
    let { req } = context
    const locale = req.locale
    const fallbackLocale = req.fallbackLocale
    req = isolateObjectProperty(req, 'locale')
    req = isolateObjectProperty(req, 'fallbackLocale')
    req.locale = args.locale || locale
    req.fallbackLocale = args.fallbackLocale || fallbackLocale

    const options = {
      collection,
      depth: 0,
      draft: args.draft,
      limit: args.limit,
      page: args.page,
      req: isolateObjectProperty<PayloadRequest>(req, 'transactionID'),
      sort: args.sort,
      where: args.where,
    }

    const results = await findOperation(options)
    return results
  }
}
