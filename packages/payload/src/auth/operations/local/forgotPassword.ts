import type { GeneratedTypes, PayloadT, RequestContext } from '../../..'
import type { PayloadRequest } from '../../../types'
import type { Result } from '../forgotPassword'

import { getDataLoader } from '../../../collections/dataloader'
import { APIError } from '../../../errors'
import { i18nInit } from '../../../translations/init'
import { setRequestContext } from '../../../utilities/setRequestContext'
import { forgotPasswordOperation } from '../forgotPassword'

export type Options<T extends keyof GeneratedTypes['collections']> = {
  collection: T
  context?: RequestContext
  data: {
    email: string
  }
  disableEmail?: boolean
  expiration?: number
  req?: PayloadRequest
}

async function localForgotPassword<T extends keyof GeneratedTypes['collections']>(
  payload: PayloadT,
  options: Options<T>,
): Promise<Result> {
  const {
    collection: collectionSlug,
    context,
    data,
    disableEmail,
    expiration,
    req = {} as PayloadRequest,
  } = options
  setRequestContext(req, context)

  const collection = payload.collections[collectionSlug]

  if (!collection) {
    throw new APIError(
      `The collection with slug ${String(
        collectionSlug,
      )} can't be found. Forgot Password Operation.`,
    )
  }

  req.payloadAPI = req.payloadAPI || 'local'
  req.payload = payload
  req.i18n = i18nInit(payload.config.i18n)

  if (!req.t) req.t = req.i18n.t
  if (!req.payloadDataLoader) req.payloadDataLoader = getDataLoader(req)

  return forgotPasswordOperation({
    collection,
    data,
    disableEmail,
    expiration,
    req,
  })
}

export default localForgotPassword
