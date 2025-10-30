import type { GraphQLResolveInfo } from 'graphql'
import type { Document, SanitizedGlobalConfig, Where } from 'payload'

import { findVersionsOperationGlobal, isolateObjectProperty } from 'payload'

import type { Context } from '../types.js'

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
    where: Where
  },
  context: Context,
  info: GraphQLResolveInfo
) => Promise<Document>

export function findVersions(globalConfig: SanitizedGlobalConfig): Resolver {
  return async function resolver(_, args, context, info) {
    const req = context.req = isolateObjectProperty(context.req, ['locale', 'fallbackLocale', 'transactionID'])
    const select = context.select = args.select ? buildSelectForCollectionMany(info) : undefined

    req.locale = args.locale || req.locale
    req.fallbackLocale = args.fallbackLocale || req.fallbackLocale
    req.query = req.query || {}

    const options = {
      depth: 0,
      globalConfig,
      limit: args.limit,
      page: args.page,
      pagination: args.pagination,
      req,
      select,
      sort: args.sort,
      where: args.where,
    }

    const result = await findVersionsOperationGlobal(options)
    return result
  }
}
