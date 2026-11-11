import type { GraphQLResolveInfo } from 'graphql'
import type { Collection, SanitizedCollectionPermission, SanitizedGlobalPermission } from 'payload'

import { docAccessOperation } from 'payload'

import type { Context } from '../types.js'

import { getGraphQLRequest } from '../getGraphQLRequest.js'

export type Resolver = (
  _: unknown,
  args: {
    branch?: string
    id: number | string
  },
  context: Context,
  info: GraphQLResolveInfo,
) => Promise<SanitizedCollectionPermission | SanitizedGlobalPermission>

export function docAccessResolver(collection: Collection): Resolver {
  async function resolver(_, args, context, info) {
    const req = await getGraphQLRequest({
      branch: args.branch,
      collectionSlug: collection.config.slug,
      context,
      info,
    })

    return docAccessOperation({
      id: args.id,
      collection,
      req,
    })
  }

  return resolver
}
