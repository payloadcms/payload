import type {
  Collection,
  CollectionSlug,
  PayloadRequest,
  RequiredDataFromCollectionSlug,
  ValidationResult,
} from 'payload'
import type { DeepPartial } from 'ts-essentials'

import { isolateObjectProperty } from 'payload'

import type { Context } from '../types.js'

export type Resolver<TSlug extends CollectionSlug> = (
  _: unknown,
  args: {
    data?: DeepPartial<RequiredDataFromCollectionSlug<TSlug>>
    draft?: boolean
    id?: number | string
    locale?: string
  },
  context: {
    req: PayloadRequest
  },
) => Promise<ValidationResult>

/**
 * Validates a single locale — the request's resolved locale, or the `locale` argument when
 * provided. Unlike the Local and REST APIs, this does not support validating multiple locales or
 * `locale: 'all'` in one call.
 */
export function validateResolver<TSlug extends CollectionSlug>(
  collection: Collection,
): Resolver<TSlug> {
  return async function resolver(_, args, context: Context) {
    const { req } = context
    const collectionSlug = collection.config.slug as TSlug
    const locale = req.payload.config.localization ? args.locale || req.locale : null

    if (args.id === undefined) {
      return req.payload.validate({
        collection: collectionSlug,
        data: args.data,
        draft: args.draft,
        locale,
        overrideAccess: false,
        req: isolateObjectProperty(req, 'transactionID'),
      })
    }

    return req.payload.validate({
      id: args.id,
      collection: collectionSlug,
      data: args.data,
      draft: args.draft,
      locale,
      overrideAccess: false,
      req: isolateObjectProperty(req, 'transactionID'),
    })
  }
}
