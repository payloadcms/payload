import type { GraphQLResolveInfo } from 'graphql'
import type { Document, SanitizedGlobalConfig, Where } from 'payload'

import { isolateObjectProperty } from 'payload'

import type { Context } from '../types.js'

import { buildSelectForCollectionMany } from '../../utilities/select.js'
import { invokeGraphQLOperation } from '../invokeOperation.js'

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
    where: Where
  },
  context: Context,
  info: GraphQLResolveInfo,
) => Promise<Document>

export function findVersions(globalConfig: SanitizedGlobalConfig): Resolver {
  return async function resolver(_, args, context, info) {
    const req = (context.req = isolateObjectProperty(context.req, [
      'locale',
      'fallbackLocale',
      'transactionID',
    ]))
    const select = (context.select = args.select ? buildSelectForCollectionMany(info) : undefined)

    req.locale = args.locale || req.locale
    req.fallbackLocale = args.fallbackLocale || req.fallbackLocale
    req.query = req.query || {}

    const { sort } = args

    const options = {
      slug: globalConfig.slug,
      depth: 0,
      limit: args.limit,
      overrideAccess: false,
      page: args.page,
      pagination: args.pagination,
      req,
      select,
      sort: sort && typeof sort === 'string' ? sort.split(',') : undefined,
      where: args.where,
    }

    const result = await invokeGraphQLOperation(req, 'global', 'findVersions', options)
    return result
  }
}
