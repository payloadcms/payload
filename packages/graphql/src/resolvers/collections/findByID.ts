import type { GraphQLResolveInfo } from 'graphql'
import type { Collection, CollectionSlug, DataFromCollectionSlug } from 'payload'

import { findByIDOperation } from 'payload'

import type { Context } from '../types.js'

import { buildSelectForCollection } from '../../utilities/select.js'
import { getGraphQLRequest } from '../getGraphQLRequest.js'

export type Resolver<TData> = (
  _: unknown,
  args: {
    branch?: string
    draft: boolean
    fallbackLocale?: string
    id: string
    locale?: string
    select?: boolean
    trash?: boolean
  },
  context: Context,
  info: GraphQLResolveInfo,
) => Promise<TData>

export function findByIDResolver<TSlug extends CollectionSlug>(
  collection: Collection,
): Resolver<DataFromCollectionSlug<TSlug>> {
  return async function resolver(_, args, context, info) {
    const req = await getGraphQLRequest({
      branch: args.branch,
      collectionSlug: collection.config.slug,
      context,
      fallbackLocale: args.fallbackLocale,
      info,
      locale: args.locale,
    })
    const select = args.select ? buildSelectForCollection(info, context) : undefined

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
      collection,
      depth: 0,
      draft: args.draft,
      req,
      select,
      trash: args.trash,
    }

    const result = await findByIDOperation(options)
    return result
  }
}
