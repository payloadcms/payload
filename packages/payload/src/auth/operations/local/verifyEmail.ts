import type { CollectionSlug, Payload, RequestContext } from '../../../index.js'
import type { PayloadRequest } from '../../../types/index.js'

import { APIError } from '../../../errors/index.js'
import { createLocalReq } from '../../../utilities/createLocalReq.js'
import { verifyEmailOperation } from '../verifyEmail.js'

export type Options<T extends CollectionSlug> = {
  collection: T
  context?: RequestContext
  req?: Partial<PayloadRequest>
  token: string
}

async function localVerifyEmail<T extends CollectionSlug>(
  payload: Payload,
  options: Options<T>,
): Promise<boolean> {
  const { collection: collectionSlug, token } = options

  const collection = payload.collections[collectionSlug]

  if (!collection) {
    throw new APIError(
      `The collection with slug ${String(collectionSlug)} can't be found. Verify Email Operation.`,
    )
  }

  return verifyEmailOperation({
    collection,
    req: await createLocalReq(options, payload),
    token,
  })
}

export const verifyEmail = localVerifyEmail
