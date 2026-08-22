import type { GraphQLResolveInfo } from 'graphql'
import type { Collection, PaginatedDocs, Where } from 'payload'

import { findOperation, isolateObjectProperty, resetBranchState } from 'payload'

import type { Context } from '../types.js'

import { buildSelectForCollectionMany } from '../../utilities/select.js'

export type Resolver = (
  _: unknown,
  args: {
    branch?: string
    data: Record<string, unknown>
    draft: boolean
    fallbackLocale?: string
    limit?: number
    locale?: string
    page?: number
    pagination?: boolean
    select?: boolean
    sort?: string
    trash?: boolean
    where?: Where
  },
  context: Context,
  info: GraphQLResolveInfo,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
) => Promise<PaginatedDocs<any>>

export function findResolver(collection: Collection): Resolver {
  return async function resolver(_, args, context, info) {
    const req = (context.req = isolateObjectProperty(context.req, [
      'branch',
      'context',
      'locale',
      'fallbackLocale',
      'transactionID',
    ]))
    const select = (context.select = args.select ? buildSelectForCollectionMany(info) : undefined)

    req.locale = args.locale || req.locale
    req.fallbackLocale = args.fallbackLocale || req.fallbackLocale

    // Same shape as `locale`: an argument on the field, resolved onto the request the
    // operation reads. Branch state is memoized per request, so a field that names its own
    // branch gets its own copy of that state rather than the previous field's.
    if (args.branch && args.branch !== req.branch) {
      req.branch = args.branch
      req.context = { ...req.context }
      resetBranchState(req)
    }
    req.query = req.query || {}

    const draft: boolean =
      (args.draft ?? req.query?.draft === 'false')
        ? false
        : req.query?.draft === 'true'
          ? true
          : undefined
    if (typeof draft === 'boolean') {
      req.query.draft = String(draft)
    }

    const { sort } = args

    const options = {
      collection,
      depth: 0,
      draft: args.draft,
      limit: args.limit,
      page: args.page,
      pagination: args.pagination,
      req,
      select,
      sort: sort && typeof sort === 'string' ? sort.split(',') : undefined,
      trash: args.trash,
      where: args.where,
    }

    const result = await findOperation(options)
    return result
  }
}
