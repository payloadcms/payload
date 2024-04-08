import type { GeneratedTypes } from '../../..//index.js'
import type { Payload } from '../../../index.js'
import type { Document, PayloadRequest, RequestContext } from '../../../types/index.js'

import { APIError } from '../../../errors/index.js'
import { createLocalReq } from '../../../utilities/createLocalReq.js'
import { duplicateOperation } from '../duplicate.js'

export type Options<TSlug extends keyof GeneratedTypes['collections']> = {
  collection: TSlug
  /**
   * context, which will then be passed to req.context, which can be read by hooks
   */
  context?: RequestContext
  depth?: number
  draft?: boolean
  fallbackLocale?: string
  id: number | string
  locale?: string
  overrideAccess?: boolean
  req?: PayloadRequest
  showHiddenFields?: boolean
  user?: Document
}

export async function duplicate<TSlug extends keyof GeneratedTypes['collections']>(
  payload: Payload,
  options: Options<TSlug>,
): Promise<GeneratedTypes['collections'][TSlug]> {
  const {
    id,
    collection: collectionSlug,
    depth,
    draft,
    overrideAccess = true,
    showHiddenFields,
  } = options
  const collection = payload.collections[collectionSlug]

  if (!collection) {
    throw new APIError(
      `The collection with slug ${String(collectionSlug)} can't be found. Duplicate Operation.`,
    )
  }

  if (collection.config.disableDuplicate === false) {
    throw new APIError(
      `The collection with slug ${String(collectionSlug)} cannot be duplicated.`,
      400,
    )
  }

  const req = await createLocalReq(options, payload)

  return duplicateOperation<TSlug>({
    id,
    collection,
    depth,
    draft,
    overrideAccess,
    req,
    showHiddenFields,
  })
}
