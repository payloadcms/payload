import type { Config as GeneratedTypes } from 'payload/generated-types'

import type { PayloadRequest } from '../../../express/types.js'
import type { Payload } from '../../../payload.js'
import type { Result } from '../forgotPassword.js'

import { getDataLoader } from '../../../collections/dataloader.js'
import { APIError } from '../../../errors/index.js'
import { setRequestContext } from '../../../express/setRequestContext.js'
import { i18nInit } from '../../../translations/init.js'
import forgotPassword from '../forgotPassword.js'

export type Options<T extends keyof GeneratedTypes['collections']> = {
  collection: T
  data: {
    email: string
  }
  disableEmail?: boolean
  expiration?: number
  req?: PayloadRequest
}

async function localForgotPassword<T extends keyof GeneratedTypes['collections']>(
  payload: Payload,
  options: Options<T>,
): Promise<Result> {
  const {
    collection: collectionSlug,
    data,
    disableEmail,
    expiration,
    req = {} as PayloadRequest,
  } = options
  setRequestContext(options.req)

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

  return forgotPassword({
    collection,
    data,
    disableEmail,
    expiration,
    req,
  })
}

export default localForgotPassword
