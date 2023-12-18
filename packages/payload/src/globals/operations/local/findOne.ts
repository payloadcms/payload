import type { GeneratedTypes, RequestContext } from '../../..'
import type { PayloadRequest } from '../../../express/types'
import type { Payload } from '../../../payload'
import type { Document } from '../../../types'

import { getDataLoader } from '../../../collections/dataloader'
import { APIError } from '../../../errors'
import { setRequestContext } from '../../../express/setRequestContext'
import { i18nInit } from '../../../translations/init'
import findOne from '../findOne'

export type Options<T extends keyof GeneratedTypes['globals']> = {
  context?: RequestContext
  depth?: number
  draft?: boolean
  fallbackLocale?: string
  locale?: string
  overrideAccess?: boolean
  req?: PayloadRequest
  showHiddenFields?: boolean
  slug: T
  user?: Document
}

export default async function findOneLocal<T extends keyof GeneratedTypes['globals']>(
  payload: Payload,
  options: Options<T>,
): Promise<GeneratedTypes['globals'][T]> {
  const {
    context,
    depth,
    draft = false,
    fallbackLocale = null,
    locale = payload.config.localization ? payload.config.localization?.defaultLocale : null,
    overrideAccess = true,
    showHiddenFields,
    slug: globalSlug,
    user,
  } = options

  const globalConfig = payload.globals.config.find((config) => config.slug === globalSlug)
  const defaultLocale = payload?.config?.localization
    ? payload?.config?.localization?.defaultLocale
    : null

  if (!globalConfig) {
    throw new APIError(`The global with slug ${String(globalSlug)} can't be found.`)
  }

  const i18n = i18nInit(payload.config.i18n)

  const req = {
    fallbackLocale: fallbackLocale ?? options.req?.fallbackLocale ?? defaultLocale,
    i18n,
    locale: locale ?? options.req?.locale ?? defaultLocale,
    payload,
    payloadAPI: 'local',
    t: i18n.t,
    user,
  } as PayloadRequest
  setRequestContext(req, context)

  if (!req.payloadDataLoader) req.payloadDataLoader = getDataLoader(req)

  return findOne({
    depth,
    draft,
    globalConfig,
    overrideAccess,
    req,
    showHiddenFields,
    slug: globalSlug as string,
  })
}
