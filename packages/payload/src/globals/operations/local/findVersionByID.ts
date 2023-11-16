import type { GeneratedTypes } from '../../../'
import type { PayloadRequest } from '../../../express/types'
import type { Payload } from '../../../payload'
import type { Document } from '../../../types'
import type { TypeWithVersion } from '../../../versions/types'

import { getDataLoader } from '../../../collections/dataloader'
import { APIError } from '../../../errors'
import { setRequestContext } from '../../../express/setRequestContext'
import { i18nInit } from '../../../translations/init'
import findVersionByID from '../findVersionByID'

export type Options<T extends keyof GeneratedTypes['globals']> = {
  depth?: number
  disableErrors?: boolean
  fallbackLocale?: string
  id: string
  locale?: string
  overrideAccess?: boolean
  req?: PayloadRequest
  showHiddenFields?: boolean
  slug: T
  user?: Document
}

export default async function findVersionByIDLocal<T extends keyof GeneratedTypes['globals']>(
  payload: Payload,
  options: Options<T>,
): Promise<TypeWithVersion<GeneratedTypes['globals'][T]>> {
  const {
    id,
    depth,
    disableErrors = false,
    fallbackLocale = null,
    locale = payload.config.localization ? payload.config.localization?.defaultLocale : null,
    overrideAccess = true,
    showHiddenFields,
    slug: globalSlug,
    user,
    req: incomingReq,
  } = options

  const globalConfig = payload.globals.config.find((config) => config.slug === globalSlug)
  const i18n = i18nInit(payload.config.i18n)

  if (!globalConfig) {
    throw new APIError(`The global with slug ${String(globalSlug)} can't be found.`)
  }

  const req = {
    fallbackLocale,
    i18n,
    locale,
    payload,
    payloadAPI: 'local',
    t: i18n.t,
    transactionID: incomingReq?.transactionID,
    user,
  } as PayloadRequest
  setRequestContext(req)

  if (!req.payloadDataLoader) req.payloadDataLoader = getDataLoader(req)

  return findVersionByID({
    id,
    depth,
    disableErrors,
    globalConfig,
    overrideAccess,
    req,
    showHiddenFields,
  })
}
