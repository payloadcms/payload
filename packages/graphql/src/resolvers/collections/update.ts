import type { GraphQLResolveInfo } from 'graphql'
import type { Collection, CollectionSlug, DataFromCollectionSlug, PayloadRequest } from 'payload'

import { updateByIDOperation } from 'payload'

import type { Context } from '../types.js'

import { getGraphQLRequest } from '../getGraphQLRequest.js'

export type Resolver<TSlug extends CollectionSlug> = (
  _: unknown,
  args: {
    autosave: boolean
    branch?: string
    data: DataFromCollectionSlug<TSlug>
    draft: boolean
    fallbackLocale?: string
    id: number | string
    locale?: string
    trash?: boolean
  },
  context: {
    req: PayloadRequest
  },
  info: GraphQLResolveInfo,
) => Promise<DataFromCollectionSlug<TSlug>>

export function updateResolver<TSlug extends CollectionSlug>(
  collection: Collection,
): Resolver<TSlug> {
  return async function resolver(_, args, context: Context, info) {
    const req = await getGraphQLRequest({
      branch: args.branch,
      collectionSlug: collection.config.slug,
      context,
      fallbackLocale: args.fallbackLocale,
      info,
      locale: args.locale,
    })

    const draft: boolean =
      (args.draft ?? req.query?.draft === 'false')
        ? false
        : req.query?.draft === 'true'
          ? true
          : undefined
    if (typeof draft === 'boolean') {
      req.query.draft = String(draft)
    }

    const options = {
      id: args.id,
      autosave: args.autosave,
      collection,
      data: args.data as any,
      depth: 0,
      draft: args.draft,
      req,
      trash: args.trash,
    }

    const result = await updateByIDOperation<TSlug>(options)

    return result
  }
}
