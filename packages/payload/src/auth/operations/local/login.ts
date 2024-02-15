import type { Payload, RequestContext } from '../../..'
import type { GeneratedTypes } from '../../../index'
import type { PayloadRequest } from '../../../types'
import type { Result } from '../login'

import { APIError } from '../../../errors'
import { createLocalReq } from '../../../utilities/createLocalReq'
import { loginOperation } from '../login'

export type Options<TSlug extends keyof GeneratedTypes['collections']> = {
  collection: TSlug
  context?: RequestContext
  data: {
    email: string
    password: string
  }
  depth?: number
  fallbackLocale?: string
  locale?: string
  overrideAccess?: boolean
  req?: PayloadRequest
  showHiddenFields?: boolean
}

async function localLogin<TSlug extends keyof GeneratedTypes['collections']>(
  payload: Payload,
  options: Options<TSlug>,
): Promise<Result & { user: GeneratedTypes['collections'][TSlug] }> {
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

export default localLogin
