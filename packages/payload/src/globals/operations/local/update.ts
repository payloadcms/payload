import type { DeepPartial } from 'ts-essentials'

import type { GeneratedTypes, RequestContext } from '../../../'
import type { PayloadRequest } from '../../../express/types'
import type { Payload } from '../../../payload'
import type { Document } from '../../../types'

import { getDataLoader } from '../../../collections/dataloader'
import { APIError } from '../../../errors'
import { setRequestContext } from '../../../express/setRequestContext'
import { i18nInit } from '../../../translations/init'
import update from '../update'

export type Options<TSlug extends keyof GeneratedTypes['globals']> = {
  context?: RequestContext
  data: DeepPartial<Omit<GeneratedTypes['globals'][TSlug], 'id'>>
  depth?: number
  draft?: boolean
  fallbackLocale?: string
  locale?: string
  overrideAccess?: boolean
  req?: PayloadRequest
  showHiddenFields?: boolean
  slug: TSlug
  user?: Document
}

export default async function updateLocal<TSlug extends keyof GeneratedTypes['globals']>(
  payload: Payload,
  options: Options<TSlug>,
): Promise<GeneratedTypes['globals'][TSlug]> {
  const {
    context,
    data,
    depth,
    draft,
    fallbackLocale: fallbackLocaleArg = options?.req?.fallbackLocale,
    locale = payload.config.localization ? payload.config.localization?.defaultLocale : null,
    overrideAccess = true,
    req: incomingReq,
    showHiddenFields,
    slug: globalSlug,
    user,
  } = options

  const globalConfig = payload.globals.config.find((config) => config.slug === globalSlug)
  const localizationConfig = payload?.config?.localization
  const defaultLocale = payload?.config?.localization
    ? payload?.config?.localization?.defaultLocale
    : null
  const fallbackLocale = localizationConfig
    ? localizationConfig.locales.find(({ code }) => locale === code)?.fallbackLocale
    : null
  const i18n = i18nInit(payload.config.i18n)

  if (!globalConfig) {
    throw new APIError(`The global with slug ${String(globalSlug)} can't be found.`)
  }

  const req = {
    fallbackLocale:
      typeof fallbackLocaleArg !== 'undefined'
        ? fallbackLocaleArg
        : fallbackLocale || defaultLocale,
    i18n,
    locale,
    payload,
    payloadAPI: 'local',
    t: i18n.t,
    transactionID: incomingReq?.transactionID,
    user,
  } as PayloadRequest
  setRequestContext(req, context)

  if (!req.payloadDataLoader) req.payloadDataLoader = getDataLoader(req)

  return update<TSlug>({
    data,
    depth,
    draft,
    globalConfig,
    overrideAccess,
    req,
    showHiddenFields,
    slug: globalSlug as string,
  })
}
