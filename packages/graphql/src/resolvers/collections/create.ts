import type {
  Collection,
  CollectionSlug,
  CreateAction,
  DataFromCollectionSlug,
  PayloadRequest,
  RequiredDataFromCollectionSlug,
} from 'payload'

import { createOperation, isolateObjectProperty } from 'payload'

import type { Context } from '../types.js'

export type Resolver<TSlug extends CollectionSlug> = (
  _: unknown,
  args: {
    action?: CreateAction
    data: RequiredDataFromCollectionSlug<TSlug>
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
    const localization = context.req.payload.config.localization
    const returningLocale =
      args.locale === 'all'
        ? context.req.locale !== 'all' && context.req.locale
          ? context.req.locale
          : localization
            ? localization.defaultLocale
            : undefined
        : undefined
    const req = isolateObjectProperty(context.req, 'locale')

    if (args.locale) {
      req.locale = args.locale
    }

    if (args.locale === 'all') {
      context.req = isolateObjectProperty(context.req, 'locale')
      context.req.locale = returningLocale
    } else {
      context.req = req
    }

    const result = await createOperation({
      action: args.action,
      collection,
      data: args.data,
      depth: 0,
      req: isolateObjectProperty(req, 'transactionID'),
      returningLocale,
    })

    return result
  }
}
