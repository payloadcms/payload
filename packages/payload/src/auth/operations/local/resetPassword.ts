import type { Payload, RequestContext } from '../../..'
import type { GeneratedTypes } from '../../../'
import type { PayloadRequest } from '../../../types'
import type { Result } from '../resetPassword'

import { getDataLoader } from '../../../collections/dataloader'
import { APIError } from '../../../errors'
import { getLocalI18n } from '../../../translations/getLocalI18n'
import { setRequestContext } from '../../../utilities/setRequestContext'
import { resetPasswordOperation } from '../resetPassword'

export type Options<T extends keyof GeneratedTypes['collections']> = {
  collection: T
  context?: RequestContext
  data: {
    password: string
    token: string
  }
  overrideAccess: boolean
  req?: PayloadRequest
}

async function localResetPassword<T extends keyof GeneratedTypes['collections']>(
  payload: Payload,
  options: Options<T>,
): Promise<Result> {
  const {
    collection: collectionSlug,
    context,
    data,
    overrideAccess,
    req = {} as PayloadRequest,
  } = options

  setRequestContext(req, context)

  const collection = payload.collections[collectionSlug]

  if (!collection) {
    throw new APIError(
      `The collection with slug ${String(
        collectionSlug,
      )} can't be found. Reset Password Operation.`,
    )
  }

  const i18n = req?.i18n || getLocalI18n({ config: payload.config })

  req.payload = payload
  req.payloadAPI = req.payloadAPI || 'local'
  req.i18n = i18n
  req.t = i18n.t

  if (!req.payloadDataLoader) req.payloadDataLoader = getDataLoader(req)

  return resetPasswordOperation({
    collection,
    data,
    overrideAccess,
    req,
  })
}

export default localResetPassword
