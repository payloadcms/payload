import type { PaginatedDocs } from '../../../database/types.js'
import type { GeneratedTypes, Payload } from '../../../index.js'
import type {
  Document,
  PayloadRequest,
  RequestContext,
  Select,
  Where,
} from '../../../types/index.js'

import { APIError } from '../../../errors/index.js'
import { createLocalReq } from '../../../utilities/createLocalReq.js'
import { findOperation } from '../find.js'

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
  limit?: number
  locale?: 'all' | GeneratedTypes['locale']
  overrideAccess?: boolean
  page?: number
  pagination?: boolean
  req?: PayloadRequest
  select?: Select
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
    select,
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

  return findOperation<GeneratedTypes['collections'][T]>({
    collection,
    currentDepth,
    depth,
    disableErrors,
    draft,
    limit,
    overrideAccess,
    page,
    pagination,
    req: await createLocalReq(options, payload),
    select,
    showHiddenFields,
    sort,
    where,
  })
}
