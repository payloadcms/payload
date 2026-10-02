import type { GraphQLResolveInfo } from 'graphql'
import type { Collection, TypeWithID, TypeWithVersion } from 'payload'

import { findVersionByIDOperation } from 'payload'

import type { Context } from '../types.js'

import { buildSelectForCollection } from '../../utilities/select.js'
import { getGraphQLRequest } from '../getGraphQLRequest.js'

export type Resolver<T extends TypeWithID = any> = (
  _: unknown,
  args: {
    branch?: string
    fallbackLocale?: string
    id: number | string
    locale?: string
    select?: boolean
    trash?: boolean
  },
  context: Context,
  info: GraphQLResolveInfo,
) => Promise<TypeWithVersion<T>>

export function findVersionByIDResolver(collection: Collection): Resolver {
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

    const options = {
      id: args.id,
      collection,
      depth: 0,
      req,
      select,
      trash: args.trash,
    }

    const result = await findVersionByIDOperation(options)
    return result
  }
}
