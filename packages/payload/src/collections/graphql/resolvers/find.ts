/* eslint-disable no-param-reassign */
import type { PaginatedDocs } from '../../../database/types'
import type { PayloadRequest } from '../../../express/types'
import type { Where } from '../../../types'
import type { Collection } from '../../config/types'

import isolateObjectProperty from '../../../utilities/isolateObjectProperty'
import find from '../../operations/find'

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

    req = isolateObjectProperty(req, ['locale', 'fallbackLocale', 'transactionID'])
    req.locale = args.locale || locale
    req.fallbackLocale = args.fallbackLocale || fallbackLocale
    if (!req.query) req.query = {}

    const draft: boolean =
      args.draft ?? req.query?.draft === 'false'
        ? false
        : req.query?.draft === 'true'
          ? true
          : undefined
    if (typeof draft === 'boolean') req.query.draft = String(draft)

    context.req = req

    const options = {
      collection,
      depth: 0,
      draft: args.draft,
      limit: args.limit,
      page: args.page,
      req,
      sort: args.sort,
      where: args.where,
    }

    const results = await find(options)
    return results
  }
}
