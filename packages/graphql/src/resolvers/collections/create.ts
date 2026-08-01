import type {
  Collection,
  CollectionSlug,
  DataFromCollectionSlug,
  PayloadRequest,
  RequiredDataFromCollectionSlug,
} from 'payload'

import { isolateObjectProperty } from 'payload'

import type { Context } from '../types.js'

import { invokeGraphQLOperation } from '../invokeOperation.js'

export type Resolver<TSlug extends CollectionSlug> = (
  _: unknown,
  args: {
    data: RequiredDataFromCollectionSlug<TSlug>
    draft: boolean
    locale?: string
  },
  context: {
    req: PayloadRequest
  },
) => Promise<DataFromCollectionSlug<TSlug>>

export function createResolver<TSlug extends CollectionSlug>(
  collection: Collection,
): Resolver<TSlug> {
  return async function resolver(_, args, context: Context) {
    if (args.locale) {
      context.req.locale = args.locale
    }

    const req = isolateObjectProperty(context.req, 'transactionID')
    const result = await invokeGraphQLOperation(req, 'collection', 'create', {
      collection: collection.config.slug,
      data: args.data,
      depth: 0,
      draft: args.draft,
      overrideAccess: false,
      req,
    })

    return result
  }
}
