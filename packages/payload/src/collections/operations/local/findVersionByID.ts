import type { GeneratedTypes, PayloadT } from '../../../'
import type { PayloadRequest, RequestContext } from '../../../types'
import type { Document } from '../../../types'
import type { TypeWithVersion } from '../../../versions/types'

import { APIError } from '../../../errors'
<<<<<<< HEAD
import { createLocalReq } from '../../../utilities/createLocalReq'
import findVersionByID from '../findVersionByID'
=======
import { i18nInit } from '../../../translations/init'
import { setRequestContext } from '../../../utilities/setRequestContext'
import { getDataLoader } from '../../dataloader'
import { findVersionByIDOperation } from '../findVersionByID'
>>>>>>> 988a21e94 (feat(3.0): next route handlers (#4590))

export type Options<T extends keyof GeneratedTypes['collections']> = {
  collection: T
  /**
   * context, which will then be passed to req.context, which can be read by hooks
   */
  context?: RequestContext
  depth?: number
  disableErrors?: boolean
  draft?: boolean
  fallbackLocale?: string
  id: string
  locale?: string
  overrideAccess?: boolean
  req?: PayloadRequest
  showHiddenFields?: boolean
  user?: Document
}

export default async function findVersionByIDLocal<T extends keyof GeneratedTypes['collections']>(
  payload: PayloadT,
  options: Options<T>,
): Promise<TypeWithVersion<GeneratedTypes['collections'][T]>> {
  const {
    id,
    collection: collectionSlug,
    depth,
    disableErrors = false,
    overrideAccess = true,
    showHiddenFields,
  } = options

  const collection = payload.collections[collectionSlug]

  if (!collection) {
    throw new APIError(
      `The collection with slug ${String(
        collectionSlug,
      )} can't be found. Find Version By ID Operation.`,
    )
  }

  const req = createLocalReq(options, payload)

  return findVersionByIDOperation({
    id,
    collection,
    depth,
    disableErrors,
    overrideAccess,
    req,
    showHiddenFields,
  })
}
