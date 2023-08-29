import type { Config as GeneratedTypes } from 'payload/generated-types'

import type { PaginatedDocs } from '../../../database/types.js'
import type { PayloadRequest } from '../../../express/types.js'
import type { Payload } from '../../../payload.js'
import type { Document, Where } from '../../../types/index.js'
import type { TypeWithVersion } from '../../../versions/types.js'

import { getDataLoader } from '../../../collections/dataloader.js'
import { APIError } from '../../../errors/index.js'
import { setRequestContext } from '../../../express/setRequestContext.js'
import { i18nInit } from '../../../translations/init.js'
import findVersions from '../findVersions.js'

export type Options<T extends keyof GeneratedTypes['globals']> = {
  depth?: number
  fallbackLocale?: string
  limit?: number
  locale?: string
  overrideAccess?: boolean
  page?: number
  showHiddenFields?: boolean
  slug: T
  sort?: string
  user?: Document
  where?: Where
}

export default async function findVersionsLocal<T extends keyof GeneratedTypes['globals']>(
  payload: Payload,
  options: Options<T>,
): Promise<PaginatedDocs<TypeWithVersion<GeneratedTypes['globals'][T]>>> {
  const {
    depth,
    fallbackLocale = null,
    limit,
    locale = payload.config.localization ? payload.config.localization?.defaultLocale : null,
    overrideAccess = true,
    page,
    showHiddenFields,
    slug: globalSlug,
    sort,
    user,
    where,
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
    user,
  } as PayloadRequest
  setRequestContext(req)

  if (!req.payloadDataLoader) req.payloadDataLoader = getDataLoader(req)

  return findVersions({
    depth,
    globalConfig,
    limit,
    overrideAccess,
    page,
    req,
    showHiddenFields,
    sort,
    where,
  })
}
