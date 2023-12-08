import type { Response } from 'express'

import type { PayloadT } from '../../..'
import type { GeneratedTypes } from '../../../index'
import type { PayloadRequest } from '../../../types'
import type { Result } from '../login'

import { getDataLoader } from '../../../collections/dataloader'
import { APIError } from '../../../errors'
import { i18nInit } from '../../../translations/init'
import { setRequestContext } from '../../../utilities/setRequestContext'
import login from '../login'

export type Options<TSlug extends keyof GeneratedTypes['collections']> = {
  collection: TSlug
  data: {
    email: string
    password: string
  }
  depth?: number
  fallbackLocale?: string
  locale?: string
  overrideAccess?: boolean
  req?: PayloadRequest
  res?: Response
  showHiddenFields?: boolean
}

async function localLogin<TSlug extends keyof GeneratedTypes['collections']>(
  payload: PayloadT,
  options: Options<TSlug>,
): Promise<Result & { user: GeneratedTypes['collections'][TSlug] }> {
  const {
    collection: collectionSlug,
    data,
    depth,
    fallbackLocale,
    locale,
    overrideAccess = true,
    req = {} as PayloadRequest,
    res,
    showHiddenFields,
  } = options
  setRequestContext(req)

  const collection = payload.collections[collectionSlug]

  if (!collection) {
    throw new APIError(
      `The collection with slug ${String(collectionSlug)} can't be found. Login Operation.`,
    )
  }

  req.payloadAPI = req.payloadAPI || 'local'
  req.payload = payload
  req.i18n = i18nInit(payload.config.i18n)
  req.locale = undefined
  req.fallbackLocale = undefined

  if (!req.t) req.t = req.i18n.t
  if (!req.payloadDataLoader) req.payloadDataLoader = getDataLoader(req)

  const args = {
    collection,
    data,
    depth,
    overrideAccess,
    req,
    res,
    showHiddenFields,
  }

  if (locale) args.req.locale = locale
  if (fallbackLocale) args.req.fallbackLocale = fallbackLocale

  return login<TSlug>(args)
}

export default localLogin
