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
    const originalReq = context.req
    const locale = originalReq.locale
    const fallbackLocale = originalReq.fallbackLocale
    const returningLocale =
      args.locale === 'all'
        ? locale !== 'all' && locale
          ? locale
          : originalReq.payload.config.localization
            ? originalReq.payload.config.localization.defaultLocale
            : undefined
        : undefined
    const req = isolateObjectProperty(originalReq, ['locale', 'fallbackLocale'])
    req.locale = args.locale || locale
    req.fallbackLocale = args.fallbackLocale || fallbackLocale
    if (!req.query) {
      req.query = {}
    }

    if (args.locale === 'all') {
      context.req = isolateObjectProperty(originalReq, ['locale', 'fallbackLocale'])
      context.req.locale = returningLocale
      context.req.fallbackLocale = args.fallbackLocale || fallbackLocale
    } else {
      context.req = req
    }

    const options = {
      id: args.id,
      action: args.action,
      autosave: args.autosave,
      collection,
      data: args.data as any,
      depth: 0,
      req: isolateObjectProperty(req, 'transactionID'),
      returningLocale,
      trash: args.trash,
    }

    const result = await updateByIDOperation<TSlug>(options)

    return result
  }
}
