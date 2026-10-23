import type { GraphQLResolveInfo } from 'graphql'
import type { Document, SanitizedGlobalConfig, Where } from 'payload'

import { findVersionsOperationGlobal } from 'payload'

import type { Context } from '../types.js'

import { buildSelectForCollectionMany } from '../../utilities/select.js'
import { getGraphQLRequest } from '../getGraphQLRequest.js'

export type Resolver = (
  _: unknown,
  args: {
    branch?: string
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
    const req = await getGraphQLRequest({
      branch: args.branch,
      context,
      fallbackLocale: args.fallbackLocale,
      globalSlug: globalConfig.slug,
      info,
      locale: args.locale,
    })
    const select = args.select ? buildSelectForCollectionMany(info, context) : undefined

    const { sort } = args

    const options = {
      depth: 0,
      globalConfig,
      limit: args.limit,
      page: args.page,
      pagination: args.pagination,
      req,
      select,
      sort: sort && typeof sort === 'string' ? sort.split(',') : undefined,
      where: args.where,
    }

    const result = await findVersionsOperationGlobal(options)
    return result
  }
}
