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
} from '../../../types/index.js'
import type { TypeWithVersion } from '../../../versions/types.js'
import type { DataFromGlobalSlug } from '../../config/types.js'

import { APIError } from '../../../errors/index.js'
import { createLocalReq } from '../../../utilities/createLocalReq.js'
import { findVersionByIDOperation } from '../findVersionByID.js'

export type Options<TSlug extends GlobalSlug, TDepth extends AllowedDepth = DefaultDepth> = {
  context?: RequestContext
  depth?: TDepth
  disableErrors?: boolean
  fallbackLocale?: false | TypedLocale
  id: string
  locale?: 'all' | TypedLocale
  overrideAccess?: boolean
  populate?: PopulateType
  req?: PayloadRequest
  select?: SelectType
  showHiddenFields?: boolean
  slug: TSlug
  user?: Document
}

// eslint-disable-next-line no-restricted-exports
export default async function findVersionByIDLocal<
  TSlug extends GlobalSlug,
  TDepth extends AllowedDepth = DefaultDepth,
>(
  payload: Payload,
  options: Options<TSlug>,
): Promise<TypeWithVersion<ApplyDepthInternal<DataFromGlobalSlug<TSlug>, TDepth>>> {
  const {
    id,
    slug: globalSlug,
    depth,
    disableErrors = false,
    overrideAccess = true,
    populate,
    select,
    showHiddenFields,
  } = options

  const globalConfig = payload.globals.config.find((config) => config.slug === globalSlug)

  if (!globalConfig) {
    throw new APIError(`The global with slug ${String(globalSlug)} can't be found.`)
  }

  return findVersionByIDOperation({
    id,
    depth,
    disableErrors,
    globalConfig,
    overrideAccess,
    populate,
    req: await createLocalReq(options, payload),
    select,
    showHiddenFields,
  })
}
