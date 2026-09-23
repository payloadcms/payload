import type {
  AuthCollectionSlug,
  AuthOperationsFromCollectionSlug,
  Payload,
  RequestContext,
} from '../../../index.js'
import type { PayloadRequest } from '../../../types/index.js'
import type { SharedLocalAPIOptions } from '../../../types/operations.js'
import type { LoginResult } from '../login.js'

import { APIError } from '../../../errors/index.js'
import { createPayloadReq } from '../../../utilities/createPayloadReq.js'
import { loginOperation } from '../login.js'

export type Options<TSlug extends AuthCollectionSlug> = {
  collection: TSlug
  context?: RequestContext
  data: AuthOperationsFromCollectionSlug<TSlug>['login']
  depth?: number
  fallbackLocale?: string
  locale?: string
  req?: Partial<PayloadRequest>
  showHiddenFields?: boolean
  trash?: boolean
} & Pick<SharedLocalAPIOptions, 'overrideAccess'>

export async function loginLocal<TSlug extends AuthCollectionSlug>(
  payload: Payload,
  options: Options<TSlug>,
): Promise<LoginResult<TSlug>> {
  const {
    collection: collectionSlug,
    data,
    depth,
    overrideAccess = false,
    showHiddenFields,
  } = options

  const collection = payload.collections[collectionSlug]

  if (!collection) {
    throw new APIError(
      `The collection with slug ${String(collectionSlug)} can't be found. Login Operation.`,
    )
  }

  const args = {
    collection,
    data,
    depth,
    overrideAccess,
    req: await createPayloadReq({ ...options, payload }),
    showHiddenFields,
  }

  const result = await loginOperation<TSlug>(args)

  if (collection.config.auth.removeTokenFromResponses) {
    delete result.token
  }

  return result
}
