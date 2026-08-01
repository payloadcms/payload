import type { Collection, CollectionSlug, DataFromCollectionSlug, PayloadRequest } from 'payload'

import { isolateObjectProperty } from 'payload'

import type { Context } from '../types.js'

import { invokeGraphQLOperation } from '../invokeOperation.js'

export type Resolver<TSlug extends CollectionSlug> = (
  _: unknown,
  args: {
    draft: boolean
    fallbackLocale?: string
    id: number | string
    locale?: string
    trash?: boolean
  },
  context: {
    req: PayloadRequest
  },
) => Promise<DataFromCollectionSlug<TSlug>>

export function getDeleteResolver<TSlug extends CollectionSlug>(
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
      collection: collection.config.slug,
      depth: 0,
      overrideAccess: false,
      req: isolateObjectProperty(req, 'transactionID'),
      trash: args.trash,
    }

    const result = await invokeGraphQLOperation(req, 'collection', 'delete', options)

    return result as DataFromCollectionSlug<TSlug>
  }
}
