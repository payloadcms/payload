import type { GraphQLResolveInfo } from 'graphql'
import type { Document, SanitizedGlobalConfig } from 'payload'

import { findOneOperation } from 'payload'

import type { Context } from '../types.js'

import { buildSelectForCollection } from '../../utilities/select.js'
import { getGraphQLRequest } from '../getGraphQLRequest.js'

export type Resolver = (
  _: unknown,
  args: {
    branch?: string
    draft?: boolean
    fallbackLocale?: string
    id: number | string
    locale?: string
    select?: boolean
  },
  context: Context,
  info: GraphQLResolveInfo,
) => Promise<Document>

export function findOne(globalConfig: SanitizedGlobalConfig): Resolver {
  return async function resolver(_, args, context, info) {
    const { slug } = globalConfig
    const req = await getGraphQLRequest({
      branch: args.branch,
      context,
      fallbackLocale: args.fallbackLocale,
      globalSlug: slug,
      info,
      locale: args.locale,
    })
    const select = args.select ? buildSelectForCollection(info, context) : undefined

    const options = {
      slug,
      depth: 0,
      draft: args.draft,
      globalConfig,
      req,
      select,
    }

    const result = await findOneOperation(options)
    return result
  }
}
