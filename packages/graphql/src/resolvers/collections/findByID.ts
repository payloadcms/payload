import type { GraphQLResolveInfo } from 'graphql'
import type { Collection, CollectionSlug, DataFromCollectionSlug } from 'payload'

import { findByIDOperation, isolateObjectProperty } from 'payload'

import type { Context } from '../types.js'

import { graphqlSelectFromCollection } from '../../utilities/graphqlSelect.js'

export type Resolver<TData> = (
  _: unknown,
  args: {
    draft: boolean
    fallbackLocale?: string
    id: string
    locale?: string
    trash?: boolean
  },
  context: Context,
  info: GraphQLResolveInfo,
) => Promise<TData>

export function findByIDResolver<TSlug extends CollectionSlug>(
  collection: Collection,
): Resolver<DataFromCollectionSlug<TSlug>> {
  return async function resolver(_, args, context, info) {
    let { req } = context
    const locale = req.locale
    const fallbackLocale = req.fallbackLocale
    req = isolateObjectProperty(req, 'locale')
    req = isolateObjectProperty(req, 'fallbackLocale')
    req.locale = args.locale || locale
    req.fallbackLocale = args.fallbackLocale || fallbackLocale
    if (!req.query) {
      req.query = {}
    }

    const draft: boolean =
      (args.draft ?? req.query?.draft === 'false')
        ? false
        : req.query?.draft === 'true'
          ? true
          : undefined
    if (typeof draft === 'boolean') {
      req.query.draft = String(draft)
    }

    context.req = req

    const options = {
      id: args.id,
      collection,
      depth: 0,
      draft: args.draft,
      req: isolateObjectProperty(req, 'transactionID'),
      select: graphqlSelectFromCollection(info),
      trash: args.trash,
    }

    const result = await findByIDOperation(options)

    return result
  }
}
