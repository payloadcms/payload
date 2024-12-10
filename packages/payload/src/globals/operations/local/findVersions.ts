/* eslint-disable no-restricted-exports */
import type { PaginatedDocs } from '../../../database/types.js'
import type {
  AllowedDepth,
  DefaultDepth,
  GlobalSlug,
  Payload,
  RequestContext,
  TypedLocale,
} from '../../../index.js'
import type {
  ApplyDepthInternal,
  Document,
  PayloadRequest,
  PopulateType,
  SelectType,
  Sort,
  Where,
} from '../../../types/index.js'
import type { TypeWithVersion } from '../../../versions/types.js'
import type { DataFromGlobalSlug } from '../../config/types.js'

import { APIError } from '../../../errors/index.js'
import { createLocalReq } from '../../../utilities/createLocalReq.js'
import { findVersionsOperation } from '../findVersions.js'

export type Options<TSlug extends GlobalSlug, TDepth extends AllowedDepth = DefaultDepth> = {
  context?: RequestContext
  depth?: TDepth
  fallbackLocale?: false | TypedLocale
  limit?: number
  locale?: 'all' | TypedLocale
  overrideAccess?: boolean
  page?: number
  populate?: PopulateType
  req?: PayloadRequest
  select?: SelectType
  showHiddenFields?: boolean
  slug: TSlug
  sort?: Sort
  user?: Document
  where?: Where
}

export default async function findVersionsLocal<
  TSlug extends GlobalSlug,
  TDepth extends AllowedDepth = DefaultDepth,
>(
  payload: Payload,
  options: Options<TSlug>,
): Promise<PaginatedDocs<TypeWithVersion<ApplyDepthInternal<DataFromGlobalSlug<TSlug>, TDepth>>>> {
  const {
    slug: globalSlug,
    depth,
    limit,
    overrideAccess = true,
    page,
    populate,
    select,
    showHiddenFields,
    sort,
    where,
  } = options

  const globalConfig = payload.globals.config.find((config) => config.slug === globalSlug)

  if (!globalConfig) {
    throw new APIError(`The global with slug ${String(globalSlug)} can't be found.`)
  }

  return findVersionsOperation({
    depth,
    globalConfig,
    limit,
    overrideAccess,
    page,
    populate,
    req: await createLocalReq(options, payload),
    select,
    showHiddenFields,
    sort,
    where,
  })
}
