import type { GeneratedTypes, Payload } from '../../../index.js'
import type { Document, PayloadRequest, RequestContext } from '../../../types/index.js'

import { APIError } from '../../../errors/index.js'
import { createLocalReq } from '../../../utilities/createLocalReq.js'
import { restoreVersionOperation } from '../restoreVersion.js'

export type Options<T extends keyof GeneratedTypes['collections']> = {
  collection: T
  /**
   * context, which will then be passed to req.context, which can be read by hooks
   */
  context?: RequestContext
  depth?: number
  draft?: boolean
  fallbackLocale?: GeneratedTypes['locale']
  id: string
  locale?: GeneratedTypes['locale']
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
