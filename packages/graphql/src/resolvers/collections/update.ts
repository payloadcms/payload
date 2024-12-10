import type { Collection, CollectionSlug, DataFromCollectionSlug, PayloadRequest } from 'payload'

import { isolateObjectProperty, updateByIDOperation } from 'payload'

import type { Context } from '../types.js'

export type Resolver<TSlug extends CollectionSlug> = (
  _: unknown,
  args: {
    autosave: boolean
    data: DataFromCollectionSlug<TSlug>
    draft: boolean
    fallbackLocale?: string
    id: number | string
    locale?: string
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
      autosave: args.autosave,
      collection,
      data: args.data as any,
      depth: 0,
      draft: args.draft,
      req: isolateObjectProperty(req, 'transactionID'),
    }

    const result = await updateByIDOperation<TSlug>(options)

    return result
  }
}
