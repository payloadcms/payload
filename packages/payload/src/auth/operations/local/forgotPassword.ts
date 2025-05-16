// @ts-strict-ignore
import type { CollectionSlug, Payload, RequestContext } from '../../../index.js'
import type { PayloadRequest } from '../../../types/index.js'
import type { Result } from '../forgotPassword.js'

import { APIError } from '../../../errors/index.js'
import { createLocalReq } from '../../../utilities/createLocalReq.js'
import { forgotPasswordOperation } from '../forgotPassword.js'

export type Options<T extends CollectionSlug> = {
  collection: T
  context?: RequestContext
  data: {
    email: string
  }
  disableEmail?: boolean
  expiration?: number
  req?: Partial<PayloadRequest>
}

async function localForgotPassword<T extends CollectionSlug>(
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
    req: await createLocalReq(options, payload),
  })
}

export const forgotPassword = localForgotPassword
