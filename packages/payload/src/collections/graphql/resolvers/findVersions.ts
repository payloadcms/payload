import type { PaginatedDocs } from '../../../database/types'
import type { PayloadRequest } from '../../../types'
import type { Where } from '../../../types'
import type { Collection } from '../../config/types'

import isolateTransactionID from '../../../utilities/isolateTransactionID'
import { findVersionsOperation } from '../../operations/findVersions'

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
