/* eslint-disable no-restricted-exports */
import type { PaginatedDocs } from '../../../database/types.js'
import type { GlobalSlug, Payload, RequestContext, TypedLocale } from '../../../index.js'
import type { Document, PayloadRequest, SelectType, Sort, Where } from '../../../types/index.js'
import type { TypeWithVersion } from '../../../versions/types.js'
import type { DataFromGlobalSlug } from '../../config/types.js'

import { APIError } from '../../../errors/index.js'
import { createLocalReq } from '../../../utilities/createLocalReq.js'
import { findVersionsOperation } from '../findVersions.js'

export type Options<TSlug extends GlobalSlug> = {
  context?: RequestContext
  depth?: number
  fallbackLocale?: TypedLocale
  limit?: number
  locale?: 'all' | TypedLocale
  overrideAccess?: boolean
  page?: number
  req?: PayloadRequest
  select?: SelectType
  showHiddenFields?: boolean
  slug: TSlug
  sort?: Sort
  user?: Document
  where?: Where
}

export default async function findVersionsLocal<TSlug extends GlobalSlug>(
  payload: Payload,
  options: Options<TSlug>,
): Promise<PaginatedDocs<TypeWithVersion<DataFromGlobalSlug<TSlug>>>> {
  const {
    slug: globalSlug,
    depth,
    limit,
    overrideAccess = true,
    page,
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
    req: await createLocalReq(options, payload),
    select,
    showHiddenFields,
    sort,
    where,
  })
}
