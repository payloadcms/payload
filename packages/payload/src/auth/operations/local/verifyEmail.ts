import type { GeneratedTypes, PayloadT } from '../../../'
import type { PayloadRequest } from '../../../types'

import { APIError } from '../../../errors'
import { createLocalReq } from '../../../utilities/createLocalReq'
import verifyEmail from '../verifyEmail'

export type Options<T extends keyof GeneratedTypes['collections']> = {
  collection: T
  req?: PayloadRequest
  token: string
}

async function localVerifyEmail<T extends keyof GeneratedTypes['collections']>(
  payload: PayloadT,
  options: Options<T>,
): Promise<boolean> {
  const { collection: collectionSlug, token } = options

  const collection = payload.collections[collectionSlug]

  if (!collection) {
    throw new APIError(
      `The collection with slug ${String(collectionSlug)} can't be found. Verify Email Operation.`,
    )
  }

  const req = createLocalReq(options, payload)

  return verifyEmail({
    collection,
    req,
    token,
  })
}

export default localVerifyEmail
