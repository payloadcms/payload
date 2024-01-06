import type { GeneratedTypes, PayloadT } from '../../../'
import type { PaginatedDocs } from '../../../database/types'
import type { PayloadRequest, RequestContext } from '../../../types'
import type { Document, Where } from '../../../types'
import type { TypeWithVersion } from '../../../versions/types'

import { APIError } from '../../../errors'
import { setRequestContext } from '../../../utilities/setRequestContext'
import { getDataLoader } from '../../dataloader'
import { findVersionsOperation } from '../findVersions'

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
    context,
    depth,
    fallbackLocale,
    limit,
    locale = null,
    overrideAccess = true,
    page,
    req: incomingReq,
    showHiddenFields,
    sort,
    user,
    where,
  } = options

  const collection = payload.collections[collectionSlug]
  const defaultLocale = payload?.config?.localization
    ? payload?.config?.localization?.defaultLocale
    : null

  if (!collection) {
    throw new APIError(
      `The collection with slug ${String(collectionSlug)} can't be found. Find Versions Operation.`,
    )
  }

  const req = {
    fallbackLocale: typeof fallbackLocale !== 'undefined' ? fallbackLocale : defaultLocale,
    i18n: {
      fallbackLanguage: payload.config.i18n.fallbackLanguage,
      language: payload.config.i18n.fallbackLanguage,
    },
    locale: locale ?? defaultLocale,
    payload,
    payloadAPI: 'local',
    transactionID: incomingReq?.transactionID,
    user,
  } as PayloadRequest
  setRequestContext(req, context)

  if (!req.payloadDataLoader) req.payloadDataLoader = getDataLoader(req)

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
