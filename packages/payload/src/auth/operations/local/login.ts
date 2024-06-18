import type { GeneratedTypes, Payload, RequestContext } from '../../../index.js'
import type { PayloadRequestWithData } from '../../../types/index.js'
import type { Result } from '../login.js'

import { APIError } from '../../../errors/index.js'
import { createLocalReq } from '../../../utilities/createLocalReq.js'
import { loginOperation } from '../login.js'

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
  req?: PayloadRequestWithData
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
