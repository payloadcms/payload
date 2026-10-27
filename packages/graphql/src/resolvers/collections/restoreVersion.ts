import type { GraphQLResolveInfo } from 'graphql'
import type { Collection, PayloadRequest } from 'payload'

import { restoreVersionOperation } from 'payload'

import type { Context } from '../types.js'

import { getGraphQLRequest } from '../getGraphQLRequest.js'

export type Resolver = (
  _: unknown,
  args: {
    branch?: string
    draft?: boolean
    id: number | string
  },
  context: {
    req: PayloadRequest
  },
  info: GraphQLResolveInfo,
) => Promise<Document>

export function restoreVersionResolver(collection: Collection): Resolver {
  async function resolver(_, args, context: Context, info) {
    const req = await getGraphQLRequest({
      branch: args.branch,
      collectionSlug: collection.config.slug,
      context,
      info,
    })
    const options = {
      id: args.id,
      collection,
      depth: 0,
      draft: args.draft,
      req,
    }

    const result = await restoreVersionOperation(options)
    return result
  }

  return resolver
}
