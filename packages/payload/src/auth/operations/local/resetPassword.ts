import type { PayloadT } from '../../..'
import type { GeneratedTypes } from '../../../'
import type { PayloadRequest } from '../../../types'
import type { Result } from '../resetPassword'

import { getDataLoader } from '../../../collections/dataloader'
import { APIError } from '../../../errors'
import { i18nInit } from '../../../translations/init'
import { setRequestContext } from '../../../utilities/setRequestContext'
import resetPassword from '../resetPassword'

export type Options<T extends keyof GeneratedTypes['collections']> = {
  collection: T
  data: {
    password: string
    token: string
  }
  overrideAccess: boolean
  req?: PayloadRequest
}

async function localResetPassword<T extends keyof GeneratedTypes['collections']>(
  payload: PayloadT,
  options: Options<T>,
): Promise<Result> {
  const { collection: collectionSlug, data, overrideAccess, req = {} as PayloadRequest } = options

  setRequestContext(req)

  const collection = payload.collections[collectionSlug]

  if (!collection) {
    throw new APIError(
      `The collection with slug ${String(
        collectionSlug,
      )} can't be found. Reset Password Operation.`,
    )
  }

  req.payload = payload
  req.payloadAPI = req.payloadAPI || 'local'
  req.i18n = i18nInit(payload.config.i18n)

  if (!req.t) req.t = req.i18n.t
  if (!req.payloadDataLoader) req.payloadDataLoader = getDataLoader(req)

  return resetPassword({
    collection,
    data,
    overrideAccess,
    req,
  })
}

export default localResetPassword
