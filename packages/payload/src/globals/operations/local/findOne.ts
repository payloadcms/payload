import type { GlobalSlug, Payload, RequestContext, TypedLocale } from '../../../index.js'
import type {
  Document,
  PayloadRequest,
  SelectType,
  TransformGlobalWithSelect,
} from '../../../types/index.js'
import type { SelectFromGlobalSlug } from '../../config/types.js'

import { APIError } from '../../../errors/index.js'
import { createLocalReq } from '../../../utilities/createLocalReq.js'
import { findOneOperation } from '../findOne.js'

export type Options<TSlug extends GlobalSlug, TSelect extends SelectType> = {
  context?: RequestContext
  depth?: number
  draft?: boolean
  fallbackLocale?: TypedLocale
  includeLockStatus?: boolean
  locale?: 'all' | TypedLocale
  overrideAccess?: boolean
  req?: PayloadRequest
  select?: TSelect
  showHiddenFields?: boolean
  slug: TSlug
  user?: Document
}

export default async function findOneLocal<
  TSlug extends GlobalSlug,
  TSelect extends SelectFromGlobalSlug<TSlug>,
>(
  payload: Payload,
  options: Options<TSlug, TSelect>,
): Promise<TransformGlobalWithSelect<TSlug, TSelect>> {
  const {
    slug: globalSlug,
    depth,
    draft = false,
    includeLockStatus,
    overrideAccess = true,
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
    req: await createLocalReq(options, payload),
    select,
    showHiddenFields,
  })
}
