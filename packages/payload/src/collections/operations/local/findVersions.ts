import type { GeneratedTypes, PayloadT } from '../../../'
import type { PaginatedDocs } from '../../../database/types'
import type { PayloadRequest, RequestContext } from '../../../types'
import type { Document, Where } from '../../../types'
import type { TypeWithVersion } from '../../../versions/types'

import { APIError } from '../../../errors'
<<<<<<< HEAD
import { createLocalReq } from '../../../utilities/createLocalReq'
import findVersions from '../findVersions'
=======
import { i18nInit } from '../../../translations/init'
import { setRequestContext } from '../../../utilities/setRequestContext'
import { getDataLoader } from '../../dataloader'
import { findVersionsOperation } from '../findVersions'
>>>>>>> 988a21e94 (feat(3.0): next route handlers (#4590))

export type Options<T extends keyof GeneratedTypes['collections']> = {
  collection: T
  /**
   * context, which will then be passed to req.context, which can be read by hooks
   */
  context?: RequestContext
  depth?: number
  draft?: boolean
  fallbackLocale?: string
  limit?: number
  locale?: string
  overrideAccess?: boolean
  page?: number
  req?: PayloadRequest
  showHiddenFields?: boolean
  sort?: string
  user?: Document
  where?: Where
}

export default async function findVersionsLocal<T extends keyof GeneratedTypes['collections']>(
  payload: PayloadT,
  options: Options<T>,
): Promise<PaginatedDocs<TypeWithVersion<GeneratedTypes['collections'][T]>>> {
  const {
    collection: collectionSlug,
    depth,
    limit,
    overrideAccess = true,
    page,
    showHiddenFields,
    sort,
    where,
  } = options

  const collection = payload.collections[collectionSlug]

  if (!collection) {
    throw new APIError(
      `The collection with slug ${String(collectionSlug)} can't be found. Find Versions Operation.`,
    )
  }

  const req = createLocalReq(options, payload)

  return findVersionsOperation({
    collection,
    depth,
    limit,
    overrideAccess,
    page,
    req,
    showHiddenFields,
    sort,
    where,
  })
}
