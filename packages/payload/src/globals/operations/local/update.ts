import type { DeepPartial } from 'ts-essentials'

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
import type { DataFromGlobalSlug, SelectFromGlobalSlug } from '../../config/types.js'

import { APIError } from '../../../errors/index.js'
import { createLocalReq } from '../../../utilities/createLocalReq.js'
import { updateOperation } from '../update.js'

export type Options<
  TSlug extends GlobalSlug,
  TSelect extends SelectType,
  TDepth extends AllowedDepth = DefaultDepth,
> = {
  context?: RequestContext
  data: DeepPartial<Omit<DataFromGlobalSlug<TSlug>, 'id'>>
  depth?: TDepth
  draft?: boolean
  fallbackLocale?: false | TypedLocale
  locale?: 'all' | TypedLocale
  overrideAccess?: boolean
  overrideLock?: boolean
  populate?: PopulateType
  publishSpecificLocale?: TypedLocale
  req?: PayloadRequest
  select?: TSelect
  showHiddenFields?: boolean
  slug: TSlug
  user?: Document
}

export default async function updateLocal<
  TSlug extends GlobalSlug,
  TSelect extends SelectFromGlobalSlug<TSlug>,
  TDepth extends AllowedDepth = DefaultDepth,
>(
  payload: Payload,
  options: Options<TSlug, TSelect>,
): Promise<ApplyDepthInternal<TransformGlobalWithSelect<TSlug, TSelect>, TDepth>> {
  const {
    slug: globalSlug,
    data,
    depth,
    draft,
    overrideAccess = true,
    overrideLock,
    populate,
    publishSpecificLocale,
    select,
    showHiddenFields,
  } = options

  const globalConfig = payload.globals.config.find((config) => config.slug === globalSlug)

  if (!globalConfig) {
    throw new APIError(`The global with slug ${String(globalSlug)} can't be found.`)
  }

  return updateOperation<TSlug, TSelect>({
    slug: globalSlug as string,
    data,
    depth,
    draft,
    globalConfig,
    overrideAccess,
    overrideLock,
    populate,
    publishSpecificLocale,
    req: await createLocalReq(options, payload),
    select,
    showHiddenFields,
  })
}
