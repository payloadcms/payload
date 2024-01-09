import type { PayloadT, RequestContext } from '../../..'
import type { GeneratedTypes } from '../../../'
import type { PayloadRequest } from '../../../types'

import { APIError } from '../../../errors'
import { getLocalI18n } from '../../../translations/getLocalI18n'
import { setRequestContext } from '../../../utilities/setRequestContext'
import { verifyEmailOperation } from '../verifyEmail'

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

  const i18n = req?.i18n || getLocalI18n({ config: payload.config })

  req.payload = payload
  req.payloadAPI = req.payloadAPI || 'local'
  req.i18n = i18n
  req.t = i18n.t

  return verifyEmailOperation({
    collection,
    req,
    token,
  })
}

export default localVerifyEmail
