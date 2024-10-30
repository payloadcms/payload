import type { GlobalSlug, Payload, RequestContext, TypedLocale } from '../../../index.js'
import type { Document, PayloadRequest, SelectType } from '../../../types/index.js'
import type { TypeWithVersion } from '../../../versions/types.js'
import type { DataFromGlobalSlug } from '../../config/types.js'

import { APIError } from '../../../errors/index.js'
import { createLocalReq } from '../../../utilities/createLocalReq.js'
import { findVersionByIDOperation } from '../findVersionByID.js'

export type Options<TSlug extends GlobalSlug> = {
  context?: RequestContext
  depth?: number
  disableErrors?: boolean
  fallbackLocale?: TypedLocale
  id: string
  locale?: 'all' | TypedLocale
  overrideAccess?: boolean
  req?: PayloadRequest
  select?: SelectType
  showHiddenFields?: boolean
  slug: TSlug
  user?: Document
}

// eslint-disable-next-line no-restricted-exports
export default async function findVersionByIDLocal<TSlug extends GlobalSlug>(
  payload: Payload,
  options: Options<TSlug>,
): Promise<TypeWithVersion<DataFromGlobalSlug<TSlug>>> {
  const {
    id,
    slug: globalSlug,
    depth,
    disableErrors = false,
    overrideAccess = true,
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
    req: await createLocalReq(options, payload),
    select,
    showHiddenFields,
  })
}
