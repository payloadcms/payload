import type { GraphQLResolveInfo } from 'graphql'
import type { Collection, DocumentVersion, PaginatedDocs, Where } from 'payload'

import { findVersionsOperation, isolateObjectProperty } from 'payload'

import type { Context } from '../types.js'

import { rememberDocumentVersion } from '../../utilities/documentVersion.js'
import { buildSelectForCollectionMany } from '../../utilities/select.js'

export type Resolver = (
  _: unknown,
  args: {
    fallbackLocale?: string
    limit?: number
    locale?: string
    page?: number
    pagination?: boolean
    select?: boolean
    sort?: string
    trash?: boolean
    version?: DocumentVersion
    where: Where
  },
  context: Context,
  info: GraphQLResolveInfo,
) => Promise<PaginatedDocs<any>>

export function findVersionsResolver(collection: Collection): Resolver {
  return async function resolver(_, args, context, info) {
    const req = (context.req = isolateObjectProperty(context.req, [
      'locale',
      'fallbackLocale',
      'transactionID',
    ]))
    const select = (context.select = args.select
      ? buildSelectForCollectionMany(info, context)
      : undefined)

    req.locale = args.locale || req.locale
    req.fallbackLocale = args.fallbackLocale || req.fallbackLocale
    req.query = req.query || {}

    const version = args.version ?? req.query?.version

    if (version !== undefined) {
      req.query.version = version
    }

    const { sort } = args

    const options = {
      collection,
      depth: 0,
      limit: args.limit,
      page: args.page,
      pagination: args.pagination,
      req,
      select,
      sort: sort && typeof sort === 'string' ? sort.split(',') : undefined,
      trash: args.trash,
      version: args.version,
      where: args.where,
    }

    const result = await findVersionsOperation(options)
    return rememberDocumentVersion({ data: result, version: args.version ?? 'published' })
  }
}
