import type { GeneratedTypes, PayloadT } from '../../..'
import type { PayloadRequest } from '../../../types'
import type { Result } from '../forgotPassword'

import { APIError } from '../../../errors'
import { createLocalReq } from '../../../utilities/createLocalReq'
import forgotPassword from '../forgotPassword'

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
  payload: PayloadT,
  options: Options<T>,
): Promise<Result> {
  const { collection: collectionSlug, data, disableEmail, expiration } = options

  const collection = payload.collections[collectionSlug]

  if (!collection) {
    throw new APIError(
      `The collection with slug ${String(
        collectionSlug,
      )} can't be found. Forgot Password Operation.`,
    )
  }

  const req = createLocalReq(options, payload)

  return forgotPassword({
    collection,
    data,
    disableEmail,
    expiration,
    req,
  })
}

export default localForgotPassword
