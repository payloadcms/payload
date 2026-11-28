import type { DataFromCollectionSlug } from '../collections/config/types.js'
import type { DataFromGlobalSlug } from '../globals/config/types.js'
import type { CollectionSlug, GlobalSlug, Payload } from '../index.js'
import type { PayloadRequest } from '../types/index.js'

import { APIError } from '../errors/index.js'
import { createPayloadRequest } from './createPayloadRequest.js'

export type GenerateFrontendPathOptions<
  TSlug extends CollectionSlug = CollectionSlug,
  TGlobalSlug extends GlobalSlug = GlobalSlug,
> = {
  /**
   * The `PayloadRequest` object. Pass it from hooks or endpoints so that `generateFrontendPath`
   * receives the current locale, user and transaction.
   */
  req?: Partial<PayloadRequest>
} & (
  | {
      collection: TSlug
      doc: Partial<DataFromCollectionSlug<TSlug>>
      global?: never
    }
  | {
      collection?: never
      doc: Partial<DataFromGlobalSlug<TGlobalSlug>>
      global: TGlobalSlug
    }
)

export async function generateFrontendPathLocal<
  TSlug extends CollectionSlug,
  TGlobalSlug extends GlobalSlug,
>(
  payload: Payload,
  options: GenerateFrontendPathOptions<TSlug, TGlobalSlug>,
): Promise<null | string> {
  const { collection: collectionSlug, doc, global: globalSlug } = options

  if (collectionSlug) {
    const collection = payload.collections[collectionSlug]?.config

    if (!collection) {
      throw new APIError(`The collection with slug ${String(collectionSlug)} can't be found.`)
    }

    if (!collection.generateFrontendPath) {
      return null
    }

    const req = await createPayloadRequest({
      fallbackLocale: options.req?.fallbackLocale,
      payload,
      req: options.req,
    })

    return (
      (await collection.generateFrontendPath({
        collection,
        doc: doc as Partial<DataFromCollectionSlug<CollectionSlug>>,
        req,
      })) ?? null
    )
  }

  const global = payload.config.globals.find(({ slug }) => slug === globalSlug)

  if (!global) {
    throw new APIError(`The global with slug ${String(globalSlug)} can't be found.`)
  }

  if (!global.generateFrontendPath) {
    return null
  }

  const req = await createPayloadRequest({
    fallbackLocale: options.req?.fallbackLocale,
    payload,
    req: options.req,
  })

  return (
    (await global.generateFrontendPath({
      doc: doc as Partial<DataFromGlobalSlug<GlobalSlug>>,
      global,
      req,
    })) ?? null
  )
}
