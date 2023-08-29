/* eslint-disable no-param-reassign */
import type { PaginatedDocs } from '../../../database/types.js'
import type { PayloadRequest } from '../../../express/types.js'
import type { Where } from '../../../types/index.js'
import type { Collection } from '../../config/types.js'

import find from '../../operations/find.js'

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
    if (args.locale) context.req.locale = args.locale
    if (args.fallbackLocale) context.req.fallbackLocale = args.fallbackLocale

    const options = {
      collection,
      depth: 0,
      draft: args.draft,
      limit: args.limit,
      page: args.page,
      req: context.req,
      sort: args.sort,
      where: args.where,
    }

    const results = await find(options)
    return results
  }
}
