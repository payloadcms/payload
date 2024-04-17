import type { GeneratedTypes } from '../../../'
import type { PayloadRequest, RequestContext } from '../../../express/types'
import type { Payload } from '../../../payload'
import type { Document } from '../../../types'

import { APIError } from '../../../errors'
import { createLocalReq } from '../../../utilities/createLocalReq'
import findByID from '../findByID'

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
  fallbackLocale?: string
  id: number | string
  locale?: string
  overrideAccess?: boolean
  req?: PayloadRequest
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
    showHiddenFields,
  } = options

  const collection = payload.collections[collectionSlug]

  if (!collection) {
    throw new APIError(
      `The collection with slug ${String(collectionSlug)} can't be found. Find By ID Operation.`,
    )
  }

  const req = createLocalReq(options, payload)

  return findByID<GeneratedTypes['collections'][T]>({
    id,
    collection,
    currentDepth,
    depth,
    disableErrors,
    draft,
    overrideAccess,
    req,
    showHiddenFields,
  })
}
