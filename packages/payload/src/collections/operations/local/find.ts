import type { GeneratedTypes } from '../../../'
import type { PaginatedDocs } from '../../../database/types'
import type { PayloadRequest, RequestContext } from '../../../express/types'
import type { Payload } from '../../../payload'
import type { Document, Where } from '../../../types'

import { APIError } from '../../../errors'
import { createLocalReq } from '../../../utilities/createLocalReq'
import find from '../find'

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
  limit?: number
  locale?: string
  overrideAccess?: boolean
  page?: number
  pagination?: boolean
  req?: PayloadRequest
  showHiddenFields?: boolean
  sort?: string
  user?: Document
  where?: Where
}

export default async function findLocal<T extends keyof GeneratedTypes['collections']>(
  payload: Payload,
  options: Options<T>,
): Promise<PaginatedDocs<GeneratedTypes['collections'][T]>> {
  const {
    collection: collectionSlug,
    currentDepth,
    depth,
    disableErrors,
    draft = false,
    limit,
    overrideAccess = true,
    page,
    pagination = true,
    showHiddenFields,
    sort,
    where,
  } = options

  const collection = payload.collections[collectionSlug]

  if (!collection) {
    throw new APIError(
      `The collection with slug ${String(collectionSlug)} can't be found. Find Operation.`,
    )
  }

  const req = createLocalReq(options, payload)

  return find<GeneratedTypes['collections'][T]>({
    collection,
    currentDepth,
    depth,
    disableErrors,
    draft,
    limit,
    overrideAccess,
    page,
    pagination,
    req,
    showHiddenFields,
    sort,
    where,
  })
}
