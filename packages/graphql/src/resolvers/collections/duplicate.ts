import type {
  Collection,
  CollectionSlug,
  CreateAction,
  DataFromCollectionSlug,
  PayloadRequest,
} from 'payload'

import { duplicateOperation, isolateObjectProperty } from 'payload'

import type { Context } from '../types.js'

export type Resolver<TData> = (
  _: unknown,
  args: {
    action?: CreateAction
    data: TData
    fallbackLocale?: string
    id: string
    locale?: string
  },
  context: {
    req: PayloadRequest
  },
) => Promise<TData>

export function duplicateResolver<TSlug extends CollectionSlug>(
  collection: Collection,
): Resolver<DataFromCollectionSlug<TSlug>> {
  return async function resolver(_, args, context: Context) {
    const { req } = context
    const locale = req.locale
    const fallbackLocale = req.fallbackLocale
    req.locale = args.locale || locale
    req.fallbackLocale = args.fallbackLocale || fallbackLocale
    context.req = req

    const result = await duplicateOperation({
      id: args.id,
      action: args.action,
      collection,
      data: args.data,
      depth: 0,
      req: isolateObjectProperty(req, 'transactionID'),
    })

    return result
  }
}
