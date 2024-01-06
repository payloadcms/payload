import type { PayloadT, RequestContext } from '../../..'
import type { GeneratedTypes } from '../../../'
import type { PayloadRequest } from '../../../types'
import type { Document } from '../../../types'

import { getDataLoader } from '../../../collections/dataloader'
import { APIError } from '../../../errors'
import { setRequestContext } from '../../../utilities/setRequestContext'
import { restoreVersionOperation } from '../restoreVersion'

export type Options<T extends keyof GeneratedTypes['globals']> = {
  context?: RequestContext
  depth?: number
  fallbackLocale?: string
  id: string
  locale?: string
  overrideAccess?: boolean
  req?: PayloadRequest
  showHiddenFields?: boolean
  slug: string
  user?: Document
}

export default async function restoreVersionLocal<T extends keyof GeneratedTypes['globals']>(
  payload: PayloadT,
  options: Options<T>,
): Promise<GeneratedTypes['globals'][T]> {
  const {
    id,
    context,
    depth,
    fallbackLocale = null,
    locale = payload.config.localization ? payload.config.localization?.defaultLocale : null,
    overrideAccess = true,
    req: incomingReq,
    showHiddenFields,
    slug: globalSlug,
    user,
  } = options

  const globalConfig = payload.globals.config.find((config) => config.slug === globalSlug)

  if (!globalConfig) {
    throw new APIError(`The global with slug ${String(globalSlug)} can't be found.`)
  }

  const req = {
    fallbackLocale,
    i18n: {
      fallbackLanguage: payload.config.i18n.fallbackLanguage,
      language: payload.config.i18n.fallbackLanguage,
    },
    locale,
    payload,
    payloadAPI: 'local',
    transactionID: incomingReq?.transactionID,
    user,
  } as PayloadRequest
  setRequestContext(req, context)

  if (!req.payloadDataLoader) req.payloadDataLoader = getDataLoader(req)

  return restoreVersionOperation({
    id,
    depth,
    globalConfig,
    overrideAccess,
    req,
    showHiddenFields,
  })
}
