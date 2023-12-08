import type { PayloadT, GeneratedTypes } from '../../../index'
import type { PayloadRequest } from '../../../types'
import type { Result } from '../resetPassword'

import { APIError } from '../../../errors'
import { createLocalReq } from '../../../utilities/createLocalReq'
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
  const { collection: collectionSlug, data, overrideAccess } = options

  const collection = payload.collections[collectionSlug]

  if (!collection) {
    throw new APIError(
      `The collection with slug ${String(
        collectionSlug,
      )} can't be found. Reset Password Operation.`,
    )
  }

  const req = createLocalReq(options, payload)

  return resetPassword({
    collection,
    data,
    overrideAccess,
    req,
  })
}

export default localResetPassword
