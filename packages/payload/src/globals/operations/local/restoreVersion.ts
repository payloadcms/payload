/* eslint-disable no-restricted-exports */
import type { GlobalSlug, Payload, RequestContext, TypedLocale } from '../../../index.js'
import type { Document, PayloadRequest, PopulateType } from '../../../types/index.js'
import type { DataFromGlobalSlug } from '../../config/types.js'

import { APIError } from '../../../errors/index.js'
import { createLocalReq } from '../../../utilities/createLocalReq.js'
import { restoreVersionOperation } from '../restoreVersion.js'

export type Options<TSlug extends GlobalSlug> = {
  context?: RequestContext
  depth?: number
  fallbackLocale?: false | TypedLocale
  id: string
  locale?: TypedLocale
  overrideAccess?: boolean
  populate?: PopulateType
  req?: Partial<PayloadRequest>
  showHiddenFields?: boolean
  slug: TSlug
  user?: Document
}

export default async function restoreVersionLocal<TSlug extends GlobalSlug>(
  payload: Payload,
  options: Options<TSlug>,
): Promise<DataFromGlobalSlug<TSlug>> {
  const { id, slug: globalSlug, depth, overrideAccess = true, populate, showHiddenFields } = options

  const globalConfig = payload.globals.config.find((config) => config.slug === globalSlug)

  if (!globalConfig) {
    throw new APIError(`The global with slug ${String(globalSlug)} can't be found.`)
  }

  return restoreVersionOperation({
    id,
    depth,
    globalConfig,
    overrideAccess,
    populate,
    req: await createLocalReq(options, payload),
    showHiddenFields,
  })
}
