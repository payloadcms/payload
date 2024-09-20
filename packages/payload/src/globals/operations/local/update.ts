import type { DeepPartial } from 'ts-essentials'

import type { GlobalSlug, Payload, RequestContext, TypedLocale } from '../../../index.js'
import type { Document, PayloadRequest } from '../../../types/index.js'
import type { DataFromGlobalSlug } from '../../config/types.js'

import { APIError } from '../../../errors/index.js'
import { createLocalReq } from '../../../utilities/createLocalReq.js'
import { updateOperation } from '../update.js'

export type Options<TSlug extends GlobalSlug> = {
  context?: RequestContext
  data: DeepPartial<Omit<DataFromGlobalSlug<TSlug>, 'id'>>
  depth?: number
  draft?: boolean
  fallbackLocale?: TypedLocale
  locale?: TypedLocale
  overrideAccess?: boolean
  overrideLock?: boolean
  publishSpecificLocale?: TypedLocale
  req?: PayloadRequest
  showHiddenFields?: boolean
  slug: TSlug
  user?: Document
}

export default async function updateLocal<TSlug extends GlobalSlug>(
  payload: Payload,
  options: Options<TSlug>,
): Promise<DataFromGlobalSlug<TSlug>> {
  const {
    slug: globalSlug,
    data,
    depth,
    draft,
    overrideAccess = true,
    overrideLock,
    publishSpecificLocale,
    showHiddenFields,
  } = options

  const globalConfig = payload.globals.config.find((config) => config.slug === globalSlug)

  if (!globalConfig) {
    throw new APIError(`The global with slug ${String(globalSlug)} can't be found.`)
  }

  return updateOperation<TSlug>({
    slug: globalSlug as string,
    data,
    depth,
    draft,
    globalConfig,
    overrideAccess,
    overrideLock,
    publishSpecificLocale,
    req: await createLocalReq(options, payload),
    showHiddenFields,
  })
}
