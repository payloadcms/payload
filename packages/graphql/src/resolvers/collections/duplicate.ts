import type { GraphQLResolveInfo } from 'graphql'
import type { Collection, CollectionSlug, DataFromCollectionSlug, PayloadRequest } from 'payload'

import { duplicateOperation } from 'payload'

import type { Context } from '../types.js'

import { getGraphQLRequest } from '../getGraphQLRequest.js'

export type Resolver<TData> = (
  _: unknown,
  args: {
    branch?: string
    data: TData
    draft: boolean
    fallbackLocale?: string
    id: string
    locale?: string
  },
  context: {
    req: PayloadRequest
  },
  info: GraphQLResolveInfo,
) => Promise<TData>

export function duplicateResolver<TSlug extends CollectionSlug>(
  collection: Collection,
): Resolver<DataFromCollectionSlug<TSlug>> {
  return async function resolver(_, args, context: Context, info) {
    const req = await getGraphQLRequest({
      branch: args.branch,
      collectionSlug: collection.config.slug,
      context,
      fallbackLocale: args.fallbackLocale,
      info,
      locale: args.locale,
    })

    const result = await duplicateOperation({
      id: args.id,
      collection,
      data: args.data,
      depth: 0,
      draft: args.draft,
      req,
    })

    return result
  }
}
