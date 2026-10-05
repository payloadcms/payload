import type {
  Collection,
  CollectionSlug,
  DataFromCollectionSlug,
  DocumentVersion,
  PayloadRequest,
  RequiredDataFromCollectionSlug,
} from 'payload'

import { createOperation, isolateObjectProperty } from 'payload'

import type { Context } from '../types.js'

export type Resolver<TSlug extends CollectionSlug> = (
  _: unknown,
  args: {
    data: RequiredDataFromCollectionSlug<TSlug>
    locale?: string
    version?: Exclude<DocumentVersion, 'latest'>
  },
  context: {
    req: PayloadRequest
  },
) => Promise<DataFromCollectionSlug<TSlug>>

export function createResolver<TSlug extends CollectionSlug>(
  collection: Collection,
): Resolver<TSlug> {
  return async function resolver(_, args, context: Context) {
    const req = isolateObjectProperty(context.req, ['locale', 'query', 'transactionID'])

    if (args.locale) {
      req.locale = args.locale
    }

    req.query = {
      ...req.query,
      version: args.version,
    }

    const result = await createOperation({
      collection,
      data: args.data,
      depth: 0,
      req,
      version: args.version,
    })

    return result
  }
}
