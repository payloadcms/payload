import type { GeneratedTypes, Payload } from '../../../index.js'
import type { Document, PayloadRequest, RequestContext, Select } from '../../../types/index.js'

import { APIError } from '../../../errors/index.js'
import { createLocalReq } from '../../../utilities/createLocalReq.js'
import { findByIDOperation } from '../findByID.js'

export type Options<T extends keyof GeneratedTypes['collections']> = {
  collection: T
  /**
   * context, which will then be passed to req.context, which can be read by hooks
   */
  context?: RequestContext
  currentDepth?: number
  depth?: number
  disableErrors?: boolean
  draft?: boolean
  fallbackLocale?: GeneratedTypes['locale']
  id: number | string
  locale?: 'all' | GeneratedTypes['locale']
  overrideAccess?: boolean
  req?: PayloadRequest
  select?: Select
  showHiddenFields?: boolean
  user?: Document
}

export default async function findByIDLocal<T extends keyof GeneratedTypes['collections']>(
  payload: Payload,
  options: Options<T>,
): Promise<GeneratedTypes['collections'][T]> {
  const {
    id,
    collection: collectionSlug,
    currentDepth,
    depth,
    disableErrors = false,
    draft = false,
    overrideAccess = true,
    select,
    showHiddenFields,
  } = options

  const collection = payload.collections[collectionSlug]

  if (!collection) {
    throw new APIError(
      `The collection with slug ${String(collectionSlug)} can't be found. Find By ID Operation.`,
    )
  }

  return findByIDOperation<GeneratedTypes['collections'][T]>({
    id,
    collection,
    currentDepth,
    depth,
    disableErrors,
    draft,
    overrideAccess,
    req: await createLocalReq(options, payload),
    select,
    showHiddenFields,
  })
}
