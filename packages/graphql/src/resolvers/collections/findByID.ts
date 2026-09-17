import type { GraphQLResolveInfo } from 'graphql'
import type { Collection, CollectionSlug, DataFromCollectionSlug, ReadVersion } from 'payload'

import { findByIDOperation, isolateObjectProperty } from 'payload'

import type { Context } from '../types.js'

import { buildSelectForCollection } from '../../utilities/select.js'

export type Resolver<TData> = (
  _: unknown,
  args: {
    fallbackLocale?: string
    id: string
    locale?: string
    select?: boolean
    trash?: boolean
    version?: ReadVersion
  },
  context: Context,
  info: GraphQLResolveInfo,
) => Promise<TData>

export function findByIDResolver<TSlug extends CollectionSlug>(
  collection: Collection,
): Resolver<DataFromCollectionSlug<TSlug>> {
  return async function resolver(_, args, context, info) {
    const req = (context.req = isolateObjectProperty(context.req, [
      'locale',
      'fallbackLocale',
      'transactionID',
    ]))
    const select = (context.select = args.select ? buildSelectForCollection(info) : undefined)

    req.locale = args.locale || req.locale
    req.fallbackLocale = args.fallbackLocale || req.fallbackLocale
    req.query = req.query || {}

    if (args.version) {
      req.query.version = args.version
    }

    const options = {
      id: args.id,
      collection,
      depth: 0,
      req,
      select,
      trash: args.trash,
      version: args.version,
    }

    const result = await findByIDOperation(options)
    return result
  }
}
