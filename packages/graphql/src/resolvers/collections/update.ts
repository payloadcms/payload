import type {
  Collection,
  CollectionSlug,
  DataFromCollectionSlug,
  PayloadRequest,
  UpdateAction,
} from 'payload'

import { isolateObjectProperty, updateByIDOperation } from 'payload'

import type { Context } from '../types.js'

export type Resolver<TSlug extends CollectionSlug> = (
  _: unknown,
  args: {
    action?: UpdateAction
    autosave: boolean
    data: DataFromCollectionSlug<TSlug>
    fallbackLocale?: string
    id: number | string
    locale?: string
    trash?: boolean
  },
  context: {
    req: PayloadRequest
  },
) => Promise<DataFromCollectionSlug<TSlug>>

export function updateResolver<TSlug extends CollectionSlug>(
  collection: Collection,
): Resolver<TSlug> {
  return async function resolver(_, args, context: Context) {
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

    context.req = req

    const options = {
      id: args.id,
      action: args.action,
      autosave: args.autosave,
      collection,
      data: args.data as any,
      depth: 0,
      req: isolateObjectProperty(req, 'transactionID'),
      trash: args.trash,
    }

    const result = await updateByIDOperation<TSlug>(options)

    return result
  }
}
