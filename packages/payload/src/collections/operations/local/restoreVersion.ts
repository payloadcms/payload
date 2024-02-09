import type { GeneratedTypes, Payload } from '../../../'
import type { PayloadRequest, RequestContext } from '../../../types'
import type { Document } from '../../../types'

import { APIError } from '../../../errors'
import { createLocalReq } from '../../../utilities/createLocalReq'
import { restoreVersionOperation } from '../restoreVersion'

export type Options<T extends keyof GeneratedTypes['collections']> = {
  collection: T
  /**
   * context, which will then be passed to req.context, which can be read by hooks
   */
  context?: RequestContext
  depth?: number
  draft?: boolean
  fallbackLocale?: string
  id: string
  locale?: string
  overrideAccess?: boolean
  req?: PayloadRequest
  showHiddenFields?: boolean
  user?: Document
}

export default async function restoreVersionLocal<T extends keyof GeneratedTypes['collections']>(
  payload: Payload,
  options: Options<T>,
): Promise<GeneratedTypes['collections'][T]> {
  const { id, collection: collectionSlug, depth, overrideAccess = true, showHiddenFields } = options

  const collection = payload.collections[collectionSlug]

  if (!collection) {
    throw new APIError(
      `The collection with slug ${String(
        collectionSlug,
      )} can't be found. Restore Version Operation.`,
    )
  }

  const args = {
    id,
    collection,
    depth,
    overrideAccess,
    payload,
    req: await createLocalReq(options, payload),
    showHiddenFields,
  }

  return restoreVersionOperation(args)
}
