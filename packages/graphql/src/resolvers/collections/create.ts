import type {
  Collection,
  CollectionSlug,
  DataFromCollectionSlug,
  PayloadRequestWithData,
  RequiredDataFromCollectionSlug,
} from 'payload'

import { createOperation, isolateObjectProperty } from 'payload'

import type { Context } from '../types.js'

export type Resolver<TSlug extends CollectionSlug> = (
  _: unknown,
  args: {
    data: RequiredDataFromCollectionSlug<TSlug>
    draft: boolean
    locale?: string
  },
  context: {
    req: PayloadRequestWithData
  },
) => Promise<DataFromCollectionSlug<TSlug>>

export default function createResolver<TSlug extends CollectionSlug>(
  collection: Collection,
): Resolver<TSlug> {
  return async function resolver(_, args, context: Context) {
    if (args.locale) {
      context.req.locale = args.locale
    }

    const options = {
      collection,
      data: args.data,
      depth: 0,
      draft: args.draft,
      req: isolateObjectProperty(context.req, 'transactionID'),
    }

    const result = await createOperation(options)

    return result
  }
}
