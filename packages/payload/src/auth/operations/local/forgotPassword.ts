import type { GeneratedTypes, Payload, RequestContext } from '../../..'
import type { PayloadRequest } from '../../../types'
import type { Result } from '../forgotPassword'

import { APIError } from '../../../errors'
import { createLocalReq } from '../../../utilities/createLocalReq'
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
  payload: Payload,
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

  return forgotPasswordOperation({
    collection,
    data,
    disableEmail,
    expiration,
    req: createLocalReq(options, payload),
  })
}

export default localForgotPassword
