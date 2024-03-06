import type { Payload, RequestContext } from '../../../index.d.ts'
import type { GeneratedTypes } from '../../../index.d.ts'
import type { PayloadRequest } from '../../../types/index.d.ts'

import { APIError } from '../../../errors/index.js'
import { createLocalReq } from '../../../utilities/createLocalReq.js'
import { verifyEmailOperation } from '../verifyEmail.js'

export type Options<T extends keyof GeneratedTypes['collections']> = {
  collection: T
  context?: RequestContext
  req?: PayloadRequest
  token: string
}

async function localVerifyEmail<T extends keyof GeneratedTypes['collections']>(
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

export default localVerifyEmail
