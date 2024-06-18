import type { GeneratedTypes, Payload, RequestContext } from '../../../index.js'
import type { PayloadRequestWithData } from '../../../types/index.js'
import type { Result } from '../resetPassword.js'

import { APIError } from '../../../errors/index.js'
import { createLocalReq } from '../../../utilities/createLocalReq.js'
import { resetPasswordOperation } from '../resetPassword.js'

export type Options<T extends keyof GeneratedTypes['collections']> = {
  collection: T
  context?: RequestContext
  data: {
    password: string
    token: string
  }
  overrideAccess: boolean
  req?: PayloadRequestWithData
}

async function localResetPassword<T extends keyof GeneratedTypes['collections']>(
  payload: Payload,
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

  const result = await resetPasswordOperation({
    collection,
    data,
    overrideAccess,
    req: await createLocalReq(options, payload),
  })

  if (collection.config.auth.removeTokenFromResponses) {
    delete result.token
  }

  return result
}

export default localResetPassword
