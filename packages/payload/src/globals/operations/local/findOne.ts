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
  TransformGlobalWithSelect,
} from '../../../types/index.js'
import type { SelectFromGlobalSlug } from '../../config/types.js'

import { APIError } from '../../../errors/index.js'
import { createLocalReq } from '../../../utilities/createLocalReq.js'
import { findOneOperation } from '../findOne.js'

export type Options<
  TSlug extends GlobalSlug,
  TSelect extends SelectType,
  TDepth extends AllowedDepth = DefaultDepth,
> = {
  context?: RequestContext
  depth?: TDepth
  draft?: boolean
  fallbackLocale?: false | TypedLocale
  includeLockStatus?: boolean
  locale?: 'all' | TypedLocale
  overrideAccess?: boolean
  populate?: PopulateType
  req?: PayloadRequest
  select?: TSelect
  showHiddenFields?: boolean
  slug: TSlug
  user?: Document
}

export default async function findOneLocal<
  TSlug extends GlobalSlug,
  TSelect extends SelectFromGlobalSlug<TSlug>,
  TDepth extends AllowedDepth = DefaultDepth,
>(
  payload: Payload,
  options: Options<TSlug, TSelect>,
): Promise<ApplyDepthInternal<TransformGlobalWithSelect<TSlug, TSelect>, TDepth>> {
  const {
    slug: globalSlug,
    depth,
    draft = false,
    includeLockStatus,
    overrideAccess = true,
    populate,
    select,
    showHiddenFields,
  } = options

  const globalConfig = payload.globals.config.find((config) => config.slug === globalSlug)

  if (!globalConfig) {
    throw new APIError(`The global with slug ${String(globalSlug)} can't be found.`)
  }

  return findOneOperation({
    slug: globalSlug as string,
    depth,
    draft,
    globalConfig,
    includeLockStatus,
    overrideAccess,
    populate,
    req: await createLocalReq(options, payload),
    select,
    showHiddenFields,
  })
}
