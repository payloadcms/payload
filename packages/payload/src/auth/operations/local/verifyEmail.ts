import type { PayloadT, RequestContext } from '../../..'
import type { GeneratedTypes } from '../../../'
import type { PayloadRequest } from '../../../types'

import { APIError } from '../../../errors'
import { i18nInit } from '../../../translations/init'
import { setRequestContext } from '../../../utilities/setRequestContext'
import verifyEmail from '../verifyEmail'

export type Options<T extends keyof GeneratedTypes['collections']> = {
  collection: T
  context?: RequestContext
  req?: PayloadRequest
  token: string
}

async function localVerifyEmail<T extends keyof GeneratedTypes['collections']>(
  payload: PayloadT,
  options: Options<T>,
): Promise<boolean> {
  const { collection: collectionSlug, context, req = {} as PayloadRequest, token } = options
  setRequestContext(req, context)

  const collection = payload.collections[collectionSlug]

  if (!collection) {
    throw new APIError(
      `The collection with slug ${String(collectionSlug)} can't be found. Verify Email Operation.`,
    )
  }

  req.payload = payload
  req.payloadAPI = req.payloadAPI || 'local'
  req.i18n = i18nInit(payload.config.i18n)

  return verifyEmail({
    collection,
    req,
    token,
  })
}

export default localVerifyEmail
