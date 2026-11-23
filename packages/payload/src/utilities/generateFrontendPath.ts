import type { DataFromCollectionSlug } from '../collections/config/types.js'
import type { DataFromGlobalSlug } from '../globals/config/types.js'
import type { CollectionSlug, GlobalSlug, Payload } from '../index.js'
import type { JsonObject, PayloadRequest } from '../types/index.js'

import { APIError } from '../errors/index.js'
import { createPayloadRequest } from './createPayloadRequest.js'

export type GenerateFrontendPathOptions = {
  doc: JsonObject
  /**
   * The `PayloadRequest` object. Pass it from hooks or endpoints so that `generateFrontendPath`
   * receives the current locale, user and transaction.
   */
  req?: Partial<PayloadRequest>
} & (
  | {
      collection: CollectionSlug
      global?: never
    }
  | {
      collection?: never
      global: GlobalSlug
    }
)

export async function generateFrontendPathLocal(
  payload: Payload,
  options: GenerateFrontendPathOptions,
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

    const req = await createPayloadRequest({ payload, req: options.req })

    return (
      (await collection.generateFrontendPath({
        collection,
        doc: doc as DataFromCollectionSlug<CollectionSlug>,
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

  const req = await createPayloadRequest({ payload, req: options.req })

  return (
    (await global.generateFrontendPath({
      doc: doc as DataFromGlobalSlug<GlobalSlug>,
      global,
      req,
    })) ?? null
  )
}
