import type { Collection, PaginatedDocs, PayloadRequest, Where } from 'payload'

import { findVersionsOperation, isolateObjectProperty } from 'payload'

import type { Context } from '../types.js'

export type Resolver = (
  _: unknown,
  args: {
    draft?: boolean
    fallbackLocale?: string
    limit?: number
    locale?: string
    page?: number
    pagination?: boolean
    sort?: string
    where: Where
  },
  context: {
    req: PayloadRequest
  },
) => Promise<PaginatedDocs<any>>

export function findVersionsResolver(collection: Collection): Resolver {
  return async function resolver(_, args, context: Context) {
    let { req } = context
    const locale = req.locale
    const fallbackLocale = req.fallbackLocale
    req = isolateObjectProperty(req, 'locale')
    req = isolateObjectProperty(req, 'fallbackLocale')
    req.locale = args.locale || locale
    req.fallbackLocale = args.fallbackLocale || fallbackLocale
    if (!req.query) {
      req.query = {}
    }

    const draft: boolean =
      (args.draft ?? req.query?.draft === 'false')
        ? false
        : req.query?.draft === 'true'
          ? true
          : undefined
    if (typeof draft === 'boolean') {
      req.query.draft = String(draft)
    }

    context.req = req

    const options = {
      collection,
      depth: 0,
      limit: args.limit,
      page: args.page,
      pagination: args.pagination,
      req: isolateObjectProperty(req, 'transactionID'),
      sort: args.sort,
      where: args.where,
    }

    const result = await findVersionsOperation(options)

    return result
  }
}
