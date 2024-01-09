import type { PayloadT, RequestContext } from '../../..'
import type { GeneratedTypes } from '../../../index'
import type { PayloadRequest } from '../../../types'
import type { Result } from '../login'

import { getDataLoader } from '../../../collections/dataloader'
import { APIError } from '../../../errors'
import { getLocalI18n } from '../../../translations/getLocalI18n'
import { setRequestContext } from '../../../utilities/setRequestContext'
import { loginOperation } from '../login'

export type Options<TSlug extends keyof GeneratedTypes['collections']> = {
  collection: TSlug
  context?: RequestContext
  data: {
    email: string
    password: string
  }
  depth?: number
  fallbackLocale?: string
  locale?: string
  overrideAccess?: boolean
  req?: PayloadRequest
  showHiddenFields?: boolean
}

async function localLogin<TSlug extends keyof GeneratedTypes['collections']>(
  payload: PayloadT,
  options: Options<TSlug>,
): Promise<Result & { user: GeneratedTypes['collections'][TSlug] }> {
  const {
    collection: collectionSlug,
    context,
    data,
    depth,
    fallbackLocale,
    locale,
    overrideAccess = true,
    req = {} as PayloadRequest,
    showHiddenFields,
  } = options
  setRequestContext(req, context)

  const collection = payload.collections[collectionSlug]

  if (!collection) {
    throw new APIError(
      `The collection with slug ${String(collectionSlug)} can't be found. Login Operation.`,
    )
  }

  const i18n = req?.i18n || getLocalI18n({ config: payload.config })

  req.payloadAPI = req.payloadAPI || 'local'
  req.payload = payload
  req.i18n = i18n
  req.t = i18n.t
  req.locale = undefined
  req.fallbackLocale = undefined

  if (!req.payloadDataLoader) req.payloadDataLoader = getDataLoader(req)

  const args = {
    collection,
    data,
    depth,
    overrideAccess,
    req,
    showHiddenFields,
  }

  if (locale) args.req.locale = locale
  if (fallbackLocale) args.req.fallbackLocale = fallbackLocale

  return loginOperation<TSlug>(args)
}

export default localLogin
