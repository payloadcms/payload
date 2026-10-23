import type { GraphQLResolveInfo } from 'graphql'
import type { Collection, PayloadRequest, Where } from 'payload'

import { countOperation } from 'payload'

import type { Context } from '../types.js'

import { getGraphQLRequest } from '../getGraphQLRequest.js'

export type Resolver = (
  _: unknown,
  args: {
    branch?: string
    data: Record<string, unknown>
    locale?: string
    trash?: boolean
    where?: Where
  },
  context: {
    req: PayloadRequest
  },
  info: GraphQLResolveInfo,
) => Promise<{ totalDocs: number }>

export function countResolver(collection: Collection): Resolver {
  return async function resolver(_, args, context: Context, info) {
    const req = await getGraphQLRequest({
      branch: args.branch,
      collectionSlug: collection.config.slug,
      context,
      info,
      locale: args.locale,
    })

    const options = {
      collection,
      req,
      trash: args.trash,
      where: args.where,
    }

    const results = await countOperation(options)
    return results
  }
}
