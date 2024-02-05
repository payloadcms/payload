import { findVersionsOperation } from 'payload/operations'
import type { PayloadRequest, Where } from 'payload/types'
import type { PaginatedDocs } from 'payload/database'
import type { Collection } from 'payload/types'

import isolateTransactionID from '../../utilities/isolateTransactionID'

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
    if (args.locale) context.req.locale = args.locale
    if (args.fallbackLocale) context.req.fallbackLocale = args.fallbackLocale

    const options = {
      collection,
      depth: 0,
      limit: args.limit,
      page: args.page,
      req: isolateTransactionID(context.req),
      sort: args.sort,
      where: args.where,
    }

    const result = await findVersionsOperation(options)

    return result
  }

  return resolver
}
