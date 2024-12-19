import type {
  AuthOperationsFromCollectionSlug,
  CollectionSlug,
  DataFromCollectionSlug,
  Payload,
  RequestContext,
} from '../../../index.js'
import type { PayloadRequest } from '../../../types/index.js'
import type { Result } from '../login.js'

import { APIError } from '../../../errors/index.js'
import { createLocalReq } from '../../../utilities/createLocalReq.js'
import { loginOperation } from '../login.js'

export type Options<TSlug extends CollectionSlug> = {
  collection: TSlug
  context?: RequestContext
  data: AuthOperationsFromCollectionSlug<TSlug>['login']
  depth?: number
  fallbackLocale?: string
  locale?: string
  overrideAccess?: boolean
  req?: Partial<PayloadRequest>
  showHiddenFields?: boolean
}

export async function localLogin<TSlug extends CollectionSlug>(
  payload: Payload,
  options: Options<TSlug>,
): Promise<{ user: DataFromCollectionSlug<TSlug> } & Result> {
  const {
    collection: collectionSlug,
    data,
    depth,
    overrideAccess = true,
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
    req: await createLocalReq(options, payload),
    showHiddenFields,
  }

  const result = await loginOperation<TSlug>(args)

  if (collection.config.auth.removeTokenFromResponses) {
    delete result.token
  }

  return result
}

export const login = localLogin
