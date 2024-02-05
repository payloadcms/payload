import { findVersionsOperation } from 'payload/operations'
import type { PayloadRequest, Where } from 'payload/types'
import type { PaginatedDocs } from 'payload/database'
import type { Collection } from 'payload/types'

import isolateObjectProperty from '../../utilities/isolateObjectProperty'

export type Resolver = (
  _: unknown,
  args: {
    fallbackLocale?: string
    limit?: number
    locale?: string
    page?: number
    sort?: string
    where: Where
  },
  context: {
    req: PayloadRequest
  },
) => Promise<PaginatedDocs<any>>

export default function findVersionsResolver(collection: Collection): Resolver {
  async function resolver(_, args, context) {
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
      limit: args.limit,
      page: args.page,
      req: isolateObjectProperty<PayloadRequest>(req, 'transactionID'),
      sort: args.sort,
      where: args.where,
    }

    const result = await findVersionsOperation(options)

    return result
  }

  return resolver
}
